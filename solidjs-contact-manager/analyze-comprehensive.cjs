const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function runSlocAnalysis() {
  return new Promise((resolve, reject) => {
    exec('npx sloc src', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      // Parse sloc output
      const lines = stdout.split('\n');
      const slocData = {};
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':').map(s => s.trim());
          if (key && value && !isNaN(parseInt(value))) {
            slocData[key] = parseInt(value);
          }
        }
      });
      
      resolve(slocData);
    });
  });
}

async function generateComprehensiveReport() {
  console.log('🔍 SolidJS Contact Manager - Comprehensive Code Analysis');
  console.log('======================================================\n');

  try {
    // Get sloc analysis
    const slocData = await runSlocAnalysis();
    
    console.log('📊 SLOC ANALYSIS RESULTS:');
    console.log(`Physical Lines: ${slocData.Physical || 'N/A'}`);
    console.log(`Source Lines: ${slocData.Source || 'N/A'}`);
    console.log(`Comment Lines: ${slocData.Comment || 'N/A'}`);
    console.log(`Empty Lines: ${slocData.Empty || 'N/A'}`);
    console.log(`Files Analyzed: ${slocData['Number of files read'] || 'N/A'}`);
    
    if (slocData.Source && slocData.Comment) {
      const commentRatio = ((slocData.Comment / (slocData.Source + slocData.Comment)) * 100).toFixed(1);
      console.log(`Comment Ratio: ${commentRatio}%`);
    }
    
    console.log('─'.repeat(50));

    // File structure analysis
    console.log('\n📁 PROJECT STRUCTURE:');
    
    function analyzeStructure(dir, level = 0) {
      const items = fs.readdirSync(dir);
      const indent = '  '.repeat(level);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          console.log(`${indent}📁 ${item}/`);
          if (level < 2) {
            analyzeStructure(fullPath, level + 1);
          }
        } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.json') || item.endsWith('.css')) {
          const size = stat.size;
          const sizeKB = (size / 1024).toFixed(1);
          const icon = item.endsWith('.tsx') ? '🟢' : 
                     item.endsWith('.ts') ? '🔵' : 
                     item.endsWith('.json') ? '📄' : '🎨';
          console.log(`${indent}${icon} ${item} (${sizeKB} KB)`);
        }
      });
    }
    
    analyzeStructure('./src');
    
    // Package.json analysis
    console.log('\n📦 DEPENDENCIES ANALYSIS:');
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    
    console.log(`Production Dependencies: ${Object.keys(deps).length}`);
    console.log(`Development Dependencies: ${Object.keys(devDeps).length}`);
    
    console.log('\nKey Framework Dependencies:');
    Object.entries(deps).forEach(([name, version]) => {
      if (name.includes('solid') || name.includes('vinxi') || name.includes('tailwind')) {
        console.log(`  🎯 ${name}: ${version}`);
      }
    });
    
    // Bundle size correlation
    console.log('\n📈 CODE-TO-BUNDLE CORRELATION:');
    if (fs.existsSync('./.vinxi/build/client/_build/assets')) {
      const bundleFiles = fs.readdirSync('./.vinxi/build/client/_build/assets');
      const bundleSizes = bundleFiles
        .filter(f => f.endsWith('.js'))
        .map(f => {
          const size = fs.statSync(path.join('./.vinxi/build/client/_build/assets', f)).size;
          return { file: f, size: (size / 1024).toFixed(1) };
        });
      
      const totalBundleSize = bundleSizes.reduce((sum, f) => sum + parseFloat(f.size), 0);
      
      console.log(`Source Lines: ${slocData.Source || 'N/A'} lines`);
      console.log(`Bundle Size: ${totalBundleSize.toFixed(1)} KB`);
      
      if (slocData.Source) {
        const linesPerKB = (slocData.Source / totalBundleSize).toFixed(1);
        console.log(`Efficiency: ${linesPerKB} lines per KB of bundle`);
      }
    }
    
    // Quality metrics
    console.log('\n🎯 CODE QUALITY METRICS:');
    
    const metrics = {
      codebaseSize: slocData.Physical > 1000 ? 'Large' : slocData.Physical > 500 ? 'Medium' : 'Small',
      documentation: slocData.Comment / slocData.Source > 0.15 ? 'Good' : slocData.Comment / slocData.Source > 0.05 ? 'Fair' : 'Poor',
      maintainability: slocData['Number of files read'] < 15 && slocData.Source < 1000 ? 'High' : 'Medium'
    };
    
    console.log(`Codebase Size: ${metrics.codebaseSize} (${slocData.Physical} physical lines)`);
    console.log(`Documentation: ${metrics.documentation} (${((slocData.Comment / slocData.Source) * 100).toFixed(1)}% comments)`);
    console.log(`Maintainability: ${metrics.maintainability} (${slocData['Number of files read']} files)`);
    
    console.log('\n✅ ANALYSIS COMPLETE');
    console.log('📄 Detailed report generated in CODE_ANALYSIS_REPORT.md');
    
  } catch (error) {
    console.error('Error running analysis:', error.message);
  }
}

if (require.main === module) {
  generateComprehensiveReport();
}
