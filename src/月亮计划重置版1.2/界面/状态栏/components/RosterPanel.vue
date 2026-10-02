<template>
  <div class="roster-panel">
    <template v-if="角色列表.length">
      <details v-for="项 in 角色列表" :key="项.键" class="roster-card">
        <summary class="roster-summary">
          <span class="roster-name">{{ 显示名称(项) }}</span>
          <span class="roster-tag">{{ 项.档案.基础信息.性别 || '未知' }}</span>
          <span class="roster-tag">{{ 项.档案.基础信息.身份 || '无' }}</span>
          <span class="title-badge">{{ 项.档案.基础信息.当前称号 || '无' }}</span>
          <span class="level-badge">Lv.{{ 项.档案.基础信息.等级 }}</span>
          <span class="rank-badge" :class="评级类(项.档案.基础信息._战力评级)">{{ 项.档案.基础信息._战力评级 }}</span>
        </summary>

        <div class="roster-body">
          <div class="vital-grid">
            <Bar
              label="HP"
              :value="项.档案.生命体征.生命值.数值"
              :max="项.档案.生命体征.生命值.上限"
              color="var(--b-hp)"
              :value-text="`${Math.round(项.档案.生命体征.生命值.数值)} / ${项.档案.生命体征.生命值.上限}`"
            />
            <Bar
              label="SP"
              :value="项.档案.生命体征.理智值.数值"
              :min="-45"
              :max="45"
              mid
              color="var(--b-sp)"
              :value-text="`${Math.round(项.档案.生命体征.理智值.数值)}`"
            />
            <Bar
              label="混乱"
              :value="项.档案.生命体征.混乱.数值"
              :max="项.档案.生命体征.混乱.阈值"
              color="var(--b-chaos)"
              :value-text="`${Math.round(项.档案.生命体征.混乱.数值)} / ${项.档案.生命体征.混乱.阈值}`"
            />
          </div>

          <div class="stat-row">
            <span class="stat">攻 <b>{{ 项.档案.战斗属性.攻击等级 }}</b><span class="muted">（+{{ 项.档案.战斗属性.攻击加成 }}）</span></span>
            <span class="stat">防 <b>{{ 项.档案.战斗属性.防御等级 }}</b><span class="muted">（+{{ 项.档案.战斗属性.防御加成 }}）</span></span>
            <span class="stat">
              速 <b>{{ 项.档案.战斗属性.速度 }}</b>
              <template v-if="项.档案.战斗属性.速度区间">（{{ 项.档案.战斗属性.速度区间.最小 }}~{{ 项.档案.战斗属性.速度区间.最大 }}）</template>
            </span>
          </div>

          <div class="sub-block">
            <div class="sub-title">状态效果</div>
            <StatusEffects :效果="项.档案.状态效果" />
          </div>

          <div class="sub-block">
            <div class="sub-title">技能</div>
            <div class="skill-names">
              <template v-if="项.档案._技能名.length">
                <span
                  v-for="名称 in 项.档案._技能名"
                  :key="名称"
                  class="skill-chip"
                  :style="{ borderLeftColor: 技能色(项.档案.技能[名称]?.罪孽) }"
                >{{ 名称 }}</span>
              </template>
              <span v-else class="empty">无</span>
            </div>
          </div>

          <div class="sub-block">
            <div class="sub-title">抗性</div>
            <Resistances :罪孽抗性="项.档案.罪孽抗性" :物理抗性="项.档案.物理抗性" />
          </div>

          <div class="sub-block">
            <div class="sub-title">穿着装备</div>
            <EquipmentPanel :装备="项.档案.穿着装备" />
          </div>
        </div>
      </details>
    </template>
    <span v-else class="empty">无</span>
  </div>
</template>

<script setup lang="ts">
import type { 角色组, 角色档案 } from '../types';
import { 罪孽颜色, type 罪孽名 } from '../constants';
import Bar from './Bar.vue';
import StatusEffects from './StatusEffects.vue';
import Resistances from './Resistances.vue';
import EquipmentPanel from './EquipmentPanel.vue';

const props = defineProps<{ 角色: 角色组 }>();

interface 角色项 {
  键: string;
  档案: 角色档案;
}

const 角色列表 = computed<角色项[]>(() => Object.entries(props.角色 ?? {}).map(([键, 档案]) => ({ 键, 档案 })));

function 显示名称(项: 角色项): string {
  return 项.档案.基础信息.名称 || 项.键 || '未知';
}

function 技能色(罪孽: string | undefined): string {
  return 罪孽 ? (罪孽颜色[罪孽 as 罪孽名] ?? 'var(--b-border)') : 'var(--b-border)';
}

function 评级类(值: string): string {
  if (值 === '色彩') return 'rank-color';
  if (值 === '一阶' || 值 === '二阶') return 'rank-high';
  if (值 === '三阶' || 值 === '四阶') return 'rank-mid';
  return 'rank-low';
}
</script>

<style scoped>
.roster-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.roster-card {
  border: 1px solid var(--b-border);
  border-left: 3px solid var(--b-accent-2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
}

.roster-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 7px 10px;
  cursor: pointer;
  list-style: none;
  font-size: 12px;
}

.roster-summary::-webkit-details-marker {
  display: none;
}

.roster-name {
  font-weight: 700;
  color: var(--b-text);
}

.roster-tag {
  font-size: 10px;
  padding: 0 5px;
  border-radius: 3px;
  border: 1px solid var(--b-border);
  color: var(--b-muted);
}

.title-badge {
  font-size: 10px;
  padding: 0 6px;
  border-radius: 8px;
  border: 1px solid var(--b-accent-2);
  color: var(--b-accent-2);
  background: rgba(217, 164, 65, 0.08);
}

.level-badge {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 8px;
  border: 1px solid var(--b-border);
  color: var(--b-muted);
}

.rank-badge {
  margin-left: auto;
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

.roster-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 10px 10px;
  border-top: 1px dashed var(--b-border);
}

.vital-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  color: var(--b-text);
}

.stat-row b {
  color: var(--b-accent-2);
  font-variant-numeric: tabular-nums;
}

.stat-row .muted {
  color: var(--b-muted);
}

.sub-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sub-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--b-muted);
  letter-spacing: 1px;
}

.skill-names {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.skill-chip {
  font-size: 11px;
  padding: 2px 7px;
  border: 1px solid var(--b-border);
  border-left-width: 3px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.25);
  color: var(--b-text);
}

.empty {
  font-size: 12px;
  color: var(--b-muted);
}
</style>
