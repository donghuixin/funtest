// 两种用法：
// 1) 不带 pairId：返回我寄出的每封信（我的结果）和收到的回信摘要（昵称 + 契合度，不含朋友的嘉宾）
// 2) 带 pairId：返回这一对的契合度，只有寄信人或回信人本人能读
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async ({ pairId }) => {
  const { OPENID } = cloud.getWXContext();
  if (pairId) {
    const { data: p } = await db.collection('pairs').doc(pairId).get().catch(() => ({ data: null }));
    if (!p) return { error: 'NOT_FOUND' };
    const role = p.ownerOpenid === OPENID ? 'owner' : p.friendOpenid === OPENID ? 'friend' : '';
    if (!role) return { error: 'NOT_FOUND' };
    return {
      role,
      unlocked: role === 'owner' ? !!p.ownerUnlocked : !!p.friendUnlocked,
      pair: { score: p.score, tierIndex: p.tierIndex, closestAxis: p.closestAxis, farthestAxis: p.farthestAxis, gaps: p.gaps },
    };
  }

  const { data: results } = await db.collection('results').where({ openid: OPENID }).orderBy('createdAt', 'desc').limit(20).get();
  const ids = results.map((r) => r._id);
  const { data: pairs } = ids.length
    ? await db.collection('pairs').where({ ownerResultId: _.in(ids) }).orderBy('createdAt', 'desc').limit(100).get()
    : { data: [] };
  return {
    records: results.map((r) => ({
      id: r._id, scores: r.scores, guest: r.guest, healer: r.healer, friction: r.friction,
      unlocked: !!r.unlocked, createdAt: r.createdAt,
      pairs: pairs.filter((p) => p.ownerResultId === r._id).map((p) => ({
        id: p._id, nickname: p.friendNickname, score: p.score, tierIndex: p.tierIndex, createdAt: p.createdAt,
      })),
    })),
  };
};
