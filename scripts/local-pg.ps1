param(
  [ValidateSet("start", "stop", "status")]
  [string]$Action = "status"
)

$PgBin = "C:\Program Files\PostgreSQL\17\bin"
$DataDir = Join-Path $PSScriptRoot "..\.pgdata"
$LogFile = Join-Path $DataDir "postgres.log"

if (-not (Test-Path $PgBin)) {
  Write-Error "PostgreSQL 17 binaries not found at $PgBin"
  exit 1
}

switch ($Action) {
  "start" {
    if (-not (Test-Path $DataDir)) {
      $pwFile = [System.IO.Path]::GetTempFileName()
      [System.IO.File]::WriteAllText($pwFile, "realcollab_secret")
      & "$PgBin\initdb.exe" -D $DataDir -U realcollab --pwfile="$pwFile" -E UTF8 -A scram-sha-256
      Remove-Item $pwFile -Force
      Add-Content -Path (Join-Path $DataDir "postgresql.conf") -Value "`nport = 5433`n"
    }
    & "$PgBin\pg_ctl.exe" -D $DataDir -l $LogFile start
  }
  "stop" {
    & "$PgBin\pg_ctl.exe" -D $DataDir stop
  }
  "status" {
    & "$PgBin\pg_ctl.exe" -D $DataDir status
  }
}
