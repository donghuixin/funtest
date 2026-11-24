import { listMine, MyRecord } from '../../services/api';
import { guestView, CONTENT } from '../../services/content';
import { loadConfig } from '../../services/config';
import type { AppData } from '../../app';

interface Row { id: string; guest: string; type: string; date: string; pairs: { id: string; who: string; score: number; tier: string }[] }

Page({
  data: { loading: true, rows: [] as Row[] },
  records: [] as MyRecord[],

  async onShow() {
    await loadConfig();
    this.refresh();
  },
  async onPullDownRefresh() {
    await this.refresh();
    wx.stopPullDownRefresh();
  },
  async refresh() {
    try {
      this.records = await listMine();
    } catch (e) {
      this.records = [];
    }
    const rows = this.records.map((r) => ({
      id: r.id,
      guest: r.guest,
      type: guestView(r.guest).type,
      date: fmt(r.createdAt),
      pairs: r.pairs.map((p) => ({ id: p.id, who: p.nickname || '一位朋友', score: p.score, tier: CONTENT.tiers[p.tierIndex].name })),
    }));
    this.setData({ loading: false, rows });
  },
  openResult(e: WechatMiniprogram.TouchEvent) {
    const rec = this.records.find((r) => r.id === e.currentTarget.dataset.id);
    if (!rec) return;
    getApp<{ globalData: AppData }>().globalData.current = { id: rec.id, scores: rec.scores, guest: rec.guest, healer: rec.healer, friction: rec.friction, unlocked: rec.unlocked };
    wx.navigateTo({ url: '/pages/result/index' });
  },
  openPair(e: WechatMiniprogram.TouchEvent) {
    wx.navigateTo({ url: `/pages/pair/index?id=${e.currentTarget.dataset.id}` });
  },
  start() {
    wx.redirectTo({ url: '/pages/quiz/index' });
  },
});

function fmt(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}
