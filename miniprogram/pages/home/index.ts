import { CONTENT } from '../../services/content';
import { track } from '../../services/track';

const DRAFT_KEY = 'quiz-draft';

Page({
  data: { guests: Object.keys(CONTENT.guests), hasDraft: false },
  onShow() {
    let hasDraft = false;
    try { hasDraft = !!wx.getStorageSync(DRAFT_KEY); } catch (e) { /* ignore */ }
    this.setData({ hasDraft });
  },
  start() {
    try { wx.removeStorageSync(DRAFT_KEY); } catch (e) { /* ignore */ }
    track('quiz_start', { mode: 'self' });
    wx.navigateTo({ url: '/pages/quiz/index' });
  },
  resume() {
    wx.navigateTo({ url: '/pages/quiz/index?resume=1' });
  },
  openHistory() {
    wx.navigateTo({ url: '/pages/history/index' });
  },
  onShareAppMessage() {
    return { title: '你需要什么样的友情？16 个问题测一测', path: '/pages/home/index' };
  },
  onShareTimeline() {
    return { title: '友情来信：你需要什么样的友情？' };
  },
});
