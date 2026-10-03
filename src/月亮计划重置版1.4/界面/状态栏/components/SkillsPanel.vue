<template>
  <div class="skills-panel">
    <template v-if="技能列表.length">
      <details v-for="项 in 技能列表" :key="项.名称" class="skill-item">
        <summary class="skill-summary">
          <span class="sin-dot" :style="{ background: 罪孽色(项.罪孽) }" />
          <span class="skill-name">{{ 项.名称 }}</span>
          <span class="skill-tag" :style="{ color: 罪孽色(项.罪孽) }">{{ 项.罪孽 }}</span>
          <span class="skill-tag">{{ 项.攻击类型 }}</span>
          <span class="skill-tag" :class="{ guard: 项.类别 === '守备', ego: 项.类别 === 'EGO' }">{{ 项.类别 }}</span>
          <span v-if="项.守备类型" class="skill-tag guard">{{ 项.守备类型 }}</span>
        </summary>
        <div class="skill-body">
          <div class="skill-line"><span class="k">基础威力</span><span class="v">{{ 项.基础威力 }}</span></div>
          <div class="skill-line">
            <span class="k">硬币威力</span>
            <span class="v">
              <template v-if="项.硬币威力.length">
                <span v-for="(威力, 下标) in 项.硬币威力" :key="下标" class="coin">{{ 威力 }}</span>
              </template>
              <template v-else>无</template>
            </span>
          </div>
          <div class="skill-line"><span class="k">攻击等级修正</span><span class="v">{{ 项.攻击等级修正 >= 0 ? '+' : '' }}{{ 项.攻击等级修正 }}</span></div>
          <div class="skill-line"><span class="k">攻击容量</span><span class="v">{{ 项.攻击容量 }}</span></div>
          <div class="skill-line"><span class="k">SP消耗</span><span class="v">{{ 项.SP消耗 }}</span></div>
          <div class="skill-line effect"><span class="k">效果</span><span class="v">{{ 项.效果 || '无' }}</span></div>
        </div>
      </details>
    </template>
    <span v-else class="empty">无</span>
  </div>
</template>

<script setup lang="ts">
import { 罪孽颜色, type 罪孽名 } from '../constants';
import { 查技能 } from '../技能库';

const props = defineProps<{ 技能: string[] }>();

interface 技能视图 {
  名称: string;
  罪孽: string;
  攻击类型: string;
  类别: string;
  守备类型: string;
  基础威力: number | string;
  硬币威力: number[];
  攻击等级修正: number;
  攻击容量: number;
  SP消耗: number;
  效果: string;
}

const 技能列表 = computed<技能视图[]>(() =>
  (props.技能 ?? []).map(名称 => {
    const 定义 = 查技能(名称);
    return {
      名称,
      罪孽: 定义?.罪孽 ?? '无',
      攻击类型: 定义?.攻击类型 ?? '—',
      类别: 定义?.类别 ?? '未知',
      守备类型: 定义?.守备类型 ?? '',
      基础威力: 定义?.基础威力 ?? '—',
      硬币威力: Array.isArray(定义?.硬币威力)
        ? 定义.硬币威力
        : (定义?.硬币 ?? []).map(项 => 项.威力).filter(威力 => Number.isFinite(威力)),
      攻击等级修正: 定义?.攻击等级修正 ?? 0,
      攻击容量: 定义?.攻击容量 ?? 1,
      SP消耗: 定义?.SP消耗 ?? 0,
      效果: 定义?.效果 ?? '（未在技能库中找到）',
    };
  }),
);

function 罪孽色(罪孽: string): string {
  return 罪孽颜色[罪孽 as 罪孽名] ?? 'var(--b-muted)';
}
</script>

<style scoped>
.skills-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skill-item {
  border: 1px solid var(--b-border);
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.2);
}

.skill-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 9px;
  cursor: pointer;
  list-style: none;
  font-size: 12px;
}

.skill-summary::-webkit-details-marker {
  display: none;
}

.sin-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: 0 0 auto;
}

.skill-name {
  font-weight: 700;
  color: var(--b-text);
}

.skill-tag {
  font-size: 10px;
  padding: 0 5px;
  border-radius: 3px;
  border: 1px solid var(--b-border);
  color: var(--b-muted);
}

.skill-tag.guard {
  border-style: dashed;
  color: #9fc6e0;
}

.skill-tag.ego {
  border-color: var(--b-accent-2);
  color: var(--b-accent-2);
}

.skill-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 10px 9px;
  border-top: 1px dashed var(--b-border);
}

.skill-line {
  display: flex;
  gap: 8px;
  font-size: 11px;
}

.skill-line .k {
  color: var(--b-muted);
  flex: 0 0 78px;
}

.skill-line .v {
  color: var(--b-text);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.skill-line.effect .v {
  color: var(--b-accent-2);
}

.coin {
  padding: 0 5px;
  border: 1px solid var(--b-border);
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.3);
  font-variant-numeric: tabular-nums;
}

.empty {
  font-size: 12px;
  color: var(--b-muted);
}
</style>
