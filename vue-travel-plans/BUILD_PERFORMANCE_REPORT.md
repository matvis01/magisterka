# Vue.js Build Performance Report

**Project:** vue-travel-plans  
**Framework:** Vue 3.5.13 + Vite  
**Measurement Date:** 2025-08-25 18:25:33  
**Runs:** 3

## Build Performance

| Metric | Time (ms) |
|--------|-----------|
| Average | 5689 |
| Minimum | 2943 |
| Maximum | 11063 |

### Individual Build Times
- Run 1: 11063ms - Run 2: 3063ms - Run 3: 2943ms

## Dev Server Startup Performance

| Metric | Time (ms) |
|--------|-----------|
| Average | 4295 |
| Minimum | 4142 |
| Maximum | 4587 |

### Individual Dev Startup Times
- Run 1: 4587ms - Run 2: 4155ms - Run 3: 4142ms

## Success Rate
- Build: 3/3 (100%)
- Dev Server: 3/3 (100%)
## Configuration
- **Build Command:** \
pm run build\ (type-check + vite build)
- **Dev Command:** \
pm run dev\ (vite)
- **Port:** 5173
- **Max Dev Startup Wait:** 120 seconds

## Notes
- Vue 3.5 with TypeScript type checking + Vite build
- Dev server measured until port 5173 responds or success indicators detected
- Build includes both TypeScript compilation and Vite bundling
- Times measured from process start to completion/readiness
- Cleanup performed between runs (dist folder removal)
