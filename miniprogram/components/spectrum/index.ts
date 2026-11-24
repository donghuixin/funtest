import { CONTENT, nameOf } from '../../services/content';

Component({
  properties: {
    scores: { type: Array, value: [] as number[] },
  },
  data: { rows: [] as { name: string; posWord: string; negWord: string; left: string; right: string; pos: string }[] },
  observers: {
    scores(s: number[]) {
      if (!s || s.length !== 4) return;
      const rows = CONTENT.axes.map((ax, i) => ({
        name: ax.name,
        posWord: ax.pos,
        negWord: ax.neg,
        left: nameOf(CONTENT.poles[i][0]),
        right: nameOf(CONTENT.poles[i][1]),
        pos: (((8 - s[i]) / 16) * 100).toFixed(1),
      }));
      this.setData({ rows });
    },
  },
});
