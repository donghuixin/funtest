// 生成海报用的小程序码，按版本（正式版 / 体验版 / 开发版）分别生成一次，存云存储后复用
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const ENVS = ['release', 'trial', 'develop'];

exports.main = async (event) => {
  const env = ENVS.indexOf(event && event.envVersion) >= 0 ? event.envVersion : 'release';
  const { data: cfg } = await db.collection('config').doc('app').get().catch(() => ({ data: {} }));
  const cache = (cfg && cfg.qrFileIDs) || {};
  if (cache[env]) return { fileID: cache[env] };
  if (env === 'release' && cfg && cfg.qrFileID) return { fileID: cfg.qrFileID };
  try {
    const res = await cloud.openapi.wxacode.getUnlimited({
      scene: 'poster',
      page: 'pages/home/index',
      checkPath: false, // 未发布时页面还不存在于线上版本，需关闭校验
      envVersion: env,
      width: 280,
    });
    const up = await cloud.uploadFile({ cloudPath: `poster/qrcode-${env}.png`, fileContent: res.buffer });
    await db.collection('config').doc('app').update({ data: { [`qrFileIDs.${env}`]: up.fileID } }).catch(() => null);
    return { fileID: up.fileID };
  } catch (e) {
    console.error('getUnlimited failed', env, e);
    return { fileID: '' }; // 生成失败时，海报改用文字邮戳 + 「微信搜索」
  }
};
