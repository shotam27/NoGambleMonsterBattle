<template>
  <div>
    <!-- Battle Arena -->
    <div
      v-if="playerParty.length > 0 && opponentParty.length > 0"
      class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-4 lg:mb-8"
    >
      <!-- Player Side -->
      <div class="bg-gray-800 rounded-lg p-4 lg:p-6">
        <h3 class="text-lg lg:text-xl font-bold mb-3 lg:mb-4 text-blue-400">
          あなたのパーティ
        </h3>

        <!-- Active Monster -->
        <div
          class="mb-3 lg:mb-4 p-3 lg:p-4 rounded-lg relative group border-4 overflow-hidden"
          :style="getMonsterBoxStyle(activePlayerMonster)"
        >
          <!-- Dark overlay for readability when background image is present -->
          <div
            v-if="activePlayerMonster?.id"
            class="absolute inset-0 bg-black opacity-70 pointer-events-none"
          ></div>
          <div v-if="activePlayerMonster" class="mb-2 relative z-10">
            <p class="text-xl lg:text-2xl font-bold">
              {{ activePlayerMonster.name }}
            </p>
            <p class="text-xs lg:text-sm text-gray-400">
              {{ typeLabel(activePlayerMonster.type) }}
            </p>
          </div>
          <HealthBar
            v-if="playerParty[playerActiveIndex]"
            :current="playerParty[playerActiveIndex].currentHp"
            :max="playerParty[playerActiveIndex].maxHp"
            class="relative z-10"
          />
          <div
            v-if="playerParty[playerActiveIndex]"
            class="mt-2 text-xs lg:text-sm text-center relative z-10"
          >
            {{ playerParty[playerActiveIndex].currentHp }} /
            {{ playerParty[playerActiveIndex].maxHp }} HP
            <span
              v-if="
                playerParty[playerActiveIndex].status &&
                playerParty[playerActiveIndex].status !== 'none'
              "
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold"
              :class="getStatusClass(playerParty[playerActiveIndex].status)"
            >
              {{ getStatusLabel(playerParty[playerActiveIndex].status) }}
            </span>
            <span
              v-if="playerParty[playerActiveIndex].hasSubstitute"
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-purple-600"
              title="分身状態"
            >
              🎭 分身
            </span>
            <span
              v-if="playerParty[playerActiveIndex].hasInjection"
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-green-600"
              title="注射状態"
            >
              💉 注射
            </span>
          </div>

          <!-- Stat Modifiers Display -->
          <div
            v-if="playerParty[playerActiveIndex]?.statModifiers"
            class="mt-2 flex flex-wrap gap-1 justify-center relative z-10"
          >
            <span
              v-if="playerParty[playerActiveIndex].statModifiers.attack !== 0"
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                playerParty[playerActiveIndex].statModifiers.attack > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              攻{{
                getStatModifierText(
                  playerParty[playerActiveIndex].statModifiers.attack
                )
              }}
            </span>
            <span
              v-if="playerParty[playerActiveIndex].statModifiers.defense !== 0"
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                playerParty[playerActiveIndex].statModifiers.defense > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              防{{
                getStatModifierText(
                  playerParty[playerActiveIndex].statModifiers.defense
                )
              }}
            </span>
            <span
              v-if="
                playerParty[playerActiveIndex].statModifiers.magicAttack !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                playerParty[playerActiveIndex].statModifiers.magicAttack > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              特攻{{
                getStatModifierText(
                  playerParty[playerActiveIndex].statModifiers.magicAttack
                )
              }}
            </span>
            <span
              v-if="
                playerParty[playerActiveIndex].statModifiers.magicDefense !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                playerParty[playerActiveIndex].statModifiers.magicDefense > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              特防{{
                getStatModifierText(
                  playerParty[playerActiveIndex].statModifiers.magicDefense
                )
              }}
            </span>
            <span
              v-if="playerParty[playerActiveIndex].statModifiers.speed !== 0"
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                playerParty[playerActiveIndex].statModifiers.speed > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              速{{
                getStatModifierText(
                  playerParty[playerActiveIndex].statModifiers.speed
                )
              }}
            </span>
          </div>

          <!-- Hover Stats Tooltip -->
          <div
            v-if="activePlayerMonster"
            class="absolute left-0 top-full mt-2 bg-gray-900 border-2 border-blue-500 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none min-w-max hidden lg:block"
          >
            <div class="text-sm space-y-1">
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">HP:</span>
                <span class="font-bold">{{
                  activePlayerMonster.stats.hp
                }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">攻撃:</span>
                <span class="font-bold">
                  {{ activePlayerMonster.stats.attack }}
                  <span
                    v-if="playerParty[playerActiveIndex]?.statModifiers?.attack"
                    :class="
                      getStatModifierClass(
                        playerParty[playerActiveIndex].statModifiers.attack
                      )
                    "
                  >
                    {{
                      getStatModifierText(
                        playerParty[playerActiveIndex].statModifiers.attack
                      )
                    }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">防御:</span>
                <span class="font-bold">
                  {{ activePlayerMonster.stats.defense }}
                  <span
                    v-if="
                      playerParty[playerActiveIndex]?.statModifiers?.defense
                    "
                    :class="
                      getStatModifierClass(
                        playerParty[playerActiveIndex].statModifiers.defense
                      )
                    "
                  >
                    {{
                      getStatModifierText(
                        playerParty[playerActiveIndex].statModifiers.defense
                      )
                    }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">特攻:</span>
                <span class="font-bold">
                  {{ activePlayerMonster.stats.magicAttack }}
                  <span
                    v-if="
                      playerParty[playerActiveIndex]?.statModifiers?.magicAttack
                    "
                    :class="
                      getStatModifierClass(
                        playerParty[playerActiveIndex].statModifiers.magicAttack
                      )
                    "
                  >
                    {{
                      getStatModifierText(
                        playerParty[playerActiveIndex].statModifiers.magicAttack
                      )
                    }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">特防:</span>
                <span class="font-bold">
                  {{ activePlayerMonster.stats.magicDefense }}
                  <span
                    v-if="
                      playerParty[playerActiveIndex]?.statModifiers
                        ?.magicDefense
                    "
                    :class="
                      getStatModifierClass(
                        playerParty[playerActiveIndex].statModifiers
                          .magicDefense
                      )
                    "
                  >
                    {{
                      getStatModifierText(
                        playerParty[playerActiveIndex].statModifiers
                          .magicDefense
                      )
                    }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">素早さ:</span>
                <span class="font-bold">
                  {{ activePlayerMonster.stats.speed }}
                  <span
                    v-if="playerParty[playerActiveIndex]?.statModifiers?.speed"
                    :class="
                      getStatModifierClass(
                        playerParty[playerActiveIndex].statModifiers.speed
                      )
                    "
                  >
                    {{
                      getStatModifierText(
                        playerParty[playerActiveIndex].statModifiers.speed
                      )
                    }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Party Members -->
        <div class="grid grid-cols-3 gap-1 lg:gap-2">
          <div
            v-for="(member, index) in playerParty"
            :key="index"
            :class="[
              'p-1.5 lg:p-2 rounded text-center text-xs lg:text-sm relative group cursor-pointer',
              index === playerActiveIndex ? 'bg-yellow-600' : 'bg-gray-700',
              member.isFainted ? 'opacity-50' : '',
            ]"
          >
            <div class="font-bold truncate">
              {{ member.monsterId?.name || "モンスター" }}
            </div>
            <div class="text-xs">
              {{
                member.isFainted
                  ? "ひんし"
                  : `${member.currentHp}/${member.maxHp}`
              }}
            </div>

            <!-- Hover Stats Tooltip for Party Members -->
            <div
              v-if="member.monsterId && index !== playerActiveIndex"
              class="absolute left-0 top-full mt-2 bg-gray-900 border-2 border-blue-500 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none min-w-max hidden lg:block"
            >
              <div class="text-xs space-y-1">
                <div class="font-bold mb-1">{{ member.monsterId.name }}</div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">HP:</span>
                  <span class="font-bold">{{ member.monsterId.stats.hp }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">攻撃:</span>
                  <span class="font-bold">{{
                    member.monsterId.stats.attack
                  }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">防御:</span>
                  <span class="font-bold">{{
                    member.monsterId.stats.defense
                  }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">特攻:</span>
                  <span class="font-bold">{{
                    member.monsterId.stats.magicAttack
                  }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">特防:</span>
                  <span class="font-bold">{{
                    member.monsterId.stats.magicDefense
                  }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">素早さ:</span>
                  <span class="font-bold">{{
                    member.monsterId.stats.speed
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Opponent Side -->
      <div class="bg-gray-800 rounded-lg p-4 lg:p-6">
        <h3 class="text-lg lg:text-xl font-bold mb-3 lg:mb-4 text-red-400">
          相手のパーティ
        </h3>

        <!-- Active Monster -->
        <div
          class="mb-3 lg:mb-4 p-3 lg:p-4 rounded-lg relative group border-4 overflow-hidden"
          :style="getMonsterBoxStyle(activeOpponentMonster)"
        >
          <!-- Dark overlay for readability when background image is present -->
          <div
            v-if="activeOpponentMonster?.id"
            class="absolute inset-0 bg-black opacity-70 pointer-events-none"
          ></div>
          <div v-if="activeOpponentMonster" class="mb-2 relative z-10">
            <p class="text-xl lg:text-2xl font-bold">
              {{ activeOpponentMonster.name }}
            </p>
            <p class="text-sm text-gray-400">
              {{ typeLabel(activeOpponentMonster.type) }}
            </p>
          </div>
          <HealthBar
            v-if="opponentParty[opponentActiveIndex]"
            :current="opponentParty[opponentActiveIndex].currentHp"
            :max="opponentParty[opponentActiveIndex].maxHp"
            class="relative z-10"
          />
          <div
            v-if="opponentParty[opponentActiveIndex]"
            class="mt-2 text-sm text-center relative z-10"
          >
            {{ opponentParty[opponentActiveIndex].currentHp }} /
            {{ opponentParty[opponentActiveIndex].maxHp }} HP
            <span
              v-if="
                opponentParty[opponentActiveIndex].status &&
                opponentParty[opponentActiveIndex].status !== 'none'
              "
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold"
              :class="getStatusClass(opponentParty[opponentActiveIndex].status)"
            >
              {{ getStatusLabel(opponentParty[opponentActiveIndex].status) }}
            </span>
            <span
              v-if="opponentParty[opponentActiveIndex].hasSubstitute"
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-purple-600"
              title="分身状態"
            >
              🎭 分身
            </span>
            <span
              v-if="opponentParty[opponentActiveIndex].hasInjection"
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-green-600"
              title="注射状態"
            >
              💉 注射
            </span>
          </div>

          <!-- Stat Modifiers Display -->
          <div
            v-if="opponentParty[opponentActiveIndex]?.statModifiers"
            class="mt-2 flex flex-wrap gap-1 justify-center relative z-10"
          >
            <span
              v-if="
                opponentParty[opponentActiveIndex].statModifiers.attack !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                opponentParty[opponentActiveIndex].statModifiers.attack > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              攻{{
                getStatModifierText(
                  opponentParty[opponentActiveIndex].statModifiers.attack
                )
              }}
            </span>
            <span
              v-if="
                opponentParty[opponentActiveIndex].statModifiers.defense !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                opponentParty[opponentActiveIndex].statModifiers.defense > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              防{{
                getStatModifierText(
                  opponentParty[opponentActiveIndex].statModifiers.defense
                )
              }}
            </span>
            <span
              v-if="
                opponentParty[opponentActiveIndex].statModifiers.magicAttack !==
                0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                opponentParty[opponentActiveIndex].statModifiers.magicAttack > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              特攻{{
                getStatModifierText(
                  opponentParty[opponentActiveIndex].statModifiers.magicAttack
                )
              }}
            </span>
            <span
              v-if="
                opponentParty[opponentActiveIndex].statModifiers
                  .magicDefense !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                opponentParty[opponentActiveIndex].statModifiers.magicDefense >
                0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              特防{{
                getStatModifierText(
                  opponentParty[opponentActiveIndex].statModifiers.magicDefense
                )
              }}
            </span>
            <span
              v-if="
                opponentParty[opponentActiveIndex].statModifiers.speed !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                opponentParty[opponentActiveIndex].statModifiers.speed > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              速{{
                getStatModifierText(
                  opponentParty[opponentActiveIndex].statModifiers.speed
                )
              }}
            </span>
          </div>

          <!-- Hover Stats Tooltip -->
          <div
            v-if="activeOpponentMonster"
            class="absolute right-0 top-full mt-2 bg-gray-900 border-2 border-red-500 rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none min-w-max"
          >
            <div class="text-sm space-y-1">
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">HP:</span>
                <span class="font-bold">{{
                  activeOpponentMonster.stats.hp
                }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">攻撃:</span>
                <span class="font-bold">
                  {{ activeOpponentMonster.stats.attack }}
                  <span
                    v-if="
                      opponentParty[opponentActiveIndex]?.statModifiers?.attack
                    "
                    :class="
                      getStatModifierClass(
                        opponentParty[opponentActiveIndex].statModifiers.attack
                      )
                    "
                  >
                    {{
                      getStatModifierText(
                        opponentParty[opponentActiveIndex].statModifiers.attack
                      )
                    }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">防御:</span>
                <span class="font-bold">
                  {{ activeOpponentMonster.stats.defense }}
                  <span
                    v-if="
                      opponentParty[opponentActiveIndex]?.statModifiers?.defense
                    "
                    :class="
                      getStatModifierClass(
                        opponentParty[opponentActiveIndex].statModifiers.defense
                      )
                    "
                  >
                    {{
                      getStatModifierText(
                        opponentParty[opponentActiveIndex].statModifiers.defense
                      )
                    }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">特攻:</span>
                <span class="font-bold">
                  {{ activeOpponentMonster.stats.magicAttack }}
                  <span
                    v-if="
                      opponentParty[opponentActiveIndex]?.statModifiers
                        ?.magicAttack
                    "
                    :class="
                      getStatModifierClass(
                        opponentParty[opponentActiveIndex].statModifiers
                          .magicAttack
                      )
                    "
                  >
                    {{
                      getStatModifierText(
                        opponentParty[opponentActiveIndex].statModifiers
                          .magicAttack
                      )
                    }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">特防:</span>
                <span class="font-bold">
                  {{ activeOpponentMonster.stats.magicDefense }}
                  <span
                    v-if="
                      opponentParty[opponentActiveIndex]?.statModifiers
                        ?.magicDefense
                    "
                    :class="
                      getStatModifierClass(
                        opponentParty[opponentActiveIndex].statModifiers
                          .magicDefense
                      )
                    "
                  >
                    {{
                      getStatModifierText(
                        opponentParty[opponentActiveIndex].statModifiers
                          .magicDefense
                      )
                    }}
                  </span>
                </span>
              </div>
              <div class="flex justify-between gap-4">
                <span class="text-gray-400">素早さ:</span>
                <span class="font-bold">
                  {{ activeOpponentMonster.stats.speed }}
                  <span
                    v-if="
                      opponentParty[opponentActiveIndex]?.statModifiers?.speed
                    "
                    :class="
                      getStatModifierClass(
                        opponentParty[opponentActiveIndex].statModifiers.speed
                      )
                    "
                  >
                    {{
                      getStatModifierText(
                        opponentParty[opponentActiveIndex].statModifiers.speed
                      )
                    }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Party Members -->
        <div class="grid grid-cols-3 gap-1 lg:gap-2">
          <div
            v-for="(member, index) in opponentParty"
            :key="index"
            :class="[
              'p-1.5 lg:p-2 rounded text-center text-xs lg:text-sm relative group cursor-pointer',
              index === opponentActiveIndex ? 'bg-yellow-600' : 'bg-gray-700',
              member.isFainted ? 'opacity-50' : '',
            ]"
          >
            <div class="font-bold truncate">
              {{ member.monsterId?.name || "モンスター" }}
            </div>
            <div class="text-xs">
              {{
                member.isFainted
                  ? "ひんし"
                  : `${member.currentHp}/${member.maxHp}`
              }}
            </div>

            <!-- Hover Stats Tooltip for Party Members -->
            <div
              v-if="member.monsterId && index !== opponentActiveIndex"
              class="absolute right-0 top-full mt-2 bg-gray-900 border-2 border-red-500 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none min-w-max hidden lg:block"
            >
              <div class="text-xs space-y-1">
                <div class="font-bold mb-1">{{ member.monsterId.name }}</div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">HP:</span>
                  <span class="font-bold">{{ member.monsterId.stats.hp }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">攻撃:</span>
                  <span class="font-bold">{{
                    member.monsterId.stats.attack
                  }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">防御:</span>
                  <span class="font-bold">{{
                    member.monsterId.stats.defense
                  }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">特攻:</span>
                  <span class="font-bold">{{
                    member.monsterId.stats.magicAttack
                  }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">特防:</span>
                  <span class="font-bold">{{
                    member.monsterId.stats.magicDefense
                  }}</span>
                </div>
                <div class="flex justify-between gap-3">
                  <span class="text-gray-400">素早さ:</span>
                  <span class="font-bold">{{
                    member.monsterId.stats.speed
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Battle Log -->
    <div
      v-if="battleLog && battleLog.length > 0"
      class="bg-gray-800 rounded-lg p-4 mb-8 max-h-40 overflow-y-auto"
    >
      <div
        v-for="(log, index) in battleLog.slice(-5)"
        :key="index"
        class="text-sm mb-1"
        v-html="formatBattleLog(log)"
      ></div>
    </div>

    <!-- Move Selection -->
    <div v-if="isPlayerTurn" class="bg-gray-800 rounded-lg p-4 lg:p-6">
      <h3 class="text-lg lg:text-xl font-bold mb-3 lg:mb-4">技を選択</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-4">
        <MoveButton
          v-for="move in activePlayerMonster?.moves || []"
          :key="move.id"
          :move="move"
          @click="$emit('move', move.id)"
        />
      </div>

      <!-- Switch Button - Opens modal -->
      <div class="mt-3 lg:mt-4">
        <button
          @click="$emit('open-switch-modal')"
          class="w-full px-4 py-3 lg:py-4 bg-purple-600 hover:bg-purple-700 rounded font-bold text-base lg:text-lg"
        >
          モンスターを交代する
        </button>
      </div>
    </div>

    <div v-else class="bg-gray-800 rounded-lg p-4 lg:p-6 text-center">
      <p class="text-lg lg:text-xl">相手のターン...</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  playerParty: {
    type: Array,
    required: true,
  },
  opponentParty: {
    type: Array,
    required: true,
  },
  playerActiveIndex: {
    type: Number,
    required: true,
  },
  opponentActiveIndex: {
    type: Number,
    required: true,
  },
  battleLog: {
    type: Array,
    default: () => [],
  },
  isPlayerTurn: {
    type: Boolean,
    default: true,
  },
});

defineEmits(["move", "switch", "open-switch-modal"]);

const activePlayerMonster = computed(() => {
  const member = props.playerParty[props.playerActiveIndex];
  return member?.monsterId || null;
});

const activeOpponentMonster = computed(() => {
  const member = props.opponentParty[props.opponentActiveIndex];
  return member?.monsterId || null;
});

const typeLabels = {
  fire: "炎",
  water: "水",
  grass: "草",
  normal: "無属性",
  light: "光",
  dark: "闇",
};

const typeColors = {
  fire: "#ef4444", // red-500
  water: "#3b82f6", // blue-500
  grass: "#22c55e", // green-500
  normal: "#ffffff", // white
  light: "#eab308", // yellow-500
  dark: "#a855f7", // purple-500
};

const typeLabel = (types) => {
  // 配列でない場合は配列に変換（後方互換性）
  const typeArray = Array.isArray(types) ? types : [types];

  // 各タイプをラベルに変換して結合
  return typeArray.map((type) => typeLabels[type] || type).join("/");
};

const getStatusLabel = (status) => {
  const labels = {
    poison: "毒",
    paralysis: "麻痺",
    sleep: "眠り",
    none: "",
  };
  return labels[status] || "";
};

const getStatusClass = (status) => {
  const classes = {
    poison: "bg-purple-600 text-white",
    paralysis: "bg-yellow-600 text-white",
    sleep: "bg-blue-600 text-white",
  };
  return classes[status] || "";
};

const getMonsterBoxStyle = (monster) => {
  if (!monster || !monster.type) {
    return { backgroundColor: "#1e3a8a" }; // デフォルト青
  }

  const types = Array.isArray(monster.type) ? monster.type : [monster.type];
  let style = {};

  // Border and background color
  if (types.length === 1) {
    // 単一タイプ: 全体を同じ色で
    const color = typeColors[types[0]] || "#6b7280";
    style.backgroundColor = `${color}33`; // 20%透明度
    style.borderColor = color;
  } else {
    // 複合タイプ: 左側に1タイプ目、右側に2タイプ目
    const color1 = typeColors[types[0]] || "#6b7280";
    const color2 = typeColors[types[1]] || "#6b7280";
    style.background = `linear-gradient(to right, ${color1}33 50%, ${color2}33 50%)`;
    style.borderImage = `linear-gradient(to right, ${color1} 50%, ${color2} 50%) 1`;
  }

  // Background image if available
  if (monster.id) {
    const imageUrl = `/images/monsters/${monster.id}.png`;
    style.backgroundImage = `url('${imageUrl}')`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "0 30%";
    style.backgroundRepeat = "no-repeat";
  }

  return style;
};

const getStatModifierText = (modifier) => {
  if (!modifier || modifier === 0) return "";
  return modifier > 0 ? `+${modifier}` : `${modifier}`;
};

const getStatModifierClass = (modifier) => {
  if (!modifier || modifier === 0) return "";
  return modifier > 0 ? "text-green-400 ml-1" : "text-red-400 ml-1";
};

const hasStatModifiers = (statModifiers) => {
  if (!statModifiers) return false;
  return (
    statModifiers.attack !== 0 ||
    statModifiers.defense !== 0 ||
    statModifiers.magicAttack !== 0 ||
    statModifiers.magicDefense !== 0 ||
    statModifiers.speed !== 0
  );
};

const formatBattleLog = (log) => {
  let formatted = log;

  // Replace player with blue text
  formatted = formatted.replace(
    /^player/,
    '<span class="text-blue-400 font-bold">player</span>'
  );

  // Replace enemy with red text
  formatted = formatted.replace(
    /^enemy/,
    '<span class="text-red-400 font-bold">enemy</span>'
  );

  return formatted;
};
</script>
