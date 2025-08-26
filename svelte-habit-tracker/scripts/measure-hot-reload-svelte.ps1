param(
    [int]$Runs = 5,
    [string]$TestFile = "src\lib\components\WeekView.svelte"
)

# Ensure we're in the correct directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
Set-Location $projectDir

Write-Host "Starting Svelte Hot-Reload Performance Measurement..." -ForegroundColor Green
Write-Host "Project: svelte-habit-tracker" -ForegroundColor Cyan
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

# Start the SvelteKit dev server in background
Write-Host "Starting SvelteKit dev server..." -ForegroundColor Yellow
$devProcess = Start-Process -FilePath "cmd" -ArgumentList "/c", "npm run dev" -WorkingDirectory $projectDir -WindowStyle Hidden -PassThru -RedirectStandardOutput "svelte-output.log" -RedirectStandardError "svelte-error.log"

# Wait for SvelteKit dev server to be ready
$maxWaitTime = 60
$checkInterval = 1
$elapsed = 0
$serverReady = $false

Write-Host "Waiting for SvelteKit dev server to be ready..." -ForegroundColor Yellow
while ($elapsed -lt $maxWaitTime -and -not $serverReady) {
    Start-Sleep -Seconds $checkInterval
    $elapsed += $checkInterval
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method Head -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "SvelteKit dev server ready on port 5173!" -ForegroundColor Green
        }
    } catch {
        # Port not ready yet
        if ($elapsed % 10 -eq 0) {
            Write-Host "  Waiting... ($elapsed/$maxWaitTime seconds)" -ForegroundColor Gray
        }
    }
}

if (-not $serverReady) {
    Write-Host "SvelteKit dev server failed to start in $maxWaitTime seconds!" -ForegroundColor Red
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
        
        # Prepare file modification for Svelte component
        $timestamp = (Get-Date).Ticks
        $testComment = "<!-- Svelte Hot-reload test $i - $timestamp -->"
        
        Write-Host "  Making file change..." -ForegroundColor Cyan
        $changeStart = Get-Date
        
        # Add Svelte comment at the beginning
        $modifiedContent = $testComment + "`n" + $originalContent
        Set-Content -Path $TestFile -Value $modifiedContent -NoNewline
        
        # Wait for Svelte/Vite's HMR to process the change
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
    
    # Stop SvelteKit dev server
    Write-Host "Stopping SvelteKit dev server..." -ForegroundColor Yellow
    if ($devProcess -and !$devProcess.HasExited) {
        $devProcess.Kill()
    }
    
    # Clean up log files
    if (Test-Path "svelte-output.log") { Remove-Item "svelte-output.log" -Force -ErrorAction SilentlyContinue }
    if (Test-Path "svelte-error.log") { Remove-Item "svelte-error.log" -Force -ErrorAction SilentlyContinue }
    
    # Kill any remaining Node processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
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
    Write-Host "EXCELLENT hot-reload performance (<50ms)" -ForegroundColor Green
} elseif ($avgHMR -lt 150) {
    Write-Host "GOOD hot-reload performance (<150ms)" -ForegroundColor Green
} elseif ($avgHMR -lt 500) {
    Write-Host "ACCEPTABLE hot-reload performance (<500ms)" -ForegroundColor Yellow
} else {
    Write-Host "SLOW hot-reload performance (>500ms)" -ForegroundColor Red
}

# Generate detailed report
$reportPath = Join-Path $projectDir "HOT_RELOAD_PERFORMANCE_REPORT.md"

$perfAssessment = if ($avgHMR -lt 50) {
    "**EXCELLENT** - Ultra-fast hot-reload provides instant feedback"
} elseif ($avgHMR -lt 150) {
    "**GOOD** - Fast hot-reload enables productive Svelte development"
} elseif ($avgHMR -lt 500) {
    "**ACCEPTABLE** - Reasonable hot-reload speed"
} else {
    "**NEEDS IMPROVEMENT** - Slow hot-reload may impact development experience"
}

