// 激励视频解锁。流量主未开通（adsEnabled=false）或广告拉取失败时直接解锁，不让用户卡住
import { getConfig } from './config';

let ad: WechatMiniprogram.RewardedVideoAd | null = null;
let adUnit = '';

export function watchAdToUnlock(): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg.adsEnabled || !cfg.rewardedAdUnitId || !wx.createRewardedVideoAd) return Promise.resolve(true);
  if (!ad || adUnit !== cfg.rewardedAdUnitId) {
    ad = wx.createRewardedVideoAd({ adUnitId: cfg.rewardedAdUnitId });
    adUnit = cfg.rewardedAdUnitId;
  }
  const video = ad;
  return new Promise((resolve) => {
    const onClose = (res?: { isEnded: boolean }) => {
      video.offClose(onClose);
      // 中途关闭不解锁；res 为空表示基础库较低，按看完处理
      resolve(!res || res.isEnded);
    };
    video.onClose(onClose);
    video
      .show()
      .catch(() => video.load().then(() => video.show()))
      .catch(() => {
        video.offClose(onClose);
        resolve(true);
      });
  });
}
