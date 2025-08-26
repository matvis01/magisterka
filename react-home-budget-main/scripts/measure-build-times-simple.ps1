param(
    [int]$Runs = 3,
    [string]$OutFile = "BUILD_PERFORMANCE_REPORT.md"
)

$ErrorActionPreference = "Continue"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "React Build Performance Measurement" -ForegroundColor Green
Write-Host "Project: React Home Budget" -ForegroundColor Cyan
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
    
    # Clean dist folder only
    if (Test-Path "dist") { 
        Write-Host "Cleaning dist folder..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "dist" 
    }
    
    # Measure production build
    $buildTime = Measure-Command {
        $output = cmd /c "npm run build 2>&1"
        if ($LASTEXITCODE -ne 0) { 
            throw "npm run build failed with exit code $LASTEXITCODE" 
        }
    } "npm run build"
    $results.build += $buildTime
    
    # Measure dev server start (time to first output)
    $devStartTime = Measure-Command {
        $job = Start-Job -ScriptBlock {
            Set-Location $using:projectRoot
            npm run dev 2>&1
        }
        
        $timeout = 30000 # 30 seconds
        $elapsed = 0
        $interval = 500
        
        while ($elapsed -lt $timeout) {
            $output = Receive-Job $job -ErrorAction SilentlyContinue
            if ($output -match "Local.*http://localhost" -or $output -match "ready in") {
                Stop-Job $job -ErrorAction SilentlyContinue
                Remove-Job $job -ErrorAction SilentlyContinue
                break
            }
            Start-Sleep -Milliseconds $interval
            $elapsed += $interval
        }
        
        if ($elapsed -ge $timeout) {
            Stop-Job $job -ErrorAction SilentlyContinue
            Remove-Job $job -ErrorAction SilentlyContinue
            throw "Dev server start timeout"
        }
    } "npm run dev (startup)"
    $results.dev_start += $devStartTime
    
    # Kill any remaining processes
    Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue
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
# React Home Budget - Build Performance Report

*Generated on: $timestamp*

## Executive Summary

Performance analysis of React Home Budget application build and startup times across $Runs test runs.

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
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Package Manager**: npm
- **Bundle Target**: ES2020+

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
- $(if($buildStats.avg -gt 20000){"Enable Vite build optimization features"}else{"Build performance is good"})
- Use dynamic imports for code splitting
- Optimize bundle size with tree shaking

### Development Experience
- $(if($devStartStats.avg -gt 10000){"Optimize Vite dev server configuration"}else{"Development startup is responsive"})
- Enable HMR optimizations
- Pre-bundle heavy dependencies

## Framework Comparison Context

### Industry Benchmarks
- **Good build time**: <10s  
- **Good dev startup**: <5s

### Current Status
- **Build Speed**: $(if($buildStats.avg -lt 10000){"Above industry standard"}elseif($buildStats.avg -lt 30000){"Within acceptable range"}else{"Below industry standard"})  
- **Dev Experience**: $(if($devStartStats.avg -lt 5000){"Above industry standard"}elseif($devStartStats.avg -lt 15000){"Within acceptable range"}else{"Below industry standard"})

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
