/**
 * 技能库插件 (独立脚本)
 *
 * - 内置一套规范化技能 DB (战斗 / 守备 / 被动 / 支援 / EGO), 数据外置于 `默认技能库.json`,
 *   按「角色 -> 技能名」归属, 内置技能归入「通用」;
 * - 玩家通过 `增 / 改 / 删 / 删角色 / 导入` 的改动写入全局变量 `技能库` 的覆盖层, 读取时按 默认库 + 全局覆盖 (角色->技能名 粒度) 合并;
 * - 通过 `initializeGlobal('技能库', api)` 向战斗 / 状态栏 / 开局表单等前端界面暴露统一接口。
 *
 * 本插件不依赖任何角色卡 schema 或变量结构, 可被其它卡 / 版本复用。
 *
 * 为保证共享接口一定初始化成功, 本文件是"纯核心": 不含任何 Vue / pinia /
 * App.vue / 界面目录 / @util/script 的静态 import, 也不含任何外部依赖。
 * 悬浮窗等界面逻辑已拆分到独立脚本 `脚本\技能库界面\index.ts`。
 */

/* ------------------------------------------------------------------ *
 * 类型 / 常量 / 纯函数: 单一定义于 `界面/共享/技能常量.ts` (纯模块, 无 Vue/pinia/DOM)。
 * 核心脚本允许静态引用它, webpack 会内联, 产物仍无外部 http import。
 * ------------------------------------------------------------------ */

import type { 技能类别, 技能定义, 技能库数据, 技能库接口 } from '../../界面/共享/技能常量';
import { 规范化技能定义, 通用角色 } from '../../界面/共享/技能常量';

export type { 技能定义, 技能库数据, 技能库接口, 技能效果 } from '../../界面/共享/技能常量';

/* ------------------------------------------------------------------ *
 * 内置默认库 (数据外置)
 *
 * 54 个内置技能已抽离为独立数据文件 `默认技能库.json` (结构:
 * `Record<角色, Record<技能名, 技能定义>>`, 内置技能归属「通用」角色),
 * 便于审校 / 批量编辑 / 跨卡复用: 替换 JSON 即可更换整套内置技能库。
 *
 * 以 `?raw` 导入原始文本后用 JSON.parse 解析, webpack 会把它内联进产物,
 * 因此核心产物仍无外部 http import。解析结果仍会经 `规范化技能定义`
 * 统一校验 (枚举合法化 / 数值夹取 / 字段清理), 与旧的内联写法行为一致。
 * ------------------------------------------------------------------ */

import 默认技能库文本 from './默认技能库.json?raw';

const 默认技能库: 技能库数据 = JSON.parse(默认技能库文本) as 技能库数据;

/* ------------------------------------------------------------------ *
 * 存储: 内置默认库 + 全局变量覆盖层 (角色 -> 技能名 粒度)
 * ------------------------------------------------------------------ */

const 存储键 = '技能库';

interface 技能库存储 {
  覆盖: 技能库数据;
  删除: Record<string, string[]>;
}

const 全局变量选项 = { type: 'global' } as const;

/** 零依赖深拷贝: 优先结构化克隆, 退化到 JSON 拷贝 (技能定义均为纯数据) */
function 深拷贝<T>(值: T): T {
  try {
    return structuredClone(值);
  } catch {
    return JSON.parse(JSON.stringify(值)) as T;
  }
}

function 是技能定义(值: unknown): 值 is 技能定义 {
  if (!值 || typeof 值 !== 'object' || Array.isArray(值)) return false;
  const 对象 = 值 as Partial<技能定义>;
  return typeof 对象.类别 === 'string' || typeof 对象.名称 === 'string';
}

/** 兼容旧版扁平结构 (技能名 -> 定义), 将其归入「通用」 */
function 规范化覆盖(原始: unknown): 技能库数据 {
  if (!原始 || typeof 原始 !== 'object' || Array.isArray(原始)) return {};
  const 结果: 技能库数据 = {};
  for (const [键, 值] of Object.entries(原始 as Record<string, unknown>)) {
    if (是技能定义(值)) {
      (结果[通用角色] ??= {})[键] = 值;
    } else if (值 && typeof 值 === 'object' && !Array.isArray(值)) {
      const 技能表: Record<string, 技能定义> = {};
      for (const [名, 定义] of Object.entries(值 as Record<string, unknown>)) {
        if (是技能定义(定义)) 技能表[名] = 定义;
      }
      结果[键] = 技能表;
    }
  }
  return 结果;
}

