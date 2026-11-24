import { CONTENT } from '../../services/content';
import { Answer, Axis, Value, MatchResult } from '../../core/scoring';
import { submitResult, submitPair } from '../../services/api';
import { track } from '../../services/track';
import type { AppData } from '../../app';

const ORDERS = [[0, 2, 1, 3], [2, 0, 3, 1], [1, 3, 0, 2], [3, 1, 2, 0]];
const CHOPS = ['友', '情', '有', '期'];
const DRAFT_KEY = 'quiz-draft';
const INTERLUDES: Record<number, [string, string]> = {
  4: ['第一封信已寄出', '你已经走过 4 站，路还长'],
  8: ['旅途过半', '风景换了，同行的人还在'],
  12: ['快到终点了', '最后 4 站，想想你最在意的那个人'],
};

interface Cell { on: boolean; color: string }
interface Opt { text: string; value: number; chop: string }

Page({
  data: {
    mode: 'self' as 'self' | 'friend',
    code: '',
    q: 0,
    total: CONTENT.questions.length,
    place: '',
    station: '',
    text: '',
    options: [] as Opt[],
    picked: 0,
    cells: [] as Cell[],
    interlude: null as null | { at: number; title: string; line: string },
    sealing: false,
    nickname: '',
    askNickname: false,
  },
  answers: [] as Answer[],
  seen: {} as Record<number, boolean>,
  busy: false,
  nickDone: false,

  onLoad(query: Record<string, string | undefined>) {
    const mode = query.mode === 'friend' ? 'friend' : 'self';
    this.setData({ mode, code: query.code || '' });
    if (mode === 'self' && query.resume) {
      try {
        const draft = wx.getStorageSync(DRAFT_KEY) as { answers: Answer[] } | '';
        if (draft && Array.isArray(draft.answers)) this.answers = draft.answers;
      } catch (e) { /* ignore */ }
    }
    const firstOpen = this.answers.findIndex((a) => !a);
    const q = this.answers.length === 0 ? 0 : firstOpen >= 0 ? firstOpen : Math.min(this.answers.length, 15);
    this.answers.forEach((_, i) => { if (i < q) this.seen[i - (i % 4)] = true; });
    this.show(q);
  },

  onUnload() {
    if (!this.data.sealing && this.answers.filter(Boolean).length < 16) track('quiz_exit', { at: this.data.q + 1 });
  },

  show(q: number) {
    if (q > 0 && q % 4 === 0 && !this.seen[q]) {
      const [title, line] = INTERLUDES[q];
      this.setData({ q, interlude: { at: q, title, line } });
      return;
    }
    const item = CONTENT.questions[q];
    const order = ORDERS[q % 4];
    const cur = this.answers[q];
    this.setData({
      q,
      interlude: null,
      place: item.place,
      station: item.place.split(' · ')[0],
      text: item.text,
      options: order.map((oi, k) => ({ ...item.options[oi], chop: CHOPS[k] })),
      picked: cur ? cur.value : 0,
      cells: this.cells(),
    });
  },

  cells(): Cell[] {
    return CONTENT.questions.map((_, k) => {
      const a = this.answers[k];
      if (!a) return { on: false, color: '' };
      const id = CONTENT.poles[a.axis][a.value > 0 ? 0 : 1];
      return { on: true, color: (CONTENT.guests as Record<string, { color: string }>)[id].color };
    });
  },

  continueTrip() {
    this.seen[this.data.q] = true;
    this.show(this.data.q);
  },

  pick(e: WechatMiniprogram.TouchEvent) {
    if (this.busy) return;
    const value = Number(e.currentTarget.dataset.v) as Value;
    const q = this.data.q;
    this.answers[q] = { q, axis: CONTENT.questions[q].axis as Axis, value };
    this.setData({ picked: value, cells: this.cells() });
    wx.vibrateShort({ type: 'light' }).catch(() => undefined);
    if (this.data.mode === 'self') {
      try { wx.setStorageSync(DRAFT_KEY, { answers: this.answers }); } catch (err) { /* ignore */ }
    }
    this.busy = true;
    setTimeout(() => {
      this.busy = false;
      if (q === this.data.total - 1) this.finish();
      else this.show(q + 1);
    }, 320);
  },

  prev() {
    if (this.data.q > 0) this.show(this.data.q - 1);
  },

  async finish() {
    if (this.answers.filter(Boolean).length < this.data.total) {
      const missing = this.answers.findIndex((a) => !a);
      this.show(missing < 0 ? this.answers.length : missing);
      return;
    }
    if (this.data.mode === 'friend' && !this.nickDone) {
      this.setData({ askNickname: true });
      return;
    }
    this.setData({ sealing: true, askNickname: false });
    const started = Date.now();
    const app = getApp<{ globalData: AppData }>();
    try {
      if (this.data.mode === 'friend') {
        const reply = await submitPair(this.data.code, this.answers, this.data.nickname);
        app.globalData.current = { ...reply.myResult, unlocked: false } as MatchResult & { id: string; unlocked: boolean };
        track('pair_finish', { score: reply.pair.score });
        await wait(1300 - (Date.now() - started));
        wx.redirectTo({ url: `/pages/pair/index?id=${reply.pairId}&fresh=1` });
      } else {
        const res = await submitResult(this.answers);
        app.globalData.current = { ...res, unlocked: false };
        try { wx.removeStorageSync(DRAFT_KEY); } catch (err) { /* ignore */ }
        track('quiz_finish', { guest: res.guest });
        await wait(1300 - (Date.now() - started));
        wx.redirectTo({ url: '/pages/result/index' });
      }
    } catch (err) {
      this.setData({ sealing: false });
      const msg = (err as Error).message;
      wx.showModal({
        title: '信没寄出去',
        content: msg === 'INVITE_NOT_FOUND' ? '这封信的链接已失效，可以请朋友重新转发。' : '网络不太好，请稍后再试一次。',
        showCancel: false,
      });
    }
  },

  onNickname(e: WechatMiniprogram.Input) {
    this.setData({ nickname: String(e.detail.value || '').slice(0, 12) });
  },
  skipNickname() {
    this.nickDone = true;
    this.setData({ nickname: '' });
    this.finish();
  },
  confirmNickname() {
    this.nickDone = true;
    this.finish();
  },
});

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)));
}
