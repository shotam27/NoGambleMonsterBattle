<template>
  <div class="min-h-screen bg-gray-900 text-white p-4 lg:p-8">
    <div class="max-w-6xl mx-auto">
      <!-- モード選択画面 -->
      <BattleModeSelection
        v-if="currentView === 'mode-select'"
        @select-mode="handleModeSelection"
        @go-back="goBackToSelect"
      />

      <!-- マッチング画面 -->
      <MatchingLobby
        v-else-if="currentView === 'matching'"
        ref="matchingLobbyRef"
        @cancel="cancelMatching"
      />

      <!-- バトル画面 -->
      <div v-else-if="currentView === 'battle'">
        <h1 class="text-2xl lg:text-4xl font-bold mb-4 lg:mb-8 text-center">
          バトル
        </h1>

        <!-- Debug info -->
        <div class="text-center mb-4 text-yellow-400 text-xs lg:text-sm">
          Debug: loading={{ loading }}, error={{ error }}, battleState={{
            battleState ? "exists" : "null"
          }}
        </div>

        <div v-if="loading" class="text-center">
          <p class="text-xl">バトル準備中...</p>
        </div>

        <div v-else-if="error" class="text-center text-red-400">
          <p class="text-xl">{{ error }}</p>
          <button
            @click="goBackToSelect"
            class="mt-4 inline-block bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded"
          >
            モンスター選択に戻る
          </button>
        </div>

        <div v-else>
          <!-- Waiting for Opponent Modal -->
          <div
            v-if="waitingForOpponent"
            class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          >
            <div class="bg-gray-800 p-8 rounded-lg max-w-md text-center">
              <h2 class="text-2xl font-bold mb-4">通信待機中...</h2>
              <div class="mb-6">
                <div
                  class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"
                ></div>
                <p class="mt-4 text-gray-400">
                  相手のコマンド入力を待っています
                </p>
              </div>
              <button
                @click="cancelWaiting"
                class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                キャンセル
              </button>
            </div>
          </div>

          <!-- Forced Switch Modal (when monster fainted) -->
          <div
            v-if="requiresSwitch"
            class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <div
              class="bg-gray-800 p-4 lg:p-8 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto"
            >
              <h2 class="text-xl lg:text-2xl font-bold mb-3 lg:mb-4">
                {{ switchModalTitle }}
              </h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4">
                <button
                  v-for="(member, index) in playerParty"
                  :key="index"
                  :disabled="member.isFainted || index === playerActiveIndex"
                  @click="switchMonster(index)"
                  :class="[
                    'p-3 lg:p-4 rounded-lg text-left transition-colors relative group',
                    member.isFainted
                      ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                      : index === playerActiveIndex
                      ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer',
                  ]"
                >
                  <div class="font-bold text-sm lg:text-base">
                    {{ member.monsterId?.name || "モンスター" }}
                  </div>
                  <div class="text-xs lg:text-sm">
                    HP: {{ member.currentHp }} / {{ member.maxHp }}
                  </div>
                  <div
                    v-if="member.isFainted"
                    class="text-red-400 text-xs lg:text-sm"
                  >
                    ひんし
                  </div>
                  <div
                    v-else-if="index === playerActiveIndex"
                    class="text-yellow-400 text-xs lg:text-sm"
                  >
                    戦闘中
                  </div>

                  <!-- Hover Stats Tooltip -->
                  <div
                    v-if="member.monsterId"
                    class="absolute left-0 top-full mt-2 bg-gray-900 border-2 border-blue-500 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none min-w-max hidden lg:block"
                  >
                    <div class="text-sm space-y-1">
                      <div class="font-bold mb-2">
                        {{ member.monsterId.name }}
                      </div>
                      <div class="text-xs text-gray-400 mb-2">
                        {{ typeLabel(member.monsterId.type) }}
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">HP:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.hp
                        }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">攻撃:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.attack
                        }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">防御:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.defense
                        }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">特攻:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.magicAttack
                        }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">特防:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.magicDefense
                        }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">素早さ:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.speed
                        }}</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Voluntary Switch Modal (when player chooses to switch) -->
          <div
            v-if="showSwitchModal"
            class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <div
              class="bg-gray-800 p-4 lg:p-8 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto"
            >
              <h2 class="text-xl lg:text-2xl font-bold mb-3 lg:mb-4">
                交代するモンスターを選択
              </h2>
              <div
                class="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4 mb-3 lg:mb-4"
              >
                <button
                  v-for="(member, index) in playerParty"
                  :key="index"
                  :disabled="member.isFainted || index === playerActiveIndex"
                  @click="handleVoluntarySwitch(index)"
                  :class="[
                    'p-3 lg:p-4 rounded-lg text-left transition-colors relative group',
                    member.isFainted
                      ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                      : index === playerActiveIndex
                      ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer',
                  ]"
                >
                  <div class="font-bold text-sm lg:text-base">
                    {{ member.monsterId?.name || "モンスター" }}
                  </div>
                  <div class="text-xs lg:text-sm">
                    HP: {{ member.currentHp }} / {{ member.maxHp }}
                  </div>
                  <div
                    v-if="member.isFainted"
                    class="text-red-400 text-xs lg:text-sm"
                  >
                    ひんし
                  </div>
                  <div
                    v-else-if="index === playerActiveIndex"
                    class="text-yellow-400 text-xs lg:text-sm"
                  >
                    戦闘中
                  </div>

                  <!-- Hover Stats Tooltip -->
                  <div
                    v-if="member.monsterId"
                    class="absolute left-0 top-full mt-2 bg-gray-900 border-2 border-blue-500 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none min-w-max hidden lg:block"
                  >
                    <div class="text-sm space-y-1">
                      <div class="font-bold mb-2">
                        {{ member.monsterId.name }}
                      </div>
                      <div class="text-xs text-gray-400 mb-2">
                        {{ typeLabel(member.monsterId.type) }}
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">HP:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.hp
                        }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">攻撃:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.attack
                        }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">防御:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.defense
                        }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">特攻:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.magicAttack
                        }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">特防:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.magicDefense
                        }}</span>
                      </div>
                      <div class="flex justify-between gap-4">
                        <span class="text-gray-400">素早さ:</span>
                        <span class="font-bold">{{
                          member.monsterId.stats.speed
                        }}</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              <button
                @click="closeSwitchModal"
                class="w-full px-4 py-3 lg:py-4 bg-gray-600 hover:bg-gray-700 rounded text-base lg:text-lg font-bold"
              >
                キャンセル
              </button>
            </div>
          </div>

          <BattleUI
            v-if="battleState"
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
            @open-switch-modal="openSwitchModal"
          />
          <div v-else class="text-center text-gray-400">
            <p>バトルデータを読み込んでいます...</p>
          </div>

          <div
            v-if="battleState && battleState.status === 'finished'"
            class="mt-8 text-center"
          >
            <div class="bg-gray-800 p-8 rounded-lg inline-block">
              <h2 class="text-3xl font-bold mb-4">
                {{ isVictory ? "勝利！" : "敗北..." }}
              </h2>
              <button
                @click="goBackToSelect"
                class="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-6 rounded"
              >
                もう一度プレイ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { io } from "socket.io-client";

