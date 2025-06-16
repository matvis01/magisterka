const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = gzipSync(content);
  return gzipped.length;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  const results = [];
  let totalSize = 0;
  let totalGzipSize = 0;

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.css'))) {
      const size = getFileSize(filePath);
      const gzipSize = getGzipSize(filePath);
      
      results.push({
        file,
        size: formatBytes(size),
        sizeRaw: size,
        gzipSize: formatBytes(gzipSize),
        gzipSizeRaw: gzipSize
      });
      
      totalSize += size;
      totalGzipSize += gzipSize;
    }
  });

  return {
    files: results.sort((a, b) => b.sizeRaw - a.sizeRaw),
    totalSize: formatBytes(totalSize),
    totalGzipSize: formatBytes(totalGzipSize),
    totalSizeRaw: totalSize,
    totalGzipSizeRaw: totalGzipSize
  };
}

console.log('🔍 SolidJS Contact Manager - Bundle Analysis');
console.log('============================================\n');

const clientDir = './.vinxi/build/client/_build/assets';
const ssrDir = './.vinxi/build/ssr/assets';

if (fs.existsSync(clientDir)) {
  console.log('📦 CLIENT BUNDLE ANALYSIS:');
  const clientAnalysis = analyzeDirectory(clientDir);
  
  console.log('\nClient Bundle Files:');
  clientAnalysis.files.forEach(file => {
    const type = file.file.endsWith('.js') ? '📄 JS' : '🎨 CSS';
    console.log(`${type} ${file.file.padEnd(30)} | ${file.size.padStart(8)} | ${file.gzipSize.padStart(8)} (gzipped)`);
  });
  
  console.log(`\n📊 Total Client Bundle: ${clientAnalysis.totalSize} (${clientAnalysis.totalGzipSize} gzipped)`);
  console.log('─'.repeat(60));
}

if (fs.existsSync(ssrDir)) {
  console.log('\n🖥️  SSR BUNDLE ANALYSIS:');
  const ssrAnalysis = analyzeDirectory(ssrDir);
  
  console.log('\nSSR Bundle Files:');
  ssrAnalysis.files.forEach(file => {
    const type = file.file.endsWith('.js') ? '📄 JS' : '🎨 CSS';
    console.log(`${type} ${file.file.padEnd(30)} | ${file.size.padStart(8)} | ${file.gzipSize.padStart(8)} (gzipped)`);
  });
  
  console.log(`\n📊 Total SSR Bundle: ${ssrAnalysis.totalSize} (${ssrAnalysis.totalGzipSize} gzipped)`);
}

// Analyze the final output directory as well
const outputDir = './.output/public/_build/assets';
if (fs.existsSync(outputDir)) {
  console.log('\n🚀 PRODUCTION OUTPUT ANALYSIS:');
  const outputAnalysis = analyzeDirectory(outputDir);
  
  console.log('\nProduction Files:');
  outputAnalysis.files.forEach(file => {
    const type = file.file.endsWith('.js') ? '📄 JS' : '🎨 CSS';
    console.log(`${type} ${file.file.padEnd(30)} | ${file.size.padStart(8)} | ${file.gzipSize.padStart(8)} (gzipped)`);
  });
  
  console.log(`\n📊 Total Production Bundle: ${outputAnalysis.totalSize} (${outputAnalysis.totalGzipSize} gzipped)`);
}

console.log('\n✨ Analysis complete! Check bundle-analysis.html for visual details.');
