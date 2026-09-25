$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$candidates = @()
$installedNode = Get-Command node -ErrorAction SilentlyContinue
if ($installedNode) { $candidates += $installedNode.Source }
$candidates += Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$compatibleNode = $null
foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
        $versionText = & $candidate --version
        $nodeVersion = [version]($versionText.TrimStart('v'))
        if ($nodeVersion -ge [version]'22.13.0') { $compatibleNode = $candidate; break }
    }
}
if (-not $compatibleNode) { throw 'Install Node.js 22.13 or later, then run npm ci and npm run dev.' }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules\tsx\dist\cli.mjs'))) { throw 'Dependencies are missing. Run npm ci first.' }
Push-Location $projectRoot
try { & $compatibleNode 'node_modules/tsx/dist/cli.mjs' 'server/index.ts' } finally { Pop-Location }
