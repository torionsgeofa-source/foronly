/**
 * 注意: schema.ts 由 MVU 独立加载, 因此此处的 评级表 / 阶层表 / 计算生命上限 必须自包含。
 * 对外的统一口径 (与生成规则 / 战斗面板一致) 见 `界面/共享/身份战力.ts`, 两者数值必须保持一致。
 */
const 评级表 = (等级: number): string => {
  if (等级 <= 10) return '九阶';
  if (等级 <= 20) return '八阶';
  if (等级 <= 30) return '七阶';
  if (等级 <= 40) return '六阶';
  if (等级 <= 50) return '五阶';
  if (等级 <= 60) return '四阶';
  if (等级 <= 70) return '三阶';
  if (等级 <= 80) return '二阶';
  if (等级 <= 85) return '一阶';
  return '色彩';
};

/** 阶层：决定生命成长曲线（生命值 = 初始生命 + 成长系数 × 等级 + 生命加成）。 */
const 阶层表: Record<string, { 初始: number; 成长: number }> = {
  普通: { 初始: 50, 成长: 5 },
  稀有: { 初始: 200, 成长: 10 },
  史诗: { 初始: 350, 成长: 17 },
  传说: { 初始: 500, 成长: 26 },
  神话: { 初始: 650, 成长: 37 },
};

const 计算生命上限 = (阶层: string, 等级: number, 生命加成: number): number => {
  const 条目 = 阶层表[阶层] ?? 阶层表['普通'];
  return Math.max(1, Math.round(条目.初始 + 条目.成长 * 等级 + 生命加成));
};

const 生命描述 = (数值: number, 上限: number): string => {
  if (数值 <= 0) return '死亡';
  const 比例 = 上限 > 0 ? 数值 / 上限 : 0;
  if (比例 < 0.35) return '身体功能失活（如骨折、断肢等）';
  if (比例 <= 0.5) return '身负重伤';
  if (比例 <= 0.75) return '轻微受损';
  return '健康';
};

/** 技能: 角色档案与战斗单位只保存技能名, 定义与规范效果存于「技能库」插件 */
const 造技能列表 = () =>
  z
    .union([
      z.array(z.string()),
      z.array(z.record(z.string(), z.unknown())),
      z.record(z.string(), z.unknown()),
    ])
    .transform(v => {
      if (Array.isArray(v)) {
        const 名字列表: string[] = [];
        for (const 项 of v) {
          if (typeof 项 === 'string') {
            if (项.trim()) 名字列表.push(项);
          } else if (项 && typeof 项 === 'object') {
            名字列表.push(...Object.keys(项));
          }
        }
        return 名字列表;
      }
      return Object.keys((v ?? {}) as object);
    })
    .prefault([]);

const 造罪孽抗性 = () =>
  z
    .object({
      暴怒: z.coerce.number().prefault(1),
      色欲: z.coerce.number().prefault(1),
      怠惰: z.coerce.number().prefault(1),
      暴食: z.coerce.number().prefault(1),
      忧郁: z.coerce.number().prefault(1),
      傲慢: z.coerce.number().prefault(1),
      嫉妒: z.coerce.number().prefault(1),
    })
    .prefault({});

const 造物理抗性 = () =>
  z
    .object({
      斩击: z.coerce.number().prefault(1),
      突刺: z.coerce.number().prefault(1),
      打击: z.coerce.number().prefault(1),
    })
    .prefault({});

const 造状态效果表 = () =>
  z
    .record(
      z.string().describe('状态名'),
      z
        .object({
          强度: z.coerce.number().prefault(0),
          层数: z.coerce.number().prefault(0),
        })
        .prefault({}),
    )
    .prefault({});

/** 单个装备槽：名称 + 效果文本 */
const 造装备槽 = () =>
  z
    .object({
      名称: z.string().prefault(''),
      效果: z.string().prefault(''),
    })
    .prefault({});

