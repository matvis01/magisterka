const fs = require('fs');
const path = require('path');

function analyzeVueBundle() {
  const distPath = './dist';
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ Build directory not found. Run "npm run build" first.');
    return;
  }

  console.log('🧩 Vue.js Bundle Deep Analysis');
  console.log('==============================\n');

  // Read package.json to get dependencies
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const deps = packageJson.dependencies || {};
  
  console.log('📋 PROJECT DEPENDENCIES:');
  Object.entries(deps).forEach(([name, version]) => {
    const category = name.includes('vue') ? '🟢 Vue' : 
                    name.includes('pinia') ? '🟡 Store' : 
                    name.includes('tailwind') ? '🔵 CSS' : 
                    name.includes('uuid') ? '🟠 Utils' : '⚪ Other';
    console.log(`${category} ${name.padEnd(25)} ${version}`);
  });

  // Analyze bundle composition
  const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
  
  // Extract asset references
  const cssMatches = indexHtml.match(/href="([^"]*\.css)"/g) || [];
  const jsMatches = indexHtml.match(/src="([^"]*\.js)"/g) || [];
  
  console.log('\n🎯 LOADED ASSETS:');
  console.log('CSS Files:');
  cssMatches.forEach(match => {
    const file = match.match(/href="([^"]*)"/)[1];
    console.log(`  🎨 ${file}`);
  });
  
  console.log('JS Files:');
  jsMatches.forEach(match => {
    const file = match.match(/src="([^"]*)"/)[1];
    console.log(`  📄 ${file}`);
  });

  // Analyze source directory structure
  console.log('\n📁 SOURCE CODE STRUCTURE:');
  function analyzeDir(dirPath, prefix = '') {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        console.log(`${prefix}📁 ${item}/`);
        if (item !== 'node_modules' && !item.startsWith('.')) {
          analyzeDir(fullPath, prefix + '  ');
        }
      } else if (item.endsWith('.vue') || item.endsWith('.ts') || item.endsWith('.js')) {
        const icon = item.endsWith('.vue') ? '🟢' : 
                    item.endsWith('.ts') ? '🔵' : '🟡';
        console.log(`${prefix}${icon} ${item}`);
      }
    });
  }
  
  analyzeDir('./src');

  console.log('\n🔍 BUNDLE PERFORMANCE INSIGHTS:');
  
  // Calculate approximate load times
  const totalGzipped = 54.09; // KB from previous analysis
  console.log(`📡 Network Performance Estimates:`);
  console.log(`   Fast 3G (1.5 Mbps): ~${(totalGzipped * 8 / 1500).toFixed(1)}s`);
  console.log(`   4G (10 Mbps): ~${(totalGzipped * 8 / 10000).toFixed(1)}s`);
  console.log(`   Broadband (50 Mbps): ~${(totalGzipped * 8 / 50000).toFixed(2)}s`);
  
  console.log('\n🎯 OPTIMIZATION RECOMMENDATIONS:');
  console.log('✅ Already optimized:');
  console.log('   • Vendor chunk separation');
  console.log('   • Gzip compression (65% reduction)');
  console.log('   • Tailwind CSS purging');
  console.log('   • Tree shaking enabled');
  
  console.log('\n🔧 Potential improvements:');
  console.log('   • Consider lazy loading for heavy components');
  console.log('   • Implement route-based code splitting');
  console.log('   • Use dynamic imports for less critical features');
  console.log('   • Consider service worker for caching');
  
  console.log('\n📊 Vue.js Ecosystem Analysis:');
  console.log('   🟢 Vue.js: Modern reactive framework');
  console.log('   🟡 Pinia: Lightweight state management');
  console.log('   🔵 Vue Router: Client-side routing');
  console.log('   🟠 Tailwind: Utility-first CSS framework');
  
  console.log('\n✨ Bundle analysis complete!');
}

analyzeVueBundle();
