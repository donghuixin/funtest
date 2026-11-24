import { openInvite } from '../../services/api';
import { track } from '../../services/track';

Page({
  data: { code: '', state: 'loading' as 'loading' | 'sealed' | 'self' | 'invalid' | 'offline' },

  async onLoad(query: Record<string, string | undefined>) {
    const code = query.code || '';
    this.setData({ code });
    track('invite_open');
    if (!getApp<{ globalData: { cloudReady: boolean } }>().globalData.cloudReady) {
      this.setData({ state: 'offline' });
      return;
    }
    try {
      const st = await openInvite(code);
      if (!st.valid) return this.setData({ state: 'invalid' });
      if (st.self) return this.setData({ state: 'self' });
      if (st.replied && st.pairId) {
        wx.redirectTo({ url: `/pages/pair/index?id=${st.pairId}` });
        return;
      }
      this.setData({ state: 'sealed' });
    } catch (e) {
      this.setData({ state: 'invalid' });
    }
  },

  reply() {
    wx.navigateTo({ url: `/pages/quiz/index?mode=friend&code=${this.data.code}` });
  },
  openHistory() {
    wx.redirectTo({ url: '/pages/history/index' });
  },
  goHome() {
    wx.redirectTo({ url: '/pages/home/index' });
  },
});
