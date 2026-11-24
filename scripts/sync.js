// 单一数据源同步：
// 1) content.json → miniprogram/data/content.ts（前端题库与文案）
// 2) miniprogram/core/scoring.ts → 各云函数目录下的 scoring.js（CommonJS）
// 3) content.json 里的 questions 的 axis 列表 → 云函数用于校验答案
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));

fs.writeFileSync(path.join(root, 'miniprogram/data/content.ts'),
  '// 由 scripts/sync.js 从 content.json 生成，请勿手改\n' +
  "import type { Content } from './types';\n\n" +
  'const CONTENT: Content = ' + JSON.stringify(content, null, 2) + ';\n\nexport default CONTENT;\n');

const src = fs.readFileSync(path.join(root, 'miniprogram/core/scoring.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018 } }).outputText;
const axes = content.questions.map(q => q.axis);
const header = '// 由 scripts/sync.js 从 miniprogram/core/scoring.ts 编译生成，请勿手改\n';
for (const fn of ['submitResult', 'submitPair']) {
  const dir = path.join(root, 'cloudfunctions', fn);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'scoring.js'), header + js);
  fs.writeFileSync(path.join(dir, 'axes.json'), JSON.stringify(axes));
}
fs.mkdirSync(path.join(root, 'tests/.build'), { recursive: true });
fs.writeFileSync(path.join(root, 'tests/.build/scoring.js'), header + js);
console.log('synced content.ts, cloud scoring.js x2, tests/.build/scoring.js');
