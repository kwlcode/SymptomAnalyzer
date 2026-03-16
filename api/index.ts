const fs = require('fs');
const path = require('path');

export default function handler(req: any, res: any) {
  const walk = (dir: string): any => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file: string) => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        if (!file.includes('node_modules')) {
          results = results.concat(walk(file));
        }
      } else {
        results.push(file);
      }
    });
    return results;
  };

  try {
    const files = walk(process.cwd());
    res.status(200).json({
      cwd: process.cwd(),
      files: files
    });
  } catch (e: any) {
    res.status(500).json({ error: e.toString() });
  }
}
