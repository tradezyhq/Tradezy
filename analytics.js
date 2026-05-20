const fs = require('fs');
const snippet = '<!-- Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-0NSDNDFP0H"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag("js", new Date());\n  gtag("config", "G-0NSDNDFP0H");\n</script>';
fs.readdirSync('.').filter(f => f.endsWith('.html')).forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('G-0NSDNDFP0H')) {
    fs.writeFileSync(f, c.replace('<head>', '<head>\n' + snippet));
    console.log('Updated:', f);
  } else {
    console.log('Skipped:', f);
  }
});
