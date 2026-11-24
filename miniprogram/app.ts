import { CLOUD_ENV_ID } from './env';
import { loadConfig } from './services/config';
import type { MatchResult } from './core/scoring';

export interface CurrentResult extends MatchResult { id: string; unlocked: boolean }

export interface AppData {
  current: CurrentResult | null; // 正在查看的个人结果
  pendingInviteCode: string; // 朋友身份答题时的邀请码
  cloudReady: boolean;
}

App<{ globalData: AppData }>({
  globalData: { current: null, pendingInviteCode: '', cloudReady: false },
  onLaunch() {
    if (wx.cloud && CLOUD_ENV_ID.indexOf('请替换') < 0) {
      wx.cloud.init({ env: CLOUD_ENV_ID, traceUser: true });
      this.globalData.cloudReady = true;
    }
    loadConfig();
  },
});
