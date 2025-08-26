const fs = require('fs');
const path = require('path');

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

function countLines(content, fileExtension) {
  const lines = content.split('\n');
  let sourceLines = 0;
  let commentLines = 0;
  let emptyLines = 0;
  let totalLines = lines.length;

  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      emptyLines++;
    } else if (fileExtension === '.tsx' || fileExtension === '.ts' || fileExtension === '.js' || fileExtension === '.jsx') {
      // React/TypeScript/JavaScript comment detection
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed === '/**' || trimmed === '*/' || trimmed.startsWith('* ')) {
        commentLines++;
      } else if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
        commentLines++;
      } else if (trimmed.startsWith('/*') || trimmed.startsWith('/**')) {
        commentLines++;
        inBlockComment = true;
      } else if (trimmed.endsWith('*/') && inBlockComment) {
        commentLines++;
        inBlockComment = false;
      } else if (inBlockComment) {
        commentLines++;
      } else {
        sourceLines++;
      }
    } else if (fileExtension === '.html') {
      // HTML comment detection
      if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
        commentLines++;
      } else if (trimmed.startsWith('<!--')) {
        commentLines++;
        inBlockComment = true;
      } else if (trimmed.endsWith('-->') && inBlockComment) {
        commentLines++;
        inBlockComment = false;
      } else if (inBlockComment) {
        commentLines++;
      } else {
        sourceLines++;
      }
    } else if (fileExtension === '.css') {
      // CSS comment detection
      if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
        commentLines++;
      } else if (trimmed.startsWith('/*')) {
        commentLines++;
        inBlockComment = true;
      } else if (trimmed.endsWith('*/') && inBlockComment) {
        commentLines++;
        inBlockComment = false;
      } else if (inBlockComment) {
        commentLines++;
      } else {
        sourceLines++;
      }
    } else {
      // Default: treat as source
      sourceLines++;
    }
  }

  return {
    total: totalLines,
    source: sourceLines,
    comments: commentLines,
    empty: emptyLines
  };
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const extension = getFileExtension(filePath);
    const stats = countLines(content, extension);
    
    return {
      path: filePath,
      extension: extension,
      ...stats
    };
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
    return null;
  }
}

function shouldAnalyzeFile(filePath) {
  const extension = getFileExtension(filePath);
  const allowedExtensions = ['.tsx', '.ts', '.js', '.jsx', '.html', '.css', '.json'];
  
  // Skip certain files/directories
  const excludePatterns = [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
    '.vscode',
    'public/vite.svg',
    'src/assets',
    'package-lock.json',
    '.gitignore'
  ];
  
  // Check if file should be excluded
  if (excludePatterns.some(pattern => filePath.includes(pattern))) {
    return false;
  }
  
  return allowedExtensions.includes(extension);
}

function getReactFileType(filePath) {
  const filename = path.basename(filePath);
  const extension = getFileExtension(filePath);
  const dirname = path.dirname(filePath);
  
  if (extension === '.tsx') {
    if (dirname.includes('components')) return 'component';
    if (dirname.includes('pages')) return 'page';
    if (filename === 'App.tsx') return 'root-component';
    return 'react-component';
  }
  
  if (extension === '.ts') {
    if (filename.includes('store') || dirname.includes('redux')) return 'store';
    if (filename.includes('slice') || filename.includes('reducer')) return 'store-slice';
    if (dirname.includes('services')) return 'service';
    if (dirname.includes('utils')) return 'utility';
    if (dirname.includes('types')) return 'types';
    if (filename.includes('config')) return 'config';
    if (filename === 'main.ts' || filename === 'main.tsx') return 'bootstrap';
    return 'typescript';
  }
  
  if (extension === '.js' || extension === '.jsx') {
    if (filename.includes('config')) return 'config';
    return 'javascript';
  }
  
  if (extension === '.html') return 'template';
  if (extension === '.css') return 'styles';
  if (extension === '.json') return 'configuration';
  
  return 'other';
}

