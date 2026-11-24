// 云函数封装。未配置云开发时，个人测试走本地计算，方便在开发者工具里直接预览
import { Answer, MatchResult, matchGuest, CompatResult } from '../core/scoring';

interface CloudError { error: string }

function isReady(): boolean {
  return getApp<{ globalData: { cloudReady: boolean } }>().globalData.cloudReady;
}

async function call<T>(name: string, data: Record<string, unknown>): Promise<T> {
  const res = await wx.cloud.callFunction({ name, data });
  const out = res.result as T | CloudError;
  if (out && typeof out === 'object' && 'error' in out) throw new Error((out as CloudError).error);
  return out as T;
}

export async function submitResult(answers: Answer[]): Promise<MatchResult & { id: string }> {
  if (!isReady()) return { id: 'local-' + Date.now(), ...matchGuest(answers) };
  return call('submitResult', { answers });
}

export async function createInvite(resultId: string): Promise<{ code: string }> {
  if (!isReady()) return { code: 'LOCALDEMO' };
  return call('createInvite', { resultId });
}

export interface InviteStatus { valid: boolean; self: boolean; replied: boolean; pairId?: string }
export async function openInvite(code: string): Promise<InviteStatus> {
  if (!isReady()) return { valid: false, self: false, replied: false };
  return call('openInvite', { code });
}

export interface PairReply { myResult: MatchResult & { id: string }; pairId: string; pair: CompatResult }
export async function submitPair(code: string, answers: Answer[], nickname: string): Promise<PairReply> {
  return call('submitPair', { code, answers, nickname });
}

export interface PairSummary { id: string; nickname: string; score: number; tierIndex: number; createdAt: number }
export interface MyRecord extends MatchResult { id: string; unlocked: boolean; createdAt: number; pairs: PairSummary[] }
export async function listMine(): Promise<MyRecord[]> {
  if (!isReady()) return [];
  const out = await call<{ records: MyRecord[] }>('listPairs', {});
  return out.records;
}

export async function getPair(pairId: string): Promise<{ pair: CompatResult; unlocked: boolean; role: 'owner' | 'friend' }> {
  return call('listPairs', { pairId });
}

export async function unlock(kind: 'result' | 'pair', id: string): Promise<void> {
  if (!isReady() || id.indexOf('local-') === 0) return;
  await call('unlock', { kind, id });
}

// envVersion：release 正式版 / trial 体验版 / develop 开发版，扫码进入对应版本
export async function getQrCode(envVersion = 'release'): Promise<string> {
  if (!isReady()) return '';
  const out = await call<{ fileID: string }>('getQrCode', { envVersion });
  if (!out.fileID) return '';
  const dl = await wx.cloud.downloadFile({ fileID: out.fileID });
  return dl.tempFilePath;
}
