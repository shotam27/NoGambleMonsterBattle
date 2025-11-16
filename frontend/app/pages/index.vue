<template>
  <div
    class="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex items-center justify-center p-4"
  >
    <div class="text-center text-white">
      <h1 class="text-4xl lg:text-6xl font-bold mb-6 lg:mb-8">
        モンスターバトル
      </h1>
      <p class="text-lg lg:text-2xl mb-8 lg:mb-12 px-4">
        運要素なしの戦略バトルゲーム
      </p>
      <div class="flex flex-col gap-3 lg:gap-4 items-center">
        <NuxtLink
          to="/select"
          class="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 lg:py-4 px-6 lg:px-8 rounded-lg text-lg lg:text-xl transition-colors"
        >
          ゲームスタート
        </NuxtLink>
        <NuxtLink
          to="/admin"
          class="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 lg:py-3 px-5 lg:px-6 rounded-lg text-base lg:text-lg transition-colors"
        >
          管理画面
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: "モンスターバトル - ホーム",
});
</script>
