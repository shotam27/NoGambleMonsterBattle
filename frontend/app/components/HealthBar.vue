<template>
  <div>
    <div class="flex justify-between mb-2">
      <span class="text-sm font-semibold">HP</span>
      <span class="text-sm font-semibold">{{ current }} / {{ max }}</span>
    </div>
    <div class="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
      <div
        class="h-full transition-all duration-400 rounded-full"
        :class="hpColor"
        :style="{ width: hpPercentage + '%' }"
      >
        <div
          class="h-full w-full bg-gradient-to-r from-transparent to-white opacity-20"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  current: {
    type: Number,
    required: true,
  },
  max: {
    type: Number,
    required: true,
  },
});

const hpPercentage = computed(() => {
  return Math.max(0, Math.min(100, (props.current / props.max) * 100));
});

const hpColor = computed(() => {
  const percentage = hpPercentage.value;
  if (percentage > 50) return "bg-green-500";
  if (percentage > 25) return "bg-yellow-500";
  return "bg-red-500";
});
</script>
