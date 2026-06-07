$sourcePath = ".\images"

Get-ChildItem -Path $sourcePath -Filter "*.png.tmp" | ForEach-Object {
    $tempPath = $_.FullName
    $imagePath = $tempPath -replace "\.tmp$", ""
    
    try {
        if (Test-Path $imagePath) {
            Remove-Item -Path $imagePath -Force
        }
        Move-Item -Path $tempPath -Destination $imagePath -Force
        Write-Host "Replaced: $($_.Name -replace "\.tmp$", "")"
    } catch {
        Write-Host "Failed to replace: $($_.Name) - $_"
    }
}

Write-Host "`nDone!"
