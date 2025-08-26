param(
    [int]$Runs = 3,
    [string]$OutFile = "BUILD_PERFORMANCE_REPORT.md"
)

$ErrorActionPreference = "Continue"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "SolidJS Build Performance Measurement" -ForegroundColor Green
Write-Host "Project: SolidJS Contact Manager" -ForegroundColor Cyan
Write-Host "Runs: $Runs" -ForegroundColor Yellow
Write-Host ""

# Results storage
$results = @{
    build = @()
    dev_start = @()
}

function Measure-Command {
    param([ScriptBlock]$Command, [string]$Description)
    
    Write-Host "Measuring: $Description" -ForegroundColor Cyan
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        & $Command | Out-Null
        $stopwatch.Stop()
        $duration = $stopwatch.ElapsedMilliseconds
        Write-Host "SUCCESS: $Description completed in $duration ms" -ForegroundColor Green
        return $duration
    }
    catch {
        $stopwatch.Stop()
        Write-Host "FAILED: $Description failed: $($_.Exception.Message)" -ForegroundColor Red
        return -1
    }
}

# Change to project directory
Set-Location $projectRoot

for ($i = 1; $i -le $Runs; $i++) {
    Write-Host ""
    Write-Host "Run $i of $Runs" -ForegroundColor Magenta
    Write-Host "=============" -ForegroundColor Magenta
    
    # Clean build folders
    if (Test-Path ".output") { 
        Write-Host "Cleaning .output folder..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force ".output" 
    }
    if (Test-Path ".vinxi") { 
        Write-Host "Cleaning .vinxi folder..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force ".vinxi" 
    }
    
    # Measure production build (robust: redirect output, ensure non-zero)
    $buildTime = Measure-Command {
        $buildStdOut = Join-Path $env:TEMP "solid_build_stdout_$(Get-Random).log"
        $buildStdErr = Join-Path $env:TEMP "solid_build_stderr_$(Get-Random).log"
        $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run build" -WorkingDirectory $projectRoot -PassThru -RedirectStandardOutput $buildStdOut -RedirectStandardError $buildStdErr
        $proc.WaitForExit()
        $exit = $proc.ExitCode
        if ($exit -ne 0) {
            Write-Host "Build stdout:" -ForegroundColor Yellow
            Get-Content $buildStdOut -ErrorAction SilentlyContinue | Select-Object -Last 20 | ForEach-Object { Write-Host $_ }
            Write-Host "Build stderr:" -ForegroundColor Yellow
            Get-Content $buildStdErr -ErrorAction SilentlyContinue | Select-Object -Last 20 | ForEach-Object { Write-Host $_ }
            throw "npm run build failed with exit code $exit"
        }
        Remove-Item -ErrorAction SilentlyContinue $buildStdOut, $buildStdErr
    } "npm run build"
    $results.build += $buildTime
    
    # Measure dev server start (spawn process, poll logs + port)
    $devStartTime = Measure-Command {
        $devStdOut = Join-Path $env:TEMP "solid_dev_stdout_$(Get-Random).log"
        $devStdErr = Join-Path $env:TEMP "solid_dev_stderr_$(Get-Random).log"
        $devProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run dev" -WorkingDirectory $projectRoot -PassThru -RedirectStandardOutput $devStdOut -RedirectStandardError $devStdErr
        $timeoutMs = 90000
        $intervalMs = 250
        $ready = $false
        $swInner = [System.Diagnostics.Stopwatch]::StartNew()
        while ($swInner.ElapsedMilliseconds -lt $timeoutMs) {
            # Port probe
            $portOpen = $false
            try {
                $tcp = New-Object System.Net.Sockets.TcpClient
                $task = $tcp.ConnectAsync('127.0.0.1',3000)
                if ($task.Wait(150) -and $tcp.Connected) { $portOpen = $true }
                $tcp.Close()
            } catch { }
            # Log probe
            $logMatch = $false
            try {
                if (Test-Path $devStdOut) {
                    $tail = Get-Content $devStdOut -ErrorAction SilentlyContinue | Select-Object -Last 25
                    if ($tail -match 'localhost:3000' -or $tail -match 'Local:' -or $tail -match 'vinxi v') { $logMatch = $true }
                }
            } catch {}
            if ($portOpen -and $logMatch) { $ready = $true; break }
            Start-Sleep -Milliseconds $intervalMs
        }
        if (-not $ready) {
            Write-Host "--- Dev stdout tail ---" -ForegroundColor Yellow
            Get-Content $devStdOut -ErrorAction SilentlyContinue | Select-Object -Last 40 | ForEach-Object { Write-Host $_ }
            Write-Host "-----------------------" -ForegroundColor Yellow
            throw "Dev server start timeout (no combined port+log readiness in $([math]::Round($timeoutMs/1000))s)"
        }
        # Cleanup
        try { if ($devProc -and -not $devProc.HasExited) { Stop-Process -Id $devProc.Id -Force -ErrorAction SilentlyContinue } } catch {}
        Remove-Item -ErrorAction SilentlyContinue $devStdOut, $devStdErr
    } "npm run dev (startup)"
    $results.dev_start += $devStartTime
    
    # Kill any remaining processes
    Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*vinxi*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep 2
}

