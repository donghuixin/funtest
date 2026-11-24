import { guestView, GuestView } from '../../services/content';
import { createInvite, unlock, getQrCode } from '../../services/api';
import { watchAdToUnlock } from '../../services/ad';
import { getConfig, loadConfig } from '../../services/config';
import { askReplyNotice } from '../../services/subscribe';
import { track } from '../../services/track';
import { drawPoster } from './poster';
import type { AppData, CurrentResult } from '../../app';

function envVersion(): string {
  try { return wx.getAccountInfoSync().miniProgram.envVersion || 'release'; } catch (e) { return 'release'; }
}

Page({
  data: {
    ready: false,
    g: null as GuestView | null,
    healer: null as GuestView | null,
    friction: null as GuestView | null,
    scores: [] as number[],
    unlocked: false,
    inviteCode: '',
    canInvite: true, // 云开发可用且邀请创建成功时，朋友打开才能看到契合度
    bannerId: '',
    posterPath: '',
    showPoster: false,
  },
  current: null as CurrentResult | null,

  async onLoad() {
    await loadConfig();
    const app = getApp<{ globalData: AppData }>();
    const r = app.globalData.current;
    if (!r) {
      wx.redirectTo({ url: '/pages/home/index' });
      return;
    }
    this.current = r;
    const cfg = getConfig();
    this.setData({
      ready: true,
      g: guestView(r.guest),
      healer: guestView(r.healer),
      friction: guestView(r.friction),
      scores: r.scores,
      unlocked: r.unlocked || !cfg.adsEnabled, // 流量主开通前深度报告直接免费
      bannerId: cfg.adsEnabled ? cfg.bannerAdUnitId : '',
    });
    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
    createInvite(r.id)
      .then(({ code }) => this.setData({ inviteCode: code, canInvite: !!code && code !== 'LOCALDEMO' }))
      .catch((e) => {
        console.error('[createInvite] 失败，朋友将看不到契合度', e);
        this.setData({ canInvite: false });
      });
  },

  async unlockReport() {
    const ok = await watchAdToUnlock();
    if (!ok) {
      wx.showToast({ title: '看完广告才能拆开哦', icon: 'none' });
      return;
    }
    this.setData({ unlocked: true });
    if (this.current) {
      this.current.unlocked = true;
      unlock('result', this.current.id).catch(() => undefined);
    }
    track('unlock_report', { guest: this.current ? this.current.guest : '' });
  },

  // 转发按钮是 open-type="share"，点击时先请求订阅「朋友回信了」
  beforeShare() {
    askReplyNotice();
  },

  onShareAppMessage() {
    track('share_invite');
    if (!this.data.canInvite || !this.data.inviteCode) {
      return { title: '你需要什么样的友情？16 个问题测一测', path: '/pages/home/index' };
    }
    return {
      title: '我给你寄了一封信，拆开前先回答 16 个问题',
      path: `/pages/invite/index?code=${this.data.inviteCode}`,
      imageUrl: '/assets/share-sealed.png',
    };
  },

  onShareTimeline() {
    return { title: '友情来信：你需要什么样的友情？' };
  },

  async makePoster() {
    if (!this.data.g) return;
    wx.showLoading({ title: '正在写信…' });
    try {
      const qr = await getQrCode(envVersion()).catch(() => '');
      const path = await drawPoster(this, '#poster', this.data.g, this.data.scores, qr);
      this.setData({ posterPath: path, showPoster: true });
    } finally {
      wx.hideLoading();
    }
  },

  savePoster() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterPath,
      success: () => {
        wx.showToast({ title: '已保存到相册' });
        track('save_poster');
      },
      fail: () => wx.showToast({ title: '没有保存，可以长按图片保存', icon: 'none' }),
    });
  },

  closePoster() {
    this.setData({ showPoster: false });
  },

  noop() {},

  again() {
    wx.redirectTo({ url: '/pages/quiz/index' });
  },

  openHistory() {
    wx.navigateTo({ url: '/pages/history/index' });
  },
});
