// 「朋友回信了」订阅消息：转发前请求一次性订阅授权
import { getConfig } from './config';

export function askReplyNotice(): Promise<void> {
  const tmpl = getConfig().replyTemplateId;
  if (!tmpl) return Promise.resolve();
  return new Promise((resolve) => {
    wx.requestSubscribeMessage({ tmplIds: [tmpl], complete: () => resolve() } as WechatMiniprogram.RequestSubscribeMessageOption);
  });
}
