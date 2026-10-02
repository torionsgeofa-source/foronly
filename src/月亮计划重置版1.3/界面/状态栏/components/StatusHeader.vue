<template>
  <header class="status-head">
    <div class="head-main">
      <span class="player-name">{{ 显示名称 }}</span>
      <span class="title-badge">{{ 基础信息.当前称号 || '无' }}</span>
      <span class="level-badge">Lv.{{ 基础信息.等级 }}</span>
      <span class="rank-badge" :class="评级类">{{ 基础信息._战力评级 }}</span>
    </div>
    <div class="head-world">
      <span class="world-item" :title="世界状态.当前场景">🕒 {{ 世界状态.当前时间 }}</span>
      <span class="world-item">📍 {{ 世界状态.当前地点 }}</span>
      <span class="world-item scene">🎬 {{ 世界状态.当前场景 }}</span>
    </div>

    <div class="exp-row">
      <span class="exp-label">经验</span>
      <Bar :value="基础信息.经验" :max="所需经验" color="var(--b-accent-2)" :value-text="`${基础信息.经验} / ${所需经验}`" />
    </div>

    <div class="combat-stats">
      <span class="stat">攻 <b>{{ 攻击等级 }}</b><span v-if="攻级增益" class="muted">（{{ 加成文本(攻级增益) }}）</span></span>
      <span class="stat">防 <b>{{ 防御等级 }}</b><span v-if="防级增益" class="muted">（{{ 加成文本(防级增益) }}）</span></span>
      <span class="stat">
        速 <b>{{ 速度下限 }}~{{ 速度上限 }}</b>
        <span class="muted">（+{{ 等级速度加成 }}）</span>
      </span>
      <span class="stat muted">性别 {{ 基础信息.性别 || '未知' }}</span>
      <span class="stat muted">种族 {{ 基础信息.种族 || '未知' }}</span>
      <span class="stat muted">身份 {{ 基础信息.身份 || '无' }}</span>
    </div>

    <div class="vitals">
      <Bar
        label="HP"
        :value="生命体征.生命值.数值"
        :max="生命体征.生命值.上限"
        color="var(--b-hp)"
        :status="生命体征.生命值.状态描述"
        :warn="生命比例 < 0.35 && 生命体征.生命值.数值 > 0"
        :value-text="`${Math.round(生命体征.生命值.数值)}/${生命体征.生命值.上限}`"
      />
      <div v-if="生命体征.护盾 > 0" class="shield-line">
        <span class="shield-label">护盾</span>
        <span class="shield-num">{{ Math.round(生命体征.护盾) }}</span>
      </div>
      <Bar
        label="SP"
        :value="生命体征.理智值.数值"
        :min="-45"
        :max="45"
        mid
        color="var(--b-sp)"
        :status="生命体征.理智值.状态描述"
        :value-text="`${Math.round(生命体征.理智值.数值)}`"
      />
      <Bar
        label="混乱"
        :value="生命体征.混乱.数值"
        :max="生命体征.混乱.阈值"
        :color="混乱临界 ? 'var(--b-accent)' : 'var(--b-chaos)'"
        :status="混乱临界 ? `${生命体征.混乱.状态} · 混乱!` : 生命体征.混乱.状态"
        :value-text="`${Math.round(生命体征.混乱.数值)}/${生命体征.混乱.阈值}`"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { 升级所需经验, 等级上限 } from '../../战斗/engine/level';
import type { 世界状态, 基础信息, 生命体征, 战斗属性, 状态效果组 } from '../types';
import Bar from './Bar.vue';

const props = defineProps<{
  世界状态: 世界状态;
  基础信息: 基础信息;
  生命体征: 生命体征;
  战斗属性: 战斗属性;
  状态效果: 状态效果组;
}>();

function 读层(名称: string): number {
  return props.状态效果?.[名称]?.层数 ?? 0;
}

