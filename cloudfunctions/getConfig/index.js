// 读取远程开关（config 集合 _id = "app"），只返回前端需要的字段
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const FIELDS = ['useRealNames', 'adsEnabled', 'rewardedAdUnitId', 'bannerAdUnitId', 'replyTemplateId', 'fontUrl'];

exports.main = async () => {
  const { data } = await db.collection('config').doc('app').get().catch(() => ({ data: {} }));
  const out = {};
  for (const k of FIELDS) if (data && data[k] !== undefined) out[k] = data[k];
  return out;
};
