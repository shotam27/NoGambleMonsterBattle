<template>
  <div
    class="bg-gray-800 rounded-lg p-3 lg:p-4 cursor-pointer hover:bg-gray-700 transition-all border-4 relative overflow-hidden"
    :class="[{ 'ring-4 ring-yellow-400 transform scale-105': isSelected }]"
    :style="borderStyle"
    @click="$emit('select')"
  >
    <div class="text-center mb-2 lg:mb-3 relative">
      <div
        v-if="isSelected"
        class="absolute -top-2 -right-2 bg-yellow-500 text-gray-900 rounded-full w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center font-bold z-10 text-sm lg:text-base"
      >
        ✓
      </div>
      <h3 class="text-lg lg:text-xl font-bold">{{ monster.name }}</h3>
      <p class="text-xs uppercase tracking-wide" :class="typeTextColor">
        {{ typeLabel }}
      </p>
    </div>

    <div class="space-y-0.5 lg:space-y-1 text-xs lg:text-sm">
      <div class="flex justify-between">
        <span>HP:</span>
        <span class="font-bold">{{ monster.stats.hp }}</span>
      </div>
      <div class="flex justify-between">
        <span>攻撃:</span>
        <span class="font-bold">{{ monster.stats.attack }}</span>
      </div>
      <div class="flex justify-between">
        <span>防御:</span>
        <span class="font-bold">{{ monster.stats.defense }}</span>
      </div>
      <div class="flex justify-between">
        <span>特攻:</span>
        <span class="font-bold">{{ monster.stats.magicAttack }}</span>
      </div>
      <div class="flex justify-between">
        <span>特防:</span>
        <span class="font-bold">{{ monster.stats.magicDefense }}</span>
      </div>
      <div class="flex justify-between">
        <span>素早さ:</span>
        <span class="font-bold">{{ monster.stats.speed }}</span>
      </div>
    </div>

    <div class="mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-gray-600">
      <p class="text-xs font-semibold mb-1">技:</p>
      <ul class="text-xs space-y-0.5 lg:space-y-1">
        <li
          v-for="move in monster.moves"
          :key="move.id"
          class="p-1 rounded"
          :style="getMoveStyle(move)"
        >
          <div class="font-medium text-xs">{{ move.name }}</div>
          <div class="text-xs opacity-90">
            威力: {{ move.power }} | {{ getMoveTypeLabel(move.type) }} |
            {{ getMoveCategoryLabel(move.category) }}
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  monster: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["select"]);

const typeColors = {
  fire: "#ef4444", // red-500
  water: "#3b82f6", // blue-500
  grass: "#22c55e", // green-500
  normal: "#ffffff", // white
  light: "#eab308", // yellow-500
  dark: "#a855f7", // purple-500
};

const typeTextColors = {
  fire: "text-red-400",
  water: "text-blue-400",
  grass: "text-green-400",
  normal: "text-white",
  light: "text-yellow-400",
  dark: "text-purple-400",
};

const typeLabels = {
  fire: "炎",
  water: "水",
  grass: "草",
  normal: "無属性",
  light: "光",
  dark: "闇",
};

const getMonsterTypes = computed(() => {
  // 配列でない場合は配列に変換（後方互換性）
  return Array.isArray(props.monster.type)
    ? props.monster.type
    : [props.monster.type];
});

const borderStyle = computed(() => {
  const types = getMonsterTypes.value;

  if (types.length === 1) {
    // 単一タイプ: 全体を同じ色で
    const color = typeColors[types[0]] || "#6b7280"; // gray-500
    return {
      borderColor: color,
    };
  } else {
    // 複合タイプ: 左側に1タイプ目、右側に2タイプ目
    const color1 = typeColors[types[0]] || "#6b7280";
    const color2 = typeColors[types[1]] || "#6b7280";
    return {
      borderImage: `linear-gradient(to right, ${color1} 50%, ${color2} 50%) 1`,
    };
  }
});

const typeTextColor = computed(() => {
  // 複合タイプの場合は最初のタイプの色を使用
  const firstType = getMonsterTypes.value[0];
  return typeTextColors[firstType] || "text-gray-400";
});

const typeLabel = computed(() => {
  // 各タイプをラベルに変換して結合
  return getMonsterTypes.value
    .map((type) => typeLabels[type] || type)
    .join("/");
});

const getMoveTypeLabel = (moveType) => {
  return typeLabels[moveType] || moveType;
};

const getMoveCategoryLabel = (category) => {
  const categoryLabels = {
    physical: "物理",
    magical: "魔法",
  };
  return categoryLabels[category] || "物理";
};

const getMoveStyle = (move) => {
  const color = typeColors[move.type] || "#6b7280";
  return {
    backgroundColor: `${color}33`, // 20%透明度
    borderLeft: `4px solid ${color}`,
  };
};
</script>
