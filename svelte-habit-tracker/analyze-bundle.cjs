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
    return {
      files: [],
      totalSize: '0 Bytes',
      totalGzipSize: '0 Bytes',
      totalSizeRaw: 0,
      totalGzipSizeRaw: 0
    };
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

console.log('🔍 Svelte Habit Tracker - Bundle Analysis');
console.log('==========================================\n');

// SvelteKit builds to .svelte-kit/output by default
const clientDir = './.svelte-kit/output/client/_app/immutable';

console.log('📦 SVELTEKIT BUILD ANALYSIS:');

// Check different possible build directories
const possibleDirs = [
  { name: 'Assets', path: './.svelte-kit/output/client/_app/immutable/assets' },
  { name: 'Chunks', path: './.svelte-kit/output/client/_app/immutable/chunks' },
  { name: 'Entry Points', path: './.svelte-kit/output/client/_app/immutable/entry' },
  { name: 'Nodes', path: './.svelte-kit/output/client/_app/immutable/nodes' }
];

let grandTotalSize = 0;
let grandTotalGzipSize = 0;
let foundFiles = false;

possibleDirs.forEach(dir => {
  if (fs.existsSync(dir.path)) {
    console.log(`\n📁 ${dir.name} (${dir.path}):`);
    const analysis = analyzeDirectory(dir.path);
    
    if (analysis.files.length > 0) {
      foundFiles = true;
      analysis.files.forEach(file => {
        const type = file.file.endsWith('.js') ? '📄 JS' : file.file.endsWith('.css') ? '🎨 CSS' : '📋 Other';
        console.log(`${type} ${file.file.padEnd(40)} | ${file.size.padStart(8)} | ${file.gzipSize.padStart(8)} (gzipped)`);
      });
      
      console.log(`📊 ${dir.name} Total: ${analysis.totalSize} (${analysis.totalGzipSize} gzipped)`);
      grandTotalSize += analysis.totalSizeRaw;
      grandTotalGzipSize += analysis.totalGzipSizeRaw;
    } else {
      console.log(`   No JS/CSS files found in ${dir.path}`);
    }
  }
});

if (foundFiles) {
  console.log('\n' + '='.repeat(80));
  console.log(`🎯 GRAND TOTAL: ${formatBytes(grandTotalSize)} (${formatBytes(grandTotalGzipSize)} gzipped)`);
  console.log('='.repeat(80));
} else {
  console.log('\n❌ No build files found. Make sure to run "npm run build" first.');
  console.log('\n🔧 Available directories:');
  if (fs.existsSync('./.svelte-kit')) {
    console.log('   ./.svelte-kit/ exists');
    if (fs.existsSync('./.svelte-kit/output')) {
      console.log('   ./.svelte-kit/output/ exists');
      if (fs.existsSync('./.svelte-kit/output/client')) {
        console.log('   ./.svelte-kit/output/client/ exists');
      }
    }
  } else {
    console.log('   ./.svelte-kit/ does not exist - build the project first');
  }
}

console.log('\n✨ Analysis complete! Check bundle-analysis.html for visual details.');
console.log('📋 Bundle composition shows Svelte\'s compilation efficiency.');
