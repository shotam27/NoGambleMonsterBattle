<template>
  <div class="min-h-screen bg-gray-900 text-white p-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-4xl font-bold mb-8 text-center">バトル</h1>

      <div v-if="loading" class="text-center">
        <p class="text-xl">バトル準備中...</p>
      </div>

      <div v-else-if="error" class="text-center text-red-400">
        <p class="text-xl">{{ error }}</p>
        <NuxtLink
          to="/select"
          class="mt-4 inline-block bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded"
        >
          モンスター選択に戻る
        </NuxtLink>
      </div>

      <div v-else-if="battleState">
        <!-- Switch Modal -->
        <div
          v-if="requiresSwitch"
          class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        >
          <div class="bg-gray-800 p-8 rounded-lg max-w-2xl">
            <h2 class="text-2xl font-bold mb-4">
              モンスターを交代してください
            </h2>
            <div class="grid grid-cols-2 gap-4">
              <button
                v-for="(member, index) in playerParty"
                :key="index"
                :disabled="member.isFainted || index === playerActiveIndex"
                @click="switchMonster(index)"
                :class="[
                  'p-4 rounded-lg text-left transition-colors',
                  member.isFainted
                    ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                    : index === playerActiveIndex
                    ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer',
                ]"
              >
                <div class="font-bold">
                  {{ member.monsterId?.name || "モンスター" }}
                </div>
                <div class="text-sm">
                  HP: {{ member.currentHp }} / {{ member.maxHp }}
                </div>
                <div v-if="member.isFainted" class="text-red-400 text-sm">
                  ひんし
                </div>
                <div
                  v-else-if="index === playerActiveIndex"
                  class="text-yellow-400 text-sm"
                >
                  戦闘中
                </div>
              </button>
            </div>
          </div>
        </div>

        <BattleUI
          :playerParty="playerParty"
          :opponentParty="opponentParty"
          :playerActiveIndex="playerActiveIndex"
          :opponentActiveIndex="opponentActiveIndex"
          :battleLog="battleLog"
          :isPlayerTurn="
            !requiresSwitch && battleState.status === 'waiting_for_actions'
          "
          @move="executeMove"
          @switch="executeSwitchAction"
        />

        <div v-if="battleState.status === 'finished'" class="mt-8 text-center">
          <div class="bg-gray-800 p-8 rounded-lg inline-block">
            <h2 class="text-3xl font-bold mb-4">
              {{ battleState.winner === "player" ? "勝利！" : "敗北..." }}
            </h2>
            <NuxtLink
              to="/select"
              class="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-6 rounded"
            >
              もう一度プレイ
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";

const { apiBaseUrl } = useApi();

const route = useRoute();
const loading = ref(true);
const error = ref(null);
const battleState = ref(null);
const battleLog = ref([]);

const requiresSwitch = computed(() => {
  return battleState.value?.status === "waiting_for_switch";
});

const battleId = computed(() => battleState.value?._id);
const playerParty = computed(() => battleState.value?.player?.party || []);
const opponentParty = computed(() => battleState.value?.opponent?.party || []);
const playerActiveIndex = computed(
  () => battleState.value?.player?.activeIndex || 0
);
const opponentActiveIndex = computed(
  () => battleState.value?.opponent?.activeIndex || 0
);

onMounted(async () => {
  try {
    const playerIds = route.query.playerIds?.split(",");
    const opponentIds = route.query.opponentIds?.split(",");

    if (
      !playerIds ||
      !opponentIds ||
      playerIds.length !== 3 ||
      opponentIds.length !== 3
    ) {
      throw new Error("3体のモンスターを選択してください");
    }

    // Start battle
    const response = await fetch("${apiBaseUrl}/battle/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerMonsterIds: playerIds,
        opponentMonsterIds: opponentIds,
      }),
    });

    if (!response.ok) throw new Error("バトルの開始に失敗しました");

    const data = await response.json();
    battleState.value = data.battle;
    console.log("Battle started:", data.battle);
    console.log("Player party:", data.battle?.player?.party);
    console.log(
      "First player statModifiers:",
      data.battle?.player?.party[0]?.statModifiers
    );
    battleLog.value.push("バトル開始！");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

const executeMove = async (moveId) => {
  if (requiresSwitch.value || battleState.value.status === "finished") return;

  try {
    const response = await fetch(
      `${apiBaseUrl}/battle/${battleId.value}/action`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "move",
          moveId,
        }),
      }
    );

    if (!response.ok) throw new Error("技の実行に失敗しました");

    const result = await response.json();

    // Update battle state
    battleState.value = result.battle;

    console.log("After move - battle state:", result.battle);
    console.log(
      "After move - Player statModifiers:",
      result.battle?.player?.party[0]?.statModifiers
    );

    // Add to battle log
    if (result.battleLog) {
      for (const log of result.battleLog) {
        if (log.message) {
          battleLog.value.push(log.message);
        } else if (log.attacker) {
          battleLog.value.push(
            `${log.attacker}の${log.move}！ ${log.damage}ダメージ！`
          );
        }
      }
    }

    if (result.message) {
      battleLog.value.push(result.message);
    }
  } catch (err) {
    error.value = err.message;
  }
};

const switchMonster = async (newIndex) => {
  try {
    const response = await fetch(
      `${apiBaseUrl}/battle/${battleId.value}/switch`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newIndex }),
      }
    );

    if (!response.ok) throw new Error("交代に失敗しました");

    const result = await response.json();
    battleState.value = result.battle;

    const monsterName =
      playerParty.value[newIndex]?.monsterId?.name || "モンスター";
    battleLog.value.push(`${monsterName}に交代した！`);
  } catch (err) {
    error.value = err.message;
  }
};

const executeSwitchAction = async (newIndex) => {
  if (battleState.value.status === "finished") return;

  try {
    const response = await fetch(
      `${apiBaseUrl}/battle/${battleId.value}/action`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "switch",
          switchToIndex: newIndex,
        }),
      }
    );

    if (!response.ok) throw new Error("交代に失敗しました");

    const result = await response.json();

    // Update battle state
    battleState.value = result.battle;

    const monsterName =
      playerParty.value[newIndex]?.monsterId?.name || "モンスター";
    battleLog.value.push(`${monsterName}に交代した！`);

    // Add to battle log
    if (result.battleLog) {
      for (const log of result.battleLog) {
        if (log.message) {
          battleLog.value.push(log.message);
        } else if (log.attacker) {
          battleLog.value.push(
            `${log.attacker}の${log.move}！ ${log.damage}ダメージ！`
          );
        }
      }
    }

    if (result.message) {
      battleLog.value.push(result.message);
    }
  } catch (err) {
    error.value = err.message;
  }
};

useHead({
  title: "バトル - モンスターバトル",
});
</script>
