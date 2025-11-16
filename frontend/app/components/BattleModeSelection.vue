<template>
  <div
    class="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex items-center justify-center p-4"
  >
    <div class="max-w-4xl w-full">
      <h1
        class="text-3xl lg:text-5xl font-bold text-center mb-8 lg:mb-12 text-gray-800"
      >
        バトルモード選択
      </h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
        <!-- AI戦 -->
        <button
          @click="selectMode('ai')"
          class="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
        >
          <div
            class="bg-gradient-to-br from-green-400 to-green-600 p-6 lg:p-8 h-48 lg:h-64 flex flex-col items-center justify-center"
          >
            <div class="text-white mb-3 lg:mb-4">
              <svg
                class="w-16 h-16 lg:w-24 lg:h-24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 class="text-2xl lg:text-3xl font-bold text-white mb-2">AI戦</h2>
            <p
              class="text-sm lg:text-base text-white text-opacity-90 text-center"
            >
              コンピューターと対戦
            </p>
          </div>
        </button>

        <!-- 対人戦 -->
        <button
          @click="selectMode('pvp')"
          class="group relative overflow-hidden rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
        >
          <div
            class="bg-gradient-to-br from-purple-400 to-purple-600 p-6 lg:p-8 h-48 lg:h-64 flex flex-col items-center justify-center"
          >
            <div class="text-white mb-3 lg:mb-4">
              <svg
                class="w-16 h-16 lg:w-24 lg:h-24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 class="text-2xl lg:text-3xl font-bold text-white mb-2">
              対人戦
            </h2>
            <p
              class="text-sm lg:text-base text-white text-opacity-90 text-center"
            >
              他のプレイヤーと対戦
            </p>
          </div>
        </button>
      </div>

      <!-- 戻るボタン -->
      <div class="mt-6 lg:mt-8 text-center">
        <button
          @click="goBack"
          class="w-full sm:w-auto px-6 lg:px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors text-base lg:text-lg"
        >
          戻る
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(["select-mode", "go-back"]);

const selectMode = (mode) => {
  emit("select-mode", mode);
};

const goBack = () => {
  emit("go-back");
};
</script>
