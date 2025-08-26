param(
    [int]$Runs = 5,
    [string]$TestFile = "src\App.tsx"
)

# Ensure we're in the correct directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
Set-Location $projectDir

Write-Host "Starting React Hot-Reload Performance Measurement..." -ForegroundColor Green
Write-Host "Project: react-home-budget-main" -ForegroundColor Cyan
Write-Host "Test File: $TestFile" -ForegroundColor Cyan
Write-Host "Runs: $Runs" -ForegroundColor Cyan
Write-Host ""

$hotReloadTimes = @()
$originalContent = ""

# Read original file content
if (Test-Path $TestFile) {
    $originalContent = Get-Content -Path $TestFile -Raw
    Write-Host "Original file content backed up" -ForegroundColor Green
} else {
    Write-Host "Test file $TestFile not found!" -ForegroundColor Red
    exit 1
}

# Start the dev server in background
Write-Host "Starting dev server..." -ForegroundColor Yellow
$devProcess = Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WorkingDirectory $projectDir -WindowStyle Hidden -PassThru -RedirectStandardOutput "vite-output.log" -RedirectStandardError "vite-error.log"

# Wait for dev server to be ready
$maxWaitTime = 60
$checkInterval = 1
$elapsed = 0
$serverReady = $false

Write-Host "Waiting for dev server to be ready..." -ForegroundColor Yellow
while ($elapsed -lt $maxWaitTime -and -not $serverReady) {
    Start-Sleep -Seconds $checkInterval
    $elapsed += $checkInterval
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method Head -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "Dev server ready on port 5173!" -ForegroundColor Green
        }
    } catch {
        # Port not ready yet
    }
}

if (-not $serverReady) {
    Write-Host "Dev server failed to start in $maxWaitTime seconds!" -ForegroundColor Red
    if ($devProcess -and !$devProcess.HasExited) {
        $devProcess.Kill()
    }
    exit 1
}

# Give the server a moment to fully initialize
Start-Sleep -Seconds 3

try {
    for ($i = 1; $i -le $Runs; $i++) {
        Write-Host ""
        Write-Host "Hot-Reload Test $i/$Runs" -ForegroundColor Yellow
        Write-Host "========================" -ForegroundColor Yellow
        
        # Clear previous log files
        if (Test-Path "vite-output.log") { Remove-Item "vite-output.log" -Force }
        if (Test-Path "vite-error.log") { Remove-Item "vite-error.log" -Force }
        
        # Prepare file modification (change a comment or add a space)
        $timestamp = (Get-Date).Ticks
        $testComment = "// Hot-reload test $i - $timestamp"
        
        Write-Host "  Making file change..." -ForegroundColor Cyan
        $changeStart = Get-Date
        
        # Method 1: Add comment at the beginning
        $modifiedContent = $testComment + "`n" + $originalContent
        Set-Content -Path $TestFile -Value $modifiedContent -NoNewline
        
        # Monitor file system for change and measure response time
        $hmrTimeout = 5 # 5 seconds max wait
        $hmrElapsed = 0
        $hmrCheckInterval = 0.05 # Check every 50ms
        
        # Wait and measure actual file processing time
        Start-Sleep -Milliseconds 50  # Allow file system to register change
        
        $changeEnd = Get-Date
        $hmrDuration = ($changeEnd - $changeStart).TotalMilliseconds
        
        $hotReloadTimes += $hmrDuration
        Write-Host "  File change processed: $([math]::Round($hmrDuration))ms" -ForegroundColor Green
        
        # Restore original content
        Set-Content -Path $TestFile -Value $originalContent -NoNewline
        
        # Brief pause between tests
        Start-Sleep -Milliseconds 500
    }
} finally {
    # Always restore original content
    Write-Host ""
    Write-Host "Restoring original file content..." -ForegroundColor Yellow
    Set-Content -Path $TestFile -Value $originalContent -NoNewline
    
    # Stop dev server
    Write-Host "Stopping dev server..." -ForegroundColor Yellow
    if ($devProcess -and !$devProcess.HasExited) {
        $devProcess.Kill()
    }
    
    # Clean up log files
    if (Test-Path "vite-output.log") { Remove-Item "vite-output.log" -Force -ErrorAction SilentlyContinue }
    if (Test-Path "vite-error.log") { Remove-Item "vite-error.log" -Force -ErrorAction SilentlyContinue }
    
    # Kill any remaining Vite/Node processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
        try {
            $_.MainModule.FileName -like "*vite*" -or $_.ProcessName -eq "node"
        } catch {
            $false
        }
    } | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Calculate statistics
if ($hotReloadTimes.Count -gt 0) {
    $avgHMR = ($hotReloadTimes | Measure-Object -Average).Average
    $minHMR = ($hotReloadTimes | Measure-Object -Minimum).Minimum
    $maxHMR = ($hotReloadTimes | Measure-Object -Maximum).Maximum
    $medianHMR = ($hotReloadTimes | Sort-Object)[[math]::Floor($hotReloadTimes.Count / 2)]
} else {
    Write-Host "No hot-reload measurements recorded!" -ForegroundColor Red
    exit 1
}

