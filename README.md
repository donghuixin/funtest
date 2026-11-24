# 友情来信（微信小程序 + 网页版）

16 道旅途情境题，测出你需要什么样的友情，匹配 8 位嘉宾之一；支持双人对测（转发后朋友答题，只显示契合度，双方都看不到对方的嘉宾）。

- 视觉：方案 A「旧信与邮戳」
- 技术：原生小程序 + TypeScript + 微信云开发，无 npm 依赖（不需要「构建 npm」）
- 变现：激励视频解锁深度报告；流量主未开通前自动免费解锁

## 目录

```
content.json            题库、嘉宾文案、契合度档位（唯一数据源）
miniprogram/            小程序前端
  core/scoring.ts       计分、匹配、契合度（前端与云函数共用）
  data/content.ts       由 content.json 生成
  services/             云函数封装、广告、远程开关、埋点、订阅消息
  components/           stamp 邮票、spectrum 光谱
  pages/                home 首页 · quiz 答题 · result 结果 · invite 收信 · pair 契合度 · history 信箱
cloudfunctions/         8 个云函数
tests/                  计分单测
demo/                   网页版（template.html + content.json → index.html）
scripts/                sync.js 同步共享代码 · upload.js 上传 · build-demo.js
docs/DEPLOY.md          从注册到上线的操作清单
```

## 常用命令

```bash
npm install            # 只装开发工具（TypeScript、类型定义、miniprogram-ci）
npm run sync           # 改了 content.json 或 scoring.ts 后必须执行
npm test               # 计分单测
npm run typecheck      # 类型检查
APPID=wx... ENV_ID=cloud1-... npm run upload   # 部署云函数并上传代码（不会提交审核）
```

改题目或文案：只改 `content.json`，然后 `npm run sync`，再上传。

## 网页版

`demo/index.html` 是可以直接在浏览器里玩的网页版，由 `npm run demo` 从 `content.json` 和 `demo/template.html` 生成。
推送到 `main` 后，GitHub Actions（`.github/workflows/pages.yml`）会自动重新生成并发布到 GitHub Pages。

网页版没有服务端：分享链接里带着答题后的四条光谱分数（`?i=`），朋友答完后可以把回信链接（`?p=`）发回去，双方看到同样的契合度，都看不到对方的嘉宾。
