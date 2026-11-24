import { CONTENT, guestView, GuestView } from '../../services/content';
import { getPair, unlock } from '../../services/api';
import { watchAdToUnlock } from '../../services/ad';
import { getConfig, loadConfig } from '../../services/config';
import { track } from '../../services/track';
import type { AppData } from '../../app';

interface Fact { name: string; level: string; text: string }

Page({
  data: {
    ready: false,
    pairId: '',
    role: 'friend' as 'owner' | 'friend',
    score: 0,
    tier: '',
    tierLine: '',
    near: '',
    far: '',
    farGap: '',
    facts: [] as Fact[],
    unlocked: false,
    mine: null as GuestView | null,
    myScores: [] as number[],
  },

  async onLoad(query: Record<string, string | undefined>) {
    await loadConfig();
    const pairId = query.id || '';
    try {
      const { pair, unlocked, role } = await getPair(pairId);
      const tier = CONTENT.tiers[pair.tierIndex];
      const far = CONTENT.axes[pair.farthestAxis];
      const facts = CONTENT.axes.map((ax, i) => {
        const d = pair.gaps[i];
        return {
          name: ax.name,
          level: d <= 3 ? '很同频' : d <= 7 ? '有些不同' : '差得很远',
          text: d <= 3 ? '这件事上你们不用多解释。' : `${ax.gap}。提前说好各自的习惯，会少很多误会。`,
        };
      });
      const app = getApp<{ globalData: AppData }>();
      const mine = role === 'friend' && app.globalData.current ? app.globalData.current : null;
      this.setData({
        ready: true,
        pairId,
        role,
        score: pair.score,
        tier: tier.name,
        tierLine: tier.line,
        near: CONTENT.axes[pair.closestAxis].name,
        far: far.name,
        farGap: far.gap,
        facts,
        unlocked: unlocked || !getConfig().adsEnabled,
        mine: mine ? guestView(mine.guest) : null,
        myScores: mine ? mine.scores : [],
      });
    } catch (e) {
      wx.showModal({ title: '没找到这封回信', content: '可能链接已失效。', showCancel: false, success: () => wx.redirectTo({ url: '/pages/home/index' }) });
    }
  },

  async unlockPair() {
    const ok = await watchAdToUnlock();
    if (!ok) {
      wx.showToast({ title: '看完广告才能解锁哦', icon: 'none' });
      return;
    }
    this.setData({ unlocked: true });
    unlock('pair', this.data.pairId).catch(() => undefined);
    track('unlock_pair');
  },

  seeMine() {
    wx.redirectTo({ url: '/pages/result/index' });
  },
  startOwn() {
    wx.redirectTo({ url: '/pages/quiz/index' });
  },
  openHistory() {
    wx.redirectTo({ url: '/pages/history/index' });
  },
  onShareAppMessage() {
    return { title: '你需要什么样的友情？16 个问题测一测', path: '/pages/home/index' };
  },
});