/** 装备槽兼容旧字符串写法（视作 { 名称: 字符串, 效果: '' }） */
const 造装备槽兼容 = () =>
  z
    .union([造装备槽(), z.string().transform(v => ({ 名称: v, 效果: '' }))])
    .prefault({});

const 造穿着装备 = () =>
  z
    .object({
      上衣: 造装备槽兼容(),
      下装: 造装备槽兼容(),
      武器: 造装备槽兼容(),
      防具: 造装备槽兼容(),
      物品: 造装备槽兼容(),
    })
    .prefault({});

/** 装备效果中 生命加成+N 的求和（兼容 +N生命值 / 生命值+N 写法），作为最大生命加成 */
const 求和装备生命加成 = (装备: Record<string, { 效果?: string } | string> | undefined): number => {
  let 总和 = 0;
  for (const 槽 of Object.values(装备 ?? {})) {
    const 文本 = typeof 槽 === 'string' ? '' : (槽?.效果 ?? '');
    if (!文本) continue;
    for (const 匹配 of 文本.matchAll(/生命加成\+(\d+)/g)) 总和 += Number(匹配[1]);
    for (const 匹配 of 文本.matchAll(/\+(\d+)点?生命值/g)) 总和 += Number(匹配[1]);
    for (const 匹配 of 文本.matchAll(/生命值\+(\d+)/g)) 总和 += Number(匹配[1]);
  }
  return 总和;
};

const 造背包 = () =>
  z
    .object({
      钱财_眼: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
      拥有的物品: z
        .record(
          z.string().describe('物品名'),
          z
            .object({
              数量: z.coerce.number().prefault(0),
            })
            .prefault({}),
        )
        .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0))
        .prefault({}),
    })
    .prefault({});

/** 角色档案：主角与全部登场角色共用同一结构（名称/经验也一致）。 */
const 造角色档案 = (名称默认: string) =>
  z
    .object({
      基础信息: z
        .object({
          名称: z.string().prefault(名称默认),
          性别: z.string().prefault('未知'),
          种族: z.string().prefault('人类'),
          身份: z.string().prefault('无'),
          当前称号: z.string().prefault('无'),
          阶层: z.enum(['普通', '稀有', '史诗', '传说', '神话']).prefault('普通'),
          _战力评级: z.string().prefault('未评级'),
          等级: z.coerce.number().transform(v => _.clamp(v, 1, 90)).prefault(1),
          经验: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        })
        .prefault({}),

      生命体征: z
        .object({
          生命值: z
            .object({
              数值: z.coerce.number().prefault(-1),
              上限: z.coerce.number().transform(v => Math.max(1, v)).prefault(50),
              状态描述: z.string().prefault('健康'),
            })
            .prefault({}),
          理智值: z
            .object({
              数值: z.coerce.number().transform(v => _.clamp(v, -45, 45)).prefault(45),
              状态描述: z.string().prefault('稳定'),
            })
            .transform(data => {
              let 状态描述;
              if (data.数值 <= -45) {
                状态描述 = '恐慌';
              } else if (data.数值 < -20) {
                状态描述 = '士气低落';
              } else if (data.数值 < 0) {
                状态描述 = '不稳定';
              } else {
                状态描述 = '稳定';
              }
              return { ...data, 状态描述 };
            })
            .prefault({}),
          混乱: z
            .object({
              数值: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
              阈值: z.coerce.number().transform(v => Math.max(0, v)).prefault(50),
              状态: z.string().prefault('正常'),
            })
            .prefault({}),
          生命加成: z.coerce.number().transform(v => Math.round(v)).prefault(0),
          护盾: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        })
        .prefault({}),

      战斗属性: z
        .object({
          攻击等级: z.coerce.number().prefault(1),
          防御等级: z.coerce.number().prefault(1),
        })
        .prefault({}),

      罪孽抗性: 造罪孽抗性(),
      物理抗性: 造物理抗性(),
      状态效果: 造状态效果表(),
      技能: 造技能列表(),
      穿着装备: 造穿着装备(),
      背包: 造背包(),
    })
    .transform(data => {
      const 等级 = data.基础信息.等级;
      const 生命加成 = 求和装备生命加成(data.穿着装备 as Record<string, { 效果?: string } | string>);
      const 生命上限 = 计算生命上限(data.基础信息.阶层, 等级, 生命加成);
      const 生命数值 = data.生命体征.生命值.数值 < 0 ? 生命上限 : _.clamp(data.生命体征.生命值.数值, 0, 生命上限);
      return {
        ...data,
        基础信息: { ...data.基础信息, _战力评级: 评级表(等级) },
        生命体征: {
          ...data.生命体征,
          生命加成,
          生命值: { 数值: 生命数值, 上限: 生命上限, 状态描述: 生命描述(生命数值, 生命上限) },
        },
        战斗属性: {
          ...data.战斗属性,
          攻击等级: Math.max(1, Math.round(等级)),
          防御等级: Math.max(1, Math.round(等级)),
        },
      };
    })
    .prefault({});

