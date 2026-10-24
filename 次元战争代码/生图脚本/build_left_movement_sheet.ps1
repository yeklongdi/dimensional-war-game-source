param(
    [Parameter(Mandatory = $true)]
    [string]$SourceSheet,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [int]$FrameCount = 6
)

<#
    将横向排列的向左移动序列帧，转换为游戏使用的横向精灵表。

    默认约定：
    - 输入图片横向排列 6 帧；
    - 绿色背景为 RGB(0, 255, 0) 附近的绿幕；
    - 输出每格为 256x512，角色脚底对齐到 y=390；
    - 输出图片保留绿色画布，以便与现有精灵表保持一致。
#>

if ($FrameCount -lt 1) {
    throw "FrameCount must be at least 1."
}

Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class LeftMovementRaster
{
    private static bool IsBackground(byte blue, byte green, byte red)
    {
        return green > 180 && red < 100 && blue < 100;
    }

    public static Rectangle FindForegroundBounds(Bitmap source, Rectangle region)
    {
        BitmapData data = source.LockBits(
            new Rectangle(0, 0, source.Width, source.Height),
            ImageLockMode.ReadOnly,
            PixelFormat.Format32bppArgb);

        try
        {
            int minX = source.Width;
            int minY = source.Height;
            int maxX = -1;
            int maxY = -1;
            int stride = Math.Abs(data.Stride);
            byte[] pixels = new byte[stride * source.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);

            for (int y = region.Top; y < region.Bottom; y++)
            {
                for (int x = region.Left; x < region.Right; x++)
                {
                    int offset = (y * stride) + (x * 4);
                    if (!IsBackground(pixels[offset], pixels[offset + 1], pixels[offset + 2]))
                    {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (maxX < 0)
                throw new InvalidOperationException("No foreground pixels found in frame region.");

            const int padding = 2;
            int left = Math.Max(0, minX - padding);
            int top = Math.Max(0, minY - padding);
            int right = Math.Min(source.Width - 1, maxX + padding);
            int bottom = Math.Min(source.Height - 1, maxY + padding);
            return Rectangle.FromLTRB(left, top, right + 1, bottom + 1);
        }
        finally
        {
            source.UnlockBits(data);
        }
    }

    public static Bitmap ExtractMasked(Bitmap source, Rectangle sourceRect)
    {
        Bitmap result = new Bitmap(sourceRect.Width, sourceRect.Height, PixelFormat.Format32bppArgb);
        using (Graphics graphics = Graphics.FromImage(result))
        {
            graphics.DrawImage(
                source,
                new Rectangle(0, 0, result.Width, result.Height),
                sourceRect,
                GraphicsUnit.Pixel);
        }

        BitmapData data = result.LockBits(
            new Rectangle(0, 0, result.Width, result.Height),
            ImageLockMode.ReadWrite,
            PixelFormat.Format32bppArgb);

        try
        {
            int stride = Math.Abs(data.Stride);
            byte[] pixels = new byte[stride * result.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            for (int y = 0; y < result.Height; y++)
            {
                for (int x = 0; x < result.Width; x++)
                {
                    int offset = (y * stride) + (x * 4);
                    if (IsBackground(pixels[offset], pixels[offset + 1], pixels[offset + 2]))
                        pixels[offset + 3] = 0;
                }
            }
            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
        }
        finally
        {
            result.UnlockBits(data);
        }

        return result;
    }
}
'@

function Add-Sprite {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.Bitmap]$Bitmap,
        [System.Drawing.Rectangle]$SourceRect,
        [int]$Column,
        [double]$Scale
    )

    $cellWidth = 256
    $bottomPivot = 390

    $drawWidth = [Math]::Max(1, [int][Math]::Round($SourceRect.Width * $scale))
    $drawHeight = [Math]::Max(1, [int][Math]::Round($SourceRect.Height * $scale))
    $drawX = ($Column * $cellWidth) + [int][Math]::Floor(($cellWidth - $drawWidth) / 2)
    $drawY = $bottomPivot - $drawHeight
    $destination = [System.Drawing.Rectangle]::new($drawX, $drawY, $drawWidth, $drawHeight)

    $maskedSprite = [LeftMovementRaster]::ExtractMasked($Bitmap, $SourceRect)
    try {
        $Graphics.DrawImage(
            $maskedSprite,
            $destination,
            0,
            0,
            $maskedSprite.Width,
            $maskedSprite.Height,
            [System.Drawing.GraphicsUnit]::Pixel
        )
    }
    finally {
        $maskedSprite.Dispose()
    }
}

$source = [System.Drawing.Bitmap]::FromFile($SourceSheet)
$canvas = [System.Drawing.Bitmap]::new(256 * $FrameCount, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)

try {
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 0, 255, 0))
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighSpeed
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

    $frameWidth = [Math]::Floor($source.Width / $FrameCount)
    $sourceRects = [System.Collections.Generic.List[System.Drawing.Rectangle]]::new()

    # Compute every crop before drawing. A single scale is then used for all
    # frames, so a frame can never be rendered at its original size by itself.
    for ($column = 0; $column -lt $FrameCount; $column++) {
        $left = $column * $frameWidth
        $right = if ($column -eq ($FrameCount - 1)) { $source.Width - 1 } else { (($column + 1) * $frameWidth) - 1 }
        $region = [System.Drawing.Rectangle]::FromLTRB($left, 0, $right + 1, $source.Height)
        $rect = [LeftMovementRaster]::FindForegroundBounds($source, $region)
        $sourceRects.Add($rect)
    }

    $maxSourceWidth = ($sourceRects | Measure-Object -Property Width -Maximum).Maximum
    $maxSourceHeight = ($sourceRects | Measure-Object -Property Height -Maximum).Maximum
    $sharedScale = [Math]::Min(224.0 / [double]$maxSourceWidth, 300.0 / [double]$maxSourceHeight)

    for ($column = 0; $column -lt $FrameCount; $column++) {
        Add-Sprite $graphics $source $sourceRects[$column] $column $sharedScale
    }

    $outputDirectory = Split-Path -Parent $OutputPath
    if (-not [string]::IsNullOrWhiteSpace($outputDirectory) -and -not (Test-Path -LiteralPath $outputDirectory)) {
        New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    }

    if (Test-Path -LiteralPath $OutputPath) {
        Remove-Item -LiteralPath $OutputPath -Force
    }

    $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Created $OutputPath"
    Write-Output "Canvas: $($canvas.Width)x$($canvas.Height); frames: $FrameCount; cells: 256x512; shared scale: $([Math]::Round($sharedScale, 4))"
}
finally {
    $graphics.Dispose()
    $canvas.Dispose()
    $source.Dispose()
}
