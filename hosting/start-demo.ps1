$ErrorActionPreference = 'Stop'
$ngrokPath = Join-Path $PSScriptRoot 'ngrok.exe'
if (-not (Test-Path -LiteralPath $ngrokPath)) {
    throw 'Install the official ngrok Windows executable in the hosting directory first.'
}
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5174/' -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -ne 200) { throw 'Unexpected HTTP status.' }
} catch {
    throw 'Start the app from the project root with npm.cmd run dev before starting the tunnel.'
}
# Host rewrite allows Vite to accept the tunnel without changing allowedHosts.
# Disable inspection so requests containing authentication data are not recorded.
& $ngrokPath http http://localhost:5174 --host-header=localhost:5174 --inspect=false
