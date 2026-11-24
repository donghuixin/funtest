// 把 content.json 内联进演示页模板，生成 demo/index.html
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
const tpl = fs.readFileSync(path.join(root, 'demo/template.html'), 'utf8');
const out = tpl.replace('/*__CONTENT__*/null', JSON.stringify(content));
fs.writeFileSync(path.join(root, 'demo/index.html'), out);
console.log('demo/index.html', out.length, 'bytes');
