// 朋友打开转发卡片：只返回状态，不返回寄信人的任何结果字段
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async ({ code }) => {
  const { OPENID } = cloud.getWXContext();
  if (!code || typeof code !== 'string') return { valid: false, self: false, replied: false };
  const { data: [inv] } = await db.collection('invites').where({ code }).limit(1).get();
  if (!inv) return { valid: false, self: false, replied: false };
  if (inv.ownerOpenid === OPENID) return { valid: true, self: true, replied: false };
  const { data: [done] } = await db.collection('pairs').where({ inviteId: inv._id, friendOpenid: OPENID }).limit(1).get();
  return { valid: true, self: false, replied: !!done, pairId: done ? done._id : undefined };
};