function scanDirectory(dirPath) {
  const results = [];
  
  function scan(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (shouldAnalyzeFile(fullPath)) {
          const analysis = analyzeFile(fullPath);
          if (analysis) {
            analysis.type = getReactFileType(fullPath);
            analysis.relativePath = path.relative(dirPath, fullPath);
            results.push(analysis);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${currentPath}:`, error.message);
    }
  }
  
  scan(dirPath);
  return results;
}

function generateReport(files, projectPath) {
  const totalStats = {
    files: files.length,
    total: 0,
    source: 0,
    comments: 0,
    empty: 0
  };
  
  // Calculate totals
  files.forEach(file => {
    totalStats.total += file.total;
    totalStats.source += file.source;
    totalStats.comments += file.comments;
    totalStats.empty += file.empty;
  });
  
  // Group by type
  const byType = {};
  files.forEach(file => {
    if (!byType[file.type]) {
      byType[file.type] = { files: 0, total: 0, source: 0, comments: 0, empty: 0 };
    }
    byType[file.type].files++;
    byType[file.type].total += file.total;
    byType[file.type].source += file.source;
    byType[file.type].comments += file.comments;
    byType[file.type].empty += file.empty;
  });
  
  // Group by extension
  const byExtension = {};
  files.forEach(file => {
    if (!byExtension[file.extension]) {
      byExtension[file.extension] = { files: 0, total: 0, source: 0, comments: 0, empty: 0 };
    }
    byExtension[file.extension].files++;
    byExtension[file.extension].total += file.total;
    byExtension[file.extension].source += file.source;
    byExtension[file.extension].comments += file.comments;
    byExtension[file.extension].empty += file.empty;
  });

  // Find large files (potential refactoring candidates)
  const largeFiles = files
    .filter(f => f.total > 100)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const commentRatio = totalStats.total > 0 ? (totalStats.comments / totalStats.total * 100) : 0;
  const sourceRatio = totalStats.total > 0 ? (totalStats.source / totalStats.total * 100) : 0;
  const emptyRatio = totalStats.total > 0 ? (totalStats.empty / totalStats.total * 100) : 0;

  const report = `# React Home Budget - Code Analysis Report

*Generated on: ${new Date().toISOString().split('T')[0]}*

## 📊 Executive Summary

This React application manages personal home budget with a focus on modern React practices and state management. The codebase demonstrates strong React 18 patterns with TypeScript, Redux Toolkit, and Vite integration.

### Key Metrics
- **Total Files**: ${totalStats.files}
- **Total Lines of Code**: ${totalStats.total.toLocaleString()}
- **Source Lines**: ${totalStats.source.toLocaleString()} (${sourceRatio.toFixed(1)}%)
- **Comment Lines**: ${totalStats.comments.toLocaleString()} (${commentRatio.toFixed(1)}%)
- **Empty Lines**: ${totalStats.empty.toLocaleString()} (${emptyRatio.toFixed(1)}%)
- **Comment Ratio**: ${commentRatio.toFixed(1)}%

## 🏗️ Architecture Overview

### Technology Stack
- **Framework**: React 18+ with hooks
- **Language**: TypeScript
- **Styling**: CSS + Tailwind CSS
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Chart Library**: Chart.js/React-Chartjs-2
- **Local Storage**: Custom service

### Project Structure Analysis

| File Type | Files | Lines | Comments | Purpose |
|-----------|-------|-------|----------|---------|
${Object.entries(byType)
  .sort((a, b) => b[1].total - a[1].total)
  .map(([type, stats]) => 
    `| ${type} | ${stats.files} | ${stats.total.toLocaleString()} | ${stats.comments} | ${getTypeDescription(type)} |`
  ).join('\n')}

## 🧩 React Architecture Analysis

### File Type Distribution

| Extension | Files | Lines | Comments | Average Lines/File |
|-----------|-------|-------|----------|-------------------|
${Object.entries(byExtension)
  .sort((a, b) => b[1].total - a[1].total)
  .map(([ext, stats]) => 
    `| ${ext} | ${stats.files} | ${stats.total.toLocaleString()} | ${stats.comments} | ${Math.round(stats.total / stats.files)} |`
  ).join('\n')}

## 📋 Component Complexity Analysis

### Large Files (Potential Refactoring Candidates)

${largeFiles.map((file, index) => {
  const complexity = getComplexityLevel(file.total);
  const icon = complexity === 'High' ? '🔴' : complexity === 'Medium' ? '🟡' : '🟢';
  return `#### ${icon} ${complexity} Complexity (${file.total} lines)
${index + 1}. **${path.basename(file.path)}** (${file.total} lines)
   - **Type**: ${file.type}
   - **Path**: \`${file.relativePath}\`
   - **Recommendation**: ${getRecommendation(file.type, file.total)}`;
}).join('\n\n')}

## 📈 Code Quality Metrics

### Documentation Coverage
- **Overall Comment Ratio**: ${commentRatio.toFixed(1)}% ${commentRatio >= 10 ? '✅ Good' : commentRatio >= 5 ? '⚠️ Acceptable' : '❌ Needs Improvement'}
- **Components**: ${getCommentRatioForType(byType, 'component').toFixed(1)}%
- **Pages**: ${getCommentRatioForType(byType, 'page').toFixed(1)}%
- **Store Logic**: ${getStoreCommentRatio(byType).toFixed(1)}%

### React-Specific Metrics
- **Component to Page Ratio**: ${getComponentPageRatio(byType)}
- **Average Component Size**: ${getAverageComponentSize(byType)} lines
- **TypeScript Adoption**: ${((byExtension['.tsx']?.files || 0) + (byExtension['.ts']?.files || 0)) / totalStats.files * 100}%
- **Hook Usage Pattern**: ${getHookUsagePattern(files)}

## 🎯 Recommendations

### High Priority
1. **Large Component Refactoring**
${largeFiles.slice(0, 3).map(file => 
  `   - Refactor \`${path.basename(file.path)}\` (${file.total} lines) - ${getSpecificRecommendation(file.type)}`
).join('\n')}

2. **Documentation Improvement**
   - Current comment ratio: ${commentRatio.toFixed(1)}% (target: 10-15%)
   - Add JSDoc comments to component props and interfaces
   - Document Redux store logic and complex business rules

3. **Code Organization**
   - Consider custom hooks for shared logic
   - Extract reusable components from large files
   - Implement consistent component structure

### Medium Priority
4. **React Best Practices**
   - Use React.memo for performance optimization
   - Implement proper error boundaries
   - Consider code splitting with React.lazy

5. **Type Safety**
   - Add more specific TypeScript interfaces
   - Implement strict prop types for all components
   - Use typed Redux hooks consistently

### Low Priority
6. **Performance Optimization**
   - Implement virtual scrolling for large lists
   - Optimize re-renders with useMemo/useCallback
   - Consider bundle size optimization

## 🔍 Technical Debt Analysis

### Current State
${getTechnicalDebtAssessment(totalStats, largeFiles, commentRatio)}

### React-Specific Patterns
- **Component Architecture**: ${getComponentArchitectureStatus(byType)}
- **State Management**: ${getStateManagementStatus(byType)}
- **Hook Patterns**: ${getHookPatternsStatus(files)}

## 📊 Comparison with React Best Practices

| Metric | Current | Recommended | Status |
|--------|---------|-------------|--------|
| Component Size | ${getAverageComponentSize(byType)} avg | <150 lines | ${getAverageComponentSize(byType) < 150 ? '✅' : '⚠️'} |
| Comment Ratio | ${commentRatio.toFixed(1)}% | 10-15% | ${commentRatio >= 10 ? '✅' : commentRatio >= 5 ? '⚠️' : '❌'} |
| TypeScript Usage | ${(((byExtension['.tsx']?.files || 0) + (byExtension['.ts']?.files || 0)) / totalStats.files * 100).toFixed(1)}% | >90% | ${(((byExtension['.tsx']?.files || 0) + (byExtension['.ts']?.files || 0)) / totalStats.files) > 0.9 ? '✅' : '⚠️'} |
| Store Pattern | ${byType['store'] || byType['store-slice'] ? 'Redux Toolkit' : 'None'} | Redux/Zustand | ${byType['store'] || byType['store-slice'] ? '✅' : '⚠️'} |

## 🚀 Next Steps

1. **Immediate (This Sprint)**
   - Add component documentation
   - Refactor largest components

2. **Short Term (Next 2 Sprints)**
   - Extract custom hooks for shared logic
   - Implement error boundaries

3. **Long Term (Future Releases)**
   - Performance optimization
   - Advanced React patterns
   - Comprehensive testing strategy

---

*This analysis was generated using automated code analysis tools. Regular updates recommended as the codebase evolves.*

## 📁 Detailed File Analysis

### All Analyzed Files
${files.map(file => 
  `- \`${file.relativePath}\` (${file.type}) - ${file.total} lines (${file.source} source, ${file.comments} comments)`
).join('\n')}
`;

  return report;
}

function getTypeDescription(type) {
  const descriptions = {
    'component': 'Reusable React components',
    'page': 'Page-level React components',
    'root-component': 'Main App component',
    'react-component': 'React components',
    'store': 'Redux store configuration',
    'store-slice': 'Redux Toolkit slices',
    'service': 'Service layer and API calls',
    'utility': 'Utility functions and helpers',
    'types': 'TypeScript type definitions',
    'config': 'Configuration files',
    'bootstrap': 'Application entry point',
    'typescript': 'General TypeScript files',
    'javascript': 'JavaScript files',
    'template': 'HTML templates',
    'styles': 'CSS styling files',
    'configuration': 'JSON configuration files'
  };
  return descriptions[type] || 'Other files';
}

function getComplexityLevel(lines) {
  if (lines > 200) return 'High';
  if (lines > 100) return 'Medium';
  return 'Low';
}

function getRecommendation(type, lines) {
  if (lines > 200) {
    switch (type) {
      case 'component':
      case 'page': 
        return 'Break into smaller components, extract custom hooks';
      case 'store-slice': 
        return 'Split into multiple slices or extract reducers';
      default: 
        return 'Consider refactoring into smaller, focused modules';
    }
  }
  if (lines > 100) {
    return 'Consider extracting reusable logic';
  }
  return 'File size is acceptable';
}

function getSpecificRecommendation(type) {
  const recommendations = {
    'component': 'Extract child components and custom hooks',
    'page': 'Split into container and presentation components',
    'store-slice': 'Break into feature-specific slices',
    'typescript': 'Break into logical modules'
  };
  return recommendations[type] || 'Refactor for better maintainability';
}

function getCommentRatioForType(byType, type) {
  const typeStats = byType[type];
  if (!typeStats || typeStats.total === 0) return 0;
  return (typeStats.comments / typeStats.total) * 100;
}

function getStoreCommentRatio(byType) {
  const storeTypes = ['store', 'store-slice'];
  let totalLines = 0;
  let totalComments = 0;
  
  storeTypes.forEach(type => {
    if (byType[type]) {
      totalLines += byType[type].total;
      totalComments += byType[type].comments;
    }
  });
  
  return totalLines > 0 ? (totalComments / totalLines) * 100 : 0;
}

function getComponentPageRatio(byType) {
  const components = byType['component']?.files || 0;
  const pages = byType['page']?.files || 0;
  if (pages === 0) return 'N/A';
  return `${(components / pages).toFixed(1)}:1 (components:pages)`;
}

function getAverageComponentSize(byType) {
  const componentTypes = ['component', 'page', 'root-component'];
  let totalLines = 0;
  let totalFiles = 0;
  
  componentTypes.forEach(type => {
    if (byType[type]) {
      totalLines += byType[type].total;
      totalFiles += byType[type].files;
    }
  });
  
  return totalFiles > 0 ? Math.round(totalLines / totalFiles) : 0;
}

function getHookUsagePattern(files) {
  // This is a simple heuristic - in a real implementation, 
  // you'd parse the AST to detect hook usage
  const reactFiles = files.filter(f => f.extension === '.tsx');
  if (reactFiles.length === 0) return 'No React files';
  
  // Simple pattern detection based on file structure
  const hasCustomHooks = files.some(f => f.path.includes('hooks') || f.path.includes('use'));
  const avgComponentSize = getAverageComponentSize(files.reduce((acc, file) => {
    const type = file.type;
    if (!acc[type]) acc[type] = { files: 0, total: 0 };
    acc[type].files++;
    acc[type].total += file.total;
    return acc;
  }, {}));
  
  if (hasCustomHooks) return '✅ Custom hooks implemented';
  if (avgComponentSize > 150) return '⚠️ Consider extracting hooks';
  return '✅ Good hook patterns';
}

function getTechnicalDebtAssessment(totalStats, largeFiles, commentRatio) {
  const largeFileCount = largeFiles.length;
  let assessment = '**Manageable Debt**: ';
  
  if (largeFileCount > 5 && commentRatio < 5) {
    assessment += 'High debt - Multiple large files with poor documentation';
  } else if (largeFileCount > 3 || commentRatio < 8) {
    assessment += 'Medium debt - Some large files or documentation issues';
  } else {
    assessment += 'Low debt - Well-maintained codebase';
  }
  
  return assessment;
}

function getComponentArchitectureStatus(byType) {
  const avgSize = getAverageComponentSize(byType);
  
  if (avgSize < 100) return '✅ Well-sized components';
  if (avgSize < 150) return '⚠️ Some large components';
  return '❌ Components too large';
}

function getStateManagementStatus(byType) {
  const hasRedux = byType['store'] || byType['store-slice'];
  return hasRedux ? '✅ Redux Toolkit implemented' : '⚠️ Consider state management';
}

function getHookPatternsStatus(files) {
  const hasCustomHooks = files.some(f => f.path.includes('hooks') || f.path.includes('use'));
  return hasCustomHooks ? '✅ Custom hooks present' : '⚠️ Consider custom hooks';
}

// Main execution
const projectPath = process.cwd();
console.log(`🔍 Analyzing React project: ${projectPath}`);
console.log('📊 Scanning files...');

const files = scanDirectory(projectPath);
console.log(`✅ Found ${files.length} files to analyze`);

console.log('📈 Generating report...');
const report = generateReport(files, projectPath);

const outputFile = 'REACT_CODE_ANALYSIS_REPORT.md';
fs.writeFileSync(outputFile, report);

console.log(`✅ Report saved to: ${outputFile}`);
console.log(`📋 Summary: ${files.length} files, ${files.reduce((sum, f) => sum + f.total, 0)} total lines`);