/** 兼容旧版删除结构 (技能名[]), 将其归入「通用」 */
function 规范化删除(原始: unknown): Record<string, string[]> {
  if (Array.isArray(原始)) return { [通用角色]: 原始.filter(项 => typeof 项 === 'string') };
  if (!原始 || typeof 原始 !== 'object') return {};
  const 结果: Record<string, string[]> = {};
  for (const [角色, 值] of Object.entries(原始 as Record<string, unknown>)) {
    if (Array.isArray(值)) 结果[角色] = 值.filter(项 => typeof 项 === 'string') as string[];
  }
  return 结果;
}

function 读取存储(): 技能库存储 {
  try {
    const 全局 = getVariables(全局变量选项) ?? {};
    const 原始 = (全局 as Record<string, unknown>)[存储键] as Record<string, unknown> | undefined;
    return {
      覆盖: 规范化覆盖(原始?.覆盖),
      删除: 规范化删除(原始?.删除),
    };
  } catch (错误) {
    console.warn('[技能库] 读取全局变量失败, 使用空覆盖层:', 错误);
    return { 覆盖: {}, 删除: {} };
  }
}

let 存储: 技能库存储 = 读取存储();

function 保存(): void {
  try {
    // 局部写: 仅更新「技能库」这一个全局变量键, 不触碰全局变量中的其它键。
    // updateVariablesWith 以原子方式读改写, 避免「读整对象 -> 整体 replace」覆盖其它键。
    updateVariablesWith(变量 => {
      (变量 as Record<string, unknown>)[存储键] = 深拷贝(存储);
      return 变量;
    }, 全局变量选项);
  } catch (错误) {
    console.error('[技能库] 写入全局变量失败:', 错误);
  }
}

/* ------------------------------------------------------------------ *
 * 合并缓存:
 * - 按角色缓存 (某角色变更只失效该角色与该角色对应的总缓存);
 * - 总缓存 (全部 / 角色列表 / 导出) 在任一次变更后重建;
 * - 查 / 角色技能 / 全部 均只取一次合并结果, 且对外返回深拷贝。
 *
 * 字段清理 / 枚举合法化 / 数值夹取 / 被动支援目标过滤 / 补展示文本统一由
 * `界面/共享/技能常量.ts` 的 `规范化技能定义` 完成, 与引擎 / UI 口径一致。
 * ------------------------------------------------------------------ */

let 总缓存: 技能库数据 | null = null;
const 角色缓存 = new Map<string, Record<string, 技能定义>>();

/** 失效缓存: 传角色则只失效该角色 (并清总缓存), 否则全部失效 */
function 失效缓存(角色?: string): void {
  总缓存 = null;
  if (角色) 角色缓存.delete(角色);
  else 角色缓存.clear();
}

/** 构建单个角色的合并结果 (默认库 + 覆盖, 删除项被剔除) */
function 构建角色(角色: string): Record<string, 技能定义> {
  const 结果: Record<string, 技能定义> = {};
  const 删除集 = new Set<string>(存储.删除[角色] ?? []);
  const 写入 = (名: string, 定义: 技能定义) => {
    if (删除集.has(名)) return;
    结果[名] = 规范化技能定义({ ...定义, 名称: 名, 所属: 角色 });
  };
  for (const [名, 定义] of Object.entries(默认技能库[角色] ?? {})) 写入(名, 定义);
  for (const [名, 定义] of Object.entries(存储.覆盖[角色] ?? {})) 写入(名, 定义);
  return 结果;
}

/** 取单个角色的合并结果 (按角色缓存) */
function 取角色(角色: string): Record<string, 技能定义> {
  let 表 = 角色缓存.get(角色);
  if (!表) {
    表 = 构建角色(角色);
    角色缓存.set(角色, 表);
  }
  return 表;
}

