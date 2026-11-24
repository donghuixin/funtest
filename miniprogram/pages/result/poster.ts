// 用 Canvas 2D 画长图海报：类型 + 判词 + 友情人格维度（雷达 + 百分比条）+ 小程序码
import type { GuestView } from '../../services/content';
import { toDims, drawRadar } from '../../core/dimensions';

const W = 600;
const PAD = 48;
const INK = '#1F3A5F';
const INK_SOFT = '#4A5D78';
const RED = '#C8452D';
const MUTED = '#8A8A8A';
const RULE = '#D9D0C1';
const PAPER = '#FBF8F2';
const WHITE = '#FFFDF8';

export function drawPoster(page: WechatMiniprogram.Page.TrivialInstance, selector: string, g: GuestView, scores: number[], qrPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    page.createSelectorQuery().select(selector).fields({ node: true, size: true }).exec(async (res) => {
      const canvas = res && res[0] && (res[0].node as WechatMiniprogram.Canvas);
      if (!canvas) return reject(new Error('canvas not found'));
      const serif = '"LetterDisplay", "Songti SC", serif';
      const sans = '"PingFang SC", sans-serif';
      const dims = toDims(scores);
      const dpr = 2;

      // 先量判词行数，再定画布高度（改尺寸会重置画布，所以分两步）
      canvas.width = W * dpr;
      canvas.height = 100;
      let ctx = canvas.getContext('2d') as any;
      ctx.font = `28px ${serif}`;
      const verdictLines = splitLines(ctx, g.verdict, W - PAD * 2 - 28);

      const yVerdict = 300;
      const yVerdictEnd = yVerdict + (verdictLines.length - 1) * 44;
      const ySection = yVerdictEnd + 72;
      const radarCy = ySection + 190;
      const radarR = 104;
      const yBars = radarCy + radarR + 92;
      const barRow = 78;
      const yFoot = yBars + barRow * 4 + 12;
      const H = yFoot + 210;

      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx = canvas.getContext('2d') as any;
      ctx.scale(dpr, dpr);

      // 信纸 + 边框 + 航空信斜纹
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = RULE;
      ctx.lineWidth = 1;
      ctx.strokeRect(14, 14, W - 28, H - 28);
      airmail(ctx, 0, 0, W, 8);

      ctx.fillStyle = MUTED;
      ctx.font = `17px ${serif}`;
      ctx.fillText('见字如面。我需要的友情是——', PAD, 64);

      // 邮票
      const sx = PAD, sy = 92, sw = 128, sh = 156;
      ctx.fillStyle = WHITE;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = PAPER;
      for (let x = sx; x <= sx + sw; x += 12) { dot(ctx, x, sy, 4); dot(ctx, x, sy + sh, 4); }
      for (let y = sy; y <= sy + sh; y += 12) { dot(ctx, sx, y, 4); dot(ctx, sx + sw, y, 4); }
      ctx.fillStyle = g.color;
      ctx.fillRect(sx + 10, sy + 10, sw - 20, sh - 20);
      const icon = await loadImage(canvas, `/assets/icons/${g.icon}.png`);
      if (icon) ctx.drawImage(icon, sx + 34, sy + 30, 60, 60);
      ctx.fillStyle = WHITE;
      ctx.font = `bold 14px ${serif}`;
      ctx.textAlign = 'center';
      ctx.fillText(g.type, sx + sw / 2, sy + sh - 24);
      ctx.textAlign = 'left';

      // 类型名、嘉宾、关键词
      const tx = sx + sw + 32;
      ctx.fillStyle = INK;
      ctx.font = `bold 42px ${serif}`;
      ctx.fillText(g.type, tx, 160);
      if (g.displayName) {
        ctx.fillStyle = INK_SOFT;
        ctx.font = `19px ${serif}`;
        ctx.fillText(g.displayName, tx, 200);
      }
      let kx = tx;
      ctx.font = `15px ${sans}`;
      g.keywords.forEach((k) => {
        const w = ctx.measureText(k).width + 20;
        ctx.strokeStyle = g.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(kx, 218, w, 26);
        ctx.fillStyle = g.color;
        ctx.fillText(k, kx + 10, 236);
        kx += w + 8;
      });

      // 判词（左侧朱红竖线）
      ctx.fillStyle = RED;
      ctx.fillRect(PAD, yVerdict - 30, 4, yVerdictEnd - yVerdict + 44);
      ctx.fillStyle = INK;
      ctx.font = `28px ${serif}`;
      verdictLines.forEach((l, i) => ctx.fillText(l, PAD + 24, yVerdict + i * 44));

      // 分节标题
      section(ctx, '我的友情人格维度', ySection, serif);

      // 雷达
      drawRadar(ctx, W / 2, radarCy, radarR, dims, serif);

      // 百分比条
      dims.forEach((d, i) => {
        const y = yBars + i * barRow;
        ctx.font = `bold 16px ${serif}`;
        ctx.fillStyle = INK;
        ctx.fillText(d.name, PAD, y);
        ctx.font = `14px ${sans}`;
        ctx.fillStyle = d.lead === 'mid' ? MUTED : RED;
        ctx.textAlign = 'right';
        ctx.fillText(d.levelText, W - PAD, y);
        ctx.textAlign = 'left';
        const by = y + 12, bw = W - PAD * 2;
        roundRect(ctx, PAD, by, bw, 8, 4, '#E6DED0');
        roundRect(ctx, PAD, by, Math.max(8, (bw * d.posPct) / 100), 8, 4, INK);
        ctx.font = `13px ${sans}`;
        ctx.fillStyle = d.lead === 'pos' ? INK : MUTED;
        ctx.fillText(`${d.posWord} ${d.posPct}%`, PAD, by + 28);
        ctx.fillStyle = d.lead === 'neg' ? INK : MUTED;
        ctx.textAlign = 'right';
        ctx.fillText(`${d.negPct}% ${d.negWord}`, W - PAD, by + 28);
        ctx.textAlign = 'left';
      });

      // 底部：虚线分隔 + 左文字 + 右侧小程序码邮戳
      ctx.strokeStyle = RULE;
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(PAD, yFoot); ctx.lineTo(W - PAD, yFoot); ctx.stroke();
      ctx.setLineDash([]);

      const qcx = W - PAD - 74, qcy = yFoot + 100;
      ctx.fillStyle = WHITE;
      ctx.beginPath(); ctx.arc(qcx, qcy, 74, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(qcx, qcy, 74, 0, Math.PI * 2); ctx.stroke();
      const qr = qrPath ? await loadImage(canvas, qrPath) : null;
      if (qr) {
        ctx.drawImage(qr, qcx - 60, qcy - 60, 120, 120);
      } else {
        ctx.fillStyle = RED;
        ctx.font = `bold 20px ${serif}`;
        ctx.textAlign = 'center';
        ctx.fillText('友情来信', qcx, qcy - 4);
        ctx.font = `15px ${serif}`;
        ctx.fillText('寄给朋友', qcx, qcy + 22);
        ctx.textAlign = 'left';
      }

      ctx.fillStyle = INK;
      ctx.font = `bold 22px ${serif}`;
      ctx.fillText(qr ? '长按识别小程序码' : '微信搜索「友情来信」', PAD, yFoot + 78);
      ctx.fillStyle = INK_SOFT;
      ctx.font = `16px ${sans}`;
      ctx.fillText('测测你需要什么样的友情', PAD, yFoot + 110);
      ctx.fillStyle = RED;
      ctx.font = `15px ${serif}`;
      ctx.fillText('友情来信 · 小程序', PAD, yFoot + 142);
      ctx.fillStyle = '#A8A8A8';
      ctx.font = `12px ${sans}`;
      ctx.fillText('趣味测试 · 非官方出品', PAD, H - 34);

      wx.canvasToTempFilePath({ canvas, success: (r: { tempFilePath: string }) => resolve(r.tempFilePath), fail: reject } as any);
    });
  });
}

