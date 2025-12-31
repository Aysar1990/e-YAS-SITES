# TSSR Monitor - Simple Extension Installer

Write-Host "Installing VS Code Extensions..." -ForegroundColor Cyan

$extensions = @(
    "Continue.continue",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "usernamehw.errorlens",
    "eamodio.gitlens",
    "GrapeCity.gc-excelviewer",
    "humao.rest-client",
    "dsznajder.es7-react-js-snippets",
    "xabikos.JavaScriptSnippets",
    "bradlc.vscode-tailwindcss",
    "ecmel.vscode-html-css",
    "mhutchie.git-graph",
    "christian-kohler.path-intellisense",
    "rangav.vscode-thunder-client",
    "SonarSource.sonarlint-vscode",
    "wix.vscode-import-cost",
    "streetsidesoftware.code-spell-checker",
    "aaron-bond.better-comments",
    "wayou.vscode-todo-highlight",
    "Orta.vscode-jest"
)

$total = $extensions.Count
$current = 0

foreach ($ext in $extensions) {
    $current++
    Write-Host "[$current/$total] Installing $ext..." -ForegroundColor Yellow
    code --install-extension $ext
}

Write-Host ""
Write-Host "DONE! All extensions installed." -ForegroundColor Green
Write-Host "Please restart VS Code now." -ForegroundColor Yellow