/**
 * 默认库 + 全局覆盖的完整合并结果 (角色并集)。
 * 角色出现在结果中的条件 (与旧实现一致): 仍有非删除技能, 或该角色是覆盖层新角色 (含空角色)。
 */
function 合并(): 技能库数据 {
  if (总缓存) return 总缓存;
  const 角色并集 = new Set<string>([...Object.keys(默认技能库), ...Object.keys(存储.覆盖)]);
  const 结果: 技能库数据 = {};
  for (const 角色 of 角色并集) {
    const 表 = 取角色(角色);
    const 覆盖有该角色 = Object.prototype.hasOwnProperty.call(存储.覆盖, 角色);
    if (Object.keys(表).length > 0 || 覆盖有该角色) 结果[角色] = 表;
  }
  总缓存 = 结果;
  return 结果;
}

function 是内置(角色: string, 名: string): boolean {
  return Object.prototype.hasOwnProperty.call(默认技能库[角色] ?? {}, 名);
}

/** 把一条技能并入覆盖层 (不删除其它角色 / 技能), 并清除同名删除标记 */
function 合并覆盖(角色: string, 技能名: string, 定义: 技能定义): void {
  if (!角色 || !技能名) return;
  (存储.覆盖[角色] ??= {})[技能名] = 规范化技能定义({ ...深拷贝(定义), 名称: 技能名, 所属: 角色 });
  const 剩余 = (存储.删除[角色] ?? []).filter(名 => 名 !== 技能名);
  if (剩余.length) 存储.删除[角色] = 剩余;
  else delete 存储.删除[角色];
}

/* ------------------------------------------------------------------ *
 * 共享 API
 * ------------------------------------------------------------------ */

export const 技能库API: 技能库接口 = {
  查: (角色, 技能名) => {
    // 技能库内部已实现未命中回退「通用」, 且 取角色 有按角色缓存
    const 定义 = 取角色(角色)[技能名] ?? 取角色(通用角色)[技能名];
    return 定义 ? 深拷贝(定义) : undefined;
  },
  全部: () => 深拷贝(合并()),
  角色列表: () => Object.keys(合并()).sort((甲, 乙) => 甲.localeCompare(乙, 'zh-Hans-CN')),
  角色技能: 角色 => 深拷贝(取角色(角色)),
  增角色: 角色 => {
    if (!角色) return;
    存储.覆盖[角色] ??= {};
    delete 存储.删除[角色];
    失效缓存(角色);
    保存();
  },
  增: (角色, 技能名, 定义) => {
    合并覆盖(角色, 技能名, 定义);
    失效缓存(角色);
    保存();
  },
  改: (角色, 技能名, 定义) => {
    合并覆盖(角色, 技能名, 定义);
    失效缓存(角色);
    保存();
  },
  删: (角色, 技能名) => {
    const 技能表 = 存储.覆盖[角色];
    if (技能表) {
      delete 技能表[技能名];
      if (Object.keys(技能表).length === 0) delete 存储.覆盖[角色];
    }
    if (是内置(角色, 技能名)) {
      const 列表 = (存储.删除[角色] ??= []);
      if (!列表.includes(技能名)) 列表.push(技能名);
    }
    失效缓存(角色);
    保存();
  },
  删角色: 角色 => {
    delete 存储.覆盖[角色];
    const 内置 = Object.keys(默认技能库[角色] ?? {});
    if (内置.length > 0) {
      const 列表 = (存储.删除[角色] ??= []);
      for (const 名 of 内置) if (!列表.includes(名)) 列表.push(名);
    }
    失效缓存(角色);
    保存();
  },
  导入: json => {
    const 数据 = 解析导入(json);
    // 增量合并: 按 角色->技能名 逐条并入覆盖层, 不删除未导入的角色 / 技能
    for (const [角色, 技能表] of Object.entries(数据)) {
      const 技能名列表 = Object.keys(技能表);
      if (技能名列表.length === 0) 存储.覆盖[角色] ??= {};
      for (const 名 of 技能名列表) 合并覆盖(角色, 名, 技能表[名]);
      失效缓存(角色);
    }
    保存();
  },
  导出: 角色 => {
    if (角色) return JSON.stringify(取角色(角色), null, 2);
    return JSON.stringify(合并(), null, 2);
  },
  重置: () => {
    存储 = { 覆盖: {}, 删除: {} };
    失效缓存();
    保存();
  },
};

