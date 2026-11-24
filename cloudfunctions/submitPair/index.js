// 朋友回信：保存朋友自己的结果，在服务端用寄信人的得分算契合度
// 返回值里只有朋友自己的结果和契合度，不含寄信人的答案、得分或嘉宾
const cloud = require('wx-server-sdk');
const { matchGuest, compat, validateAnswers } = require('./scoring');
const AXES = require('./axes.json');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async ({ code, answers, nickname = '' }) => {
  const { OPENID } = cloud.getWXContext();
  if (!validateAnswers(answers, AXES)) return { error: 'BAD_ANSWERS' };
  const { data: [inv] } = await db.collection('invites').where({ code: String(code || '') }).limit(1).get();
  if (!inv) return { error: 'INVITE_NOT_FOUND' };
  if (inv.ownerOpenid === OPENID) return { error: 'SELF_INVITE' };

  const mine = matchGuest(answers);
  const { data: [done] } = await db.collection('pairs').where({ inviteId: inv._id, friendOpenid: OPENID }).limit(1).get();
  if (done) {
    const { data: r } = await db.collection('results').doc(done.friendResultId).get();
    return { myResult: { id: r._id, scores: r.scores, guest: r.guest, healer: r.healer, friction: r.friction }, pairId: done._id, pair: pick(done) };
  }

  const { _id: friendResultId } = await db.collection('results').add({
    data: { openid: OPENID, answers, ...mine, unlocked: false, viaInvite: inv._id, createdAt: Date.now() },
  });
  const { data: owner } = await db.collection('results').doc(inv.ownerResultId).get();
  const pair = compat(owner.scores, mine.scores); // 寄信人的得分只在这里用一次

  const { _id: pairId } = await db.collection('pairs').add({
    data: {
      inviteId: inv._id, ownerOpenid: inv.ownerOpenid, ownerResultId: inv.ownerResultId,
      friendOpenid: OPENID, friendResultId, friendNickname: String(nickname).trim().slice(0, 12),
      ...pair, ownerUnlocked: false, friendUnlocked: false, createdAt: Date.now(),
    },
  });

  await notifyOwner(inv.ownerOpenid, String(nickname).trim().slice(0, 12), pair.score, pairId).catch(() => null);
  return { myResult: { id: friendResultId, ...mine }, pairId, pair };
};

function pick(p) {
  return { score: p.score, tierIndex: p.tierIndex, closestAxis: p.closestAxis, farthestAxis: p.farthestAxis, gaps: p.gaps };
}

// 「朋友回信了」订阅消息。模板 ID 和字段映射放在 config 集合，字段值里的 {nickname} {score} 会被替换
async function notifyOwner(openid, nickname, score, pairId) {
  const { data: cfg } = await db.collection('config').doc('app').get().catch(() => ({ data: {} }));
  if (!cfg || !cfg.replyTemplateId || !cfg.replyTemplateFields) return;
  const data = {};
  for (const [k, v] of Object.entries(cfg.replyTemplateFields)) {
    data[k] = { value: String(v).replace('{nickname}', nickname || '一位朋友').replace('{score}', String(score)) };
  }
  await cloud.openapi.subscribeMessage.send({
    touser: openid,
    templateId: cfg.replyTemplateId,
    page: `pages/pair/index?id=${pairId}`,
    data,
    miniprogramState: cfg.miniprogramState || 'formal',
  });
}
