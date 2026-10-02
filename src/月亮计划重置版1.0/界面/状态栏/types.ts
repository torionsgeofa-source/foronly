import type { Schema } from '../../schema';

export type 世界状态 = Schema['世界状态'];
export type 基础信息 = Schema['玩家状态']['基础信息'];
export type 生命体征 = Schema['玩家状态']['生命体征'];
export type 战斗属性 = Schema['玩家状态']['战斗属性'];
export type 罪孽抗性 = Schema['玩家状态']['罪孽抗性'];
export type 物理抗性 = Schema['玩家状态']['物理抗性'];
export type 罪孽资源 = Schema['玩家状态']['罪孽资源'];
export type 状态效果组 = Schema['玩家状态']['状态效果'];
export type 技能组 = Schema['玩家状态']['技能'];
export type 技能 = 技能组[string];
export type 穿着装备 = Schema['玩家状态']['穿着装备'];
export type 背包 = Schema['玩家状态']['背包'];
export type 交互对象组 = Schema['交互对象'];
export type 交互对象 = 交互对象组[string];
export type 战斗 = Schema['战斗'];
export type 战斗单位 = 战斗['单位'][string];
