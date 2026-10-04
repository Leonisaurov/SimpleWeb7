const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const { minify: minifyHtml } = require('html-minifier-terser');

const SRC = __dirname;
const OUT = path.join(__dirname, 'dist');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });

for (const f of ['css/styles.css', 'js/app.js', 'js/register-sw.js', 'sw.js']) {
  esbuild.buildSync({
    entryPoints: [path.join(SRC, f)],
    outfile: path.join(OUT, f),
    minify: true,
    bundle: false,
  });
}

(async () => {
  for (const f of ['index.html']) {
    const html = fs.readFileSync(path.join(SRC, f), 'utf8');
    const min = await minifyHtml(html, { collapseWhitespace: true, removeComments: true, minifyCSS: true, minifyJS: true });
    fs.writeFileSync(path.join(OUT, f), min);
  }
  for (const f of ['manifest.json', 'robots.txt', 'sitemap.xml', 'package.json', 'README.md']) {
    try { fs.copyFileSync(path.join(SRC, f), path.join(OUT, f)); } catch {}
  }
  console.log('Build en dist/');
})();
