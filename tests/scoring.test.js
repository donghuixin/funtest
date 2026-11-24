// 运行：npm test（会先执行 scripts/sync.js 生成 tests/.build/scoring.js）
const test = require('node:test');
const assert = require('node:assert');
const { matchGuest, compat, axisScores, validateAnswers, POLES } = require('./.build/scoring');
const content = require('../content.json');
const AXES = content.questions.map((q) => q.axis);

const answersFrom = (pick) => content.questions.map((q, i) => ({ q: i, axis: q.axis, value: pick(q, i) }));

test('题库：16 题，每条光谱 4 题，每题四个选项分值为 +2 +1 -1 -2', () => {
  assert.strictEqual(content.questions.length, 16);
  for (let ax = 0; ax < 4; ax++) assert.strictEqual(AXES.filter((a) => a === ax).length, 4);
  for (const q of content.questions) assert.deepStrictEqual(q.options.map((o) => o.value).sort(), [-1, -2, 1, 2].sort());
});

test('每位嘉宾都有完整文案', () => {
  for (const pair of POLES) for (const id of pair) {
    const g = content.guests[id];
    assert.ok(g, id);
    for (const k of ['name', 'type', 'verdict', 'need', 'blind', 'color', 'icon']) assert.ok(g[k], `${id}.${k}`);
    assert.strictEqual(g.tips.length, 3);
  }
});

test('全选最强正向：亲密深度并列时按 ±2 个数、再按最后作答题号，选中最后的光谱「相处节奏」→ 青稚', () => {
  const r = matchGuest(answersFrom(() => 2));
  assert.deepStrictEqual(r.scores, [8, 8, 8, 8]);
  assert.strictEqual(r.guest, 'qingzhi');
  assert.strictEqual(r.friction, 'baixiaochun');
  assert.strictEqual(r.healer, 'wangzixuan');
});

test('只在「关心方式」上强烈偏向负向端 → 马天宇，磨合对象是张萌', () => {
  const r = matchGuest(answersFrom((q) => (q.axis === 1 ? -2 : q.axis === 0 ? 1 : -1)));
  assert.strictEqual(r.guest, 'matianyu');
  assert.strictEqual(r.friction, 'zhangmeng');
});

test('8 位嘉宾都能被匹配到', () => {
  for (let ax = 0; ax < 4; ax++) for (const sign of [1, -1]) {
    const r = matchGuest(answersFrom((q, i) => (q.axis === ax ? 2 * sign : i % 2 ? 1 : -1)));
    assert.strictEqual(r.guest, POLES[ax][sign > 0 ? 0 : 1]);
  }
});

test('随机作答时 8 位嘉宾分布大致均匀（各 8%–20%）', () => {
  const count = {};
  const N = 40000;
  let seed = 42;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let n = 0; n < N; n++) {
    const r = matchGuest(answersFrom((q) => q.options[Math.floor(rnd() * 4)].value));
    count[r.guest] = (count[r.guest] || 0) + 1;
  }
  for (const pair of POLES) for (const id of pair) {
    const share = (count[id] || 0) / N;
    assert.ok(share > 0.08 && share < 0.2, `${id} ${(share * 100).toFixed(1)}%`);
  }
});

test('契合度：相同得 100，完全相反得 0，档位与最近/最远光谱正确', () => {
  assert.strictEqual(compat([3, -2, 5, 0], [3, -2, 5, 0]).score, 100);
  assert.strictEqual(compat([8, 8, 8, 8], [-8, -8, -8, -8]).score, 0);
  const c = compat([8, 0, 0, 0], [-8, 0, 2, 0]);
  assert.strictEqual(c.score, 72);
  assert.strictEqual(c.tierIndex, 1);
  assert.strictEqual(c.farthestAxis, 0);
  assert.deepStrictEqual(c.gaps, [16, 0, 2, 0]);
});

test('答案校验：拒绝题数不对、光谱不对或分值非法的答案', () => {
  const ok = answersFrom(() => 1);
  assert.ok(validateAnswers(ok, AXES));
  assert.ok(!validateAnswers(ok.slice(0, 15), AXES));
  assert.ok(!validateAnswers(ok.map((a, i) => (i === 3 ? { ...a, value: 3 } : a)), AXES));
  assert.ok(!validateAnswers(ok.map((a, i) => (i === 3 ? { ...a, axis: 0 } : a)), AXES));
  assert.deepStrictEqual(axisScores(ok), [4, 4, 4, 4]);
});
