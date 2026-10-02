import type { Schema as MvuSchema } from '../../schema';
import type { 技能, 技能效果, 战斗单位, 状态效果, 技能时机 } from './engine/types';
import { 从模板生成单位, 技能记录转技能, 查找模板, 附加人格技能 } from './engine/units';
import { 解析效果, 解析装备效果 } from './engine/效果解析';
import { 存活 } from './engine/battle';
import { 战力评级 } from './engine/level';

type 罪孽对象 = { 暴怒: number; 色欲: number; 怠惰: number; 暴食: number; 忧郁: number; 傲慢: number; 嫉妒: number };
type 物理抗性对象 = { 斩击: number; 突刺: number; 打击: number };

function 罪孽写回(来源: Record<string, number>): 罪孽对象 {
  return {
    暴怒: 来源.暴怒 ?? 0,
    色欲: 来源.色欲 ?? 0,
    怠惰: 来源.怠惰 ?? 0,
    暴食: 来源.暴食 ?? 0,
    忧郁: 来源.忧郁 ?? 0,
    傲慢: 来源.傲慢 ?? 0,
    嫉妒: 来源.嫉妒 ?? 0,
  };
}

function 物理抗性写回(来源: Record<string, number>): 物理抗性对象 {
  return {
    斩击: 来源.斩击 ?? 1,
    突刺: 来源.突刺 ?? 1,
    打击: 来源.打击 ?? 1,
  };
}

function 复制状态(状态: Record<string, 状态效果>): Record<string, 状态效果> {
  const 结果: Record<string, 状态效果> = {};
  for (const [名称, 值] of Object.entries(状态)) {
    if (值.强度 > 0 || 值.层数 > 0) 结果[名称] = { 强度: 值.强度, 层数: 值.层数 };
  }
  return 结果;
}

function 技能写回(技能表: Record<string, 技能>) {
  return Object.fromEntries(
    Object.entries(技能表).map(([名称, 技能]) => [
      名称,
      {
        罪孽: 技能.罪孽,
        攻击类型: 技能.攻击类型,
        基础威力: 技能.基础威力,
        硬币威力: [...技能.硬币威力],
        攻击等级修正: 技能.攻击等级修正,
        攻击容量: 技能.攻击容量,
        效果: 技能.效果,
        类别: 技能.类别,
        时机: 技能.时机 ?? '',
        条件: 技能.条件 ?? '',
        守备类型: 技能.守备类型 ?? '',
        SP消耗: 技能.SP消耗 ?? 0,
      },
    ]),
  );
}

type 角色档案 = MvuSchema['玩家状态'];

const 合法时机集 = new Set<string>(['战斗开始时', '回合开始时', '回合结束时', '命中时', '受击时', '击杀时', '常驻']);

/** 将玩家自制的 被动 / 支援 技能效果文本解析为可结算模板, 追加到单位 (不与人格模板重名) */
function 附加自定义被动支援(单位: 战斗单位): void {
  for (const 技能 of Object.values(单位.技能)) {
    if (技能.类别 !== '被动' && 技能.类别 !== '支援') continue;
    const { 效果 } = 解析效果(技能.效果);
    if (效果.length === 0) continue;
    const 时机: 技能时机 = 技能.时机 && 合法时机集.has(技能.时机) ? 技能.时机 : '回合开始时';
    const 条件 = 技能.条件 && 技能.条件.trim() ? 技能.条件 : undefined;
    const 模板 = { 名称: 技能.名称, 时机, 条件, 效果, 说明: 技能.效果 };
    if (技能.类别 === '被动') {
      if (单位.被动技能.some(项 => 项.名称 === 技能.名称)) continue;
      单位.被动技能.push(模板);
    } else {
      if (单位.支援技能.some(项 => 项.名称 === 技能.名称)) continue;
      单位.支援技能.push(模板);
    }
  }
}

/** 读取单个装备槽的效果文本 (兼容旧字符串写法) */
function 装备槽效果文本(槽: unknown): string {
  if (typeof 槽 === 'string') return '';
  if (槽 && typeof 槽 === 'object' && '效果' in 槽) return String((槽 as { 效果?: unknown }).效果 ?? '');
  return '';
}

/**
 * 将装备效果中的状态类 / 护盾类效果作为「战斗开始时」的持久被动应用到单位。
 * 生命加成+N 已由 schema 并入生命上限, 引擎不重复处理。
 */
function 附加装备效果(单位: 战斗单位, 档案: 角色档案): void {
  const 效果: 技能效果[] = [];
  for (const 槽 of Object.values(档案.穿着装备 ?? {})) {
    const 文本 = 装备槽效果文本(槽);
    if (!文本) continue;
    for (const 项 of 解析装备效果(文本).效果) {
      if (项.type !== '生命加成') 效果.push(项);
    }
  }
  if (效果.length === 0) return;
  if (单位.被动技能.some(技能 => 技能.名称 === '装备效果')) return;
  单位.被动技能.push({ 名称: '装备效果', 时机: '战斗开始时', 效果, 说明: '装备赋予的持久效果' });
}

