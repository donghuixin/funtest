// 埋点：We 分析自定义事件。事件需先在「小程序后台 → 统计 → 自定义分析」里创建同名事件
export type TrackEvent =
  | 'quiz_start' | 'quiz_finish' | 'quiz_exit'
  | 'unlock_report' | 'share_invite' | 'save_poster'
  | 'invite_open' | 'pair_finish' | 'unlock_pair';

export function track(name: TrackEvent, data: Record<string, string | number> = {}): void {
  try {
    wx.reportEvent(name, data);
  } catch (e) {
    // 基础库过低或事件未配置时忽略
  }
}
