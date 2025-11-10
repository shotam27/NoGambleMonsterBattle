<template>
  <div
    class="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex items-center justify-center"
  >
    <div class="text-center text-white">
      <h1 class="text-6xl font-bold mb-8">モンスターバトル</h1>
      <p class="text-2xl mb-12">運要素なしの戦略バトルゲーム</p>
      <div class="flex flex-col gap-4 items-center">
        <NuxtLink
          to="/select"
          class="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-lg text-xl transition-colors"
        >
          ゲームスタート
        </NuxtLink>
        <NuxtLink
          to="/admin"
          class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
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
