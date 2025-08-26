param(
    [int]$Runs = 3
)

# Ensure we're in the correct directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
Set-Location $projectDir

Write-Host "Starting SolidJS build performance measurement..." -ForegroundColor Green
Write-Host "Project: solidjs-contact-manager" -ForegroundColor Cyan
Write-Host "Location: $projectDir" -ForegroundColor Cyan
Write-Host "Runs: $Runs" -ForegroundColor Cyan
Write-Host ""

$buildTimes = @()
$devTimes = @()

for ($i = 1; $i -le $Runs; $i++) {
    Write-Host "Run $i/$Runs" -ForegroundColor Yellow
    
    # Clean build folders
    if (Test-Path ".output") {
        Remove-Item -Recurse -Force ".output"
        Write-Host "  Cleaned .output folder"
    }
    if (Test-Path ".vinxi") {
        Remove-Item -Recurse -Force ".vinxi"
        Write-Host "  Cleaned .vinxi folder"
    }
    
    # Measure build time
    Write-Host "  Measuring build time..." -ForegroundColor Cyan
    $buildStart = Get-Date
    
    # Use cmd to run npm build
    $buildOutput = cmd /c "npm run build 2>&1"
    $buildExitCode = $LASTEXITCODE
    $buildEnd = Get-Date
    
    if ($buildExitCode -eq 0) {
        $buildDuration = ($buildEnd - $buildStart).TotalMilliseconds
        $buildTimes += $buildDuration
        Write-Host "  Build completed: $([math]::Round($buildDuration))ms" -ForegroundColor Green
    } else {
        Write-Host "  Build failed! Exit code: $buildExitCode" -ForegroundColor Red
        continue
    }
    
    # Measure dev server startup time
    Write-Host "  Measuring dev server startup..." -ForegroundColor Cyan
    $devStart = Get-Date
    
    # Start dev server as background job
    $devJob = Start-Job -ScriptBlock {
        param($projectPath)
        Set-Location $projectPath
        cmd /c "npm run dev" 2>&1
    } -ArgumentList $projectDir
    
    # Wait for server to be ready (check for port 3000)
    $maxWaitTime = 120 # 2 minutes max
    $checkInterval = 0.5
    $elapsed = 0
    $serverReady = $false
    
    while ($elapsed -lt $maxWaitTime -and -not $serverReady) {
        Start-Sleep -Seconds $checkInterval
        $elapsed += $checkInterval
        
        # Check if port 3000 is listening
        try {
            $connection = Test-NetConnection -ComputerName "localhost" -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
            if ($connection) {
                $devEnd = Get-Date
                $devDuration = ($devEnd - $devStart).TotalMilliseconds
                $devTimes += $devDuration
                $serverReady = $true
                Write-Host "  Dev server ready: $([math]::Round($devDuration))ms" -ForegroundColor Green
            }
        } catch {
            # Port not ready yet
        }
        
        # Also check job output for readiness indicators
        if (-not $serverReady) {
            $jobOutput = Receive-Job -Job $devJob -ErrorAction SilentlyContinue
            if ($jobOutput -match "Local:.+localhost:3000|ready in|ready|Server running|dev server running" -and $jobOutput -notmatch "error|failed") {
                if (-not $serverReady) {
                    $devEnd = Get-Date
                    $devDuration = ($devEnd - $devStart).TotalMilliseconds
                    $devTimes += $devDuration
                    $serverReady = $true
                    Write-Host "  Dev server ready: $([math]::Round($devDuration))ms" -ForegroundColor Green
                }
            }
        }
    }
    
    if (-not $serverReady) {
        Write-Host "  Dev server timeout after $maxWaitTime seconds!" -ForegroundColor Red
    }
    
    # Cleanup: Stop the dev server job
    Stop-Job -Job $devJob -ErrorAction SilentlyContinue
    Remove-Job -Job $devJob -ErrorAction SilentlyContinue
    
    # Kill any remaining vinxi/node processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vinxi*" -or $_.CommandLine -like "*solid*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host ""
}

# Manual dev server measurement
Write-Host ""
Write-Host "Manual dev server measurement..." -ForegroundColor Yellow
Write-Host "Starting dev server (will be killed after ~10 seconds)" -ForegroundColor Yellow

