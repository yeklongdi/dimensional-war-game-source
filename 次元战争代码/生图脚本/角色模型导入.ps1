param(
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath,

    [switch]$SkipGodotImport
)

<#
绿幕角色模型导入器：
源序列帧 -> 扣绿幕 -> 裁透明边 -> Nearest 缩放到 32x32 -> 写入游戏 assets -> Godot 导入扫描。
配置模板见同目录 README.md。
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if ($null -eq ("ChromaModelRaster" -as [type])) {
    Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class ChromaModelRaster
{
    public static Bitmap NormalizeFrame(
        Bitmap source, int cellX, int cellY, int columns, int rows,
        int fitWidth, int fitHeight, int greenMin, double hardRatio, double softRatio)
    {
        int x0 = (int)Math.Round((double)cellX * source.Width / columns);
        int x1 = (int)Math.Round((double)(cellX + 1) * source.Width / columns);
        int y0 = (int)Math.Round((double)cellY * source.Height / rows);
        int y1 = (int)Math.Round((double)(cellY + 1) * source.Height / rows);
        int width = x1 - x0;
        int height = y1 - y0;
        Bitmap working = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (Graphics graphics = Graphics.FromImage(working))
        {
            graphics.Clear(Color.Transparent);
            graphics.DrawImage(source, new Rectangle(0, 0, width, height),
                new Rectangle(x0, y0, width, height), GraphicsUnit.Pixel);
        }

        int minX = width, minY = height, maxX = -1, maxY = -1;
        BitmapData data = working.LockBits(new Rectangle(0, 0, width, height),
            ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        try
        {
            int stride = Math.Abs(data.Stride);
            byte[] pixels = new byte[stride * height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            for (int y = 0; y < height; y++)
            {
                for (int x = 0; x < width; x++)
                {
                    int offset = y * stride + x * 4;
                    byte blue = pixels[offset];
                    byte green = pixels[offset + 1];
                    byte red = pixels[offset + 2];
                    byte alpha = pixels[offset + 3];
                    double other = Math.Max(1.0, Math.Max(red, blue));
                    double ratio = green / other;
                    bool hardGreen = green >= greenMin && ratio >= hardRatio;
                    if (hardGreen)
                    {
                        pixels[offset + 3] = 0;
                        continue;
                    }
                    if (green >= greenMin * 0.75 && ratio > softRatio)
                    {
                        double factor = 1.0 - Math.Min(1.0, Math.Max(0.0,
                            (ratio - softRatio) / Math.Max(0.001, hardRatio - softRatio)));
                        pixels[offset + 3] = (byte)Math.Round(alpha * factor);
                        pixels[offset + 1] = (byte)Math.Min(green, Math.Round(other * 1.08));
                    }
                    if (pixels[offset + 3] > 0)
                    {
                        minX = Math.Min(minX, x);
                        minY = Math.Min(minY, y);
                        maxX = Math.Max(maxX, x);
                        maxY = Math.Max(maxY, y);
                    }
                }
            }
            Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
        }
        finally
        {
            working.UnlockBits(data);
        }

        Bitmap output = new Bitmap(32, 32, PixelFormat.Format32bppArgb);
        if (maxX < minX || maxY < minY)
        {
            working.Dispose();
            return output;
        }
        minX = Math.Max(0, minX - 2);
        minY = Math.Max(0, minY - 2);
        maxX = Math.Min(width - 1, maxX + 2);
        maxY = Math.Min(height - 1, maxY + 2);
        int cropWidth = maxX - minX + 1;
        int cropHeight = maxY - minY + 1;
        double scale = Math.Min((double)fitWidth / cropWidth, (double)fitHeight / cropHeight);
        int drawWidth = Math.Max(1, (int)Math.Round(cropWidth * scale));
        int drawHeight = Math.Max(1, (int)Math.Round(cropHeight * scale));
        using (Graphics graphics = Graphics.FromImage(output))
        {
            graphics.Clear(Color.Transparent);
            graphics.InterpolationMode = InterpolationMode.NearestNeighbor;
            graphics.PixelOffsetMode = PixelOffsetMode.Half;
            graphics.SmoothingMode = SmoothingMode.None;
            graphics.DrawImage(working,
                new Rectangle((32 - drawWidth) / 2, 31 - drawHeight, drawWidth, drawHeight),
                new Rectangle(minX, minY, cropWidth, cropHeight), GraphicsUnit.Pixel);
        }
        working.Dispose();
        return output;
    }
}
'@
}

function Get-ConfigText {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "找不到配置文件：$Path"
    }
    return Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Test-CharacterId {
    param([string]$CharacterId)
    return $CharacterId -match '^[a-z0-9_]+$'
}

function Get-RgbRatio {
    param([System.Drawing.Color]$Color)
    $other = [Math]::Max([int]$Color.R, [int]$Color.B)
    return [double]$Color.G / [Math]::Max(1.0, [double]$other)
}

function Test-HardGreen {
    param([System.Drawing.Color]$Color, $Chroma)
    return $Color.G -ge [int]$Chroma.green_min -and (Get-RgbRatio $Color) -ge [double]$Chroma.hard_ratio
}

function Get-SoftAlpha {
    param([System.Drawing.Color]$Color, $Chroma)
    if ($Color.G -lt ([double]$Chroma.green_min * 0.75)) {
        return 1.0
    }
    $ratio = Get-RgbRatio $Color
    $soft = [double]$Chroma.soft_ratio
    $hard = [double]$Chroma.hard_ratio
    if ($ratio -le $soft) {
        return 1.0
    }
    return 1.0 - [Math]::Min(1.0, [Math]::Max(0.0, ($ratio - $soft) / [Math]::Max(0.001, $hard - $soft)))
}

function New-NormalizedFrame {
    param(
        [System.Drawing.Bitmap]$Source,
        [int]$CellX,
        [int]$CellY,
        [int]$Columns,
        [int]$Rows,
        [int]$FitWidth,
        [int]$FitHeight,
        $Chroma
    )

    return [ChromaModelRaster]::NormalizeFrame(
        $Source, $CellX, $CellY, $Columns, $Rows, $FitWidth, $FitHeight,
        [int]$Chroma.green_min, [double]$Chroma.hard_ratio, [double]$Chroma.soft_ratio)
}

function New-MirroredFrame {
    param([System.Drawing.Bitmap]$Source)
    $copy = [System.Drawing.Bitmap]::new($Source)
    $copy.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)
    return $copy
}

function Save-ImportedModel {
    param($Config)
    $characterId = [string]$Config.character_id
    if (-not (Test-CharacterId $characterId)) {
        throw "character_id 只能使用小写字母、数字和下划线：$characterId"
    }
    if (-not (Test-Path -LiteralPath $Config.source)) {
        throw "找不到源序列帧：$($Config.source)"
    }
    if (-not (Test-Path -LiteralPath $Config.project_root)) {
        New-Item -ItemType Directory -Path $Config.project_root -Force | Out-Null
    }

    $source = [System.Drawing.Bitmap]::FromFile($Config.source)
    $allFrames = @{}
    $builtAnimations = [System.Collections.ArrayList]::new()
    try {
        foreach ($animation in $Config.animations) {
            $frames = [System.Collections.ArrayList]::new()
            $mirrorSource = ""
            if ($animation.PSObject.Properties.Name -contains 'mirror_of') {
                $mirrorSource = [string]$animation.mirror_of
            }
            if (-not [string]::IsNullOrWhiteSpace($mirrorSource)) {
                if (-not $allFrames.ContainsKey($mirrorSource)) {
                    throw "镜像动画必须定义在前面：$($animation.name) -> $mirrorSource"
                }
                foreach ($sourceFrame in $allFrames[$mirrorSource]) {
                    [void]$frames.Add((New-MirroredFrame $sourceFrame))
                }
            }
            else {
                foreach ($cell in $animation.cells) {
                    $cellX = [int]$cell[0]
                    $cellY = [int]$cell[1]
                    if ($cellX -lt 0 -or $cellY -lt 0 -or $cellX -ge [int]$Config.grid.columns -or $cellY -ge [int]$Config.grid.rows) {
                        throw "动画 $($animation.name) 存在越界格子：[$cellX,$cellY]"
                    }
                    $frame = New-NormalizedFrame -Source $source -CellX $cellX -CellY $cellY `
                        -Columns ([int]$Config.grid.columns) -Rows ([int]$Config.grid.rows) `
                        -FitWidth ([int]$Config.fit.width) -FitHeight ([int]$Config.fit.height) -Chroma $Config.chroma_key
                    if ($null -ne $frame) {
                        [void]$frames.Add($frame)
                    }
                    else {
                        Write-Warning "跳过空白帧：$($animation.name) [$cellX,$cellY]"
                    }
                }
            }
            if ($frames.Count -eq 0) {
                throw "动画 $($animation.name) 没有可用帧"
            }
            $allFrames[[string]$animation.name] = $frames
            $builtEntry = [pscustomobject]@{
                name = [string]$animation.name
                frames = $frames
                fps = [double]$animation.fps
                loop = [bool]$animation.loop
            }
            [void]$builtAnimations.Add($builtEntry)
        }

        if (-not $allFrames.ContainsKey('idle')) {
            throw '必须提供 idle 动画。'
        }
        $maxFrames = ($builtAnimations | ForEach-Object { $_.frames.Count } | Measure-Object -Maximum).Maximum
        $sheet = [System.Drawing.Bitmap]::new(32 * $maxFrames, 32 * $builtAnimations.Count, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
        try {
            $sheetGraphics.Clear([System.Drawing.Color]::Transparent)
            $manifestAnimations = [System.Collections.ArrayList]::new()
            for ($row = 0; $row -lt $builtAnimations.Count; $row++) {
                $built = $builtAnimations[$row]
                for ($column = 0; $column -lt $built.frames.Count; $column++) {
                    $sheetGraphics.DrawImage($built.frames[$column], $column * 32, $row * 32, 32, 32)
                }
                $manifestEntry = [ordered]@{
                    name = $built.name
                    row = $row
                    frame_count = $built.frames.Count
                    fps = $built.fps
                    loop = $built.loop
                }
                [void]$manifestAnimations.Add($manifestEntry)
            }

            $assetsDir = Join-Path -Path ([string]$Config.project_root) -ChildPath 'assets'
            $charactersDir = Join-Path -Path $assetsDir -ChildPath 'characters'
            $outputDir = Join-Path -Path $charactersDir -ChildPath $characterId
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
            $sheetName = "{0}_battle_sheet.png" -f $characterId
            $manifestName = "{0}_battle_model.json" -f $characterId
            $sheetPath = Join-Path $outputDir $sheetName
            $manifestPath = Join-Path $outputDir $manifestName
            if (Test-Path -LiteralPath $sheetPath) { Remove-Item -LiteralPath $sheetPath -Force }
            $sheet.Save($sheetPath, [System.Drawing.Imaging.ImageFormat]::Png)

            $manifest = [ordered]@{
                version = 1
                character_id = $characterId
                source = [string]$Config.source
                sheet = "res://assets/characters/$characterId/$sheetName"
                cell_size = 32
                columns = [int]$maxFrames
                animations = $manifestAnimations
            }
            [System.IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 8), [System.Text.UTF8Encoding]::new($false))
            Write-Host "已生成透明战场图集：$sheetPath" -ForegroundColor Green
            Write-Host "已生成动画清单：$manifestPath" -ForegroundColor Green
        }
        finally {
            $sheetGraphics.Dispose()
            $sheet.Dispose()
        }
    }
    finally {
        foreach ($frameList in $allFrames.Values) {
            foreach ($frame in $frameList) { $frame.Dispose() }
        }
        $source.Dispose()
    }
}

$config = Get-ConfigText $ConfigPath
Save-ImportedModel $config

if (-not $SkipGodotImport) {
    $godot = [string]$config.godot_executable
    if (-not (Test-Path -LiteralPath $godot)) {
        throw "找不到 Godot：$godot"
    }
    $scanArgs = @("--headless", "--editor", "--path", [string]$config.project_root, "--quit")
    $scan = Start-Process -FilePath $godot -ArgumentList $scanArgs -Wait -PassThru -NoNewWindow
    if ($scan.ExitCode -ne 0) {
        throw "Godot 导入扫描失败，退出码：$($scan.ExitCode)"
    }
    Write-Host "Godot 已完成导入扫描；下次进入战斗会按角色ID自动加载该模型。" -ForegroundColor Green
}
