<template>
  <div class="relative group">
    <button
      class="text-white font-bold py-3 lg:py-4 px-4 lg:px-6 rounded-lg transition-colors w-full"
      :class="typeColor"
      @click="$emit('click')"
    >
      <div class="text-left">
        <p class="text-base lg:text-lg font-bold">{{ move.name }}</p>
        <div class="flex justify-between text-xs lg:text-sm mt-1">
          <span>威力: {{ move.power }}</span>
          <span class="uppercase">{{ typeLabel }}</span>
        </div>
        <div class="text-xs mt-1 opacity-80">
          {{ categoryLabel }}
        </div>
        <div
          v-if="move.description"
          class="text-xs mt-2 opacity-70 text-gray-200"
        >
          {{ move.description }}
        </div>
      </div>
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  move: {
    type: Object,
    required: true,
  },
});

defineEmits(["click"]);

const typeColors = {
  fire: "bg-red-600 hover:bg-red-700",
  water: "bg-blue-600 hover:bg-blue-700",
  grass: "bg-green-600 hover:bg-green-700",
  normal: "bg-gray-600 hover:bg-gray-700",
  light: "bg-yellow-600 hover:bg-yellow-700",
  dark: "bg-purple-600 hover:bg-purple-700",
};

const typeLabels = {
  fire: "炎",
  water: "水",
  grass: "草",
  normal: "無属性",
  light: "光",
  dark: "闇",
};

const categoryLabels = {
  physical: "物理",
  magical: "魔法",
};

const typeColor = computed(
  () => typeColors[props.move.type] || "bg-gray-600 hover:bg-gray-700"
);
const typeLabel = computed(
  () => typeLabels[props.move.type] || props.move.type
);
const categoryLabel = computed(
  () => categoryLabels[props.move.category] || props.move.category || "物理"
);
</script>
