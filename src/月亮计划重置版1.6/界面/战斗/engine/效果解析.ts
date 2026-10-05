import type { 技能效果, 效果目标 } from './types';
import { 自我增益列表, 效果目标列表 } from './types';
import { 合法状态名, 序列化技能效果 } from '../../共享/技能常量';

/** 装备效果：技能效果之外，追加仅装备模式产出的「生命加成」标记（供 schema 求和最大生命） */
export type 装备效果 = 技能效果 | { type: '生命加成'; 数值: number };

/** 解析模式：技能模式不产出「生命加成」且拒绝「生命上限」；装备模式将 +N生命值 视作最大生命 */
type 解析模式 = '技能' | '装备';

/**
 * 引擎可识别的状态白名单 (统一自 `界面/共享/技能常量.ts`, 此处再导出以兼容旧引用)。
 * 汇总自 engine/status.ts (自我增益/层数上限/聚合加成/DoT 触发)
 * 与 世界书 战斗规则 的 状态效果_通用 / 状态效果_DoT。
 */
export { 合法状态名 };

const 合法状态集 = new Set(合法状态名);

/** 统一清洗: 全角数字/符号转半角、半角逗号归一为全角、去除所有空白 */
function 预清洗(文本: string): string {
  return 文本
    .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[＋]/g, '+')
    .replace(/[－ー−–—]/g, '-')
    .replace(/[％]/g, '%')
    .replace(/[：]/g, ':')
    .replace(/,/g, '，')
    .replace(/\s+/g, '');
}

/** 按 ; ； 。 \n 切分多条效果 */
function 切分(文本: string): string[] {
  return 文本
    .split(/[；;。\n\r]+/)
    .map(段 => 段.trim())
    .filter(Boolean);
}

const 合法目标集 = new Set<string>(效果目标列表);

function 取合法目标(原始: unknown, 默认: 效果目标): 效果目标 {
  return 合法目标集.has(String(原始)) ? (原始 as 效果目标) : 默认;
}

/** 状态默认落点: 自我增益落来源, 其余落敌人 */
function 状态默认目标(状态: string): 效果目标 {
  return 自我增益列表.includes(状态) ? '自己' : '敌人';
}

function 构造施加状态(状态: string, 层数: number, 强度: number | undefined, 修复: string[], 原文: string, 指定目标?: 效果目标): 技能效果 {
  if (!合法状态集.has(状态)) {
    修复.push(`未知状态名「${状态}」将被引擎忽略（来自「${原文}」）`);
  }
  return { type: '施加状态', 目标: 指定目标 ?? 状态默认目标(状态), 状态, 层数, 强度: 强度 ?? 0 };
}