/** 由一份完整角色档案(玩家/角色通用结构)构造战斗单位。 */
export function 档案转单位(档案: 角色档案, 名称: string, 阵营: 战斗单位['阵营']): 战斗单位 {
  const 单位: 战斗单位 = {
    名称: 名称 || 档案.基础信息.名称 || '角色',
    阵营,
    身份: 档案.基础信息.身份,
    等级: 档案.基础信息.等级,
    生命值: 档案.生命体征.生命值.数值,
    生命上限: 档案.生命体征.生命值.上限,
    护盾: 档案.生命体征.护盾,
    理智值: 档案.生命体征.理智值.数值,
    混乱值: 档案.生命体征.混乱.数值,
    混乱阈值: 档案.生命体征.混乱.阈值,
    攻击等级: 档案.战斗属性.攻击等级,
    防御等级: 档案.战斗属性.防御等级,
    本回合速度: 5,
    罪孽抗性: { ...档案.罪孽抗性 },
    物理抗性: { ...档案.物理抗性 },
    状态效果: 复制状态(档案.状态效果),
    技能: 技能记录转技能(档案.技能),
    被动技能: [],
    支援技能: [],
    是否玩家: false,
    已选技能: null,
    已选目标: [],
    已行动: false,
    恐慌状态: '无',
  };
  if (Object.keys(单位.技能).length === 0) {
    单位.技能 = 从模板生成单位(查找模板(单位.身份), 单位.名称, 阵营).技能;
  }
  附加人格技能(单位);
  附加自定义被动支援(单位);
  附加装备效果(单位, 档案);
  return 单位;
}

/** 用当前战斗状态(生命/理智/混乱/状态效果)覆盖档案构造出的单位。 */
function 应用战斗状态(单位: 战斗单位, 记录: MvuSchema['战斗']['单位'][string]): void {
  const 生命 = Number(记录.生命值);
  if (Number.isFinite(生命) && 生命 >= 0 && 生命 <= 单位.生命上限) 单位.生命值 = 生命;
  const 理智 = Number(记录.理智值);
  if (Number.isFinite(理智)) 单位.理智值 = Math.max(-45, Math.min(45, 理智));
  const 混乱 = Number(记录.混乱值);
  if (Number.isFinite(混乱) && 混乱 >= 0) 单位.混乱值 = 混乱;
  const 阈值 = Number(记录.混乱阈值);
  if (Number.isFinite(阈值) && 阈值 > 0) 单位.混乱阈值 = 阈值;
  const 护盾 = Number(记录.护盾);
  if (Number.isFinite(护盾) && 护盾 >= 0) 单位.护盾 = 护盾;
  if (记录.状态效果 && Object.keys(记录.状态效果).length > 0) 单位.状态效果 = 复制状态(记录.状态效果);
}

export function 玩家单位(data: MvuSchema): 战斗单位 {
  const 单位 = 档案转单位(data.玩家状态, data.玩家状态.基础信息.名称 || '玩家', '玩家');
  单位.是否玩家 = true;
  return 单位;
}

export function 变量单位(名称: string, 记录: MvuSchema['战斗']['单位'][string], 档案?: 角色档案): 战斗单位 {
  const 阵营 = (记录.阵营 === '玩家' || 记录.阵营 === '盟友' ? 记录.阵营 : '敌人') as 战斗单位['阵营'];
  if (档案) {
    const 单位 = 档案转单位(档案, 名称, 阵营);
    应用战斗状态(单位, 记录);
    return 单位;
  }
  const 单位: 战斗单位 = {
    名称,
    阵营,
    身份: 记录.身份,
    等级: 记录.等级,
    生命值: 记录.生命值,
    生命上限: 记录.生命上限,
    护盾: 记录.护盾,
    理智值: 记录.理智值,
    混乱值: 记录.混乱值,
    混乱阈值: 记录.混乱阈值,
    攻击等级: 记录.攻击等级,
    防御等级: 记录.防御等级,
    本回合速度: 5,
    罪孽抗性: { ...记录.罪孽抗性 },
    物理抗性: { ...记录.物理抗性 },
    状态效果: 复制状态(记录.状态效果),
    技能: 技能记录转技能(记录.技能),
    被动技能: [],
    支援技能: [],
    是否玩家: false,
    已选技能: null,
    已选目标: [],
    已行动: false,
    恐慌状态: '无',
  };
  const 模板 = 查找模板(单位.身份);
  if (Object.keys(单位.技能).length === 0) {
    const 补全 = 从模板生成单位(模板, 名称, 单位.阵营);
    单位.技能 = 补全.技能;
  }
  附加人格技能(单位);
  return 单位;
}

