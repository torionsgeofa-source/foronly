<template>
  <div class="bar">
    <span v-if="label" class="bar-label">{{ label }}</span>
    <div class="bar-track">
      <div class="bar-fill" :class="{ warn }" :style="填充样式" />
      <div v-if="mid" class="bar-mid" />
    </div>
    <span class="bar-tail">
      <span v-if="status" class="bar-status">{{ status }}</span>
      <span v-if="valueText" class="bar-num">{{ valueText }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string;
    value: number;
    max?: number;
    min?: number;
    color?: string;
    mid?: boolean;
    status?: string;
    valueText?: string;
    warn?: boolean;
  }>(),
  { label: '', max: 100, min: 0, color: 'var(--b-accent)', mid: false, status: '', valueText: '', warn: false },
);

const 百分比 = computed(() => {
  const 区间 = props.max - props.min;
  if (区间 <= 0) return 0;
  return ((props.value - props.min) / 区间) * 100;
});

const 填充样式 = computed(() => {
  const 位置 = Math.max(0, Math.min(100, 百分比.value));
  if (props.mid) {
    const 左 = Math.min(位置, 50);
    const 宽 = Math.abs(位置 - 50);
    return { left: `${左}%`, width: `${宽}%`, background: props.color };
  }
  return { left: '0%', width: `${位置}%`, background: props.color };
});
</script>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bar-label {
  width: 32px;
  flex: 0 0 auto;
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
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
  transition: left 0.55s cubic-bezier(0.4, 0, 0.2, 1), width 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent 55%);
}

.bar-fill.warn {
  animation: bar-warn 1.1s ease-in-out infinite;
}

@keyframes bar-warn {
  0%,
  100% {
    filter: brightness(1);
    box-shadow: 0 0 0 rgba(224, 75, 58, 0);
  }
  50% {
    filter: brightness(1.45);
    box-shadow: 0 0 8px rgba(224, 75, 58, 0.85);
  }
}

.bar-mid {
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  background: var(--b-muted);
  opacity: 0.55;
}

.bar-tail {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.bar-status {
  font-size: 10px;
  color: var(--b-accent-2);
  white-space: nowrap;
}

.bar-num {
  font-size: 10px;
  color: var(--b-muted);
  min-width: 52px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