$devStartTime = Measure-Command {
    $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -NoNewWindow
    Start-Sleep 10  # Wait 10 seconds for startup
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue
} "npm run dev (manual 10s test)"

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

# Generate report
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$report = @"
# SolidJS Contact Manager - Build Performance Report

*Generated on: $timestamp*

## Executive Summary

Performance analysis of SolidJS Contact Manager application build times across $Runs test runs.

### Key Performance Metrics

| Operation | Average | Minimum | Maximum | Median | Unit |
|-----------|---------|---------|---------|--------|------|
| **npm run build** | $($buildStats.avg) | $($buildStats.min) | $($buildStats.max) | $($buildStats.median) | ms |
| **npm run dev** | ~$([Math]::Round($devStartTime/1000, 1))s | - | - | - | (manual test) |

### Performance Grades

| Operation | Time (avg) | Grade | Assessment |
|-----------|------------|-------|------------|
| **Production Build** | $([Math]::Round($buildStats.avg/1000, 1))s | $(if($buildStats.avg -lt 10000){"Excellent"}elseif($buildStats.avg -lt 30000){"Good"}else{"Slow"}) | $(if($buildStats.avg -lt 10000){"Very fast build"}elseif($buildStats.avg -lt 30000){"Acceptable build time"}else{"Build optimization needed"}) |
| **Dev Server Start** | ~$([Math]::Round($devStartTime/1000, 1))s | $(if($devStartTime -lt 5000){"Excellent"}elseif($devStartTime -lt 15000){"Good"}else{"Slow"}) | $(if($devStartTime -lt 5000){"Instant development feedback"}elseif($devStartTime -lt 15000){"Good developer experience"}else{"Slow development startup"}) |

## Technical Analysis

### Project Configuration
- **Framework**: SolidJS with SolidStart
- **Build Tool**: Vinxi (Vite-based)
- **Package Manager**: npm
- **Bundle Target**: ES2020+
- **SSR**: Enabled (Universal/Isomorphic)

### Build Characteristics
- **Build Consistency**: $(if(($buildStats.max - $buildStats.min) -lt ($buildStats.avg * 0.3)){"Consistent"}else{"Variable"}) (±$([Math]::Round((($buildStats.max - $buildStats.min)/2)/1000, 1))s variance)
- **Dev Server Test**: Manual measurement (automatic detection issues with Vinxi output)

## Detailed Results

### Raw Measurements (milliseconds)

#### npm run build  
$($results.build | ForEach-Object { "- Run: $_ ms" })

#### npm run dev
- Manual test: $devStartTime ms (~$([Math]::Round($devStartTime/1000, 1))s)

## Optimization Recommendations

### Build Performance
- $(if($buildStats.avg -gt 20000){"Enable Vinxi build optimization features"}else{"Build performance is good"})
- Leverage SolidJS's compile-time optimizations
- Consider route-based code splitting

### Development Experience
- $(if($devStartTime -gt 10000){"Optimize Vinxi dev server configuration"}else{"Development startup is responsive"})
- Enable HMR optimizations for SolidJS
- Pre-bundle heavy dependencies

## Framework Comparison Context

### Industry Benchmarks
- **Good build time**: <10s  
- **Good dev startup**: <5s

### Current Status
- **Build Speed**: $(if($buildStats.avg -lt 10000){"Above industry standard"}elseif($buildStats.avg -lt 30000){"Within acceptable range"}else{"Below industry standard"})  
- **Dev Experience**: $(if($devStartTime -lt 5000){"Above industry standard"}elseif($devStartTime -lt 15000){"Within acceptable range"}else{"Below industry standard"})

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
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\measure-build-times-simple.ps1

# Run with custom parameters  
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\measure-build-times-simple.ps1 -Runs 5 -OutFile CUSTOM_BUILD_REPORT.md
```
"@

# Write report
$report | Out-File -FilePath $OutFile -Encoding UTF8
Write-Host ""
Write-Host "Report generated: $OutFile" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Build: $([Math]::Round($buildStats.avg/1000, 1))s avg" -ForegroundColor White  
Write-Host "  - Dev Start: ~$([Math]::Round($devStartTime/1000, 1))s (manual)" -ForegroundColor White
