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
  if (!fs.existsSync(dirPath)) {
    return { files: [], totalSize: '0 Bytes', totalGzipSize: '0 Bytes', totalSizeRaw: 0, totalGzipSizeRaw: 0 };
  }
  
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

console.log('🚀 Vue Travel Plans - Bundle Analysis');
console.log('====================================\n');

const distDir = './dist/assets';

if (fs.existsSync(distDir)) {
  console.log('📦 PRODUCTION BUNDLE ANALYSIS:');
  const analysis = analyzeDirectory(distDir);
  
  if (analysis.files.length > 0) {
    console.log('\nBundle Files:');
    analysis.files.forEach(file => {
      const type = file.file.endsWith('.js') ? '📄 JS' : '🎨 CSS';
      const category = file.file.includes('vendor') ? '(vendor)' : 
                     file.file.includes('index') ? '(main)' : 
                     file.file.includes('utils') ? '(utils)' : '';
      console.log(`${type} ${file.file.padEnd(35)} ${category.padEnd(8)} | ${file.size.padStart(8)} | ${file.gzipSize.padStart(8)} (gzipped)`);
    });
    
    console.log(`\n📊 Total Bundle: ${analysis.totalSize} (${analysis.totalGzipSize} gzipped)`);
    
    // Calculate breakdown
    const jsFiles = analysis.files.filter(f => f.file.endsWith('.js'));
    const cssFiles = analysis.files.filter(f => f.file.endsWith('.css'));
    
    const totalJsSize = jsFiles.reduce((sum, f) => sum + f.sizeRaw, 0);
    const totalCssSize = cssFiles.reduce((sum, f) => sum + f.sizeRaw, 0);
    const totalJsGzipSize = jsFiles.reduce((sum, f) => sum + f.gzipSizeRaw, 0);
    const totalCssGzipSize = cssFiles.reduce((sum, f) => sum + f.gzipSizeRaw, 0);
    
    console.log('\n📈 BREAKDOWN BY TYPE:');
    console.log(`📄 JavaScript: ${formatBytes(totalJsSize)} (${formatBytes(totalJsGzipSize)} gzipped)`);
    console.log(`🎨 CSS: ${formatBytes(totalCssSize)} (${formatBytes(totalCssGzipSize)} gzipped)`);
    
    // Calculate compression ratios
    const jsCompressionRatio = ((totalJsSize - totalJsGzipSize) / totalJsSize * 100).toFixed(1);
    const cssCompressionRatio = ((totalCssSize - totalCssGzipSize) / totalCssSize * 100).toFixed(1);
    const totalCompressionRatio = ((analysis.totalSizeRaw - analysis.totalGzipSizeRaw) / analysis.totalSizeRaw * 100).toFixed(1);
    
    console.log('\n🗜️  COMPRESSION RATIOS:');
    console.log(`📄 JavaScript: ${jsCompressionRatio}% compression`);
    console.log(`🎨 CSS: ${cssCompressionRatio}% compression`);
    console.log(`📦 Total: ${totalCompressionRatio}% compression`);
    
    console.log('─'.repeat(70));
  } else {
    console.log('❌ No bundle files found. Make sure to run "npm run build" first.');
  }
} else {
  console.log('❌ Dist directory not found. Please run "npm run build" first.');
}

console.log('\n✨ Analysis complete! Check bundle-analysis.html for visual details.');
