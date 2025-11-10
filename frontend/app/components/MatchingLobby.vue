<template>
  <div
    class="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4"
  >
    <div class="max-w-2xl w-full">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h1 class="text-4xl font-bold text-center mb-8 text-gray-800">
          マッチング中...
        </h1>

        <!-- ローディングアニメーション -->
        <div class="flex justify-center mb-8">
          <div class="relative">
            <div
              class="w-32 h-32 border-8 border-purple-200 rounded-full"
            ></div>
            <div
              class="absolute top-0 left-0 w-32 h-32 border-8 border-purple-600 rounded-full border-t-transparent animate-spin"
            ></div>
          </div>
        </div>

        <!-- 待機中のメッセージ -->
        <div class="text-center mb-8">
          <p class="text-xl text-gray-600 mb-4">対戦相手を探しています...</p>
          <p class="text-sm text-gray-500">待機中: {{ waitingTime }}秒</p>
        </div>

        <!-- 待機プレイヤー数 -->
        <div v-if="waitingPlayers > 0" class="bg-purple-50 rounded-lg p-4 mb-6">
          <p class="text-center text-purple-700">
            <span class="font-semibold">{{ waitingPlayers }}</span> 人が待機中
          </p>
        </div>

        <!-- キャンセルボタン -->
        <div class="text-center">
          <button
            @click="cancelMatching"
            class="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const emit = defineEmits(["cancel", "matched"]);

const waitingTime = ref(0);
const waitingPlayers = ref(0);
let timer = null;

onMounted(() => {
  // 待機時間カウンター
  timer = setInterval(() => {
    waitingTime.value++;
  }, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

const cancelMatching = () => {
  emit("cancel");
};

// Socket.IOから待機プレイヤー数を更新する関数
const updateWaitingPlayers = (count) => {
  waitingPlayers.value = count;
};

// 親コンポーネントから呼び出せるように公開
defineExpose({
  updateWaitingPlayers,
});
</script>