const 攻级增益 = computed(() => 读层('攻击等级提升') - 读层('攻击等级降低'));
const 防级增益 = computed(() => 读层('防御等级提升') - 读层('防御等级降低'));
const 攻击等级 = computed(() => Math.max(1, props.战斗属性.攻击等级 + 攻级增益.value));
const 防御等级 = computed(() => Math.max(1, props.战斗属性.防御等级 + 防级增益.value));

const 等级速度加成 = computed(() => Math.floor((props.基础信息.等级 ?? 1) / 10));
const 速度下限 = computed(() => 3 + 等级速度加成.value);
const 速度上限 = computed(() => 6 + 等级速度加成.value);

function 加成文本(值: number): string {
  return 值 >= 0 ? `+${值}` : `${值}`;
}

const 显示名称 = computed(() => {
  const 原始 = props.基础信息.名称;
  if (!原始) return '未知';
  try {
    return substitudeMacros(原始) || 原始;
  } catch {
    return 原始;
  }
});

const 所需经验 = computed(() => {
  if (props.基础信息.等级 >= 等级上限) return Math.max(1, props.基础信息.经验);
  return Math.max(1, 升级所需经验(props.基础信息.等级));
});

const 生命比例 = computed(() => {
  const 上限 = props.生命体征.生命值.上限;
  return 上限 > 0 ? props.生命体征.生命值.数值 / 上限 : 0;
});

const 混乱临界 = computed(
  () => props.生命体征.混乱.阈值 > 0 && props.生命体征.混乱.数值 >= props.生命体征.混乱.阈值,
);

const 评级类 = computed(() => {
  const 值 = props.基础信息._战力评级;
  if (值 === '色彩') return 'rank-color';
  if (值 === '一阶' || 值 === '二阶') return 'rank-high';
  if (值 === '三阶' || 值 === '四阶') return 'rank-mid';
  return 'rank-low';
});
</script>

<style scoped>
.status-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--b-border);
  border-left: 3px solid var(--b-accent);
  border-radius: 8px;
  background: linear-gradient(150deg, var(--b-surface), var(--b-bg));
}

.head-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.player-name {
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 1px;
  color: var(--b-text);
}

.title-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 8px;
  border: 1px solid var(--b-accent-2);
  color: var(--b-accent-2);
  background: rgba(217, 164, 65, 0.08);
}

.level-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 8px;
  border: 1px solid var(--b-border);
  color: var(--b-muted);
}

.rank-badge {
  font-size: 10px;
  line-height: 1.6;
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid var(--b-border);
  background: rgba(0, 0, 0, 0.25);
  letter-spacing: 1px;
  color: var(--b-muted);
}

.rank-badge.rank-mid {
  color: #9fc6e0;
  border-color: rgba(79, 163, 209, 0.6);
}

.rank-badge.rank-high {
  color: #f0d48a;
  border-color: rgba(217, 164, 65, 0.7);
}

.rank-badge.rank-color {
  color: #fff;
  border-color: transparent;
  background:
    linear-gradient(#1b161b, #1b161b) padding-box,
    linear-gradient(90deg, #e04b3a, #e0a53a, #4fb04f, #3aa0e0, #8a5de0) border-box;
  border: 1px solid transparent;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
}

.head-world {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11px;
  color: var(--b-muted);
}

.world-item.scene {
  color: var(--b-accent-2);
}

.exp-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.exp-label {
  font-size: 10px;
  color: var(--b-muted);
  flex: 0 0 auto;
}

.combat-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  color: var(--b-text);
}

.combat-stats b {
  color: var(--b-accent-2);
  font-variant-numeric: tabular-nums;
}

.combat-stats .muted {
  color: var(--b-muted);
}

.vitals {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
}

.shield-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 1px 8px;
  border: 1px solid rgba(79, 163, 209, 0.7);
  border-radius: 8px;
  background: rgba(79, 163, 209, 0.12);
  font-size: 11px;
}

.shield-label {
  color: #9fc6e0;
  letter-spacing: 1px;
}

.shield-num {
  color: #cfe8f7;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
