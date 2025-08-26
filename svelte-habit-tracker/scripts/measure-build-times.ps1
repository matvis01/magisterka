param(
  [int]$Runs = 3,
  [string]$OutFile = "BUILD_PERFORMANCE_REPORT.md"
)

$ErrorActionPreference = "Continue"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Svelte Build Performance Measurement" -ForegroundColor Green
Write-Host "Project: Svelte Habit Tracker" -ForegroundColor Cyan
Write-Host "Runs: $Runs" -ForegroundColor Yellow
Write-Host ""

$results = @{ build = @(); dev_start = @() }

function Measure-Step {
  param([ScriptBlock]$Action,[string]$Label)
  Write-Host "Measuring: $Label" -ForegroundColor Cyan
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try { & $Action | Out-Null; $sw.Stop(); Write-Host "SUCCESS: $Label in $($sw.ElapsedMilliseconds) ms" -ForegroundColor Green; return $sw.ElapsedMilliseconds }
  catch { $sw.Stop(); Write-Host "FAILED: $Label - $($_.Exception.Message)" -ForegroundColor Red; return -1 }
}

Set-Location $projectRoot

for($i=1;$i -le $Runs;$i++){
  Write-Host ""; Write-Host "Run $i of $Runs" -ForegroundColor Magenta; Write-Host "=============" -ForegroundColor Magenta
  if(Test-Path "dist"){ Write-Host "Cleaning dist..." -ForegroundColor Yellow; Remove-Item dist -Recurse -Force }

  # Build
  $results.build += (Measure-Step {
    $out = Join-Path $env:TEMP "svelte_build_out_$(Get-Random).log"
    $err = Join-Path $env:TEMP "svelte_build_err_$(Get-Random).log"
    $p = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run build" -WorkingDirectory $projectRoot -PassThru -RedirectStandardOutput $out -RedirectStandardError $err
    $p.WaitForExit(); if($p.ExitCode -ne 0){
      Write-Host "Build failed (tail stdout):" -ForegroundColor Yellow; Get-Content $out | Select-Object -Last 30
      Write-Host "stderr:" -ForegroundColor Yellow; Get-Content $err | Select-Object -Last 30
      throw "npm run build exit $($p.ExitCode)" }
    Remove-Item $out,$err -ErrorAction SilentlyContinue
  } "npm run build")

  # Dev start (port 5173)
  $results.dev_start += (Measure-Step {
    $stdout = Join-Path $env:TEMP "svelte_dev_out_$(Get-Random).log"
    $stderr = Join-Path $env:TEMP "svelte_dev_err_$(Get-Random).log"
    $devProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run dev" -WorkingDirectory $projectRoot -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    $timeoutMs=45000; $interval=200; $ok=$false; $inner=[System.Diagnostics.Stopwatch]::StartNew()
    while($inner.ElapsedMilliseconds -lt $timeoutMs){
      $portOpen=$false; try{ $tcp=New-Object System.Net.Sockets.TcpClient; $t=$tcp.ConnectAsync('127.0.0.1',5173); if($t.Wait(150) -and $tcp.Connected){ $portOpen=$true }; $tcp.Close() }catch{}
      $logReady=$false; try{ if(Test-Path $stdout){ $tail= Get-Content $stdout -ErrorAction SilentlyContinue | Select-Object -Last 25; if($tail -match 'localhost:5173' -or $tail -match 'ready in'){ $logReady=$true } } }catch{}
      if($portOpen -and $logReady){ $ok=$true; break }
      Start-Sleep -Milliseconds $interval
    }
    if(-not $ok){
      Write-Host "Dev startup timeout (tail stdout):" -ForegroundColor Yellow
      if(Test-Path $stdout){ Get-Content $stdout | Select-Object -Last 40 }
      throw "Dev server not ready in $([math]::Round($timeoutMs/1000))s" }
    try{ if($devProc -and -not $devProc.HasExited){ Stop-Process -Id $devProc.Id -Force -ErrorAction SilentlyContinue } }catch{}
    Remove-Item $stdout,$stderr -ErrorAction SilentlyContinue
  } "npm run dev (startup)")

  Get-Process | Where-Object { $_.ProcessName -like '*node*' } | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep 1
}

function Stats($vals){ $v=$vals | Where-Object { $_ -ge 0 }; if(-not $v){return @{avg=0;min=0;max=0;median=0}}; $s=$v|Sort-Object; $m= if($s.Count%2 -eq 0){ ($s[$s.Count/2-1]+$s[$s.Count/2])/2 } else { $s[[int]([math]::Floor($s.Count/2))] }; @{ avg=[math]::Round(($v|Measure-Object -Average).Average,0); min=$s[0]; max=$s[-1]; median=[math]::Round($m,0)} }
$buildStats=Stats $results.build; $devStats=Stats $results.dev_start
$ts= Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

$report=@"
# Svelte Habit Tracker - Build Performance Report

*Generated on: $ts*

## Executive Summary

Performance analysis of Svelte Habit Tracker build & dev startup across $Runs runs.

### Key Performance Metrics
| Operation | Average | Minimum | Maximum | Median | Unit |
|-----------|---------|---------|---------|--------|------|
| **npm run build** | $($buildStats.avg) | $($buildStats.min) | $($buildStats.max) | $($buildStats.median) | ms |
| **npm run dev** | $($devStats.avg) | $($devStats.min) | $($devStats.max) | $($devStats.median) | ms |

### Performance Grades
| Operation | Time (avg) | Grade | Assessment |
|-----------|------------|-------|------------|
| **Production Build** | $([math]::Round($buildStats.avg/1000,1))s | $(if($buildStats.avg -lt 8000){'Excellent'}elseif($buildStats.avg -lt 20000){'Good'}else{'Slow'}) | $(if($buildStats.avg -lt 8000){'Very fast build'}elseif($buildStats.avg -lt 20000){'Acceptable build time'}else{'Build optimization recommended'}) |
| **Dev Server Start** | $([math]::Round($devStats.avg/1000,1))s | $(if($devStats.avg -lt 4000){'Excellent'}elseif($devStats.avg -lt 10000){'Good'}else{'Slow'}) | $(if($devStats.avg -lt 4000){'Instant feedback'}elseif($devStats.avg -lt 10000){'Good DX'}else{'Slow startup'}) |

## Raw Measurements
### npm run build
$($results.build | ForEach-Object { "- Run: $_ ms" })
### npm run dev (startup)
$($results.dev_start | ForEach-Object { "- Run: $_ ms" })

## Notes
- Startup readiness = port 5173 open AND log line containing 'localhost:5173' or 'ready in'.
- Cleaning only dist to simulate fresh build output.

---
*Automated measurement script.*
"@

$report | Out-File -Encoding UTF8 -FilePath $OutFile
Write-Host "\nReport generated: $OutFile" -ForegroundColor Green
Write-Host "Build avg: $([math]::Round($buildStats.avg/1000,1))s  Dev start avg: $([math]::Round($devStats.avg/1000,1))s" -ForegroundColor Cyan
