<template>
  <div v-if="条目.length" class="status-icons">
    <span
      v-for="项 in 条目"
      :key="项.名称"
      class="status-badge"
      :class="项.类别"
      :title="项.名称"
    >
      <span class="status-glyph">{{ 图标(项.名称, 项.类别) }}</span>
      <span class="status-name">{{ 项.名称 }}</span>
      <span v-if="项.强度" class="status-num">{{ 项.强度 }}</span>
      <span v-if="项.层数" class="status-stack">×{{ 项.层数 }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { 状态效果 } from '../engine/types';

const props = defineProps<{ statuses: Record<string, 状态效果> }>();

const 减益列表 = ['破裂', '流血', '烧伤', '震颤', '沉沦', '虚弱', '破绽', '威力降低', '拼点威力降低', '攻击等级降低', '防御等级降低', '伤害弱化', '易损', '束缚', '麻痹'];

const 图标表: Record<string, string> = {
  破裂: '✦',
  流血: '❖',
  烧伤: '▲',
  震颤: '≈',
  沉沦: '◐',
  虚弱: '▽',
  破绽: '✸',
  麻痹: '✳',
  易损: '⊘',
  束缚: '✖',
  威力降低: '↓',
  拼点威力降低: '↓',
  攻击等级降低: '↓',
  防御等级降低: '↓',
  伤害弱化: '↓',
  强壮: '↑',
  威力提升: '↑',
  攻击等级提升: '↑',
  防御等级提升: '↑',
  伤害强化: '↑',
  守护: '◈',
  呼吸法: '∿',
  充能: 'ϟ',
  迅捷: '»',
  暴击伤害强化: '✷',
};

const 条目 = computed(() =>
  Object.entries(props.statuses)
    .filter(([, 值]) => 值.强度 > 0 || 值.层数 > 0)
    .map(([名称, 值]) => ({
      名称,
      强度: 值.强度,
      层数: 值.层数,
      类别: 减益列表.includes(名称) ? 'debuff' : 'buff',
    })),
);

function 图标(名称: string, 类别: string): string {
  return 图标表[名称] ?? (类别 === 'debuff' ? '▽' : '△');
}
</script>

<style scoped>
.status-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--b-border);
  border-left-width: 3px;
  background: var(--b-surface-2);
  color: var(--b-muted);
  white-space: nowrap;
  transition: filter 0.15s;
}

.status-badge:hover {
  filter: brightness(1.25);
}

.status-badge.buff {
  border-color: #4fbf6a;
  color: #8fe0a2;
}

.status-badge.debuff {
  border-color: #d94b3a;
  color: #e88a7c;
  animation: status-pulse 2.2s ease-in-out infinite;
}

.status-glyph {
  color: inherit;
  opacity: 0.9;
}

.status-num {
  font-weight: 800;
}

.status-stack {
  opacity: 0.75;
}

@keyframes status-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(217, 75, 58, 0); }
  50% { box-shadow: 0 0 6px rgba(217, 75, 58, 0.4); }
}
</style>