/* 立即向全局暴露共享接口, 使其不依赖本文件后面的任何重代码 */
initializeGlobal('技能库', 技能库API);
{
  const 库 = 技能库API.全部();
  const 角色数 = Object.keys(库).length;
  const 技能数 = Object.values(库).reduce((和, 表) => 和 + Object.keys(表).length, 0);
  console.info('[技能库] 已共享全局接口, 角色数:', 角色数, '技能数:', 技能数);
}

/**
 * 判定一个值是否为「技能定义对象」。
 * 兼容只有 名称 / 类别 / 所属 等技能字段、但字段不完整的旧数据。
 */
function 是导入技能定义(值: unknown): 值 is Record<string, unknown> {
  if (!值 || typeof 值 !== 'object' || Array.isArray(值)) return false;
  const 对象 = 值 as Record<string, unknown>;
  return typeof 对象.类别 === 'string' || typeof 对象.名称 === 'string' || typeof 对象.所属 === 'string';
}

function 规范化导入定义(名: string, 原始: Record<string, unknown>, 默认角色: string): 技能定义 {
  const 对象 = 原始 as unknown as Partial<技能定义>;
  return 规范化技能定义({
    ...对象,
    名称: 名,
    类别: (对象.类别 as 技能类别) ?? '战斗',
    所属: (对象.所属 as string) ?? 默认角色,
  });
}

/**
 * 解析导入 JSON, 兼容三种结构:
 * 1. 整库 `{ 角色: { 技能名: 定义 } }` —— 顶层值是技能表对象;
 * 2. 单角色 / 多技能 `{ 技能名: 定义 }` —— 顶层值是技能定义对象, 归入各自的 `所属` (缺省「通用」);
 * 3. 单技能 `{ 技能名: 定义 }` —— 与 2 相同规则, 天然可被识别。
 */
function 解析导入(json: string): 技能库数据 {
  const 解析 = JSON.parse(json) as unknown;
  if (!解析 || typeof 解析 !== 'object' || Array.isArray(解析)) {
    throw Error('技能库 JSON 应为「角色 -> 技能名 -> 技能定义」或「技能名 -> 技能定义」的对象');
  }
  const 结果: 技能库数据 = {};
  for (const [键, 值] of Object.entries(解析 as Record<string, unknown>)) {
    if (是导入技能定义(值)) {
      // 顶层值是技能定义: 视为单条技能, 归入其 所属 (缺省「通用」)
      const 对象 = 值 as Record<string, unknown>;
      const 角色 = typeof 对象.所属 === 'string' && 对象.所属 ? 对象.所属 : 通用角色;
      const 名 = typeof 对象.名称 === 'string' && 对象.名称 ? 对象.名称 : 键;
      (结果[角色] ??= {})[名] = 规范化导入定义(名, 对象, 角色);
      continue;
    }
    if (!值 || typeof 值 !== 'object' || Array.isArray(值)) {
      throw Error(`「${键}」既不是技能定义, 也不是技能表`);
    }
    // 顶层值是技能表: 角色 -> 技能名 -> 定义
    const 技能表: Record<string, 技能定义> = {};
    for (const [名, 定义] of Object.entries(值 as Record<string, unknown>)) {
      if (!是导入技能定义(定义)) {
        throw Error(`技能「${键}/${名}」缺少 类别 / 名称 / 所属 等技能字段`);
      }
      技能表[名] = 规范化导入定义(名, 定义 as Record<string, unknown>, 键);
    }
    结果[键] = 技能表;
  }
  return 结果;
}

/* ------------------------------------------------------------------ *
 * 悬浮窗 / 脚本按钮等界面逻辑已拆分到独立脚本 `脚本\技能库界面\index.ts`。
 * 本文件保持纯核心, 以保证 initializeGlobal('技能库', api) 一定成功执行。
 * ------------------------------------------------------------------ */
