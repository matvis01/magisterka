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

# First, start the dev server and wait for it to be ready
Write-Host "Starting dev server..." -ForegroundColor Yellow
$devJob = Start-Job -ScriptBlock {
    param($projectPath)
    Set-Location $projectPath
    cmd /c "npm run dev" 2>&1
} -ArgumentList $projectDir

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
        $connection = Test-NetConnection -ComputerName "localhost" -Port 5173 -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($connection) {
            $serverReady = $true
            Write-Host "Dev server ready on port 5173!" -ForegroundColor Green
        }
    } catch {
        # Port not ready yet
    }
}

if (-not $serverReady) {
    Write-Host "Dev server failed to start in $maxWaitTime seconds!" -ForegroundColor Red
    Stop-Job -Job $devJob -ErrorAction SilentlyContinue
    Remove-Job -Job $devJob -ErrorAction SilentlyContinue
    exit 1
}

# Give the server a moment to fully initialize
Start-Sleep -Seconds 3

# Read original file content
if (Test-Path $TestFile) {
    $originalContent = Get-Content -Path $TestFile -Raw
    Write-Host "Original file content backed up" -ForegroundColor Green
} else {
    Write-Host "Test file $TestFile not found!" -ForegroundColor Red
    Stop-Job -Job $devJob -ErrorAction SilentlyContinue
    Remove-Job -Job $devJob -ErrorAction SilentlyContinue
    exit 1
}

try {
    for ($i = 1; $i -le $Runs; $i++) {
        Write-Host ""
        Write-Host "Hot-Reload Test $i/$Runs" -ForegroundColor Yellow
        Write-Host "========================" -ForegroundColor Yellow
        
        # Prepare file modification (add a comment with timestamp)
        $timestamp = (Get-Date).Ticks
        $testComment = "// Hot-reload test $i - $timestamp"
        
        # Measure time from file change to browser update
        Write-Host "  Making file change..." -ForegroundColor Cyan
        $changeStart = Get-Date
        
        # Modify the file by adding a comment at the top
        $modifiedContent = $testComment + "`n" + $originalContent
        Set-Content -Path $TestFile -Value $modifiedContent -NoNewline
        
        # Monitor dev server output for HMR completion
        $hmrDetected = $false
        $hmrTimeout = 10 # 10 seconds max wait for HMR
        $hmrElapsed = 0
        $hmrCheckInterval = 0.1
        
        Write-Host "  Waiting for HMR to complete..." -ForegroundColor Cyan
        
        while ($hmrElapsed -lt $hmrTimeout -and -not $hmrDetected) {
            Start-Sleep -Seconds $hmrCheckInterval
            $hmrElapsed += $hmrCheckInterval
            
            # Check job output for HMR indicators
            $jobOutput = Receive-Job -Job $devJob -ErrorAction SilentlyContinue
            if ($jobOutput -match "hmr update|hot updated|updated.*chunks?|page reload") {
                $changeEnd = Get-Date
                $hmrDuration = ($changeEnd - $changeStart).TotalMilliseconds
                $hotReloadTimes += $hmrDuration
                $hmrDetected = $true
                Write-Host "  HMR completed: $([math]::Round($hmrDuration))ms" -ForegroundColor Green
            }
        }
        
        if (-not $hmrDetected) {
            Write-Host "  HMR timeout after $hmrTimeout seconds!" -ForegroundColor Red
            # Still record a time for failed HMR
            $changeEnd = Get-Date
            $hmrDuration = ($changeEnd - $changeStart).TotalMilliseconds
            Write-Host "  Fallback time recorded: $([math]::Round($hmrDuration))ms" -ForegroundColor Yellow
        }
        
        # Restore original content
        Set-Content -Path $TestFile -Value $originalContent -NoNewline
        Start-Sleep -Seconds 1 # Brief pause between tests
    }
} finally {
    # Always restore original content
    Write-Host ""
    Write-Host "Restoring original file content..." -ForegroundColor Yellow
    Set-Content -Path $TestFile -Value $originalContent -NoNewline
    
    # Stop dev server
    Write-Host "Stopping dev server..." -ForegroundColor Yellow
    Stop-Job -Job $devJob -ErrorAction SilentlyContinue
    Remove-Job -Job $devJob -ErrorAction SilentlyContinue
    
    # Kill any remaining Vite processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Calculate statistics
if ($hotReloadTimes.Count -gt 0) {
    $avgHMR = ($hotReloadTimes | Measure-Object -Average).Average
    $minHMR = ($hotReloadTimes | Measure-Object -Minimum).Minimum
    $maxHMR = ($hotReloadTimes | Measure-Object -Maximum).Maximum
    $medianHMR = ($hotReloadTimes | Sort-Object)[[math]::Floor($hotReloadTimes.Count / 2)]
} else {
    Write-Host "No successful hot-reload measurements recorded!" -ForegroundColor Red
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
Write-Host "Success Rate: $($hotReloadTimes.Count)/$Runs ($([math]::Round(($hotReloadTimes.Count / $Runs) * 100))%)" -ForegroundColor Cyan

# Performance Assessment
Write-Host ""
if ($avgHMR -lt 100) {
    Write-Host "🚀 EXCELLENT hot-reload performance (<100ms)" -ForegroundColor Green
} elseif ($avgHMR -lt 300) {
    Write-Host "✅ GOOD hot-reload performance (<300ms)" -ForegroundColor Green
} elseif ($avgHMR -lt 1000) {
    Write-Host "⚠️  ACCEPTABLE hot-reload performance (<1s)" -ForegroundColor Yellow
} else {
    Write-Host "❌ SLOW hot-reload performance (>1s)" -ForegroundColor Red
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

$(if ($avgHMR -lt 100) {
"🚀 **EXCELLENT** - Sub-100ms hot-reload provides instant feedback"
} elseif ($avgHMR -lt 300) {
"✅ **GOOD** - Fast hot-reload enables productive development"
} elseif ($avgHMR -lt 1000) {
"⚠️ **ACCEPTABLE** - Reasonable hot-reload speed"
} else {
"❌ **NEEDS IMPROVEMENT** - Slow hot-reload may impact development experience"
})

## Success Rate
- Successful HMR: $($hotReloadTimes.Count)/$Runs ($([math]::Round(($hotReloadTimes.Count / $Runs) * 100))%)
- Failed/Timeout: $(($Runs - $hotReloadTimes.Count))/$Runs ($([math]::Round((($Runs - $hotReloadTimes.Count) / $Runs) * 100))%)

## Configuration
- **Dev Server**: Vite (port 5173)
- **HMR Detection**: Log pattern matching
- **Test Method**: File modification + timestamp injection
- **Timeout**: 10 seconds per test
- **Test File**: $TestFile

## Benchmark Context

### Industry Standards
- **Excellent**: <100ms
- **Good**: 100-300ms  
- **Acceptable**: 300ms-1s
- **Poor**: >1s

### Vite HMR Features
- Fast refresh for React components
- Preserve component state during updates
- CSS hot-reload without page refresh
- Optimized dependency pre-bundling

## Notes
- Times measured from file save to HMR completion signal
- Test involves adding/removing comments to trigger recompilation
- Original file content is always restored after testing
- Multiple runs provide statistical reliability

---

*This report was generated using automated hot-reload performance measurement tools.*
"@

Set-Content -Path $reportPath -Value $reportContent -Encoding UTF8
Write-Host "Report saved to: $reportPath" -ForegroundColor Green

Write-Host ""
Write-Host "Hot-Reload Measurement Complete!" -ForegroundColor Green
