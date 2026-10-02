
export const Schema = z.object({
  世界状态: z.object({
    当前时间: z.string().prefault('都市历 XXX年XX月XX日 XX:XX'),
    当前地点: z.string().prefault('某个巢/某个后巷_具体地点'),
    当前场景: z.string().prefault('未知场景'),
  }).prefault({}),

  玩家状态: z.object({
    基础信息: z.object({
      名称: z.string().prefault('{{user}}'),
      种族: z.string().prefault('人类'),
      身份: z.string().prefault('无'),
      当前称号: z.string().describe('如1~9阶收尾人/1~5级公司员工或高管/灾害评级等，随剧情推进更新，仅显示最新称号').prefault('无'),
      _战力评级: z.string().prefault('未评级'),
      等级: z.coerce.number().transform(v => _.clamp(v, 1, 90)).prefault(1),
      经验: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
    }).transform(data => {
      const l = data.等级;
      const r = l <= 10 ? '九阶' : l <= 20 ? '八阶' : l <= 30 ? '七阶' : l <= 40 ? '六阶' : l <= 50 ? '五阶' : l <= 60 ? '四阶' : l <= 70 ? '三阶' : l <= 80 ? '二阶' : l <= 85 ? '一阶' : '色彩';
      return { ...data, _战力评级: r };
    }).prefault({}),

    生命体征: z.object({
      生命值: z.object({
        数值: z.coerce.number().prefault(100),
        上限: z.coerce.number().transform(v => Math.max(1, v)).prefault(100),
        状态描述: z.string().prefault('健康'),
      })
      .transform(data => {
        const 比例 = data.上限 > 0 ? data.数值 / data.上限 : 0;
        let 状态描述;
        if (data.数值 <= 0) {
          状态描述 = '死亡';
        } else if (比例 < 0.35) {
          状态描述 = '身体功能失活（如骨折、断肢等）';
        } else if (比例 <= 0.5) {
          状态描述 = '身负重伤';
        } else if (比例 <= 0.75) {
          状态描述 = '轻微受损';
        } else {
          状态描述 = '健康';
        }
        return {
          ...data,
          数值: _.clamp(data.数值, 0, data.上限),
          状态描述,
        };
      })
      .prefault({}),

      理智值: z.object({
        数值: z.coerce.number().transform(v => _.clamp(v, -45, 45)).prefault(0),
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

      混乱: z.object({
        数值: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
        阈值: z.coerce.number().transform(v => Math.max(1, v)).prefault(50),
        状态: z.string().prefault('正常'),
      }).prefault({}),
    }).prefault({}),

    战斗属性: z.object({
      攻击等级: z.coerce.number().transform(v => Math.max(1, v)).prefault(1),
      防御等级: z.coerce.number().transform(v => Math.max(1, v)).prefault(1),
      速度: z.coerce.number().transform(v => Math.max(1, v)).prefault(1),
    }).prefault({}),

    罪孽抗性: z.object({
      暴怒: z.coerce.number().prefault(1),
      色欲: z.coerce.number().prefault(1),
      怠惰: z.coerce.number().prefault(1),
      暴食: z.coerce.number().prefault(1),
      忧郁: z.coerce.number().prefault(1),
      傲慢: z.coerce.number().prefault(1),
      嫉妒: z.coerce.number().prefault(1),
    }).prefault({}),

    物理抗性: z.object({
      斩击: z.coerce.number().prefault(1),
      突刺: z.coerce.number().prefault(1),
      打击: z.coerce.number().prefault(1),
    }).prefault({}),

    罪孽资源: z.object({
      暴怒: z.coerce.number().prefault(0),
      色欲: z.coerce.number().prefault(0),
      怠惰: z.coerce.number().prefault(0),
      暴食: z.coerce.number().prefault(0),
      忧郁: z.coerce.number().prefault(0),
      傲慢: z.coerce.number().prefault(0),
      嫉妒: z.coerce.number().prefault(0),
    }).prefault({}),

    状态效果: z.record(
      z.string().describe('状态名'),
      z.object({
        强度: z.coerce.number().prefault(0),
        层数: z.coerce.number().prefault(0),
      }).prefault({})
    ).prefault({}),

    技能: z.record(
      z.string().describe('技能名'),
      z.object({
        罪孽: z.string().prefault('无'),
        攻击类型: z.string().prefault('打击'),
        基础威力: z.coerce.number().prefault(0),
        硬币威力: z.array(z.coerce.number()).prefault([]),
        攻击等级修正: z.coerce.number().prefault(0),
        攻击容量: z.coerce.number().prefault(1),
        效果: z.string().prefault(''),
      }).prefault({})
    ).prefault({}),

    穿着装备: z.object({
      上衣: z.string().prefault('自定义上衣'),
      下装: z.string().prefault('自定义下装'),
      武器: z.string().prefault('无'),
      防具: z.string().prefault('无'),
      物品: z.string().prefault('无'),
    }).prefault({}),

    背包: z.object({
      钱财_眼: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
      拥有的物品: z.record(
        z.string().describe('物品名'),
        z.object({
          数量: z.coerce.number().prefault(0),
        }).prefault({})
      )
      .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0))
      .prefault({}),
    }).prefault({}),
  }).prefault({}),

  战斗: z.object({
    进行中: z.boolean().prefault(false),
    回合: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
    当前行动者: z.string().prefault(''),
    速度顺序: z.array(z.string()).prefault([]),
    日志: z.array(z.string()).prefault([]),
    单位: z.record(
      z.string().describe('单位名称'),
      z.object({
        阵营: z.string().prefault('敌人'),
        身份: z.string().prefault('未知'),
        _战力评级: z.string().prefault('未评级'),
        等级: z.coerce.number().transform(v => _.clamp(v, 1, 90)).prefault(1),
        生命值: z.coerce.number().prefault(1),
        生命上限: z.coerce.number().prefault(1),
        理智值: z.coerce.number().transform(v => _.clamp(v, -45, 45)).prefault(0),
        混乱值: z.coerce.number().prefault(0),
        混乱阈值: z.coerce.number().prefault(50),
        攻击等级: z.coerce.number().prefault(1),
        防御等级: z.coerce.number().prefault(1),
        速度: z.coerce.number().prefault(1),
        罪孽抗性: z.object({
          暴怒: z.coerce.number().prefault(1),
          色欲: z.coerce.number().prefault(1),
          怠惰: z.coerce.number().prefault(1),
          暴食: z.coerce.number().prefault(1),
          忧郁: z.coerce.number().prefault(1),
          傲慢: z.coerce.number().prefault(1),
          嫉妒: z.coerce.number().prefault(1),
        }).prefault({}),
        物理抗性: z.object({
          斩击: z.coerce.number().prefault(1),
          突刺: z.coerce.number().prefault(1),
          打击: z.coerce.number().prefault(1),
        }).prefault({}),
        罪孽资源: z.object({
          暴怒: z.coerce.number().prefault(0),
          色欲: z.coerce.number().prefault(0),
          怠惰: z.coerce.number().prefault(0),
          暴食: z.coerce.number().prefault(0),
          忧郁: z.coerce.number().prefault(0),
          傲慢: z.coerce.number().prefault(0),
          嫉妒: z.coerce.number().prefault(0),
        }).prefault({}),
        状态效果: z.record(
          z.string().describe('状态名'),
          z.object({
            强度: z.coerce.number().prefault(0),
            层数: z.coerce.number().prefault(0),
          }).prefault({})
        ).prefault({}),
        技能: z.record(
          z.string().describe('技能名'),
          z.object({
            罪孽: z.string().prefault('无'),
            攻击类型: z.string().prefault('打击'),
            基础威力: z.coerce.number().prefault(0),
            硬币威力: z.array(z.coerce.number()).prefault([]),
            攻击等级修正: z.coerce.number().prefault(0),
            攻击容量: z.coerce.number().prefault(1),
            效果: z.string().prefault(''),
          }).prefault({})
        ).prefault({}),
      }).transform(data => {
        const l = data.等级;
        const r = l <= 10 ? '九阶' : l <= 20 ? '八阶' : l <= 30 ? '七阶' : l <= 40 ? '六阶' : l <= 50 ? '五阶' : l <= 60 ? '四阶' : l <= 70 ? '三阶' : l <= 80 ? '二阶' : l <= 85 ? '一阶' : '色彩';
        return { ...data, _战力评级: r };
      }).prefault({})
    ).prefault({}),
  }).prefault({}),

  交互对象: z.record(
    z.string().describe('对象名称'),
    z.object({
      身份: z.string().prefault('未知'),
      生理状态: z.string().prefault('健康'),
      好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
      服饰: z.string().prefault('默认服饰'),
      当前行为: z.string().prefault('无'),
    }).prefault({})
  ).prefault({}),
});

export type Schema = z.output<typeof Schema>;
