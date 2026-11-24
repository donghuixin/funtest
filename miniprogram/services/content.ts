// 文案读取：按远程开关决定是否显示嘉宾真名
import CONTENT from '../data/content';
import type { Guest } from '../data/types';
import { getConfig } from './config';

export { CONTENT };

export interface GuestView extends Guest { id: string; displayName: string }

export function guestView(id: string): GuestView {
  const g = (CONTENT.guests as Record<string, Guest>)[id];
  const real = getConfig().useRealNames;
  return { ...g, id, displayName: real ? `${g.name} · ${g.group}` : '' };
}

export function nameOf(id: string): string {
  const g = (CONTENT.guests as Record<string, Guest>)[id];
  return getConfig().useRealNames ? g.name : g.type;
}
