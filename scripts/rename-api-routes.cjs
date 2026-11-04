const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'src/routes/api');

function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      walk(full);
      continue;
    }

    if (item.name.startsWith('$')) {
      const renamed = path.join(path.dirname(full), '-' + item.name);
      fs.renameSync(full, renamed);
      console.log(`Renamed ${item.name} -> ${path.basename(renamed)}`);
    }
  }
}

walk(root);
