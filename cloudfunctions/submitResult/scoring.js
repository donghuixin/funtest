// 由 scripts/sync.js 从 miniprogram/core/scoring.ts 编译生成，请勿手改
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compat = exports.matchGuest = exports.axisScores = exports.validateAnswers = exports.POLES = void 0;
// 每条光谱：[正向端, 负向端]
exports.POLES = [
    ['xufei', 'lina'],
    ['zhangmeng', 'matianyu'],
    ['wangzixuan', 'wenjier'],
    ['qingzhi', 'baixiaochun'],
];
const VALID_VALUES = [-2, -1, 1, 2];
function validateAnswers(answers, axes) {
    if (!Array.isArray(answers) || answers.length !== axes.length)
        return false;
    return answers.every((a, i) => a && typeof a === 'object' && a.q === i && a.axis === axes[i] && VALID_VALUES.indexOf(a.value) >= 0);
}
exports.validateAnswers = validateAnswers;
function axisScores(answers) {
    const s = [0, 0, 0, 0];
    for (const a of answers)
        s[a.axis] += a.value;
    return s;
}
exports.axisScores = axisScores;
function matchGuest(answers) {
    const s = axisScores(answers);
    const strong = [0, 0, 0, 0]; // ±2 选项个数
    const last = [-1, -1, -1, -1]; // 每条光谱最后作答的题号
    for (const a of answers) {
        if (Math.abs(a.value) === 2)
            strong[a.axis]++;
        last[a.axis] = Math.max(last[a.axis], a.q);
    }
    const order = [0, 1, 2, 3].sort((x, y) => Math.abs(s[y]) - Math.abs(s[x]) || strong[y] - strong[x] || last[y] - last[x]);
    const side = (ax, same) => exports.POLES[ax][(s[ax] >= 0) === same ? 0 : 1];
    return {
        scores: s,
        guest: side(order[0], true),
        healer: side(order[1], true),
        friction: side(order[0], false),
    };
}
exports.matchGuest = matchGuest;
function compat(a, b) {
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
exports.compat = compat;
