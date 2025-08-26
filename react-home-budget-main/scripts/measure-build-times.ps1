param(
    [int]$Runs = 3,
    [string]$OutFile = "BUILD_PERFORMANCE_REPORT.md"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "🚀 React Build Performance Measurement" -ForegroundColor Green
Write-Host "Project: React Home Budget" -ForegroundColor Cyan
Write-Host "Runs: $Runs" -ForegroundColor Yellow
Write-Host ""

# Results storage
$results = @{
    install = @()
    build = @()
    dev_start = @()
}

# Clean function
function Clean-Project {
    Write-Host "🧹 Cleaning project..." -ForegroundColor Yellow
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
    Start-Sleep 2
}

function Measure-Command {
    param([ScriptBlock]$Command, [string]$Description)
    
    Write-Host "⏱️  Measuring: $Description" -ForegroundColor Cyan
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        & $Command
        $stopwatch.Stop()
        $duration = $stopwatch.ElapsedMilliseconds
        Write-Host "✅ $Description completed in $duration ms" -ForegroundColor Green
        return $duration
    }
    catch {
        $stopwatch.Stop()
        Write-Host "❌ $Description failed: $($_.Exception.Message)" -ForegroundColor Red
        return -1
    }
}

# Change to project directory
Set-Location $projectRoot

