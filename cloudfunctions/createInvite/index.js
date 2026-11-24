// 为自己的一次结果生成（或复用）邀请码。邀请码随机、不可猜，转发链接里只有它
const cloud = require('wx-server-sdk');
const crypto = require('crypto');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function newCode() {
  const bytes = crypto.randomBytes(12);
  let s = '';
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return s;
}

exports.main = async ({ resultId }) => {
  const { OPENID } = cloud.getWXContext();
  if (!resultId) return { error: 'BAD_REQUEST' };
  const { data: res } = await db.collection('results').doc(resultId).get().catch(() => ({ data: null }));
  if (!res || res.openid !== OPENID) return { error: 'NOT_FOUND' };
  const { data: [old] } = await db.collection('invites').where({ ownerResultId: resultId }).limit(1).get();
  if (old) return { code: old.code };
  const code = newCode();
  await db.collection('invites').add({ data: { code, ownerOpenid: OPENID, ownerResultId: resultId, createdAt: Date.now() } });
  return { code };
};
