# 上线操作清单

带 ★ 的步骤只能由你本人完成（实名、扫码、确认提交）。其余步骤 Claude 可以代填，你最后检查。

## 1. 注册与基础信息（mp.weixin.qq.com）

1. ★ 注册小程序账号，主体选「个人」，用你的微信扫码完成实名。
2. 填写小程序信息：
   - 名称：建议备选「后会有期友情测试」「友情来信」「寄给朋友的一封信」。含节目名的名称可能被驳回，准备备选。
   - 简介：「用 16 个旅途中的小场景，测一测你需要什么样的友情，再把结果寄给朋友，看看你们的契合度。」（不提嘉宾真名）
   - 头像：用 `miniprogram/assets/share-sealed.png` 里的信封火漆图裁成方形。
   - 服务类目：选个人主体可选的娱乐或工具类目。不要选需要资质的「心理测评」。以后台实际可选项为准。
3. 记下 AppID（开发管理 → 开发设置），填入 `project.config.json` 的 `appid`。

## 2. 云开发

1. 打开微信开发者工具，导入本项目，点「云开发」开通环境（个人主体可用，选最低档套餐）。
2. 把环境 ID 填进 `miniprogram/env.ts`。
3. 在云开发控制台 → 数据库，新建 4 个集合：`results`、`invites`、`pairs`、`config`。
4. 每个集合的「数据权限」改为自定义安全规则：`{ "read": false, "write": false }`。前端只能通过云函数访问数据，这是「结果对朋友不可见」的保障。
5. 建索引：`invites.code`（唯一）、`invites.ownerResultId`、`pairs.inviteId + pairs.friendOpenid`、`pairs.ownerResultId`、`results.openid + results.createdAt`。
6. 在 `config` 集合新增一条记录，`_id` 填 `app`：

```json
{
  "_id": "app",
  "useRealNames": true,
  "adsEnabled": false,
  "rewardedAdUnitId": "",
  "bannerAdUnitId": "",
  "replyTemplateId": "",
  "replyTemplateFields": {},
  "fontUrl": ""
}
```

7. 部署 8 个云函数：开发者工具里在每个云函数目录上右键「上传并部署：云端安装依赖」，或用 `npm run upload -- --functions-only`。

## 3. 订阅消息（可选，「朋友回信了」通知）

1. 小程序后台 → 功能 → 订阅消息 → 从公共模板库选一个「回复通知」类一次性模板。
2. 把模板 ID 填到 `config.replyTemplateId`，把字段映射填到 `replyTemplateFields`，例如 `{"thing1": "{nickname} 给你回信了", "number2": "{score}"}`（字段名以模板为准）。

## 4. 上传代码

两种方式任选：

- 开发者工具：点右上角「上传」，版本号 1.0.0。
- 命令行：后台 → 开发管理 → 开发设置 → 小程序代码上传 → 生成密钥，保存为 `private.<AppID>.key` 放到项目根目录，关闭 IP 白名单（或加入本机 IP），然后 `APPID=... ENV_ID=... npm run upload`。

上传后在后台「版本管理」里能看到开发版本。

## 5. 体验与提审

1. 设为体验版，用手机扫码走一遍：答题、结果、海报、转发给另一个微信号回信、信箱里看回信。
2. 后台 → 设置 → 用户隐私保护指引：声明收集「用户昵称（回信署名，选填）」，用途「在回信列表中向寄信人展示」。
3. ★ 提交审核。备注里说明：「趣味测试，非官方出品，不涉及心理诊断；角色基于综艺节目公开内容。」
4. ★ 审核通过后点「发布」。

## 6. 接入广告（流量主）

1. 上线后累计独立访客达到门槛（后台「流量主」页面会显示当前进度），★ 申请开通流量主。
2. 开通后新建两个广告位：激励视频（用于「拆开完整的信」「关系解读」）、Banner（结果页底部）。
3. 把两个广告位 ID 填进 `config` 记录的 `rewardedAdUnitId`、`bannerAdUnitId`，再把 `adsEnabled` 改为 `true`。立即生效，不用重新发版。

## 7. 一键切换为不显示真名

如果审核或投诉要求，把 `config.useRealNames` 改成 `false`：结果页、光谱、海报都只显示友情类型名。
