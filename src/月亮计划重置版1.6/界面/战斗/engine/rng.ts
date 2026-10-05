export interface 随机源 {
  (): number;
}

export const 默认随机源: 随机源 = () => Math.random();

export function 夹取(值: number, 最小: number, 最大: number): number {
  return Math.min(最大, Math.max(最小, 值));
}

/** 硬币正面率 = 50% + 理智值, 理智 -45~45 对应 5%~95% */
export function 正面率(理智值: number): number {
  return 夹取((50 + 理智值) / 100, 0.05, 0.95);
}

export function 掷硬币(概率: number, rng: 随机源 = 默认随机源): boolean {
  return rng() < 概率;
}

export function 随机整数(最小: number, 最大: number, rng: 随机源 = 默认随机源): number {
  if (最大 <= 最小) return 最小;
  return 最小 + Math.floor(rng() * (最大 - 最小 + 1));
}

export function 从数组随机取<T>(数组: T[], rng: 随机源 = 默认随机源): T | undefined {
  if (数组.length === 0) return undefined;
  return 数组[随机整数(0, 数组.length - 1, rng)];
}
