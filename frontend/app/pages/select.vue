<template>
  <div class="min-h-screen bg-gray-900 text-white p-4 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-2xl lg:text-4xl font-bold mb-3 lg:mb-4 text-center">
        モンスターを3体選択
      </h1>
      <p class="text-center mb-4 lg:mb-8 text-sm lg:text-base text-gray-400">
        選択中: {{ selectedMonsters.length }}/3
      </p>

      <div v-if="loading" class="text-center">
        <p class="text-lg lg:text-xl">読み込み中...</p>
      </div>

      <div v-else-if="error" class="text-center text-red-400">
        <p class="text-lg lg:text-xl">{{ error }}</p>
      </div>

      <div v-else>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4"
        >
          <MonsterCard
            v-for="monster in monsters"
            :key="monster._id"
            :monster="monster"
            :isSelected="isSelected(monster._id)"
            @select="toggleMonster(monster)"
          />
        </div>

        <div class="mt-6 lg:mt-8 text-center">
          <button
            v-if="selectedMonsters.length === 3"
            @click="proceedToModeSelection"
            class="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 lg:py-4 px-6 lg:px-8 rounded-lg text-lg lg:text-xl transition-colors w-full sm:w-auto"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const { apiBaseUrl } = useApi();

const router = useRouter();
const monsters = ref([]);
const selectedMonsters = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/monster`);
    if (!response.ok) throw new Error("モンスターの取得に失敗しました");
    monsters.value = await response.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

const isSelected = (monsterId) => {
  return selectedMonsters.value.some((m) => m._id === monsterId);
};

const toggleMonster = (monster) => {
  if (isSelected(monster._id)) {
    selectedMonsters.value = selectedMonsters.value.filter(
      (m) => m._id !== monster._id
    );
  } else if (selectedMonsters.value.length < 3) {
    selectedMonsters.value.push(monster);
  }
};

const proceedToModeSelection = () => {
  // モード選択画面に遷移
  console.log("proceedToModeSelection called");
  console.log(
    "Selected monsters:",
    selectedMonsters.value.map((m) => m._id)
  );
  router.push({
    path: "/mode-select",
    query: {
      playerIds: selectedMonsters.value.map((m) => m._id).join(","),
    },
  });
  console.log("router.push executed");
};

useHead({
  title: "モンスター選択 - モンスターバトル",
});
</script>
