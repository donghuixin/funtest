// 计分、嘉宾匹配、契合度：纯函数，前端与云函数共用（云函数版本由 scripts/sync.js 编译生成）
export type Axis = 0 | 1 | 2 | 3; // ①亲密深度 ②关心方式 ③安全感来源 ④相处节奏
export type Value = -2 | -1 | 1 | 2;
export interface Answer { q: number; axis: Axis; value: Value }
export type GuestId =
  | 'xufei' | 'lina' | 'zhangmeng' | 'matianyu'
  | 'wangzixuan' | 'wenjier' | 'qingzhi' | 'baixiaochun';

// 每条光谱：[正向端, 负向端]
export const POLES: ReadonlyArray<readonly [GuestId, GuestId]> = [
  ['xufei', 'lina'],
  ['zhangmeng', 'matianyu'],
  ['wangzixuan', 'wenjier'],
  ['qingzhi', 'baixiaochun'],
];

export interface MatchResult {
  scores: number[]; // 每条 -8 ~ +8
  guest: GuestId; // 你需要的友情
  healer: GuestId; // 治愈你的朋友
  friction: GuestId; // 最需磨合的朋友
}

export interface CompatResult {
  score: number; // 0 ~ 100
  tierIndex: number; // 0 天生同频 · 1 默契搭档 · 2 需要磨合 · 3 互补型
  closestAxis: number;
  farthestAxis: number;
  gaps: number[]; // 每条光谱的差距（只有大小，没有方向，不会暴露对方偏向哪一端）
}

const VALID_VALUES = [-2, -1, 1, 2];

export function validateAnswers(answers: unknown, axes: number[]): answers is Answer[] {
  if (!Array.isArray(answers) || answers.length !== axes.length) return false;
  return answers.every((a, i) =>
    a && typeof a === 'object' && a.q === i && a.axis === axes[i] && VALID_VALUES.indexOf(a.value) >= 0);
}

export function axisScores(answers: Answer[]): number[] {
  const s = [0, 0, 0, 0];
  for (const a of answers) s[a.axis] += a.value;
  return s;
}

export function matchGuest(answers: Answer[]): MatchResult {
  const s = axisScores(answers);
  const strong = [0, 0, 0, 0]; // ±2 选项个数
  const last = [-1, -1, -1, -1]; // 每条光谱最后作答的题号
  for (const a of answers) {
    if (Math.abs(a.value) === 2) strong[a.axis]++;
    last[a.axis] = Math.max(last[a.axis], a.q);
  }
  const order = ([0, 1, 2, 3] as Axis[]).sort((x, y) =>
    Math.abs(s[y]) - Math.abs(s[x]) || strong[y] - strong[x] || last[y] - last[x]);
  const side = (ax: Axis, same: boolean): GuestId => POLES[ax][(s[ax] >= 0) === same ? 0 : 1];
  return {
    scores: s,
    guest: side(order[0], true),
    healer: side(order[1], true),
    friction: side(order[0], false),
  };
}

export function compat(a: number[], b: number[]): CompatResult {
  const gaps = a.map((v, i) => Math.abs(v - b[i]));
  const score = Math.round(100 - (gaps.reduce((t, g) => t + g, 0) / 64) * 100);
  const tierIndex = score >= 85 ? 0 : score >= 65 ? 1 : score >= 45 ? 2 : 3;
  return {
    score,
    tierIndex,
    closestAxis: gaps.indexOf(Math.min(...gaps)),
    farthestAxis: gaps.indexOf(Math.max(...gaps)),
    gaps,
  };
}
