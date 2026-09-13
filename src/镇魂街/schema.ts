export const Schema = z.object({
  世界: z.object({
    当前时间节点: z.string().prefault('待初始化'),
    详细时间: z.string().prefault('待初始化'),
    当前区域: z.string().prefault('待初始化'),
    详细地点: z.string().prefault('待初始化'),
  }).prefault({}),

  玩家: z.object({
    身份来源: z.enum(['原创角色', '原著角色']).prefault('原创角色'),
    角色名: z.string().prefault('待初始化'),
    是否武神躯: z.boolean().prefault(false),
    守护灵列表: z.record(
      z.string().describe('守护灵名'),
      z.object({
        来历: z.string().prefault('待初始化'),
        能力: z.string().prefault('待初始化'),
      }).prefault({}),
    ).prefault({}),
    物品栏: z.record(
      z.string().describe('物品名'),
      z.object({
        描述: z.string().prefault('待初始化'),
      }).prefault({}),
    ).prefault({}),
    特殊能力: z.record(
      z.string().describe('能力名'),
      z.string().describe('能力说明').prefault('待初始化'),
    ).prefault({}),
    当前状态: z.string().prefault('待初始化'),
  }).prefault({}),

  NPC: z.record(
    z.string().describe('NPC名'),
    z.object({
      是否武神躯: z.boolean().prefault(false),
      守护灵列表: z.record(
        z.string().describe('守护灵名'),
        z.object({
          来历: z.string().prefault('待初始化'),
          能力: z.string().prefault('待初始化'),
        }).prefault({}),
      ).prefault({}),
      当前状态: z.string().prefault('待初始化'),
      物品栏: z.record(
        z.string().describe('物品名'),
        z.object({
          描述: z.string().prefault('待初始化'),
        }).prefault({}),
      ).prefault({}),
      特殊能力: z.record(
        z.string().describe('能力名'),
        z.string().describe('能力说明').prefault('待初始化'),
      ).prefault({}),
      好感度: z.coerce.number().prefault(0).transform((v) => _.clamp(v, 0, 100)),
      与主角关系: z.string().prefault('待初始化'),
    }).prefault({}),
  ).prefault({}),
});

export type Schema = z.output<typeof Schema>;