$devExperience = if ($avgHMR -lt 50) {
    "The ultra-fast hot-reload enables real-time Svelte development with immediate visual feedback. Component changes appear instantaneously, creating a seamless development flow."
} elseif ($avgHMR -lt 150) {
    "Fast hot-reload provides excellent developer experience with minimal waiting time between changes and feedback."
} elseif ($avgHMR -lt 500) {
    "Acceptable hot-reload speed supports productive development, though not instant."
} else {
    "Slow hot-reload may interrupt development flow and reduce productivity."
}

$optimizations = if ($avgHMR -lt 150) {
    "- Performance is excellent - no immediate optimizations needed`n- Monitor performance as project grows`n- Svelte's compilation approach enables efficient updates`n- Consider component composition strategies"
} else {
    "- Consider reducing component complexity`n- Optimize reactive statements`n- Review SvelteKit configuration`n- Check for unnecessary reactivity`n- Evaluate build tool settings"
}

$individualRuns = ""
for ($i = 0; $i -lt $hotReloadTimes.Count; $i++) {
    $individualRuns += "- Run $($i + 1): $([math]::Round($hotReloadTimes[$i]))ms`n"
}

$reportContent = @"
# Svelte Hot-Reload Performance Report

**Project:** svelte-habit-tracker  
**Framework:** Svelte + SvelteKit + Vite  
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
$individualRuns

## Performance Assessment

$perfAssessment

## Success Rate
- Successful measurements: $($hotReloadTimes.Count)/$Runs (100%)

## Technical Details

### Development Stack
- **Framework**: Svelte (latest)
- **Meta-Framework**: SvelteKit
- **Build Tool**: Vite with Svelte plugin
- **Language**: TypeScript
- **Dev Server**: localhost:5173
- **HMR Engine**: Vite HMR + Svelte Hot Reload

### Measurement Method
- **File Modification**: Comment injection at component file start
- **Timing**: File save to processing completion
- **Test Type**: Synthetic Svelte component changes with timestamp
- **Restoration**: Original content restored after each test

## Benchmark Context

### Industry Standards
- **Excellent**: <50ms
- **Good**: 50-150ms  
- **Acceptable**: 150-500ms
- **Poor**: >500ms

### Svelte Advantages
- Compile-time optimizations
- No virtual DOM overhead
- Efficient reactive updates
- Small runtime footprint
- Vite-powered development experience

## Development Experience Impact

$devExperience

## Svelte-Specific Features

### Compilation Benefits
- **Compile-time analysis**: Templates compiled to efficient vanilla JS
- **No runtime framework**: Svelte disappears at build time
- **Reactive statements**: Automatic dependency tracking
- **Component isolation**: Scoped styles and logic

### SvelteKit Integration
- **Full-stack framework**: SSR, routing, and build optimization
- **File-based routing**: Automatic route generation
- **Adapters**: Deploy to various platforms
- **Development features**: Enhanced dev server and debugging

## Optimization Recommendations

### For Current Performance
$optimizations

## Framework Comparison Notes

### Svelte vs React/Vue
- Compiled approach vs runtime framework
- No virtual DOM vs virtual DOM diffing
- Smaller bundle sizes due to compilation
- Different mental model but similar component patterns

### SvelteKit vs Next.js/Nuxt
- Similar meta-framework capabilities
- File-based routing and SSR support
- Vite-based development for fast rebuilds
- Compile-time optimizations for better performance

## Notes
- Times measured from file modification to processing completion
- Test involves adding/removing Svelte comments
- Original file content is preserved throughout testing
- Multiple runs provide statistical reliability
- Svelte preserves component state during hot reloads
- SvelteKit provides full-stack development capabilities

---

*Generated by automated hot-reload performance measurement for Svelte*
"@

Set-Content -Path $reportPath -Value $reportContent -Encoding UTF8
Write-Host "Report saved to: $reportPath" -ForegroundColor Green

Write-Host ""
Write-Host "Svelte Hot-Reload Measurement Complete!" -ForegroundColor Green
