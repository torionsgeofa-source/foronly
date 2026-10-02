export type 罪孽名 = '暴怒' | '色欲' | '怠惰' | '暴食' | '忧郁' | '傲慢' | '嫉妒';
export type 攻击类型名 = '斩击' | '突刺' | '打击';
export type 硬币类型 = '普通' | '不可摧毁' | '截除' | '无我';
export type 阵营名 = '玩家' | '盟友' | '敌人';
export type 技能类别 = '攻击' | '守备' | 'EGO';
export type 守备类型名 = '闪避' | '防御' | '强化防御' | '反击' | '强化反击';

export const 罪孽列表: 罪孽名[] = ['暴怒', '色欲', '怠惰', '暴食', '忧郁', '傲慢', '嫉妒'];
export const 攻击类型列表: 攻击类型名[] = ['斩击', '突刺', '打击'];
export const 硬币类型列表: 硬币类型[] = ['普通', '不可摧毁', '截除', '无我'];
export const 守备类型列表: 守备类型名[] = ['闪避', '防御', '强化防御', '反击', '强化反击'];
/** 可参与拼点、胜利后不造成伤害而是规避/格挡的守备类型 */
export const 可拼点守备列表: 守备类型名[] = ['闪避', '防御', '强化防御'];

export const 罪孽颜色: Record<罪孽名, string> = {
  暴怒: '#e04b3a',
  色欲: '#e05297',
  怠惰: '#e0a53a',
  暴食: '#4fb04f',
  忧郁: '#3aa0e0',
  傲慢: '#8a5de0',
  嫉妒: '#e0d23a',
};

export const 攻击类型颜色: Record<攻击类型名, string> = {
  斩击: '#d8d8d8',
  突刺: '#7fd4a0',
  打击: '#e0b06a',
};

export interface 硬币 {
  id: number;
  威力: number;
  类型: 硬币类型;
  正面: boolean;
  /** 被拼点击碎后不再计算, 也无法继续攻击 */
  已摧毁: boolean;
  /** 不可摧毁硬币失败后转为破裂: 威力固定为 1 */
  已破碎: boolean;
}

/** 结构化数值调整 (直接作用于单位字段并夹取范围) */
export interface 数值调整 {
  生命?: number;
  SP?: number;
  攻击等级?: number;
  防御等级?: number;
  速度?: number;
}

export type 技能效果 =
  | { type: '施加状态'; 状态: string; 强度?: number; 层数?: number }
  | { type: '调整数值'; 数值: 数值调整 }
  | { type: '震颤引爆' }
  | { type: '条件增伤'; 条件: string; 数值: number };

export interface 技能 {
  名称: string;
  /** 战斗技能槽位: 1/2/3/守备; 由标准模板派生 */
  槽位?: 技能槽位;
  罪孽: 罪孽名;
  攻击类型: 攻击类型名;
  基础威力: number;
  /** 由 硬币 派生的硬币威力 / 类型, 保留以兼容旧逻辑 */
  硬币威力: number[];
  硬币类型: 硬币类型[];
  /** 每枚硬币的详细定义 (含各自命中效果) */
  硬币?: 战斗技能硬币[];
  攻击等级修正: number;
  攻击容量: number;
  效果: string;
  类别: 技能类别;
  /** 仅守备技能拥有; 决定拼点使用防御/攻击等级以及胜利后的结算方式 */
  守备类型?: 守备类型名;
  /** E.G.O 理智消耗 (未填写时默认 10) */
  SP消耗?: number;
  /** 结构化技能效果; 有值时优先于字符串 效果 */
  effects?: 技能效果[];
}

/** 战斗技能槽位 (边狱公司: 1/2/3 号技能与守备技能) */
export type 技能槽位 = 1 | 2 | 3 | '守备';

/** 标准战斗技能模板中的单枚硬币 */
export interface 战斗技能硬币 {
  威力: number;
  类型: 硬币类型;
  /** 该枚硬币命中时结算的效果 (独立于其他硬币) */
  命中效果?: 技能效果[];
}

/** 标准战斗技能 (拼点技能) 模板 */
export interface 战斗技能模板 {
  名称: string;
  槽位: 技能槽位;
  类别: 技能类别;
  守备类型?: 守备类型名;
  罪孽: 罪孽名;
  攻击类型: 攻击类型名;
  基础威力: number;
  硬币: 战斗技能硬币[];
  攻击等级修正: number;
  攻击容量: number;
  SP消耗?: number;
  /** 供 UI 展示的简短说明 (可选) */
  效果?: string;
}

/** 被动 / 支援技能的触发时机 */
export type 技能时机 = '战斗开始时' | '回合开始时' | '回合结束时' | '命中时' | '受击时' | '击杀时' | '常驻';

