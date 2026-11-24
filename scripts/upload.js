// 用 miniprogram-ci 上传代码为「体验版 / 待提审版本」，并部署云函数。不会提交审核、不会发布。
// 用法：
//   APPID=wx1234... ENV_ID=cloud1-xxxx node scripts/upload.js [--functions-only | --code-only]
// 准备：小程序后台 → 开发管理 → 开发设置 → 小程序代码上传 → 生成「代码上传密钥」，
//       保存为项目根目录下 private.<APPID>.key；并关闭 IP 白名单或把本机出口 IP 加进去。
const ci = require('miniprogram-ci');
const path = require('path');
const fs = require('fs');

const appid = process.env.APPID;
const envId = process.env.ENV_ID;
const root = path.join(__dirname, '..');
const pkg = require('../package.json');
if (!appid) throw new Error('请设置环境变量 APPID');
const keyPath = path.join(root, `private.${appid}.key`);
if (!fs.existsSync(keyPath)) throw new Error(`找不到上传密钥 ${keyPath}`);

const project = new ci.Project({
  appid,
  type: 'miniProgram',
  projectPath: root,
  privateKeyPath: keyPath,
  ignores: ['node_modules/**/*', 'tests/**/*', 'scripts/**/*', 'demo/**/*', 'docs/**/*'],
});

(async () => {
  const only = process.argv[2];
  if (only !== '--code-only') {
    if (!envId) throw new Error('部署云函数需要设置 ENV_ID');
    const fnRoot = path.join(root, 'cloudfunctions');
    for (const name of fs.readdirSync(fnRoot)) {
      process.stdout.write(`部署云函数 ${name} … `);
      await ci.cloud.uploadFunction({ project, env: envId, name, path: path.join(fnRoot, name), remoteNpmInstall: true });
      console.log('完成');
    }
  }
  if (only !== '--functions-only') {
    const res = await ci.upload({
      project,
      version: pkg.version,
      desc: `后会有期 友情测试 v${pkg.version}`,
      setting: { es6: true, es7: true, minify: true, autoPrefixWXSS: true },
      onProgressUpdate: () => {},
    });
    console.log('代码已上传，到小程序后台「版本管理 → 开发版本」查看并设为体验版或提交审核。', res.subPackageInfo || '');
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
