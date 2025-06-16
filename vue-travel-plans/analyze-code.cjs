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
  let inVueTemplate = false;
  let inVueScript = false;
  let inVueStyle = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Track Vue.js sections
    if (trimmed.includes('<template>')) inVueTemplate = true;
    if (trimmed.includes('</template>')) inVueTemplate = false;
    if (trimmed.includes('<script>') || trimmed.includes('<script setup>')) inVueScript = true;
    if (trimmed.includes('</script>')) inVueScript = false;
    if (trimmed.includes('<style>') || trimmed.includes('<style scoped>')) inVueStyle = true;
    if (trimmed.includes('</style>')) inVueStyle = false;
    
    if (trimmed === '') {
      emptyLines++;
    } else if (trimmed.startsWith('//') || trimmed.startsWith('<!--')) {
      commentLines++;
    } else if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
      commentLines++;
    } else if (trimmed.startsWith('/*') || trimmed.startsWith('<!--')) {
      commentLines++;
      inBlockComment = true;
    } else if ((trimmed.endsWith('*/') || trimmed.endsWith('-->')) && inBlockComment) {
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

function analyzeVueFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const stats = countLines(content);
  
  // Analyze Vue.js specific sections
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
  const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  
  const vueStats = {
    template: templateMatch ? templateMatch[1].split('\n').length : 0,
    script: scriptMatch ? scriptMatch[1].split('\n').length : 0,
    style: styleMatch ? styleMatch[1].split('\n').length : 0
  };
  
  return {
    path: filePath,
    extension: getFileExtension(filePath),
    vue: vueStats,
    ...stats
  };
}

function analyzeFile(filePath) {
  const ext = getFileExtension(filePath);
  
  if (ext === '.vue') {
    return analyzeVueFile(filePath);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const stats = countLines(content);
  
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
    byComponent: {},
    vueStats: { template: 0, script: 0, style: 0 }
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
        const allowedExts = ['.vue', '.ts', '.js', '.json', '.css'];
        
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
          
          // Vue-specific stats
          if (analysis.vue) {
            results.vueStats.template += analysis.vue.template;
            results.vueStats.script += analysis.vue.script;
            results.vueStats.style += analysis.vue.style;
          }
          
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
  console.log('🚀 Vue Travel Plans - Code Analysis');
  console.log('===================================\n');

  const srcAnalysis = analyzeDirectory('./src');
  const configFiles = [
    './package.json',
    './vite.config.ts',
    './tailwind.config.js',
    './index.html'
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

  // Vue.js specific analysis
  console.log('\n🟢 VUE.JS COMPONENT ANALYSIS:');
  console.log(`Template Lines: ${srcAnalysis.vueStats.template}`);
  console.log(`Script Lines: ${srcAnalysis.vueStats.script}`);
  console.log(`Style Lines: ${srcAnalysis.vueStats.style}`);
  
  const vueTotal = srcAnalysis.vueStats.template + srcAnalysis.vueStats.script + srcAnalysis.vueStats.style;
  if (vueTotal > 0) {
    console.log(`Template %: ${((srcAnalysis.vueStats.template / vueTotal) * 100).toFixed(1)}%`);
    console.log(`Script %: ${((srcAnalysis.vueStats.script / vueTotal) * 100).toFixed(1)}%`);
    console.log(`Style %: ${((srcAnalysis.vueStats.style / vueTotal) * 100).toFixed(1)}%`);
  }

  // Print by file type
  console.log('\n📁 BREAKDOWN BY FILE TYPE:');
  Object.entries(srcAnalysis.byExtension).forEach(([ext, stats]) => {
    const icon = ext === '.vue' ? '🟢' : ext === '.ts' ? '🔵' : ext === '.js' ? '🟡' : ext === '.json' ? '📄' : '⚪';
    console.log(`${icon} ${ext.padEnd(6)} | ${stats.files.toString().padStart(2)} files | ${stats.source.toString().padStart(4)} lines | ${stats.comments.toString().padStart(3)} comments`);
  });

  // Print by component
  console.log('\n🏗️  BREAKDOWN BY COMPONENT:');
  Object.entries(srcAnalysis.byComponent).forEach(([component, stats]) => {
    const icon = component === 'components' ? '🧩' : 
                component === 'views' ? '👁️' : 
                component === 'stores' ? '🗄️' : 
                component === 'router' ? '🛣️' : 
                component === 'types' ? '📝' : '📁';
    console.log(`${icon} ${component.padEnd(15)} | ${stats.files.toString().padStart(2)} files | ${stats.source.toString().padStart(4)} lines | ${stats.comments.toString().padStart(3)} comments`);
  });

  // Print largest files
  console.log('\n📋 LARGEST FILES:');
  const largestFiles = srcAnalysis.files
    .sort((a, b) => b.source - a.source)
    .slice(0, 8);
  
  largestFiles.forEach(file => {
    const icon = file.extension === '.vue' ? '🟢' : file.extension === '.ts' ? '🔵' : '📄';
    console.log(`${icon} ${file.relativePath.padEnd(40)} | ${file.source.toString().padStart(4)} lines`);
  });

  // Configuration files
  console.log('\n⚙️  CONFIGURATION FILES:');
  configAnalysis.files.forEach(file => {
    console.log(`📄 ${file.relativePath.padEnd(25)} | ${file.source.toString().padStart(4)} lines`);
  });

  // Vue component complexity
  console.log('\n🧩 VUE COMPONENT COMPLEXITY:');
  const vueFiles = srcAnalysis.files.filter(f => f.extension === '.vue');
  vueFiles.sort((a, b) => b.source - a.source).forEach(file => {
    const complexity = file.source > 150 ? 'High' : file.source > 75 ? 'Medium' : 'Low';
    const complexityIcon = complexity === 'High' ? '🔴' : complexity === 'Medium' ? '🟡' : '🟢';
    console.log(`${complexityIcon} ${file.relativePath.padEnd(35)} | ${file.source.toString().padStart(4)} lines | ${complexity}`);
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
      commentRatio: parseFloat(commentRatio),
      vueStats: srcAnalysis.vueStats
    }
  };
}

module.exports = { generateReport, analyzeDirectory };

if (require.main === module) {
  generateReport();
}
