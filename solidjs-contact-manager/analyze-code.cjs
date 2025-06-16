const fs = require('fs');
const path = require('path');

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

function countLines(content) {
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
    } else if (trimmed.startsWith('//')) {
      commentLines++;
    } else if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
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
  }

  return {
    total: totalLines,
    source: sourceLines,
    comments: commentLines,
    empty: emptyLines
  };
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const stats = countLines(content);
  const ext = getFileExtension(filePath);
  
  return {
    path: filePath,
    extension: ext,
    ...stats
  };
}

function analyzeDirectory(dirPath, baseDir = dirPath) {
  const results = {
    files: [],
    totals: { total: 0, source: 0, comments: 0, empty: 0 },
    byExtension: {},
    byComponent: {}
  };

  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile()) {
        const ext = getFileExtension(item);
        const allowedExts = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.css', '.json'];
        
        if (allowedExts.includes(ext)) {
          const analysis = analyzeFile(fullPath);
          const relativePath = path.relative(baseDir, fullPath);
          analysis.relativePath = relativePath;
          
          results.files.push(analysis);
          
          // Update totals
          results.totals.total += analysis.total;
          results.totals.source += analysis.source;
          results.totals.comments += analysis.comments;
          results.totals.empty += analysis.empty;
          
          // Group by extension
          if (!results.byExtension[ext]) {
            results.byExtension[ext] = { files: 0, total: 0, source: 0, comments: 0, empty: 0 };
          }
          results.byExtension[ext].files += 1;
          results.byExtension[ext].total += analysis.total;
          results.byExtension[ext].source += analysis.source;
          results.byExtension[ext].comments += analysis.comments;
          results.byExtension[ext].empty += analysis.empty;
          
          // Group by component (directory structure)
          const parts = relativePath.split(path.sep);
          const component = parts.length > 1 ? parts[0] : 'root';
          
          if (!results.byComponent[component]) {
            results.byComponent[component] = { files: 0, total: 0, source: 0, comments: 0, empty: 0 };
          }
          results.byComponent[component].files += 1;
          results.byComponent[component].total += analysis.total;
          results.byComponent[component].source += analysis.source;
          results.byComponent[component].comments += analysis.comments;
          results.byComponent[component].empty += analysis.empty;
        }
      }
    }
  }
  
  walkDir(dirPath);
  return results;
}

function generateReport() {
  console.log('📊 SolidJS Contact Manager - Code Analysis');
  console.log('==========================================\n');

  const srcAnalysis = analyzeDirectory('./src');
  const configFiles = [
    './package.json',
    './app.config.ts',
    './tailwind.config.cjs',
    './postcss.config.cjs'
  ].filter(file => fs.existsSync(file));

  // Analyze config files
  const configAnalysis = {
    files: [],
    totals: { total: 0, source: 0, comments: 0, empty: 0 }
  };

  configFiles.forEach(file => {
    const analysis = analyzeFile(file);
    analysis.relativePath = file;
    configAnalysis.files.push(analysis);
    
    configAnalysis.totals.total += analysis.total;
    configAnalysis.totals.source += analysis.source;
    configAnalysis.totals.comments += analysis.comments;
    configAnalysis.totals.empty += analysis.empty;
  });

  // Print summary
  console.log('📈 OVERALL SUMMARY:');
  console.log(`Total Files: ${srcAnalysis.files.length + configAnalysis.files.length}`);
  console.log(`Total Lines: ${srcAnalysis.totals.total + configAnalysis.totals.total}`);
  console.log(`Source Lines: ${srcAnalysis.totals.source + configAnalysis.totals.source}`);
  console.log(`Comment Lines: ${srcAnalysis.totals.comments + configAnalysis.totals.comments}`);
  console.log(`Empty Lines: ${srcAnalysis.totals.empty + configAnalysis.totals.empty}`);
  
  const totalSource = srcAnalysis.totals.source + configAnalysis.totals.source;
  const totalComments = srcAnalysis.totals.comments + configAnalysis.totals.comments;
  const commentRatio = ((totalComments / (totalSource + totalComments)) * 100).toFixed(1);
  
  console.log(`Comment Ratio: ${commentRatio}%`);
  console.log('─'.repeat(50));

  // Print by file type
  console.log('\n📁 BREAKDOWN BY FILE TYPE:');
  Object.entries(srcAnalysis.byExtension).forEach(([ext, stats]) => {
    const icon = ext === '.tsx' ? '🟢' : ext === '.ts' ? '🔵' : ext === '.css' ? '🎨' : ext === '.json' ? '📄' : '⚪';
    console.log(`${icon} ${ext.padEnd(6)} | ${stats.files.toString().padStart(2)} files | ${stats.source.toString().padStart(4)} lines | ${stats.comments.toString().padStart(3)} comments`);
  });

  // Print by component
  console.log('\n🏗️  BREAKDOWN BY COMPONENT:');
  Object.entries(srcAnalysis.byComponent).forEach(([component, stats]) => {
    const icon = component === 'components' ? '🧩' : 
                component === 'routes' ? '🛣️' : 
                component === 'data' ? '📊' : '📁';
    console.log(`${icon} ${component.padEnd(15)} | ${stats.files.toString().padStart(2)} files | ${stats.source.toString().padStart(4)} lines | ${stats.comments.toString().padStart(3)} comments`);
  });

  // Print largest files
  console.log('\n📋 LARGEST FILES:');
  const largestFiles = srcAnalysis.files
    .sort((a, b) => b.source - a.source)
    .slice(0, 5);
  
  largestFiles.forEach(file => {
    const icon = file.extension === '.tsx' ? '🟢' : file.extension === '.ts' ? '🔵' : '📄';
    console.log(`${icon} ${file.relativePath.padEnd(35)} | ${file.source.toString().padStart(4)} lines`);
  });

  // Configuration files
  console.log('\n⚙️  CONFIGURATION FILES:');
  configAnalysis.files.forEach(file => {
    console.log(`📄 ${file.relativePath.padEnd(25)} | ${file.source.toString().padStart(4)} lines`);
  });

  console.log('\n✨ Analysis complete!');

  return {
    src: srcAnalysis,
    config: configAnalysis,
    summary: {
      totalFiles: srcAnalysis.files.length + configAnalysis.files.length,
      totalLines: srcAnalysis.totals.total + configAnalysis.totals.total,
      sourceLines: srcAnalysis.totals.source + configAnalysis.totals.source,
      commentLines: srcAnalysis.totals.comments + configAnalysis.totals.comments,
      emptyLines: srcAnalysis.totals.empty + configAnalysis.totals.empty,
      commentRatio: parseFloat(commentRatio)
    }
  };
}

module.exports = { generateReport, analyzeDirectory };

if (require.main === module) {
  generateReport();
}
