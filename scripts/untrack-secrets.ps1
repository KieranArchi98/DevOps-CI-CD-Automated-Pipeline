Set-StrictMode -Version Latest
$pwd = Resolve-Path .
Set-Location $pwd
Write-Output "Listing tracked files that look like secrets/env..."
$tracked = git ls-files
$regex = '(^|/)(\.env$|\.env\..+|secrets(.*)?\.ya?ml$)|(\.key$|\.crt$|\.pem$)'
$matches = $tracked | Select-String -Pattern $regex | ForEach-Object { $_.ToString().Trim() } | Sort-Object -Unique
if (-not $matches) {
    Write-Output 'No tracked secret/env files found.'
    exit 0
}
Write-Output 'Files to untrack:'
$matches | ForEach-Object { Write-Output " - $_" }
foreach ($f in $matches) {
    git rm --cached --ignore-unmatch -- "$f"
    Write-Output "Untracked: $f"
}
git add .gitignore 2>$null
try {
    git diff --staged --quiet
    $staged = $LASTEXITCODE
} catch {
    $staged = 1
}
if ($staged -eq 0) {
    Write-Output 'No staged changes to commit.'
} else {
    git commit -m 'Untrack secret/env files (kept locally); update .gitignore'
    Write-Output 'Committed untrack changes.'
}
Write-Output 'Final git status (porcelain):'
git status --porcelain
