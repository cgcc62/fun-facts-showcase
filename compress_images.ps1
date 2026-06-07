Add-Type -AssemblyName System.Drawing

$sourcePath = ".\images"

Get-ChildItem -Path $sourcePath -Filter *.png | ForEach-Object {
    $imagePath = $_.FullName
    $tempPath = $imagePath + ".tmp"
    
    try {
        $image = [System.Drawing.Image]::FromFile($imagePath)
        
        $maxDimension = 1200
        $width = $image.Width
        $height = $image.Height
        
        if ($width -gt $maxDimension -or $height -gt $maxDimension) {
            if ($width -gt $height) {
                $newWidth = $maxDimension
                $newHeight = [int]($height * ($maxDimension / $width))
            } else {
                $newHeight = $maxDimension
                $newWidth = [int]($width * ($maxDimension / $height))
            }
        } else {
            $newWidth = $width
            $newHeight = $height
        }
        
        $newImage = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $graphics = [System.Drawing.Graphics]::FromImage($newImage)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($image, 0, 0, $newWidth, $newHeight)
        
        $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Png.Guid }
        $parameters = New-Object System.Drawing.Imaging.EncoderParameters
        $qualityParam = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 80)
        $parameters.Param[0] = $qualityParam
        
        $newImage.Save($tempPath, $encoder, $parameters)
        
        $originalSize = [math]::Round($_.Length / 1KB, 2)
        $compressedSize = [math]::Round((Get-Item $tempPath).Length / 1KB, 2)
        $reduction = [math]::Round((1 - $compressedSize / $originalSize) * 100, 1)
        
        Move-Item -Path $tempPath -Destination $imagePath -Force
        
        Write-Host "Compressed: $($_.Name)"
        Write-Host "  Original: ${originalSize}KB -> Compressed: ${compressedSize}KB ($reduction% smaller)"
        
        $image.Dispose()
        $newImage.Dispose()
        $graphics.Dispose()
    } catch {
        Write-Host "Failed: $($_.Name) - $_"
        if (Test-Path $tempPath) {
            Remove-Item $tempPath -Force
        }
    }
}

Write-Host "`nDone!"
