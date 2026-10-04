/**
 * 旧存档兼容升级: 对象式技能 → 并入库 + 收敛为技能名数组。
 *
 * 旧聊天里 `玩家状态.技能` / `角色.<名>.技能` / `战斗.单位.<名>.技能` 可能是
 * 「技能名 → 定义」的对象; 新结构只保存技能名数组 (string[]), 定义存于技能库插件。
 *
 * 迁移在 schema 解析**之前**读取原始变量 (getVariables), 因此不会因 schema
 * `造技能列表` 把对象压成 `Object.keys` 而丢定义:
 * 1. 逐条 `技能库.增(角色, 名, 定义)` 并入库 (玩家 / 空 / `{{user}}` → 主角);
 * 2. 用 `updateVariablesWith` 把该字段改写为技能名数组。
 *
 * 迁移是幂等的: 字段已是数组时直接跳过; 技能库未就绪时由调用方跳过并告警,
 * 此时 schema 仍会把对象收敛为名字数组 (不崩溃, 但定义无法回收)。
 */
import { 归一化角色键 } from './技能常量';

/** 迁移所需的最小技能库接口 (避免与各界面重复类型耦合) */
export interface 技能迁移库接口 {
  查(角色: string, 技能名: string): unknown;
  增(角色: string, 技能名: string, 定义: any): void;
}

function 是对象技能表(值: unknown): 值 is Record<string, unknown> {
  return !!值 && typeof 值 === 'object' && !Array.isArray(值);
}

/**
 * 扫描并迁移当前消息楼层变量中的对象式技能。
 *
 * @param api 技能库共享接口 (需已就绪)
 * @returns 并入库的技能条数
 */
export function 迁移旧技能(api: 技能迁移库接口): number {
  const 变量选项 = { type: 'message', message_id: getCurrentMessageId() } as const;
  let 迁移条数 = 0;

  updateVariablesWith(变量 => {
    const 状态数据 = _.get(变量, 'stat_data');
    if (!状态数据 || typeof 状态数据 !== 'object') return 变量;

    /**
     * 处理单个技能字段:
     * - 旧「技能名 → 定义」对象, 或含定义的「对象数组」→ 并入库并返回名字数组;
     * - 已是纯字符串数组 → 返回 null (跳过, 保证迁移幂等, 不重复改写变量)。
     */
    const 处理字段 = (字段: unknown, 角色: string): string[] | null => {
      const 是对象表 = 是对象技能表(字段);
      const 是对象数组 = Array.isArray(字段) && 字段.some(项 => 是对象技能表(项));
      if (!是对象表 && !是对象数组) return null;
      const 名字列表: string[] = [];
      const 处理条目 = (技能名: string, 定义: unknown) => {
        if (是对象技能表(定义)) {
          try {
            api.增(角色, 技能名, 定义);
            迁移条数 += 1;
          } catch (错误) {
            console.warn(`[技能迁移] 技能「${技能名}」并入库失败`, 错误);
          }
        }
        if (技能名 && !名字列表.includes(技能名)) 名字列表.push(技能名);
      };
      if (是对象表) {
        for (const [技能名, 定义] of Object.entries(字段 as Record<string, unknown>)) 处理条目(技能名, 定义);
      } else {
        for (const 项 of 字段 as unknown[]) {
          if (是对象技能表(项)) {
            for (const [技能名, 定义] of Object.entries(项)) 处理条目(技能名, 定义);
          } else if (typeof 项 === 'string' && 项.trim()) {
            处理条目(项.trim(), undefined);
          }
        }
      }
      return 名字列表;
    };

    // 玩家状态
    const 玩家档案 = (状态数据 as Record<string, any>).玩家状态;
    if (玩家档案) {
      const 名列表 = 处理字段(玩家档案.技能, 归一化角色键(玩家档案.基础信息?.名称));
      if (名列表) 玩家档案.技能 = 名列表;
    }

    // 角色档案
    const 角色表 = (状态数据 as Record<string, any>).角色;
    if (是对象技能表(角色表)) {
      for (const [角色名, 档案] of Object.entries(角色表)) {
        if (!是对象技能表(档案)) continue;
        const 名列表 = 处理字段((档案 as Record<string, any>).技能, 归一化角色键(角色名));
        if (名列表) (档案 as Record<string, any>).技能 = 名列表;
      }
    }

    // 战斗单位
    const 单位表 = (状态数据 as Record<string, any>).战斗?.单位;
    if (是对象技能表(单位表)) {
      for (const [单位名, 记录] of Object.entries(单位表)) {
        if (!是对象技能表(记录)) continue;
        const 名列表 = 处理字段((记录 as Record<string, any>).技能, 归一化角色键(单位名));
        if (名列表) (记录 as Record<string, any>).技能 = 名列表;
      }
    }

    return 变量;
  }, 变量选项);

  return 迁移条数;
}