/** 解析单个片段; 无法识别时记录 修复 并返回 null */
function 解析片段(原文: string, 修复: string[], 模式: 解析模式 = '技能'): 装备效果 | null {
  let 文本 = 预清洗(原文);
  if (!文本) return null;

  // 提取「对<目标>」前缀; 未指定时由状态 / 正负号推断默认落点
  let 指定目标: 效果目标 | undefined;
  const 目标匹配 = 文本.match(/^对(敌人|自己|随机盟友|全体盟友|全体敌人)(.+)$/);
  if (目标匹配) {
    指定目标 = 目标匹配[1] as 效果目标;
    文本 = 目标匹配[2];
  }

  // 装备模式: 最大生命的固定加成, 与技能的治疗 / 护盾区分
  if (模式 === '装备') {
    let 生 = 文本.match(/^(?:生命加成|生命上限)\+(\d+)$/);
    if (生) return { type: '生命加成', 数值: Number(生[1]) };
    生 = 文本.match(/^\+(\d+)点?生命值$/);
    if (生) return { type: '生命加成', 数值: Number(生[1]) };
    生 = 文本.match(/^生命值\+(\d+)$/);
    if (生) return { type: '生命加成', 数值: Number(生[1]) };
  }

  // 战斗中不修改生命上限: 含「生命上限」的写法一律按无法识别片段处理, 不生成任何效果。
  if (文本.includes('生命上限')) {
    修复.push(`无法识别的效果片段「${原文}」`);
    return null;
  }

  // 条件增伤: 当<条件>时伤害+<N>% (兼容「造成伤害」「增加」)
  let 匹配 = 文本.match(/^当(.+?)时(?:造成)?伤害(?:增加|\+)(\d+)%$/);
  if (匹配) return { type: '条件增伤', 条件: 匹配[1], 数值: Number(匹配[2]) };

  // 震颤引爆
  if (文本 === '震颤引爆') return { type: '震颤引爆', 目标: 指定目标 ?? '敌人' };

  // 护盾 · 规范: 获得N点护盾 / 获得护盾N
  匹配 = 文本.match(/^(?:获得(\d+)点?护盾|获得护盾(\d+))$/);
  if (匹配) return { type: '获得护盾', 目标: 指定目标 ?? '自己', 数值: Number(匹配[1] ?? 匹配[2]) };

  // 容错: 施加N层护盾 → 获得 N×10 点护盾 (每层 10 点)
  匹配 = 文本.match(/^施加(\d+)层护盾$/);
  if (匹配) {
    const 点数 = Number(匹配[1]) * 10;
    修复.push(`「${原文}」→ 获得护盾${点数} (每层 10 点)`);
    return { type: '获得护盾', 目标: 指定目标 ?? '自己', 数值: 点数 };
  }

  // 数值: 恢复/失去 N 点 生命 / SP
  匹配 = 文本.match(/^(恢复|失去)(\d+)点?(生命|SP)$/i);
  if (匹配) {
    const 变化 = Number(匹配[2]) * (匹配[1] === '恢复' ? 1 : -1);
    const 目标 = 指定目标 ?? (匹配[1] === '恢复' ? '自己' : '敌人');
    if (匹配[3].toUpperCase() === 'SP') return { type: '调整数值', 目标, SP: 变化 };
    return { type: '调整数值', 目标, 生命: 变化 };
  }

  // 施加状态 · 数字在前: 施加N层状态[，强度M]
  匹配 = 文本.match(/^施加(\d+)层(.+?)(?:，?强度(\d+))?$/);
  if (匹配) return 构造施加状态(匹配[2], Number(匹配[1]), 匹配[3] ? Number(匹配[3]) : undefined, 修复, 原文, 指定目标);

  // 施加状态 · 状态在前 (容错): 施加状态N层[，强度M]
  匹配 = 文本.match(/^施加(.+?)(\d+)层(?:，?强度(\d+))?$/);
  if (匹配) return 构造施加状态(匹配[1], Number(匹配[2]), 匹配[3] ? Number(匹配[3]) : undefined, 修复, 原文, 指定目标);

  // 容错: 速度±N → 迅捷 / 束缚
  匹配 = 文本.match(/^速度([+-])(\d+)$/);
  if (匹配) {
    const 状态 = 匹配[1] === '+' ? '迅捷' : '束缚';
    修复.push(`「${原文}」→ 施加${匹配[2]}层${状态}`);
    return { type: '施加状态', 目标: 指定目标 ?? (匹配[1] === '+' ? '自己' : '敌人'), 状态, 层数: Number(匹配[2]), 强度: 0 };
  }

  // 容错: 攻击等级±N → 攻击等级提升 / 降低
  匹配 = 文本.match(/^攻击等级([+-])(\d+)$/);
  if (匹配) {
    const 状态 = 匹配[1] === '+' ? '攻击等级提升' : '攻击等级降低';
    修复.push(`「${原文}」→ 施加${匹配[2]}层${状态}`);
    return { type: '施加状态', 目标: 指定目标 ?? (匹配[1] === '+' ? '自己' : '敌人'), 状态, 层数: Number(匹配[2]), 强度: 0 };
  }

  // 容错: 防御等级±N → 防御等级提升 / 降低
  匹配 = 文本.match(/^防御等级([+-])(\d+)$/);
  if (匹配) {
    const 状态 = 匹配[1] === '+' ? '防御等级提升' : '防御等级降低';
    修复.push(`「${原文}」→ 施加${匹配[2]}层${状态}`);
    return { type: '施加状态', 目标: 指定目标 ?? (匹配[1] === '+' ? '自己' : '敌人'), 状态, 层数: Number(匹配[2]), 强度: 0 };
  }

  修复.push(`无法识别的效果片段「${原文}」`);
  return null;
}

/** 将单条结构化效果转回规范语句 (统一自 `界面/共享/技能常量.ts`, 再导出以兼容旧引用) */
export { 序列化技能效果 as 序列化效果 };

/** 将单条结构化效果 (含装备独有) 转回规范语句 */
function 序列化单条(效果: 装备效果): string {
  if (效果.type === '生命加成') return `生命加成+${效果.数值}`;
  return 序列化技能效果(效果);
}

/** 解析一段 (可含多条) 技能效果文本为结构化效果；无法识别的片段记入 修复, 不抛错 */
export function 解析效果(文本: string): { 效果: 技能效果[]; 修复: string[] } {
  const 修复: string[] = [];
  const 效果: 技能效果[] = [];
  for (const 段 of 切分(文本)) {
    const 单条 = 解析片段(段, 修复, '技能');
    if (单条 && 单条.type !== '生命加成') 效果.push(单条);
  }
  return { 效果, 修复 };
}

/** 解析一段装备效果文本为结构化效果；+N生命值 类片段产出「生命加成」标记 */
export function 解析装备效果(文本: string): { 效果: 装备效果[]; 修复: string[] } {
  const 修复: string[] = [];
  const 效果: 装备效果[] = [];
  for (const 段 of 切分(文本)) {
    const 单条 = 解析片段(段, 修复, '装备');
    if (单条) 效果.push(单条);
  }
  return { 效果, 修复 };
}

