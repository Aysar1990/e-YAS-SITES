$file = "C:\Users\aysar\Downloads\New folder (3)\New folder (3)\TSSR Monitor\tssr-app\electron\server\routes\stats.js"
$content = Get-Content $file -Raw -Encoding UTF8
$newContent = $content -replace 'sites_cache', 'sites'
$newContent | Out-File -FilePath $file -Encoding UTF8 -NoNewline
Write-Host "✅ تم استبدال sites_cache بـ sites في stats.js"