const { apiUrl, apiBaseUrl } = useApi();

console.log("mode-select.vue script loaded!");

const route = useRoute();
const router = useRouter();

const currentView = ref("mode-select");
const battleId = ref(null);
const battleMode = ref(null); // 'ai' or 'pvp'
const yourSide = ref(null); // 'player' or 'opponent'
const matchingLobbyRef = ref(null);

const loading = ref(false);
const error = ref(null);
const battleState = ref(null);
const battleLog = ref([]);
const showSwitchModal = ref(false);
const waitingForOpponent = ref(false); // 相手のアクション待機中

const requiresSwitch = computed(() => {
  // Battle is waiting for switch
  if (battleState.value?.status !== "waiting_for_switch") {
    return false;
  }

  // Check if MY active monster is fainted OR if I have pending switch after attack
  const myParty =
    yourSide.value === "player"
      ? battleState.value.player?.party
      : battleState.value.opponent?.party;
  const myActiveIndex =
    yourSide.value === "player"
      ? battleState.value.player?.activeIndex
      : battleState.value.opponent?.activeIndex;

  const myActiveMonster = myParty?.[myActiveIndex];
  const isFainted = myActiveMonster?.isFainted || false;

  // Check if I have pending switch after attack (とんぼ返りなど)
  const hasPendingSwitch =
    yourSide.value === "player"
      ? battleState.value.pendingSwitchAfterAttack?.player
      : battleState.value.pendingSwitchAfterAttack?.opponent;

  const result = isFainted || hasPendingSwitch;

  console.log("requiresSwitch computed:", {
    battleStatus: battleState.value?.status,
    yourSide: yourSide.value,
    myActiveIndex,
    isFainted: myActiveMonster?.isFainted,
    hasPendingSwitch,
    result,
  });

  return result;
});

