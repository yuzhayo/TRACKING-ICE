param(
    [int]$Port = 5300,
    [string]$ProfileDir,
    [string]$Chrome
)

$ErrorActionPreference = 'Stop'

$pageUrl = "http://127.0.0.1:$Port/"
$cdpNewTab = "http://127.0.0.1:9333/json/new?$pageUrl"
$logPath = Join-Path $env:TEMP 'tracking-ice-automation-tab.log'

function Write-Log([string]$message) {
    "$(Get-Date -Format 'o') $message" | Add-Content -LiteralPath $logPath -Encoding utf8
}

function Start-AutomationChrome() {
    if (-not $Chrome -or -not $ProfileDir -or -not (Test-Path $ProfileDir)) {
        return $false
    }

    Start-Process -FilePath $Chrome -ArgumentList @(
        "--user-data-dir=$ProfileDir",
        "--profile-directory=Default",
        "--remote-debugging-port=9333",
        "--no-first-run",
        "--no-default-browser-check",
        $pageUrl
    )

    return $true
}

Write-Log "helper started port=$Port"

for ($attempt = 0; $attempt -lt 120; $attempt++) {
    Start-Sleep -Milliseconds 500

    try {
        Invoke-WebRequest -Uri $pageUrl -UseBasicParsing -TimeoutSec 2 | Out-Null
    } catch {
        continue
    }

    Write-Log "dev server answered"

    try {
        $target = Invoke-RestMethod -Uri $cdpNewTab -Method Put

        if ($target.id) {
            try {
                Invoke-WebRequest -Uri "http://127.0.0.1:9333/json/activate/$($target.id)" -UseBasicParsing | Out-Null
            } catch {
                Write-Log "activate failed: $($_.Exception.Message)"
            }
        }

        Write-Log "CDP tab opened"
        exit 0
    } catch {
        Write-Log "CDP failed, starting Chrome: $($_.Exception.Message)"

        try {
            if (Start-AutomationChrome) {
                Write-Log "Chrome process started"
                exit 0
            }

            Write-Error "Chrome or automation profile is unavailable"
            exit 1
        } catch {
            Write-Log "Chrome start failed: $($_.Exception.Message)"
            Write-Error $_
            exit 1
        }
    }
}

Write-Log "dev server did not answer"
Write-Error "Dev server tidak menjawab pada $pageUrl"
exit 1
