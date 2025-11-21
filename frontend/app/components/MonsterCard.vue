<template>
  <div
    class="bg-gray-800 rounded-lg p-3 lg:p-4 cursor-pointer hover:bg-gray-700 transition-all border-4 relative overflow-hidden"
    :class="[{ 'ring-4 ring-yellow-400 transform scale-105': isSelected }]"
    :style="cardStyle"
    @click="$emit('select')"
  >
    <!-- Dark overlay for readability when background image is present -->
    <div
      v-if="monsterImageUrl"
      class="absolute inset-0 bg-black opacity-70 pointer-events-none"
    ></div>

    <div class="text-center mb-2 lg:mb-3 relative z-10">
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

    <div class="space-y-0.5 lg:space-y-1 text-xs lg:text-sm relative z-10">
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

    <div
      class="mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-gray-600 relative z-10"
    >
      <p class="text-xs font-semibold mb-1">技:</p>
      <ul class="text-xs space-y-0.5 lg:space-y-1">
        <li
          v-for="move in monster.moves"
          :key="move.id"
          class="p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
          :style="getMoveStyle(move)"
          @click.stop="showMoveDetail(move)"
        >
          <div class="font-medium text-xs">{{ move.name }}</div>
          <div class="text-xs opacity-90">
            威力: {{ move.power }} | {{ getMoveTypeLabel(move.type) }} |
            {{ getMoveCategoryLabel(move.category) }}
          </div>
        </li>
      </ul>
    </div>

    <!-- Move Detail Modal -->
    <div
      v-if="selectedMove"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      @click="closeModal"
    >
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full" @click.stop>
        <h3 class="text-xl font-bold mb-4">{{ selectedMove.name }}</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">威力:</span>
            <span class="font-bold">{{ selectedMove.power }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">タイプ:</span>
            <span class="font-bold">{{
              getMoveTypeLabel(selectedMove.type)
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">カテゴリー:</span>
            <span class="font-bold">{{
              getMoveCategoryLabel(selectedMove.category)
            }}</span>
          </div>
          <div
            v-if="selectedMove.description"
            class="mt-4 pt-4 border-t border-gray-600"
          >
            <p class="text-gray-300">{{ selectedMove.description }}</p>
          </div>
        </div>
        <button
          @click="closeModal"
          class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

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

const selectedMove = ref(null);

const showMoveDetail = (move) => {
  selectedMove.value = move;
};

const closeModal = () => {
  selectedMove.value = null;
};

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

const monsterImageUrl = computed(() => {
  // Check if monster has an id and construct image path
  if (props.monster.id) {
    return `/images/monsters/${props.monster.id}.png`;
  }
  return null;
});

const cardStyle = computed(() => {
  const types = getMonsterTypes.value;
  const imageUrl = monsterImageUrl.value;

  let style = {};

  // Border style
  if (types.length === 1) {
    const color = typeColors[types[0]] || "#6b7280";
    style.borderColor = color;
  } else {
    const color1 = typeColors[types[0]] || "#6b7280";
    const color2 = typeColors[types[1]] || "#6b7280";
    style.borderImage = `linear-gradient(to right, ${color1} 50%, ${color2} 50%) 1`;
  }

  // Background image if available
  if (imageUrl) {
    style.backgroundImage = `url('${imageUrl}')`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
    style.backgroundRepeat = "no-repeat";
  }

  return style;
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
