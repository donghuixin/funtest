import { toDims, drawRadar, Dim } from '../../core/dimensions';

const FONT = '"LetterDisplay", "Songti SC", "PingFang SC", sans-serif';

Component({
  properties: {
    scores: { type: Array, value: [] as number[] },
  },
  data: { dims: [] as Dim[] },
  observers: {
    scores(s: number[]) {
      if (!s || s.length !== 4) return;
      this.setData({ dims: toDims(s) }, () => this.draw());
    },
  },
  lifetimes: {
    ready() { if (this.data.dims.length) this.draw(); },
  },
  methods: {
    draw() {
      this.createSelectorQuery().select('#ps-radar').fields({ node: true, size: true }).exec((res) => {
        const r = res && res[0];
        if (!r || !r.node) return;
        const canvas = r.node as WechatMiniprogram.Canvas;
        const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        const dpr = info.pixelRatio || 2;
        const w = r.width as number;
        const h = r.height as number;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext('2d') as any;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);
        const radius = Math.min(w / 2 - 92, h / 2 - 56);
        drawRadar(ctx, w / 2, h / 2 + 4, radius, this.data.dims, FONT);
      });
    },
  },
});