/** 将技能效果文本改写为规范语句; 多条用 ； 连接, 无法识别的片段原样保留 */
export function 规范化效果(文本: string): string {
  const 结果: string[] = [];
  for (const 段 of 切分(文本)) {
    const 单条 = 解析片段(段, [], '技能');
    结果.push(单条 && 单条.type !== '生命加成' ? 序列化技能效果(单条) : 段);
  }
  return 结果.join('；');
}

/** 将装备效果文本改写为规范语句：+N生命值 / 生命值+N / +N点生命值 → 生命加成+N */
export function 规范化装备效果(文本: string): string {
  const 结果: string[] = [];
  for (const 段 of 切分(文本)) {
    const 单条 = 解析片段(段, [], '装备');
    结果.push(单条 ? 序列化单条(单条) : 段);
  }
  return 结果.join('；');
}

function 可选数(值: unknown): number | undefined {
  const 数 = Number(值);
  return Number.isFinite(数) ? 数 : undefined;
}

/**
 * 将任意旧 / 新结构的效果规范化为统一 技能效果。
 * 兼容旧版 `{ type:'调整数值', 数值:{ 生命/SP } }` 与缺少 `目标` 的效果。
 * 无法识别时返回 null (调用方跳过)。
 */
/** 提取可选 条件 (去空白; 空串视为无条件) */
function 可选条件(对象: Record<string, unknown>): string | undefined {
  const 条件 = 对象.条件;
  if (typeof 条件 !== 'string') return undefined;
  const 值 = 条件.trim();
  return 值 ? 值 : undefined;
}

export function 规范化技能效果(原始: unknown): 技能效果 | null {
  if (!原始 || typeof 原始 !== 'object') return null;
  const 对象 = 原始 as Record<string, unknown>;
  const type = 对象.type;
  const 条件 = 可选条件(对象);

  if (type === '施加状态') {
    const 状态 = String(对象.状态 ?? '');
    if (!状态) return null;
    return {
      type: '施加状态',
      目标: 取合法目标(对象.目标, 状态默认目标(状态)),
      状态,
      层数: 可选数(对象.层数) ?? 1,
      强度: 可选数(对象.强度) ?? 0,
      ...(条件 ? { 条件 } : {}),
    };
  }

  if (type === '调整数值') {
    const 旧数值 = 对象.数值 && typeof 对象.数值 === 'object' ? (对象.数值 as Record<string, unknown>) : 对象;
    const 生命 = 可选数(旧数值.生命);
    const SP = 可选数(旧数值.SP);
    if (生命 !== undefined || SP !== undefined) {
      const 默认: 效果目标 = (生命 ?? 0) >= 0 && (SP ?? 0) >= 0 ? '自己' : '敌人';
      return { type: '调整数值', 目标: 取合法目标(对象.目标, 默认), 生命, SP, ...(条件 ? { 条件 } : {}) };
    }
    // 旧结构可能以 攻击等级 / 防御等级 表示数值增益, 转为对应的提升 / 降低状态
    const 攻击等级 = 可选数(旧数值.攻击等级);
    const 防御等级 = 可选数(旧数值.防御等级);
    if (攻击等级 !== undefined) {
      return {
        type: '施加状态',
        目标: 取合法目标(对象.目标, 攻击等级 >= 0 ? '自己' : '敌人'),
        状态: 攻击等级 >= 0 ? '攻击等级提升' : '攻击等级降低',
        层数: Math.abs(攻击等级),
        强度: 0,
        ...(条件 ? { 条件 } : {}),
      };
    }
    if (防御等级 !== undefined) {
      return {
        type: '施加状态',
        目标: 取合法目标(对象.目标, 防御等级 >= 0 ? '自己' : '敌人'),
        状态: 防御等级 >= 0 ? '防御等级提升' : '防御等级降低',
        层数: Math.abs(防御等级),
        强度: 0,
        ...(条件 ? { 条件 } : {}),
      };
    }
    return null;
  }

  if (type === '震颤引爆') return { type: '震颤引爆', 目标: 取合法目标(对象.目标, '敌人'), ...(条件 ? { 条件 } : {}) };

  if (type === '获得护盾') {
    const 数值 = 可选数(对象.数值);
    if (数值 === undefined) return null;
    return { type: '获得护盾', 目标: 取合法目标(对象.目标, '自己'), 数值, ...(条件 ? { 条件 } : {}) };
  }

  if (type === '条件增伤') {
    return { type: '条件增伤', 条件: String(对象.条件 ?? ''), 数值: 可选数(对象.数值) ?? 0 };
  }

  return null;
}

/** 批量规范化效果列表; 丢弃无法识别的条目 */
export function 规范化效果列表(列表: unknown): 技能效果[] {
  if (!Array.isArray(列表)) return [];
  const 结果: 技能效果[] = [];
  for (const 项 of 列表) {
    const 效果 = 规范化技能效果(项);
    if (效果) 结果.push(效果);
  }
  return 结果;
}
