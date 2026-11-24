// 保存一次个人测试，服务端重新计分（以服务端为准）
const cloud = require('wx-server-sdk');
const { matchGuest, validateAnswers } = require('./scoring');
const AXES = require('./axes.json');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async ({ answers }) => {
  const { OPENID } = cloud.getWXContext();
  if (!validateAnswers(answers, AXES)) return { error: 'BAD_ANSWERS' };
  const r = matchGuest(answers);
  const { _id } = await db.collection('results').add({
    data: { openid: OPENID, answers, ...r, unlocked: false, createdAt: Date.now() },
  });
  return { id: _id, ...r };
};