export const Schema = z.object({
  世界状态: z
    .object({
      当前时间: z.string().prefault('都市历 XXX年XX月XX日 XX:XX'),
      当前地点: z.string().prefault('某个巢/某个后巷_具体地点'),
      当前场景: z.string().prefault('未知场景'),
    })
    .prefault({}),

  玩家状态: 造角色档案('{{user}}'),

  角色: z.record(z.string().describe('角色名称'), 造角色档案('')).prefault({}),

  战斗: z
    .object({
      进行中: z.boolean().prefault(false),
      回合: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
      当前行动者: z.string().prefault(''),
      速度顺序: z.array(z.string()).prefault([]),
      日志: z.array(z.string()).prefault([]),
      单位: z
        .record(
          z.string().describe('单位名称'),
           z
             .object({
               阵营: z.string().prefault('敌人'),
               身份: z.string().prefault('未知'),
               _战力评级: z.string().prefault('未评级'),
               /** 生命层级 (阶层): 与 角色档案.基础信息.阶层 同名同序, 供无档案 NPC 派生生命上限 */
               阶层: z.enum(['普通', '稀有', '史诗', '传说', '神话']).prefault('普通'),
               等级: z.coerce.number().transform(v => _.clamp(v, 1, 90)).prefault(1),
               /** 生命值: -1 = 未设置 (战斗面板按满血处理); ≥0 为有效值 (0 = 重伤濒死, 由玩家指令 / 正文 AI 处理) */
               生命值: z.coerce.number().prefault(-1),
               /** 生命上限: 0 = 未设置 (由 阶层 + 等级 或 角色档案 派生) */
               生命上限: z.coerce.number().prefault(0),
              护盾: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
              理智值: z.coerce.number().transform(v => _.clamp(v, -45, 45)).prefault(0),
              混乱值: z.coerce.number().prefault(0),
              混乱阈值: z.coerce.number().prefault(50),
              攻击等级: z.coerce.number().prefault(1),
              防御等级: z.coerce.number().prefault(1),
              罪孽抗性: 造罪孽抗性(),
              物理抗性: 造物理抗性(),
              状态效果: 造状态效果表(),
              技能: 造技能列表(),
            })
            .transform(data => ({
              ...data,
              _战力评级: 评级表(data.等级),
            }))
            .prefault({}),
        )
        .prefault({}),
    })
    .prefault({}),

  交互对象: z
    .record(
      z.string().describe('对象名称'),
      z
        .object({
          身份: z.string().prefault('未知'),
          生理状态: z.string().prefault('健康'),
          好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
          服饰: z.string().prefault('默认服饰'),
          当前行为: z.string().prefault('无'),
          当前状态: z.string().prefault(''),
          核心驱动: z.string().prefault(''),
          语言基调: z.string().prefault(''),
          偏离阈值: z.string().prefault(''),
        })
        .prefault({}),
    )
    .prefault({}),
});

export type Schema = z.output<typeof Schema>;
