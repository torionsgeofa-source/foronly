<template>
  <div ref="容器" class="battle-log">
    <div v-for="(行, 下标) in logs" :key="下标" class="log-line" :class="行类(行)">{{ 行 }}</div>
    <div v-if="logs.length === 0" class="log-line muted">尚无战斗记录</div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ logs: string[] }>();
const 容器 = ref<HTMLElement | null>(null);

function 行类(行: string): string {
  if (/倒下|死亡|失败|解体/.test(行)) return 'death';
  if (/暴击|拼点|压制|击碎/.test(行)) return 'clash';
  if (/烧伤|流血|破裂|沉沦|震颤|混乱|状态/.test(行)) return 'status';
  if (/第\s*\d+\s*回合/.test(行)) return 'round';
  return '';
}

watch(
  () => props.logs.length,
  () => {
    nextTick(() => {
      if (容器.value) 容器.value.scrollTop = 容器.value.scrollHeight;
    });
  },
);
</script>

<style scoped>
.battle-log {
  max-height: 150px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--b-border);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(200, 69, 47, 0.05), transparent 40%),
    #0b080b;
  font-size: 11px;
  line-height: 1.5;
  font-family: 'Consolas', 'Menlo', monospace;
}

.battle-log::-webkit-scrollbar {
  width: 6px;
}

.battle-log::-webkit-scrollbar-thumb {
  background: var(--b-border);
  border-radius: 3px;
}

.log-line {
  color: var(--b-text);
  white-space: pre-wrap;
  word-break: break-all;
  padding-left: 6px;
  border-left: 2px solid transparent;
  animation: log-in 0.28s ease;
}

@keyframes log-in {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.log-line.muted {
  color: var(--b-muted);
}

.log-line.death {
  border-left-color: var(--b-enemy);
  color: #f0a090;
}

.log-line.clash {
  border-left-color: var(--b-accent-2);
  color: #f0d48a;
}

.log-line.status {
  border-left-color: #a05de0;
  color: #c8a0f0;
}

.log-line.round {
  border-left-color: var(--b-ally);
  color: #9fc6e0;
  font-weight: 700;
}
</style>
