# YAS Logo Copy Script - TRANSPARENT VERSION
# Run this from PowerShell in project root

Write-Host "🎨 YAS Transparent Logo Copy Script" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# You need to download the transparent logo first
$logoDestination = "src\assets\images\logo-new.png"

Write-Host "📋 INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Download the TRANSPARENT logo (logo-yas-final.png)" -ForegroundColor White
Write-Host "   - Check Discord/Telegram for the processed file" -ForegroundColor Gray
Write-Host "   - File size should be ~118 KB" -ForegroundColor Gray
Write-Host "   - Transparent background (no white)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Save it as: logo-new.png" -ForegroundColor White
Write-Host "   To: C:\Users\aysar\Downloads\" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run this script again" -ForegroundColor White
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan

# Try to find and copy if exists
$possibleLocations = @(
    "C:\Users\aysar\Downloads\logo-new.png",
    "C:\Users\aysar\Downloads\logo-yas-final.png",
    "$PSScriptRoot\logo-new.png"
)

$logoFound = $false

foreach ($location in $possibleLocations) {
    if (Test-Path $location) {
        Write-Host ""
        Write-Host "✅ Found logo at: $location" -ForegroundColor Green
        
        try {
            # Create directory if doesn't exist
            $destDir = Split-Path -Parent $logoDestination
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                Write-Host "📁 Created directory: $destDir" -ForegroundColor Yellow
            }
            
            # Copy logo
            Copy-Item -Path $location -Destination $logoDestination -Force
            
            # Verify
            if (Test-Path $logoDestination) {
                $fileSize = (Get-Item $logoDestination).Length
                $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
                Write-Host "✅ Logo copied successfully! ($fileSizeKB KB)" -ForegroundColor Green
                Write-Host "   Destination: $logoDestination" -ForegroundColor Gray
                
                # Check if it's the right size (should be around 118 KB for transparent)
                if ($fileSizeKB -lt 150 -and $fileSizeKB -gt 50) {
                    Write-Host "✅ File size looks correct (transparent version)" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  Warning: File size is $fileSizeKB KB" -ForegroundColor Yellow
                    Write-Host "   Expected: ~118 KB (transparent version)" -ForegroundColor Gray
                }
                
                $logoFound = $true
                break
            }
        } catch {
            Write-Host "❌ Error copying logo: $_" -ForegroundColor Red
        }
    }
}

if (-not $logoFound) {
    Write-Host ""
    Write-Host "❌ Logo file not found!" -ForegroundColor Red
    Write-Host "   Checked locations:" -ForegroundColor Gray
    foreach ($loc in $possibleLocations) {
        Write-Host "   - $loc" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Restart dev server (Ctrl+C, then: npm run dev)" -ForegroundColor White
Write-Host "   2. Open Sites > Map View" -ForegroundColor White  
Write-Host "   3. Check logo in bottom-right corner" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