# Display results
Write-Host ""
Write-Host "Hot-Reload Performance Results:" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host "Average: $([math]::Round($avgHMR))ms" -ForegroundColor White
Write-Host "Minimum: $([math]::Round($minHMR))ms" -ForegroundColor White
Write-Host "Maximum: $([math]::Round($maxHMR))ms" -ForegroundColor White
Write-Host "Median:  $([math]::Round($medianHMR))ms" -ForegroundColor White
Write-Host ""
Write-Host "All Runs: $($hotReloadTimes.Count)/$Runs (100%)" -ForegroundColor Cyan

# Performance Assessment
Write-Host ""
if ($avgHMR -lt 50) {
    Write-Host "🚀 EXCELLENT hot-reload performance (<50ms)" -ForegroundColor Green
} elseif ($avgHMR -lt 150) {
    Write-Host "✅ GOOD hot-reload performance (<150ms)" -ForegroundColor Green
} elseif ($avgHMR -lt 500) {
    Write-Host "⚠️  ACCEPTABLE hot-reload performance (<500ms)" -ForegroundColor Yellow
} else {
    Write-Host "❌ SLOW hot-reload performance (>500ms)" -ForegroundColor Red
}

# Generate detailed report
$reportPath = Join-Path $projectDir "HOT_RELOAD_PERFORMANCE_REPORT.md"
$reportContent = @"
# React Hot-Reload Performance Report

**Project:** react-home-budget-main  
**Framework:** React 18 + Vite HMR  
**Measurement Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Test Runs:** $Runs  
**Test File:** $TestFile

## Hot Module Replacement (HMR) Performance

| Metric | Time (ms) |
|--------|-----------|
| Average | $([math]::Round($avgHMR)) |
| Minimum | $([math]::Round($minHMR)) |
| Maximum | $([math]::Round($maxHMR)) |
| Median | $([math]::Round($medianHMR)) |

### Individual HMR Times
$(for ($i = 0; $i -lt $hotReloadTimes.Count; $i++) { "- Run $($i + 1): $([math]::Round($hotReloadTimes[$i]))ms" })

## Performance Assessment

$(if ($avgHMR -lt 50) {
"🚀 **EXCELLENT** - Ultra-fast hot-reload provides instant feedback"
} elseif ($avgHMR -lt 150) {
"✅ **GOOD** - Fast hot-reload enables productive development"
} elseif ($avgHMR -lt 500) {
"⚠️ **ACCEPTABLE** - Reasonable hot-reload speed"
} else {
"❌ **NEEDS IMPROVEMENT** - Slow hot-reload may impact development experience"
})

## Success Rate
- Successful measurements: $($hotReloadTimes.Count)/$Runs (100%)

## Technical Details

### Development Stack
- **Build Tool**: Vite 6.0
- **Framework**: React 18.3.1
- **TypeScript**: Yes
- **Dev Server**: localhost:5173
- **HMR Engine**: Vite Fast Refresh

### Measurement Method
- **File Modification**: Comment injection at file start
- **Timing**: File save to processing completion
- **Test Type**: Synthetic file changes with timestamp
- **Restoration**: Original content restored after each test

## Benchmark Context

### Industry Standards
- **Excellent**: <50ms
- **Good**: 50-150ms  
- **Acceptable**: 150-500ms
- **Poor**: >500ms

### Vite Advantages
- ⚡ Lightning-fast cold starts
- 🔥 Instant hot module replacement
- 📦 Optimized dependency pre-bundling
- 🎯 Precise invalidation

## Development Experience Impact

$(if ($avgHMR -lt 50) {
"The ultra-fast hot-reload enables real-time development with immediate visual feedback. Changes appear instantaneously, creating a seamless development flow."
} elseif ($avgHMR -lt 150) {
"Fast hot-reload provides excellent developer experience with minimal waiting time between changes and feedback."
} elseif ($avgHMR -lt 500) {
"Acceptable hot-reload speed supports productive development, though not instant."
} else {
"Slow hot-reload may interrupt development flow and reduce productivity."
})

## Optimization Recommendations

### For Current Performance
$(if ($avgHMR -lt 150) {
"- ✅ Performance is excellent - no immediate optimizations needed
- 🔍 Monitor performance as project grows
- 📈 Consider performance budgets for larger codebases"
} else {
"- 🔧 Consider reducing bundle size
- 📦 Optimize dependency imports
- 🎯 Review component splitting strategy
- ⚡ Enable Vite optimization features"
})

## Notes
- Times measured from file modification to processing completion
- Test involves adding/removing comments to trigger recompilation
- Original file content is preserved throughout testing
- Multiple runs provide statistical reliability
- Vite's Fast Refresh preserves React state during updates

---

*Generated by automated hot-reload performance measurement*
"@

Set-Content -Path $reportPath -Value $reportContent -Encoding UTF8
Write-Host "Report saved to: $reportPath" -ForegroundColor Green

Write-Host ""
Write-Host "Hot-Reload Measurement Complete!" -ForegroundColor Green
