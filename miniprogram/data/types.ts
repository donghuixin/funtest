import type { GuestId } from '../core/scoring';

export interface AxisInfo { id: number; name: string; pos: string; neg: string; gap: string }
export interface Option { text: string; value: number }
export interface Question { place: string; axis: number; text: string; options: Option[] }
export interface Guest {
  name: string; type: string; group: string; color: string; icon: string;
  verdict: string; keywords: string[]; need: string; blind: string; tips: string[];
}
export interface Tier { min: number; name: string; line: string }
export interface Content {
  axes: AxisInfo[];
  poles: string[][];
  questions: Question[];
  guests: Record<GuestId, Guest> | Record<string, Guest>;
  tiers: Tier[];
}
