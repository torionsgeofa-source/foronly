<template>
  <div
    class="unit-card"
    :class="[阵营类, { current: isCurrent, dead: !存活中, targetable: isTargetable, target: isTarget }]"
    @click="emit('click')"
  >
    <div class="unit-head">
      <span class="unit-name">{{ unit.名称 }}</span>
      <span v-if="unit.是否玩家" class="tag player-tag">玩家</span>
      <span class="unit-identity">{{ unit.身份 }}</span>
      <span class="unit-level">Lv.{{ unit.等级 }}</span>
      <span class="rank-badge" :class="评级类" :title="`战力评级 ${评级}`">{{ 评级 }}</span>
    </div>

    <div class="bar-row">
      <span class="bar-label hp-label">HP</span>
      <div class="bar-track"><div class="bar-fill hp" :style="{ width: hp百分比 }" /></div>
      <span class="bar-num">{{ Math.round(unit.生命值) }}/{{ unit.生命上限 }}</span>
    </div>

    <div class="bar-row">
      <span class="bar-label sp-label">SP</span>
      <div class="bar-track">
        <div class="bar-fill sp" :style="{ width: sp百分比 }" />
        <div class="sp-mid" />
      </div>
      <span class="bar-num">{{ Math.round(unit.理智值) }}</span>
    </div>

    <div class="bar-row">
      <span class="bar-label chaos-label">混乱</span>
      <div class="bar-track"><div class="bar-fill chaos" :style="{ width: chaos百分比 }" /></div>
      <span class="bar-num">{{ Math.round(unit.混乱值) }}/{{ unit.混乱阈值 }}</span>
    </div>

    <div class="unit-stats">
      <span>攻 {{ 有效攻击 }}</span>
      <span>防 {{ 有效防御 }}</span>
      <span>速 {{ 有效速度值 }}<template v-if="unit.速度区间">（{{ unit.速度区间.最小 }}~{{ unit.速度区间.最大 }}）</template></span>
      <span v-if="存活中 && 混乱" class="staggered">混乱!</span>
      <span v-if="存活中 && 恐慌" class="panicked">恐慌</span>
      <span v-else-if="存活中 && 士气低落" class="low-morale">士气低落</span>
      <span v-if="!存活中" class="dead-tag">已倒下</span>
    </div>

    <StatusIcons :statuses="unit.状态效果" />

    <div v-if="被动列表.length || 支援列表.length" class="unit-traits">
      <span
        v-for="技能 in 被动列表"
        :key="`被动-${技能.名称}`"
        class="trait passive"
        :title="`[被动·${技能.时机}] ${技能说明(技能)}`"
      >被·{{ 技能.名称 }}</span>
      <span
        v-for="技能 in 支援列表"
        :key="`支援-${技能.名称}`"
        class="trait support"
        :title="`[支援·${技能.时机}] ${技能说明(技能)}`"
      >援·{{ 技能.名称 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 战斗单位, 被动技能模板, 支援技能模板 } from '../engine/types';
import { 聚合加成, 是否混乱, 描述效果列表 } from '../engine/status';
import { 存活, 有效速度 } from '../engine/battle';
import { 战力评级 } from '../engine/level';
import StatusIcons from './StatusIcons.vue';

const props = defineProps<{
  unit: 战斗单位;
  isCurrent?: boolean;
  isTargetable?: boolean;
  isTarget?: boolean;
}>();

const emit = defineEmits<{ (e: 'click'): void }>();

const 存活中 = computed(() => 存活(props.unit));
const 混乱 = computed(() => 是否混乱(props.unit));
const 恐慌 = computed(() => props.unit.恐慌状态 !== '无');
const 士气低落 = computed(() => (props.unit.状态效果['士气低落']?.层数 ?? 0) > 0);

const hp百分比 = computed(() => `${Math.max(0, Math.min(100, (props.unit.生命值 / Math.max(1, props.unit.生命上限)) * 100))}%`);
const sp百分比 = computed(() => `${Math.max(0, Math.min(100, ((props.unit.理智值 + 45) / 90) * 100))}%`);
const chaos百分比 = computed(() => `${Math.max(0, Math.min(100, (props.unit.混乱值 / Math.max(1, props.unit.混乱阈值)) * 100))}%`);

const 有效攻击 = computed(() => props.unit.攻击等级 + 聚合加成(props.unit).攻击等级);
const 有效防御 = computed(() => props.unit.防御等级 + 聚合加成(props.unit).防御等级);
const 有效速度值 = computed(() => 有效速度(props.unit));

const 被动列表 = computed(() => props.unit.被动技能 ?? []);
const 支援列表 = computed(() => props.unit.支援技能 ?? []);

function 技能说明(技能: 被动技能模板 | 支援技能模板): string {
  return 技能.说明 || 描述效果列表(技能.效果) || '无效果';
}

const 阵营类 = computed(() => (props.unit.阵营 === '敌人' ? 'enemy' : 'ally'));

const 评级 = computed(() => 战力评级(props.unit.等级));
const 评级类 = computed(() => {
  const 值 = 评级.value;
  if (值 === '色彩') return 'rank-color';
  if (值 === '一阶' || 值 === '二阶') return 'rank-high';
  if (值 === '三阶' || 值 === '四阶') return 'rank-mid';
  return 'rank-low';
});
</script>

<style scoped>
.unit-card {
  border: 1px solid var(--b-border);
  border-radius: 6px;
  background: var(--b-surface);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    opacity 0.2s;
}

.unit-card.ally {
  border-left: 3px solid var(--b-ally);
}

.unit-card.enemy {
  border-left: 3px solid var(--b-enemy);
}

.unit-card.current {
  box-shadow: 0 0 0 2px var(--b-accent-2);
}

.unit-card.targetable {
  cursor: pointer;
  border-color: var(--b-accent-2);
}

.unit-card.targetable:hover {
  background: var(--b-surface-2);
}

.unit-card.target {
  box-shadow: 0 0 0 2px var(--b-accent);
}

.unit-card.dead {
  opacity: 0.4;
  filter: grayscale(1);
}

.unit-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.unit-name {
  font-weight: 700;
  font-size: 14px;
}

.player-tag {
  font-size: 10px;
  padding: 0 4px;
  border-radius: 3px;
  background: var(--b-player);
  color: #06210f;
}

.unit-identity,
.unit-level {
  font-size: 11px;
  color: var(--b-muted);
}

.unit-level {
  margin-left: auto;
}

.rank-badge {
  font-size: 10px;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid var(--b-border);
  color: var(--b-muted);
  background: rgba(0, 0, 0, 0.25);
  letter-spacing: 1px;
}

.rank-badge.rank-low {
  color: #b6a9b3;
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

.bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bar-label {
  width: 30px;
  font-size: 10px;
  color: var(--b-muted);
}

.bar-track {
  position: relative;
  flex: 1;
  height: 8px;
  background: #0b080b;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  position: relative;
  height: 100%;
  border-radius: 4px;
  transition: width 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent 55%);
}

.bar-fill.hp {
  background: var(--b-hp);
}

.bar-fill.sp {
  background: var(--b-sp);
}

.bar-fill.chaos {
  background: var(--b-chaos);
}

.sp-mid {
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  background: var(--b-muted);
  opacity: 0.5;
}

.bar-num {
  font-size: 10px;
  color: var(--b-muted);
  min-width: 58px;
  text-align: right;
}

.unit-stats {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: var(--b-muted);
}

.staggered {
  color: var(--b-accent-2);
  font-weight: 700;
}

.panicked {
  color: #f0a090;
  font-weight: 700;
}

.low-morale {
  color: #b6a9b3;
}

.dead-tag {
  color: var(--b-enemy);
}

.unit-traits {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.trait {
  font-size: 9px;
  line-height: 1.6;
  padding: 0 4px;
  border-radius: 3px;
  border: 1px solid var(--b-border);
  background: rgba(0, 0, 0, 0.25);
  color: var(--b-muted);
  cursor: help;
}

.trait.passive {
  border-left-width: 3px;
  border-left-color: #8a5de0;
}

.trait.support {
  border-left-width: 3px;
  border-left-color: var(--b-accent-2);
}
</style>