// 交換モーダルのタイトル
const switchModalTitle = computed(() => {
  if (!battleState.value) return "モンスターを交代してください";

  const hasPendingSwitch =
    yourSide.value === "player"
      ? battleState.value.pendingSwitchAfterAttack?.player
      : battleState.value.pendingSwitchAfterAttack?.opponent;

  if (hasPendingSwitch) {
    return "交代するモンスターを選択";
  }

  return "モンスターを交代してください";
});

// 勝敗判定 - yourSideに応じて勝敗を判定
const isVictory = computed(() => {
  if (!battleState.value || battleState.value.status !== "finished") {
    return false;
  }

  // AI戦の場合は従来通り
  if (battleMode.value === "ai") {
    return battleState.value.winner === "player";
  }

  // PvP戦の場合はyourSideに応じて判定
  return battleState.value.winner === yourSide.value;
});

// yourSideに応じてプレイヤーと相手を入れ替え
const playerParty = computed(() => {
  if (!battleState.value) return [];
  const party =
    yourSide.value === "player"
      ? battleState.value.player?.party || []
      : battleState.value.opponent?.party || [];
  console.log(
    "playerParty computed - yourSide:",
    yourSide.value,
    "party size:",
    party.length
  );
  if (party.length > 0) {
    console.log(
      "Active monster isFainted:",
      party[playerActiveIndex.value]?.isFainted
    );
  }
  return party;
});

const opponentParty = computed(() => {
  if (!battleState.value) return [];
  return yourSide.value === "player"
    ? battleState.value.opponent?.party || []
    : battleState.value.player?.party || [];
});

const playerActiveIndex = computed(() => {
  if (!battleState.value) return 0;
  return yourSide.value === "player"
    ? battleState.value.player?.activeIndex || 0
    : battleState.value.opponent?.activeIndex || 0;
});

const opponentActiveIndex = computed(() => {
  if (!battleState.value) return 0;
  return yourSide.value === "player"
    ? battleState.value.opponent?.activeIndex || 0
    : battleState.value.player?.activeIndex || 0;
});

// Socket.IO接続
let socket = null;