function loadImage(canvas: WechatMiniprogram.Canvas, src: string): Promise<any> {
  return new Promise((ok) => {
    const img = canvas.createImage();
    img.onload = () => ok(img.width ? img : null);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

function section(ctx: any, text: string, y: number, font: string) {
  ctx.fillStyle = RED;
  ctx.font = `bold 18px ${font}`;
  ctx.fillText(text, PAD, y);
  const w = ctx.measureText(text).width;
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD + w + 16, y - 6); ctx.lineTo(W - PAD, y - 6); ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = '12px sans-serif';
  ctx.fillText('离中心越远，这一维的倾向越鲜明', PAD, y + 28);
}

function airmail(ctx: any, x: number, y: number, w: number, h: number) {
  const colors = [RED, WHITE, INK, WHITE];
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let i = -2, k = 0; i * 14 < w + 20; i++, k++) {
    ctx.fillStyle = colors[k % 4];
    ctx.beginPath();
    ctx.moveTo(x + i * 14, y + h); ctx.lineTo(x + i * 14 + 14, y + h);
    ctx.lineTo(x + i * 14 + 14 + h, y); ctx.lineTo(x + i * 14 + h, y);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h); ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath(); ctx.fill();
}

function dot(ctx: any, x: number, y: number, r: number) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

function splitLines(ctx: any, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; } else line += ch;
  }
  if (line) lines.push(line);
  return lines;
}