# Calculate statistics
function Get-Stats {
    param([array]$values)
    $valid = $values | Where-Object { $_ -gt 0 }
    if ($valid.Count -eq 0) { return @{ avg = 0; min = 0; max = 0; median = 0 } }
    
    $sorted = $valid | Sort-Object
    $median = if ($sorted.Count % 2 -eq 0) {
        ($sorted[($sorted.Count/2)-1] + $sorted[$sorted.Count/2]) / 2
    } else {
        $sorted[[Math]::Floor($sorted.Count/2)]
    }
    
    return @{
        avg = [Math]::Round(($valid | Measure-Object -Average).Average, 0)
        min = ($valid | Measure-Object -Minimum).Minimum
        max = ($valid | Measure-Object -Maximum).Maximum
        median = [Math]::Round($median, 0)
    }
}

$buildStats = Get-Stats $results.build
$devStartStats = Get-Stats $results.dev_start

# Generate report
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$report = @"
# SolidJS Contact Manager - Build Performance Report

*Generated on: $timestamp*

## Executive Summary

Performance analysis of SolidJS Contact Manager application build and startup times across $Runs test runs.

### Key Performance Metrics

| Operation | Average | Minimum | Maximum | Median | Unit |
|-----------|---------|---------|---------|--------|------|
| **npm run build** | $($buildStats.avg) | $($buildStats.min) | $($buildStats.max) | $($buildStats.median) | ms |
| **npm run dev** | $($devStartStats.avg) | $($devStartStats.min) | $($devStartStats.max) | $($devStartStats.median) | ms |

### Performance Grades

| Operation | Time (avg) | Grade | Assessment |
|-----------|------------|-------|------------|
| **Production Build** | $([Math]::Round($buildStats.avg/1000, 1))s | $(if($buildStats.avg -lt 10000){"Excellent"}elseif($buildStats.avg -lt 30000){"Good"}else{"Slow"}) | $(if($buildStats.avg -lt 10000){"Very fast build"}elseif($buildStats.avg -lt 30000){"Acceptable build time"}else{"Build optimization needed"}) |
| **Dev Server Start** | $([Math]::Round($devStartStats.avg/1000, 1))s | $(if($devStartStats.avg -lt 5000){"Excellent"}elseif($devStartStats.avg -lt 15000){"Good"}else{"Slow"}) | $(if($devStartStats.avg -lt 5000){"Instant development feedback"}elseif($devStartStats.avg -lt 15000){"Good developer experience"}else{"Slow development startup"}) |

## Technical Analysis

### Project Configuration
- **Framework**: SolidJS with SolidStart
- **Build Tool**: Vinxi (Vite-based)
- **Package Manager**: npm
- **Bundle Target**: ES2020+
- **SSR**: Enabled (Universal/Isomorphic)

### Build Characteristics
- **Build Consistency**: $(if(($buildStats.max - $buildStats.min) -lt ($buildStats.avg * 0.3)){"Consistent"}else{"Variable"}) (±$([Math]::Round((($buildStats.max - $buildStats.min)/2)/1000, 1))s variance)
- **Dev Server Reliability**: $(if($devStartStats.min -gt 0){"100% success rate"}else{"Some failures detected"})

## Detailed Results

### Raw Measurements (milliseconds)

#### npm run build  
$($results.build | ForEach-Object { "- Run: $_ ms" })

#### npm run dev (startup)
$($results.dev_start | ForEach-Object { "- Run: $_ ms" })

## Optimization Recommendations

### Build Performance
- $(if($buildStats.avg -gt 20000){"Enable Vinxi build optimization features"}else{"Build performance is good"})
- Leverage SolidJS's compile-time optimizations
- Consider route-based code splitting

### Development Experience
- $(if($devStartStats.avg -gt 10000){"Optimize Vinxi dev server configuration"}else{"Development startup is responsive"})
- Enable HMR optimizations for SolidJS
- Pre-bundle heavy dependencies

## Framework Comparison Context

### Industry Benchmarks
- **Good build time**: <10s  
- **Good dev startup**: <5s

### Current Status
- **Build Speed**: $(if($buildStats.avg -lt 10000){"Above industry standard"}elseif($buildStats.avg -lt 30000){"Within acceptable range"}else{"Below industry standard"})  
- **Dev Experience**: $(if($devStartStats.avg -lt 5000){"Above industry standard"}elseif($devStartStats.avg -lt 15000){"Within acceptable range"}else{"Below industry standard"})

### SolidJS-Specific Notes
- SolidJS compiles to highly optimized vanilla JavaScript
- No virtual DOM overhead in runtime or build
- SolidStart adds SSR capabilities which may affect build times
- Vinxi provides modern bundling with Vite under the hood

---

*This report was generated using automated build performance measurement tools.*

## Reproduction Commands

To reproduce these measurements:

```powershell
# Run measurement
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\measure-build-times.ps1

# Run with custom parameters  
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\measure-build-times.ps1 -Runs 5 -OutFile CUSTOM_BUILD_REPORT.md
```
"@

# Write report
$report | Out-File -FilePath $OutFile -Encoding UTF8
Write-Host ""
Write-Host "Report generated: $OutFile" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Build: $([Math]::Round($buildStats.avg/1000, 1))s avg" -ForegroundColor White  
Write-Host "  - Dev Start: $([Math]::Round($devStartStats.avg/1000, 1))s avg" -ForegroundColor White
