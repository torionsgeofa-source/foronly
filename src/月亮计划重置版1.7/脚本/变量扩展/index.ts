/**
 * 变量结构扩展 (独立脚本)
 *
 * 背景: MVU 的校验 schema 从数据现算, 对象节点默认 `extensible:false`;
 * 当模型用 JSON Patch 向「角色 / 战斗.单位 / 交互对象」这些映射**新增键**时,
 * MVU 会报「SCHEMA 违规: 无法向不可扩展对象写入新键」并拒绝该操作。
 *
 * 解决: 监听 MVU 的「变量更新开始 / 变量初始化」事件, 在更新结算前把这三个映射的
 * schema 节点标为 `extensible / recursiveExtensible`, 从而允许新增键。
 * (只动 schema 元数据, 不改动任何实际变量值。)
 */
$(() => {
  errorCatched(() => {
    const 映射路径: Array<string[]> = [
      ['角色'],
      ['交互对象'],
      ['战斗', '单位'],
    ];

    const 标记可扩展 = (节点: unknown): void => {
      if (!节点 || typeof 节点 !== 'object') return;
      const 对象 = 节点 as { extensible?: boolean; recursiveExtensible?: boolean };
      对象.extensible = true;
      对象.recursiveExtensible = true;
    };

    const 处理 = (variables: unknown): void => {
      const schema = (variables as { schema?: unknown } | null)?.schema as
        | { type?: string; properties?: Record<string, unknown> }
        | undefined;
      // 非对象 (如 mvu_zod 的哨兵字符串) 表示不启用 schema 校验, 无需处理
      if (!schema || typeof schema !== 'object' || schema.type !== 'object') return;
      for (const 路径 of 映射路径) {
        let 当前: { properties?: Record<string, unknown> } | undefined = schema;
        for (const 段 of 路径) {
          const 节点 = 当前?.properties?.[段] as { properties?: Record<string, unknown> } | undefined;
          if (!节点) {
            当前 = undefined;
            break;
          }
          当前 = 节点;
        }
        标记可扩展(当前);
      }
    };

    eventOn('mag_variable_initialized', 处理);
    eventOn('mag_variable_update_started', 处理);
    console.info('[变量扩展] 已启用: 角色 / 战斗.单位 / 交互对象 允许新增键');
  })();
});
