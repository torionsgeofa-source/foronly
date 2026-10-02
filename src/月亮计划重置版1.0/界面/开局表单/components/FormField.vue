<template>
  <label class="form-field" :class="{ error: !!error }">
    <span class="field-label">
      {{ label }}
      <span v-if="required" class="req">*</span>
    </span>
    <input v-model="model" class="field-input" :type="type" :placeholder="placeholder" :list="listId" />
    <datalist v-if="listId" :id="listId">
      <option v-for="项 in options" :key="项" :value="项" />
    </datalist>
    <span v-if="error" class="field-error">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
const model = defineModel<string>({ default: '' });

const props = withDefaults(
  defineProps<{
    label: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
    type?: string;
    options?: string[];
  }>(),
  {
    placeholder: '',
    required: false,
    error: '',
    type: 'text',
    options: () => [],
  },
);

const 唯一Id = `field-${Math.random().toString(36).slice(2, 9)}`;
const listId = computed(() => (props.options.length ? `${唯一Id}-list` : ''));
</script>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  color: var(--b-muted);
}

.req {
  color: var(--b-accent);
  margin-left: 2px;
}

.field-input {
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--b-border);
  border-radius: 5px;
  background: #0b080b;
  color: var(--b-text);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input:focus {
  border-color: var(--b-accent-2);
  box-shadow: 0 0 0 2px rgba(217, 164, 65, 0.15);
}

.form-field.error .field-input {
  border-color: var(--b-accent);
}

.field-error {
  font-size: 10px;
  color: #e88a7c;
}
</style>