onMounted(() => {
  // Socket.IO初期化
  console.log(`Initializing Socket.IO connection to ${apiUrl}`);
  socket = io(apiUrl);

  socket.on("connect", () => {
    console.log("Socket.IO connected! Socket ID:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error);
  });

  // マッチング成功イベント
  socket.on("match-found", async (data) => {
    console.log("Match found:", data);
    battleId.value = data.battleId;
    yourSide.value = data.yourSide;
    console.log("yourSide set to:", yourSide.value);

    // バトルデータを取得
    try {
      loading.value = true;
      console.log("Fetching PvP battle data for battleId:", battleId.value);
      const response = await fetch(
        `${apiBaseUrl}/battle/${battleId.value}/status`
      );
      if (!response.ok) throw new Error("バトルデータの取得に失敗しました");

      const result = await response.json();
      console.log("PvP battle data received:", result);
      // APIが{battle: ...}を返すか、直接バトルオブジェクトを返すか確認
      battleState.value = result.battle || result;
      console.log("battleState.value set to:", battleState.value);
      battleLog.value.push("対人戦開始！");
      currentView.value = "battle";
      console.log("currentView set to battle");
    } catch (err) {
      console.error("Error fetching PvP battle data:", err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  });

  // キュー更新イベント
  socket.on("queue-update", (data) => {
    if (matchingLobbyRef.value) {
      matchingLobbyRef.value.updateWaitingPlayers(data.waitingPlayers);
    }
  });

  // バトル更新イベント（PvP用）
  socket.on("battle-update", (data) => {
    console.log("Battle update received:", data);
    if (battleMode.value === "pvp" && data.battle) {
      battleState.value = data.battle;

      // 待機状態を解除
      waitingForOpponent.value = false;

      console.log("Updated battleState.status:", battleState.value.status);
      console.log(
        "requiresSwitch:",
        battleState.value.status === "waiting_for_switch"
      );
      console.log(
        "Player active monster isFainted:",
        battleState.value.player.party[battleState.value.player.activeIndex]
          ?.isFainted
      );
      console.log(
        "Opponent active monster isFainted:",
        battleState.value.opponent.party[battleState.value.opponent.activeIndex]
          ?.isFainted
      );

      // バトルログを追加
      if (data.battleLog) {
        for (const log of data.battleLog) {
          if (log.message) {
            battleLog.value.push(log.message);
          } else if (log.attacker) {
            battleLog.value.push(
              `${log.attacker}の${log.move}！ ${log.damage}ダメージ！`
            );
          }
        }
      }
    }
  });

  // バトル終了イベント（PvP用）
  socket.on("battle-end", (data) => {
    console.log("Battle ended:", data);
    if (data.battle) {
      battleState.value = data.battle;
    }
  });

  // アクションキャンセル完了イベント
  socket.on("action-cancelled", (data) => {
    console.log("Action cancelled:", data);
    if (data.battle) {
      battleState.value = data.battle;
      waitingForOpponent.value = false;
    }
  });

  // エラーイベント
  socket.on("error", (data) => {
    console.error("Socket error:", data);
    alert(data.message);
  });

  // 対戦相手切断イベント
  socket.on("opponent-disconnected", (data) => {
    alert(data.message);
    router.push("/select");
  });
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});

const handleModeSelection = async (mode) => {
  console.log("handleModeSelection called with mode:", mode);
  battleMode.value = mode;

  if (mode === "ai") {
    // AI戦の場合は従来通りバトル作成
    console.log("Starting AI battle...");
    await startAIBattle();
  } else if (mode === "pvp") {
    // 対人戦の場合はマッチング開始
    console.log("Starting matchmaking...");
    startMatchmaking();
  }
};

const startAIBattle = async () => {
  try {
    console.log("startAIBattle: Starting...");
    loading.value = true;

    // 全モンスターを取得
    const response = await fetch(`${apiBaseUrl}/monster`);
    const allMonsters = await response.json();
    console.log("startAIBattle: Fetched monsters, count =", allMonsters.length);

    // ランダムにプレイヤーのモンスターを選択
    const shuffledMonsters = [...allMonsters].sort(() => Math.random() - 0.5);
    const playerMonsters = shuffledMonsters.slice(0, 3);
    const opponentMonsters = shuffledMonsters.slice(3, 6);

    console.log(
      "startAIBattle: Selected player monsters =",
      playerMonsters.map((m) => m._id)
    );
    console.log(
      "startAIBattle: Selected opponent monsters =",
      opponentMonsters.map((m) => m._id)
    );

    // バトル作成
    const battleResponse = await fetch(`${apiBaseUrl}/battle/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerMonsterIds: playerMonsters.map((m) => m._id),
        opponentMonsterIds: opponentMonsters.map((m) => m._id),
      }),
    });

    if (!battleResponse.ok) throw new Error("バトルの作成に失敗しました");

    const battleData = await battleResponse.json();
    console.log("startAIBattle: Battle created, battleData =", battleData);
    battleId.value = battleData.battle._id;
    battleState.value = battleData.battle;
    console.log("startAIBattle: battleState set to", battleState.value);
    yourSide.value = "player";
    battleLog.value.push("バトル開始！");
    currentView.value = "battle";
    console.log("startAIBattle: currentView set to battle");
  } catch (err) {
    console.error("Error starting AI battle:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
    console.log("startAIBattle: loading set to false");
  }
};

const startMatchmaking = () => {
  const playerIds = route.query.playerIds.split(",");

  currentView.value = "matching";

  // マッチング開始をサーバーに通知
  socket.emit("join-matchmaking", {
    playerMonsterIds: playerIds,
  });
};

const cancelMatching = () => {
  socket.emit("cancel-matchmaking");
  currentView.value = "mode-select";
};

const goBackToSelect = () => {
  router.push("/select");
};

const executeMove = async (moveId) => {
  if (requiresSwitch.value || battleState.value.status === "finished") return;

  console.log(
    "executeMove called - battleMode:",
    battleMode.value,
    "moveId:",
    moveId
  );

  // PvP戦の場合はSocket.IOでアクションを送信
  if (battleMode.value === "pvp") {
    console.log(
      "Sending PvP move action:",
      moveId,
      "to battleId:",
      battleId.value
    );
    socket.emit("player-action", {
      battleId: battleId.value,
      action: {
        type: "move",
        moveId: moveId,
      },
    });
    // 相手の入力待ち状態に移行
    waitingForOpponent.value = true;
    return;
  }

  console.log("Using HTTP request for AI battle");
  // AI戦の場合は従来のHTTPリクエスト
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
  // PvP戦の場合はSocket.IOでアクションを送信
  if (battleMode.value === "pvp") {
    console.log("Sending PvP forced switch:", newIndex);
    socket.emit("player-action", {
      battleId: battleId.value,
      action: {
        type: "switch",
        switchToIndex: newIndex,
      },
    });
    return;
  }

  // AI戦の場合は従来のHTTPリクエスト
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

  // PvP戦の場合はSocket.IOでアクションを送信
  if (battleMode.value === "pvp") {
    console.log("Sending PvP switch action:", newIndex);
    socket.emit("player-action", {
      battleId: battleId.value,
      action: {
        type: "switch",
        switchToIndex: newIndex,
      },
    });
    // バトルが通常の交代（waiting_for_actions）の場合のみ待機状態に移行
    // 強制交代（waiting_for_switch）の場合は待機しない
    if (battleState.value.status === "waiting_for_actions") {
      waitingForOpponent.value = true;
    }
    return;
  }

  // AI戦の場合は従来のHTTPリクエスト
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

const openSwitchModal = () => {
  showSwitchModal.value = true;
};

const closeSwitchModal = () => {
  showSwitchModal.value = false;
};

const handleVoluntarySwitch = (index) => {
  executeSwitchAction(index);
  closeSwitchModal();
};

const cancelWaiting = () => {
  // アクションキャンセルをサーバーに通知
  if (socket && battleId.value) {
    socket.emit("cancel-action", {
      battleId: battleId.value,
    });
  }
  // 待機モーダルを閉じる（action-cancelledイベントで再度falseになるが念のため）
  waitingForOpponent.value = false;
};

// タイプ表示用のヘルパー関数
const typeLabels = {
  fire: "炎",
  water: "水",
  grass: "草",
  normal: "無属性",
  light: "光",
  dark: "闇",
};

const typeLabel = (types) => {
  // 配列でない場合は配列に変換（後方互換性）
  const typeArray = Array.isArray(types) ? types : [types];
  // 各タイプをラベルに変換して結合
  return typeArray.map((type) => typeLabels[type] || type).join("/");
};

useHead({
  title: "バトルモード選択 - モンスターバトル",
});
</script>