export function 构建全部单位(data: MvuSchema): 战斗单位[] {
  const 单位: 战斗单位[] = [玩家单位(data)];
  for (const [名称, 记录] of Object.entries(data.战斗.单位)) {
    const 档案 = data.角色?.[名称];
    单位.push(变量单位(名称, 记录, 档案));
  }
  return 单位;
}

export function 写回玩家(data: MvuSchema, 单位: 战斗单位): void {
  const 玩家 = data.玩家状态;
  玩家.生命体征.生命值.数值 = Math.max(0, Math.round(单位.生命值));
  玩家.生命体征.理智值.数值 = Math.max(-45, Math.min(45, Math.round(单位.理智值)));
  玩家.生命体征.混乱.数值 = Math.max(0, Math.round(单位.混乱值));
  玩家.生命体征.混乱.阈值 = Math.max(0, Math.round(单位.混乱阈值));
  玩家.生命体征.护盾 = Math.max(0, Math.round(单位.护盾));
  // 攻击等级/防御等级由 schema 按「等级」派生, 速度由公式实时计算, 均不写回
  玩家.状态效果 = 复制状态(单位.状态效果);
}

export function 写回单位(data: MvuSchema, 单位: 战斗单位): void {
  data.战斗.单位[单位.名称] = {
    阵营: 单位.阵营,
    身份: 单位.身份,
    _战力评级: 战力评级(Math.round(单位.等级)),
    等级: Math.round(单位.等级),
    生命值: Math.max(0, Math.round(单位.生命值)),
    生命上限: Math.max(1, Math.round(单位.生命上限)),
    护盾: Math.max(0, Math.round(单位.护盾)),
    理智值: Math.max(-45, Math.min(45, Math.round(单位.理智值))),
     混乱值: Math.max(0, Math.round(单位.混乱值)),
     混乱阈值: Math.max(0, Math.round(单位.混乱阈值)),
    攻击等级: 单位.基础属性?.攻击等级 ?? 单位.攻击等级,
    防御等级: 单位.基础属性?.防御等级 ?? 单位.防御等级,
    罪孽抗性: 罪孽写回(单位.罪孽抗性),
    物理抗性: 物理抗性写回(单位.物理抗性),
    状态效果: 复制状态(单位.状态效果),
    技能: 技能写回(单位.技能) as MvuSchema['战斗']['单位'][string]['技能'],
  };
}

/**
 * 战斗结束 (进行中 === false) 时, 清除所有参战单位的一切战斗效果:
 * 状态效果 (buff / debuff / DoT) 与 护盾, 并同步清空持久层中玩家与各参战角色的对应字段。
 */
function 清零战斗效果(data: MvuSchema, 单位: 战斗单位[]): void {
  for (const u of 单位) {
    u.状态效果 = {};
    u.护盾 = 0;
    if (u.是否玩家) {
      data.玩家状态.状态效果 = {};
      data.玩家状态.生命体征.护盾 = 0;
      continue;
    }
    const 档案 = data.角色[u.名称];
    if (档案) {
      档案.状态效果 = {};
      档案.生命体征.护盾 = 0;
    }
  }
}

export function 写回战斗(data: MvuSchema, 单位: 战斗单位[], 回合: number, 速度顺序: string[], 当前行动者: string, 日志: string[], 进行中: boolean): void {
  if (!进行中) 清零战斗效果(data, 单位);
  for (const u of 单位) {
    if (u.是否玩家) 写回玩家(data, u);
    else 写回单位(data, u);
  }
  data.战斗.回合 = 回合;
  data.战斗.速度顺序 = [...速度顺序];
  data.战斗.当前行动者 = 当前行动者;
  data.战斗.日志 = 日志.slice(-40);
  data.战斗.进行中 = 进行中;
}

export function 生成回合摘要(回合: number, 单位: 战斗单位[], 日志: string[], 结束: string | null): string {
  const 存活单位 = 单位.filter(存活);
  const 玩家 = 单位.find(u => u.是否玩家);
  const 状态行 = 存活单位
    .map(u => `${u.名称}: HP ${Math.round(u.生命值)}/${u.生命上限} SP ${Math.round(u.理智值)}`)
    .join(' | ');
  const 结尾 = 结束 ? `\n战斗结果: ${结束}` : '';
  const 玩家行 = 玩家 ? `\n玩家: ${玩家.名称} HP ${Math.round(玩家.生命值)}/${玩家.生命上限} SP ${Math.round(玩家.理智值)}` : '';
  return [
    `<战斗结算 第${回合}回合>`,
    日志.slice(-12).map(行 => `- ${行}`).join('\n'),
    `存活: ${状态行 || '无'}${玩家行}${结尾}`,
    '</战斗结算>',
  ].join('\n');
}
