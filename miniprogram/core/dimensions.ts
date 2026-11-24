// 「友情人格维度」：把四条光谱分数（-8 ~ +8）换算成两端百分比、强弱和解读文案
import { CONTENT } from '../services/content';

export type Lead = 'pos' | 'neg' | 'mid';

export interface Dim {
  name: string;
  posWord: string;
  negWord: string;
  posPct: number; // 偏向正向端的比例 0~100
  negPct: number;
  lead: Lead;
  leadWord: string; // 主导一端，均衡时为「均衡」
  leadPct: number;
  strength: number; // 0~1，偏离中点的程度，用于雷达图
  levelText: string; // 例：明显偏向「深度绑定」
  text: string; // 解读
}

// 每条光谱：[正向端解读, 负向端解读, 均衡解读]
const READINGS: string[][] = [
  [
    '你想要的朋友，是能把日常摊开来分享的人。一起吃饭、一起吐槽、一起计划下一次见面，这种「我们是一伙的」感觉会让你踏实。',
    '你珍惜各自有空间的友情。不必天天联系，见面时依然熟络。对你来说，好朋友是能放心让彼此走远一点的人。',
    '你在靠近和留白之间切换得很自然。热闹时能陪着，安静时也不觉得被冷落，你看重的是相处舒服，而不是距离远近。',
  ],
  [
    '你表达关心的方式很直接：主动约、主动问、主动拉朋友一把。你也希望这份热情能被回应，而不是总等你先开口。',
    '你的关心有分寸。不追着问，也不替别人做决定，只在对方需要时稳稳地出现。你也希望朋友同样尊重你的边界。',
    '你会看情况决定要不要往前一步。朋友低落时你会主动些，朋友想静一静时你也懂得退后，这份分寸感让人放松。',
  ],
  [
    '让你安心的是态度和陪伴：一句及时的回复、一件被记住的小事，比什么都重要。你需要感觉到自己被放在心上。',
    '让你安心的是公平和清楚：账算明白，约定说到做到，付出大致对等。规则清晰了，你才能放心把心交出去。',
    '你既在意心意，也在意分寸。朋友的陪伴让你温暖，彼此说清楚、做到位，也让你觉得这段关系靠得住。',
  ],
  [
    '你喜欢能一起变好的朋友：互相督促、互相提要求，在彼此身上看到进步。好的友情对你来说带着一点向上的力气。',
    '你喜欢和朋友一起放松。不用表现，不用较劲，待在一起就很舒服。友情对你来说，是能卸下力气的地方。',
    '你能跟朋友一起拼，也能一起躺。该认真时认真，该松弛时松弛，节奏跟着彼此的状态走。',
  ],
];

export function toDims(scores: number[]): Dim[] {
  return CONTENT.axes.map((ax, i) => {
    const s = Math.max(-8, Math.min(8, scores[i] || 0));
    const posPct = Math.round(((s + 8) / 16) * 100);
    const negPct = 100 - posPct;
    const lead: Lead = Math.abs(s) <= 1 ? 'mid' : s > 0 ? 'pos' : 'neg';
    const leadWord = lead === 'pos' ? ax.pos : lead === 'neg' ? ax.neg : '均衡';
    const leadPct = lead === 'neg' ? negPct : posPct;
    const abs = Math.abs(s);
    const levelText = lead === 'mid' ? '两端很均衡' : `${abs >= 5 ? '明显' : '略微'}偏向「${leadWord}」`;
    return {
      name: ax.name,
      posWord: ax.pos,
      negWord: ax.neg,
      posPct,
      negPct,
      lead,
      leadWord,
      leadPct: lead === 'mid' ? Math.max(posPct, negPct) : leadPct,
      strength: abs / 8,
      levelText,
      text: READINGS[i][lead === 'pos' ? 0 : lead === 'neg' ? 1 : 2],
    };
  });
}

// 画四角雷达图，结果页和海报共用。上、右、下、左依次是四个维度
export function drawRadar(ctx: any, cx: number, cy: number, r: number, dims: Dim[], font: string) {
  const ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  const pt = (k: number, f: number) => [cx + Math.cos(ang[k]) * r * f, cy + Math.sin(ang[k]) * r * f];

  // 网格
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#D9D0C1';
  [0.25, 0.5, 0.75, 1].forEach((f, gi) => {
    ctx.setLineDash(gi === 3 ? [] : [4, 4]);
    ctx.beginPath();
    for (let k = 0; k < 4; k++) { const [x, y] = pt(k, f); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath();
    ctx.stroke();
  });
  ctx.setLineDash([]);
  for (let k = 0; k < 4; k++) { const [x, y] = pt(k, 1); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); }

  // 数据多边形：离中心越远倾向越鲜明，留一点底避免缩成一个点
  const vals = dims.map((d) => 0.14 + 0.86 * d.strength);
  ctx.beginPath();
  for (let k = 0; k < 4; k++) { const [x, y] = pt(k, vals[k]); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath();
  ctx.fillStyle = 'rgba(200,69,45,.16)';
  ctx.fill();
  ctx.strokeStyle = '#C8452D';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#C8452D';
  for (let k = 0; k < 4; k++) { const [x, y] = pt(k, vals[k]); ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }

  // 标签：维度名 + 主导一端与比例
  const gap = 14;
  const lab = [
    { x: cx, y: cy - r - gap - 20, align: 'center' },
    { x: cx + r + gap, y: cy - 8, align: 'left' },
    { x: cx, y: cy + r + gap + 12, align: 'center' },
    { x: cx - r - gap, y: cy - 8, align: 'right' },
  ];
  dims.forEach((d, k) => {
    const L = lab[k];
    ctx.textAlign = L.align;
    ctx.fillStyle = '#1F3A5F';
    ctx.font = `bold 15px ${font}`;
    ctx.fillText(d.name, L.x, L.y);
    ctx.fillStyle = d.lead === 'mid' ? '#6B6B6B' : '#C8452D';
    ctx.font = `13px ${font}`;
    ctx.fillText(d.lead === 'mid' ? '两端均衡' : `${d.leadWord} ${d.leadPct}%`, L.x, L.y + 20);
  });
  ctx.textAlign = 'left';
}
