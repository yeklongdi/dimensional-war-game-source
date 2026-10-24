param(
    [Parameter(Mandatory = $true)]
    [string]$SourceSheet,

    [Parameter(Mandatory = $true)]
    [string]$MissingFrames,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

Add-Type -AssemblyName System.Drawing

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class SpriteRaster
{
    private static bool IsBackground(byte blue, byte green, byte red)
    {
        return green > 180 && red < 100 && blue < 100;
    }

    public static Rectangle FindBounds(Bitmap source, Rectangle region)
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
            byte[] pixels = new byte[Math.Abs(data.Stride) * source.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);

            for (int y = region.Top; y < region.Bottom; y++)
            {
                for (int x = region.Left; x < region.Right; x++)
                {
                    int offset = (y * data.Stride) + (x * 4);
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
                throw new InvalidOperationException("No foreground pixels found in the requested region.");

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
            byte[] pixels = new byte[Math.Abs(data.Stride) * result.Height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            for (int y = 0; y < result.Height; y++)
            {
                for (int x = 0; x < result.Width; x++)
                {
                    int offset = (y * data.Stride) + (x * 4);
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

function Test-BackgroundPixel {
    param([System.Drawing.Color]$Color)

    return ($Color.G -gt 210 -and $Color.R -lt 90 -and $Color.B -lt 90)
}

function Get-ForegroundBounds {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [int]$X1,
        [int]$Y1,
        [int]$X2,
        [int]$Y2
    )

    $region = [System.Drawing.Rectangle]::FromLTRB($X1, $Y1, $X2 + 1, $Y2 + 1)
    return [SpriteRaster]::FindBounds($Bitmap, $region)
}

function Add-Sprite {
    param(
        [System.Drawing.Graphics]$Graphics,
        [System.Drawing.Bitmap]$Bitmap,
        [System.Drawing.Rectangle]$SourceRect,
        [int]$Column,
        [int]$Row,
        [double]$ScaleMultiplier = 1.0
    )

    $cellWidth = 256
    $cellHeight = 512
    $maxWidth = 224
    $maxHeight = 300
    $bottomPivot = ($Row * $cellHeight) + 390

    $scale = [Math]::Min($maxWidth / $SourceRect.Width, $maxHeight / $SourceRect.Height) * $ScaleMultiplier
    $drawWidth = [Math]::Max(1, [int][Math]::Round($SourceRect.Width * $scale))
    $drawHeight = [Math]::Max(1, [int][Math]::Round($SourceRect.Height * $scale))
    $drawX = ($Column * $cellWidth) + [int][Math]::Floor(($cellWidth - $drawWidth) / 2)
    $drawY = $bottomPivot - $drawHeight
    $destination = [System.Drawing.Rectangle]::new($drawX, $drawY, $drawWidth, $drawHeight)

    $maskedSprite = [SpriteRaster]::ExtractMasked($Bitmap, $SourceRect)

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
$missing = [System.Drawing.Bitmap]::FromFile($MissingFrames)
$canvas = [System.Drawing.Bitmap]::new(2048, 2048, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)

try {
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 0, 255, 0))
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighSpeed
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

    $rowBands = @(
        @(0, 312),
        @(313, 626),
        @(627, 939),
        @(940, 1253)
    )

    $rowIntervals = @(
        @(@(41,178), @(220,357), @(401,542), @(571,725), @(751,873), @(895,1014)),
        @(@(47,171), @(216,347), @(386,500), @(536,654), @(679,797), @(815,919), @(948,1067), @(1110,1213)),
        @(@(36,161), @(233,349), @(399,518), @(573,687), @(738,856), @(941,1018), @(1103,1187)),
        @(@(15,160), @(184,317), @(348,526), @(562,706), @(740,889), @(917,1043), @(1081,1225))
    )

    # Row 1: six down-flight frames; columns 7 and 8 intentionally remain green.
    for ($column = 0; $column -lt 6; $column++) {
        $interval = $rowIntervals[0][$column]
        $rect = Get-ForegroundBounds $source $interval[0] $rowBands[0][0] $interval[1] $rowBands[0][1]
        Add-Sprite $graphics $source $rect $column 0
    }

    # Row 2: six right-flight frames, then down-idle and up-idle.
    for ($column = 0; $column -lt 8; $column++) {
        $interval = $rowIntervals[1][$column]
        $rect = Get-ForegroundBounds $source $interval[0] $rowBands[1][0] $interval[1] $rowBands[1][1]
        Add-Sprite $graphics $source $rect $column 1
    }

    # Row 3: five generated up-flight frames, one separately generated sixth frame,
    # then left-idle and right-idle.
    for ($column = 0; $column -lt 5; $column++) {
        $interval = $rowIntervals[2][$column]
        $rect = Get-ForegroundBounds $source $interval[0] $rowBands[2][0] $interval[1] $rowBands[2][1]
        Add-Sprite $graphics $source $rect $column 2
    }

    $missingUp = Get-ForegroundBounds $missing 169 0 490 1253
    Add-Sprite $graphics $missing $missingUp 5 2 0.90

    for ($sourceIndex = 5; $sourceIndex -lt 7; $sourceIndex++) {
        $interval = $rowIntervals[2][$sourceIndex]
        $rect = Get-ForegroundBounds $source $interval[0] $rowBands[2][0] $interval[1] $rowBands[2][1]
        Add-Sprite $graphics $source $rect ($sourceIndex + 1) 2
    }

    # Row 4: seven generated combat frames plus the separately generated eighth frame.
    for ($column = 0; $column -lt 7; $column++) {
        $interval = $rowIntervals[3][$column]
        $rect = Get-ForegroundBounds $source $interval[0] $rowBands[3][0] $interval[1] $rowBands[3][1]
        Add-Sprite $graphics $source $rect $column 3
    }

    $missingCombat = Get-ForegroundBounds $missing 639 0 1136 1253
    Add-Sprite $graphics $missing $missingCombat 7 3

    $outputDirectory = Split-Path -Parent $OutputPath
    if (-not (Test-Path -LiteralPath $outputDirectory)) {
        New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    }

    $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Created $OutputPath"
    Write-Output "Canvas: 2048x2048; grid: 8x4; cells: 256x512; sprites: 30"
}
finally {
    $graphics.Dispose()
    $canvas.Dispose()
    $missing.Dispose()
    $source.Dispose()
}
