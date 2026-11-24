// 看完激励视频后记录解锁状态（只能解锁自己的结果或自己参与的那一对）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async ({ kind, id }) => {
  const { OPENID } = cloud.getWXContext();
  if (kind === 'result') {
    const { data: r } = await db.collection('results').doc(id).get().catch(() => ({ data: null }));
    if (!r || r.openid !== OPENID) return { error: 'NOT_FOUND' };
    await db.collection('results').doc(id).update({ data: { unlocked: true, unlockedAt: Date.now() } });
    return { ok: true };
  }
  if (kind === 'pair') {
    const { data: p } = await db.collection('pairs').doc(id).get().catch(() => ({ data: null }));
    if (!p) return { error: 'NOT_FOUND' };
    const field = p.ownerOpenid === OPENID ? 'ownerUnlocked' : p.friendOpenid === OPENID ? 'friendUnlocked' : '';
    if (!field) return { error: 'NOT_FOUND' };
    await db.collection('pairs').doc(id).update({ data: { [field]: true } });
    return { ok: true };
  }
  return { error: 'BAD_REQUEST' };
};
