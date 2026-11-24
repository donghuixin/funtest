// 远程开关：云数据库 config 集合里 _id 为 "app" 的文档，经 getConfig 云函数读取
export interface RemoteConfig {
  useRealNames: boolean; // false 时只显示友情类型名（审核或投诉时一键切换）
  adsEnabled: boolean; // 流量主开通、广告位建好后再打开
  rewardedAdUnitId: string;
  bannerAdUnitId: string;
  replyTemplateId: string; // 「朋友回信了」订阅消息模板 ID
  fontUrl: string; // 子集化后的标题字体（云存储 https 链接），留空则用系统宋体
}

export const DEFAULT_CONFIG: RemoteConfig = {
  useRealNames: true,
  adsEnabled: false,
  rewardedAdUnitId: '',
  bannerAdUnitId: '',
  replyTemplateId: '',
  fontUrl: '',
};

let current: RemoteConfig = { ...DEFAULT_CONFIG };
let loading: Promise<RemoteConfig> | null = null;

export function getConfig(): RemoteConfig {
  return current;
}

export function loadConfig(): Promise<RemoteConfig> {
  if (loading) return loading;
  const app = getApp<{ globalData: { cloudReady: boolean } }>();
  if (!app || !app.globalData.cloudReady) return Promise.resolve(current);
  loading = wx.cloud
    .callFunction({ name: 'getConfig' })
    .then((res) => {
      current = { ...DEFAULT_CONFIG, ...((res.result as Partial<RemoteConfig>) || {}) };
      if (current.fontUrl) {
        wx.loadFontFace({ family: 'LetterDisplay', source: `url("${current.fontUrl}")`, global: true, scopes: ['webview', 'native'] });
      }
      return current;
    })
    .catch(() => current);
  return loading;
}