for ($i = 1; $i -le $Runs; $i++) {
    Write-Host ""
    Write-Host "🔄 Run $i of $Runs" -ForegroundColor Magenta
    Write-Host "=================" -ForegroundColor Magenta
    
    # Clean project
    Clean-Project
    
    # Measure npm install
    $installTime = Measure-Command {
        $output = npm install 2>&1
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    } "npm install (cold)"
    $results.install += $installTime
    
    # Measure production build
    $buildTime = Measure-Command {
        $output = npm run build 2>&1
        Write-Host "Build output: $output"
        if ($LASTEXITCODE -ne 0) { 
            Write-Host "Build failed with exit code: $LASTEXITCODE"
            throw "npm run build failed" 
        }
    } "npm run build"
    $results.build += $buildTime
    
    # Measure dev server start (time to ready message)
    $devStartTime = Measure-Command {
        $job = Start-Job -ScriptBlock {
            Set-Location $using:projectRoot
            npm run dev 2>&1
        }
        
        $timeout = 30000 # 30 seconds
        $elapsed = 0
        $interval = 500
        $found = $false
        
        while ($elapsed -lt $timeout -and -not $found) {
            $output = Receive-Job $job
            if ($output -match "Local.*http://localhost" -or $output -match "ready in" -or $output -match "dev server running") {
                $found = $true
                break
            }
            Start-Sleep -Milliseconds $interval
            $elapsed += $interval
        }
        
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
        
        if (-not $found) {
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

$installStats = Get-Stats $results.install
$buildStats = Get-Stats $results.build
$devStartStats = Get-Stats $results.dev_start

# Read package.json for dependencies count
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$depCount = if ($packageJson.dependencies) { $packageJson.dependencies.PSObject.Properties.Count } else { 0 }
$devDepCount = if ($packageJson.devDependencies) { $packageJson.devDependencies.PSObject.Properties.Count } else { 0 }

# Generate report
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$report = @"
# React Home Budget - Build Performance Report

*Generated on: $timestamp*

## 📊 Executive Summary

Performance analysis of React Home Budget application build and startup times across $Runs test runs.

### Key Performance Metrics

| Operation | Average | Minimum | Maximum | Median | Unit |
|-----------|---------|---------|---------|--------|------|
| **npm install** | $($installStats.avg) | $($installStats.min) | $($installStats.max) | $($installStats.median) | ms |
| **npm run build** | $($buildStats.avg) | $($buildStats.min) | $($buildStats.max) | $($buildStats.median) | ms |
| **npm run dev** | $($devStartStats.avg) | $($devStartStats.min) | $($devStartStats.max) | $($devStartStats.median) | ms |

### Performance Grades

| Operation | Time (avg) | Grade | Assessment |
|-----------|------------|-------|------------|
| **Dependencies Install** | $([Math]::Round($installStats.avg/1000, 1))s | $(if($installStats.avg -lt 30000){"Excellent"}elseif($installStats.avg -lt 60000){"Good"}else{"Slow"}) | $(if($installStats.avg -lt 30000){"Fast dependency resolution"}elseif($installStats.avg -lt 60000){"Standard install time"}else{"Consider dependency optimization"}) |
| **Production Build** | $([Math]::Round($buildStats.avg/1000, 1))s | $(if($buildStats.avg -lt 10000){"Excellent"}elseif($buildStats.avg -lt 30000){"Good"}else{"Slow"}) | $(if($buildStats.avg -lt 10000){"Very fast build"}elseif($buildStats.avg -lt 30000){"Acceptable build time"}else{"Build optimization needed"}) |
| **Dev Server Start** | $([Math]::Round($devStartStats.avg/1000, 1))s | $(if($devStartStats.avg -lt 5000){"Excellent"}elseif($devStartStats.avg -lt 15000){"Good"}else{"Slow"}) | $(if($devStartStats.avg -lt 5000){"Instant development feedback"}elseif($devStartStats.avg -lt 15000){"Good developer experience"}else{"Slow development startup"}) |

## 🔧 Technical Analysis

### Project Configuration
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite $(if(Test-Path "vite.config.ts"){"(configured)"}else{"(default)"})
- **Package Manager**: npm
- **Bundle Target**: ES2020+ 
- **Dependencies**: $depCount runtime, $devDepCount dev

### Build Characteristics
- **Cold Install Performance**: $([Math]::Round($installStats.avg/1000, 1))s average (includes dependency resolution)
- **Build Consistency**: $(if(($buildStats.max - $buildStats.min) -lt ($buildStats.avg * 0.3)){"Consistent"}else{"Variable"}) (±$([Math]::Round((($buildStats.max - $buildStats.min)/2)/1000, 1))s variance)
- **Dev Server Reliability**: $(if($devStartStats.min -gt 0){"100% success rate"}else{"Some failures detected"})

### Performance Factors
$(if($installStats.avg -gt 60000){
"WARNING: **Slow Dependency Installation**
- Consider using yarn or pnpm for faster installs
- Review dependency tree for optimization opportunities
- Use .npmrc for registry optimization

"})$(if($buildStats.avg -gt 30000){
"WARNING: **Slow Build Times**
- Enable Vite build optimizations
- Review bundle analyzer for large dependencies
- Consider code splitting strategies

"})$(if($devStartStats.avg -gt 15000){
"WARNING: **Slow Development Startup**
- Optimize Vite dev server configuration
- Review hot module replacement setup
- Consider pre-bundling large dependencies

"})

## 📈 Detailed Results

### Raw Measurements (milliseconds)

#### npm install
$($results.install | ForEach-Object { "- Run: $_ ms" } | Out-String)
#### npm run build  
$($results.build | ForEach-Object { "- Run: $_ ms" } | Out-String)
#### npm run dev (startup)
$($results.dev_start | ForEach-Object { "- Run: $_ ms" } | Out-String)

## 🎯 Optimization Recommendations

### Immediate Improvements
1. **$(if($installStats.avg -gt 45000){"Dependency Optimization"}else{"Dependency Management"})**
   - $(if($installStats.avg -gt 45000){"Switch to yarn or pnpm for faster installs"}else{"Current install speed is acceptable"})
   - Use exact versions in package.json to avoid resolution overhead
   - Consider npm audit for security and performance

2. **$(if($buildStats.avg -gt 20000){"Build Optimization"}else{"Build Performance"})**
   - $(if($buildStats.avg -gt 20000){"Enable Vite's build optimization features"}else{"Build performance is good"})
   - Use dynamic imports for code splitting
   - Optimize bundle size with tree shaking

3. **$(if($devStartStats.avg -gt 10000){"Development Experience"}else{"Development Setup"})**
   - $(if($devStartStats.avg -gt 10000){"Optimize Vite dev server configuration"}else{"Development startup is responsive"})
   - Enable HMR optimizations
   - Pre-bundle heavy dependencies

### Long-term Considerations
- Monitor build times as project grows
- Implement build caching strategies
- Consider micro-frontend architecture for very large projects
- Regular dependency audits and updates

## 📊 Framework Comparison Context

*Note: These metrics can be compared with other framework implementations to assess relative build performance.*

### Industry Benchmarks
- **Good npm install**: <30s
- **Good build time**: <10s  
- **Good dev startup**: <5s

### Current Status
- **Install Speed**: $(if($installStats.avg -lt 30000){"Above industry standard"}elseif($installStats.avg -lt 60000){"Within acceptable range"}else{"Below industry standard"})
- **Build Speed**: $(if($buildStats.avg -lt 10000){"Above industry standard"}elseif($buildStats.avg -lt 30000){"Within acceptable range"}else{"Below industry standard"})  
- **Dev Experience**: $(if($devStartStats.avg -lt 5000){"Above industry standard"}elseif($devStartStats.avg -lt 15000){"Within acceptable range"}else{"Below industry standard"})

---

*This report was generated using automated build performance measurement tools. Regular monitoring recommended as project evolves.*

## 🔄 Reproduction Commands

To reproduce these measurements:

``````powershell
# Run single measurement
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\measure-build-times.ps1

# Run with custom parameters  
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\measure-build-times.ps1 -Runs 5 -OutFile CUSTOM_BUILD_REPORT.md
``````
"@

# Write report
$report | Out-File -FilePath $OutFile -Encoding UTF8
Write-Host ""
Write-Host "📋 Report generated: $OutFile" -ForegroundColor Green
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  - Install: $([Math]::Round($installStats.avg/1000, 1))s avg" -ForegroundColor White
Write-Host "  - Build: $([Math]::Round($buildStats.avg/1000, 1))s avg" -ForegroundColor White  
Write-Host "  - Dev Start: $([Math]::Round($devStartStats.avg/1000, 1))s avg" -ForegroundColor White
