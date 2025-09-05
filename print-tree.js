/* eslint-disable @typescript-eslint/no-var-requires */
// print-tree.js
const fs = require('fs');
const path = require('path');

// Configurazione
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.pnpm-store',
  'coverage',
  '.nyc_output',
];

const IGNORE_FILES = [
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
];

// Disabilita colori su Windows
const isWindows = process.platform === 'win32';
const colors = {
  reset: isWindows ? '' : '\x1b[0m',
  dim: isWindows ? '' : '\x1b[2m',
  blue: isWindows ? '' : '\x1b[34m',
  green: isWindows ? '' : '\x1b[32m',
  yellow: isWindows ? '' : '\x1b[33m',
};

function shouldIgnore(name, isDirectory) {
  // Check directory ignores
  if (isDirectory && IGNORE_DIRS.includes(name)) {
    return true;
  }

  // Check file ignores
  if (!isDirectory) {
    for (const pattern of IGNORE_FILES) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        if (regex.test(name)) return true;
      } else if (name === pattern) {
        return true;
      }
    }
  }

  return false;
}

function getFileTree(dir, prefix = '', isLast = true, depth = 0, maxDepth = 10) {
  let output = '';

  if (depth > maxDepth) return output;

  try {
    const items = fs
      .readdirSync(dir)
      .filter((item) => !shouldIgnore(item, fs.statSync(path.join(dir, item)).isDirectory()));

    // Separa file e directory
    const dirs = [];
    const files = [];

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        dirs.push(item);
      } else {
        files.push(item);
      }
    });

    // Ordina alfabeticamente
    dirs.sort();
    files.sort();

    const allItems = [...dirs, ...files];

    allItems.forEach((item, index) => {
      const isLastItem = index === allItems.length - 1;
      const fullPath = path.join(dir, item);
      const isDir = fs.statSync(fullPath).isDirectory();

      // Costruisci il prefisso per l'albero (versione semplice per Windows)
      const connector = isWindows ? (isLastItem ? '+-- ' : '|-- ') : isLastItem ? '└── ' : '├── ';
      const color = isDir ? colors.blue : colors.green;

      output += prefix + connector + color + item + colors.reset;

      if (isDir) {
        output += '/\n';
        const newPrefix =
          prefix + (isWindows ? (isLastItem ? '    ' : '|   ') : isLastItem ? '    ' : '│   ');
        output += getFileTree(fullPath, newPrefix, isLastItem, depth + 1, maxDepth);
      } else {
        // Aggiungi estensione e dimensione file
        const stats = fs.statSync(fullPath);
        const size = formatFileSize(stats.size);
        output += ` ${colors.dim}(${size})${colors.reset}\n`;
      }
    });
  } catch (error) {
    output += prefix + `${colors.dim}[Error reading directory: ${error.message}]${colors.reset}\n`;
  }

  return output;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

function getProjectStats(dir) {
  let stats = {
    totalFiles: 0,
    totalDirs: 0,
    filesByExt: {},
    totalSize: 0,
  };

  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);

      items.forEach((item) => {
        if (shouldIgnore(item, true)) return;

        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !shouldIgnore(item, true)) {
          stats.totalDirs++;
          scan(fullPath);
        } else if (stat.isFile() && !shouldIgnore(item, false)) {
          stats.totalFiles++;
          stats.totalSize += stat.size;

          const ext = path.extname(item) || 'no-ext';
          stats.filesByExt[ext] = (stats.filesByExt[ext] || 0) + 1;
        }
      });
    } catch (error) {
      // Ignora errori di permessi
    }
  }

  scan(dir);
  return stats;
}

// Main
console.log('\n' + colors.yellow + '========================================' + colors.reset);
console.log(colors.yellow + '     PROJECT STRUCTURE - KOKORU GARDEN' + colors.reset);
console.log(colors.yellow + '========================================' + colors.reset + '\n');

const projectRoot = process.cwd();
console.log(colors.blue + 'Root: ' + colors.reset + projectRoot + '\n');

// Stampa l'albero
console.log(getFileTree(projectRoot, '', true, 0, 5));

// Stampa statistiche
console.log('\n' + colors.yellow + '========================================' + colors.reset);
console.log(colors.yellow + '     PROJECT STATISTICS' + colors.reset);
console.log(colors.yellow + '========================================' + colors.reset + '\n');

const stats = getProjectStats(projectRoot);
console.log('Total Files: ' + colors.green + stats.totalFiles + colors.reset);
console.log('Total Directories: ' + colors.blue + stats.totalDirs + colors.reset);
console.log('Total Size: ' + colors.yellow + formatFileSize(stats.totalSize) + colors.reset);
console.log('\nFiles by extension:');

// Ordina per numero di file
const sortedExts = Object.entries(stats.filesByExt)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedExts.forEach(([ext, count]) => {
  console.log(`  ${ext}: ${colors.green}${count}${colors.reset}`);
});

console.log(
  '\n' +
    colors.dim +
    '(Showing max depth: 5, ignoring: node_modules, .git, dist, etc.)' +
    colors.reset +
    '\n',
);