/** 被动技能模板 (只对自己生效) */
export interface 被动技能模板 {
  名称: string;
  时机: 技能时机;
  条件?: string;
  效果: 技能效果[];
  说明?: string;
}

/** 支援技能模板 (对自己 + 所有战斗中友方生效) */
export interface 支援技能模板 {
  名称: string;
  时机: 技能时机;
  条件?: string;
  效果: 技能效果[];
  说明?: string;
}

export interface 速度区间 {
  最小: number;
  最大: number;
}

export type 恐慌状态 = '无' | '待生效' | '生效中';

export interface 状态效果 {
  强度: number;
  层数: number;
}

/** 单位生成时的基础属性快照, 供常驻光环每回合重算 (幂等) 使用 */
export interface 基础属性 {
  攻击等级: number;
  防御等级: number;
  速度: number;
}

export interface 战斗单位 {
  名称: string;
  阵营: 阵营名;
  身份: string;
  等级: number;
  生命值: number;
  生命上限: number;
  理智值: number;
  混乱值: number;
  混乱阈值: number;
  攻击等级: number;
  防御等级: number;
  速度: number;
  /** 每回合在区间内掷速度; 省略时使用固定速度 */
  速度区间?: 速度区间;
  /** 本回合实际掷出的速度 (未掷时等于固定速度) */
  本回合速度: number;
  罪孽抗性: Record<string, number>;
  物理抗性: Record<string, number>;
  状态效果: Record<string, 状态效果>;
  技能: Record<string, 技能>;
  /** 战斗被动 (只对自己生效) */
  被动技能: 被动技能模板[];
  /** 支援被动 (对自己 + 所有战斗中友方生效) */
  支援技能: 支援技能模板[];
  /** 生成时的基础攻击/防御/速度, 用于常驻光环幂等重算 */
  基础属性?: 基础属性;
  是否玩家: boolean;
  已选技能: string | null;
  /** 本次行动选中的目标 (支持攻击容量多目标) */
  已选目标: string[];
  /** 本回合是否已经行动过 (含作为拼点防守方被消耗) */
  已行动: boolean;
  /** 恐慌状态机: 待生效 -> 生效中 -> 无 */
  恐慌状态: 恐慌状态;
}

export interface 拼点硬币记录 {
  id: number;
  威力: number;
  类型: 硬币类型;
  正面: boolean;
  固定: boolean;
}

export interface 拼点回合记录 {
  回合数: number;
  左侧威力: number;
  右侧威力: number;
  左侧硬币: 拼点硬币记录[];
  右侧硬币: 拼点硬币记录[];
  结果: '左胜' | '右胜' | '平局';
  摧毁: { 方: '左' | '右'; 硬币id: number } | null;
  额外击碎: { 方: '左' | '右'; 硬币id: number } | null;
}

export interface 拼点结果 {
  左侧名称: string;
  右侧名称: string;
  左侧技能: string;
  右侧技能: string;
  胜者: '左' | '右' | '无';
  记录: 拼点回合记录[];
  左侧初始硬币: 硬币[];
  右侧初始硬币: 硬币[];
  左侧剩余硬币: 硬币[];
  右侧剩余硬币: 硬币[];
  左侧攻击等级加成: number;
  右侧攻击等级加成: number;
  左侧拼点威力加成: number;
  右侧拼点威力加成: number;
  左侧SP变化: number;
  右侧SP变化: number;
}

export interface SP变化记录 {
  名称: string;
  变化: number;
}

export type 守备结算 = '闪避' | '防御' | '强化防御' | '反击' | '强化反击';

export interface 追加伤害记录 {
  名称: string;
  数值: number;
  类型: '固定' | '理智';
}

export interface 伤害明细 {
  目标: string;
  数值: number;
  暴击: boolean;
  罪孽: 罪孽名;
  攻击类型: 攻击类型名;
  静态: number;
  动态: number;
  追加: 追加伤害记录[];
}

export interface 命中结果 {
  来源: string;
  目标: string;
  技能: string;
  拼点?: 拼点结果;
  伤害: 伤害明细[];
  追加: 追加伤害记录[];
  文本: string;
  目标死亡: boolean;
  目标混乱: boolean;
  /** 若本次为守备结算, 标明守备类型 */
  守备结果?: 守备结算;
  /** 本次结算造成的 SP 变化 (用于 UI 与日志) */
  SP变化?: SP变化记录[];
  /** 本次是否为跳过行动 (混乱/恐慌/架起守备) */
  跳过行动?: boolean;
  /** 本技能是否因 SP ≤ -45 而侵蚀 (随机攻击任意单位) */
  侵蚀?: boolean;
}

export interface 战斗状态 {
  单位: 战斗单位[];
  回合: number;
  速度顺序: string[];
  当前行动者: string;
  行动指针: number;
  日志: string[];
  结束: null | '玩家胜' | '敌人胜';
}
