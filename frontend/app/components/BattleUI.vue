<template>
  <div>
    <!-- Win Streak Display (top right) -->
    <div
      v-if="winStreak > 0"
      class="fixed top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    >
      <div class="text-sm font-bold">連勝</div>
      <div class="text-2xl font-bold text-center">{{ winStreak }}</div>
    </div>

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
          class="mb-3 lg:mb-4 p-3 lg:p-4 rounded-lg relative group border-4 overflow-hidden transition-all duration-300"
          :class="{
            'monster-attack': animatingMonster === 'player',
            'monster-damage': damagedMonster === 'player',
            'opacity-60':
              displayedPlayerParty[displayedPlayerActiveIndex]?.isFainted,
          }"
          :style="getMonsterBoxStyle(displayedActivePlayerMonster)"
        >
          <!-- Dark overlay for readability when background image is present -->
          <div
            v-if="displayedActivePlayerMonster?.id"
            class="absolute inset-0 bg-black opacity-70 pointer-events-none"
          ></div>

          <!-- ひんし表示 -->
          <div
            v-if="displayedPlayerParty[displayedPlayerActiveIndex]?.isFainted"
            class="absolute inset-0 flex items-center justify-center z-30"
          >
            <div
              class="text-4xl lg:text-5xl font-bold text-red-500 bg-black bg-opacity-80 px-6 py-3 rounded-lg shadow-2xl"
            >
              ひんし
            </div>
          </div>

          <div v-if="displayedActivePlayerMonster" class="mb-2 relative z-10">
            <p class="text-xl lg:text-2xl font-bold">
              {{ displayedActivePlayerMonster.name }}
            </p>
            <p class="text-xs lg:text-sm text-gray-400">
              {{ typeLabel(displayedActivePlayerMonster.type) }}
            </p>
          </div>
          <HealthBar
            v-if="displayedPlayerParty[displayedPlayerActiveIndex]"
            :current="displayedPlayerHp"
            :max="displayedPlayerParty[displayedPlayerActiveIndex].maxHp"
            class="relative z-10"
          />
          <div
            v-if="displayedPlayerParty[displayedPlayerActiveIndex]"
            class="mt-2 text-xs lg:text-sm text-center relative z-10"
          >
            {{ displayedPlayerHp }} /
            {{ displayedPlayerParty[displayedPlayerActiveIndex].maxHp }} HP
            <span
              v-if="
                displayedPlayerParty[displayedPlayerActiveIndex].status &&
                displayedPlayerParty[displayedPlayerActiveIndex].status !==
                  'none'
              "
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold"
              :class="
                getStatusClass(
                  displayedPlayerParty[displayedPlayerActiveIndex].status
                )
              "
            >
              {{
                getStatusLabel(
                  displayedPlayerParty[displayedPlayerActiveIndex].status
                )
              }}
            </span>
            <span
              v-if="
                displayedPlayerParty[displayedPlayerActiveIndex].hasSubstitute
              "
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-purple-600"
              title="分身状態"
            >
              🎭 分身
            </span>
            <span
              v-if="
                displayedPlayerParty[displayedPlayerActiveIndex].hasInjection
              "
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-green-600"
              title="注射状態"
            >
              💉 注射
            </span>
          </div>

          <!-- Stat Modifiers Display -->
          <div
            v-if="
              displayedPlayerParty[displayedPlayerActiveIndex]?.statModifiers
            "
            class="mt-2 flex flex-wrap gap-1 justify-center relative z-10"
          >
            <span
              v-if="
                displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                  .attack !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                  .attack > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              攻{{
                getStatModifierText(
                  displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                    .attack
                )
              }}
            </span>
            <span
              v-if="
                displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                  .defense !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                  .defense > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              防{{
                getStatModifierText(
                  displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                    .defense
                )
              }}
            </span>
            <span
              v-if="
                displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                  .magicAttack !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                  .magicAttack > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              特攻{{
                getStatModifierText(
                  displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                    .magicAttack
                )
              }}
            </span>
            <span
              v-if="
                displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                  .magicDefense !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                  .magicDefense > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              特防{{
                getStatModifierText(
                  displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                    .magicDefense
                )
              }}
            </span>
            <span
              v-if="
                displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                  .speed !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                  .speed > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              速{{
                getStatModifierText(
                  displayedPlayerParty[displayedPlayerActiveIndex].statModifiers
                    .speed
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
            v-for="(member, index) in displayedPlayerParty"
            :key="index"
            :class="[
              'p-1.5 lg:p-2 rounded text-center text-xs lg:text-sm relative group cursor-pointer',
              index === displayedPlayerActiveIndex
                ? 'bg-yellow-600'
                : 'bg-gray-700',
              member.isFainted ? 'opacity-50' : '',
            ]"
            @click="openMonsterDetail(member.monsterId)"
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
              v-if="member.monsterId && index !== displayedPlayerActiveIndex"
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
          class="mb-3 lg:mb-4 p-3 lg:p-4 rounded-lg relative group border-4 overflow-hidden transition-all duration-300"
          :class="{
            'monster-attack': animatingMonster === 'opponent',
            'monster-damage': damagedMonster === 'opponent',
            'opacity-60':
              displayedOpponentParty[displayedOpponentActiveIndex]?.isFainted,
          }"
          :style="getMonsterBoxStyle(displayedActiveOpponentMonster)"
        >
          <!-- Dark overlay for readability when background image is present -->
          <div
            v-if="displayedActiveOpponentMonster?.id"
            class="absolute inset-0 bg-black opacity-70 pointer-events-none"
          ></div>

          <!-- ひんし表示 -->
          <div
            v-if="
              displayedOpponentParty[displayedOpponentActiveIndex]?.isFainted
            "
            class="absolute inset-0 flex items-center justify-center z-30"
          >
            <div
              class="text-4xl lg:text-5xl font-bold text-red-500 bg-black bg-opacity-80 px-6 py-3 rounded-lg shadow-2xl"
            >
              ひんし
            </div>
          </div>

          <div v-if="displayedActiveOpponentMonster" class="mb-2 relative z-10">
            <p class="text-xl lg:text-2xl font-bold">
              {{ displayedActiveOpponentMonster.name }}
            </p>
            <p class="text-sm text-gray-400">
              {{ typeLabel(displayedActiveOpponentMonster.type) }}
            </p>
          </div>
          <HealthBar
            v-if="displayedOpponentParty[displayedOpponentActiveIndex]"
            :current="displayedOpponentHp"
            :max="displayedOpponentParty[displayedOpponentActiveIndex].maxHp"
            class="relative z-10"
          />
          <div
            v-if="displayedOpponentParty[displayedOpponentActiveIndex]"
            class="mt-2 text-sm text-center relative z-10"
          >
            {{ displayedOpponentHp }} /
            {{ displayedOpponentParty[displayedOpponentActiveIndex].maxHp }} HP
            <span
              v-if="
                displayedOpponentParty[displayedOpponentActiveIndex].status &&
                displayedOpponentParty[displayedOpponentActiveIndex].status !==
                  'none'
              "
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold"
              :class="
                getStatusClass(
                  displayedOpponentParty[displayedOpponentActiveIndex].status
                )
              "
            >
              {{
                getStatusLabel(
                  displayedOpponentParty[displayedOpponentActiveIndex].status
                )
              }}
            </span>
            <span
              v-if="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .hasSubstitute
              "
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-purple-600"
              title="分身状態"
            >
              🎭 分身
            </span>
            <span
              v-if="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .hasInjection
              "
              class="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-green-600"
              title="注射状態"
            >
              💉 注射
            </span>
          </div>

          <!-- Stat Modifiers Display -->
          <div
            v-if="
              displayedOpponentParty[displayedOpponentActiveIndex]
                ?.statModifiers
            "
            class="mt-2 flex flex-wrap gap-1 justify-center relative z-10"
          >
            <span
              v-if="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .statModifiers.attack !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .statModifiers.attack > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              攻{{
                getStatModifierText(
                  displayedOpponentParty[displayedOpponentActiveIndex]
                    .statModifiers.attack
                )
              }}
            </span>
            <span
              v-if="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .statModifiers.defense !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .statModifiers.defense > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              防{{
                getStatModifierText(
                  displayedOpponentParty[displayedOpponentActiveIndex]
                    .statModifiers.defense
                )
              }}
            </span>
            <span
              v-if="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .statModifiers.magicAttack !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .statModifiers.magicAttack > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              特攻{{
                getStatModifierText(
                  displayedOpponentParty[displayedOpponentActiveIndex]
                    .statModifiers.magicAttack
                )
              }}
            </span>
            <span
              v-if="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .statModifiers.magicDefense !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .statModifiers.magicDefense > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              特防{{
                getStatModifierText(
                  displayedOpponentParty[displayedOpponentActiveIndex]
                    .statModifiers.magicDefense
                )
              }}
            </span>
            <span
              v-if="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .statModifiers.speed !== 0
              "
              class="px-2 py-0.5 rounded text-xs font-bold"
              :class="
                displayedOpponentParty[displayedOpponentActiveIndex]
                  .statModifiers.speed > 0
                  ? 'bg-green-600'
                  : 'bg-red-600'
              "
            >
              速{{
                getStatModifierText(
                  displayedOpponentParty[displayedOpponentActiveIndex]
                    .statModifiers.speed
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
            v-for="(member, index) in displayedOpponentParty"
            :key="index"
            :class="[
              'p-1.5 lg:p-2 rounded text-center text-xs lg:text-sm relative group cursor-pointer',
              index === displayedOpponentActiveIndex
                ? 'bg-yellow-600'
                : 'bg-gray-700',
              member.isFainted ? 'opacity-50' : '',
            ]"
            @click="openMonsterDetail(member.monsterId)"
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
              v-if="member.monsterId && index !== displayedOpponentActiveIndex"
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
      v-if="displayedLogs && displayedLogs.length > 0"
      class="bg-gray-800 rounded-lg p-4 mb-8 max-h-40 overflow-y-auto"
    >
      <div
        v-for="(log, index) in displayedLogs.slice(-5)"
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
          :opponentTypes="activeOpponentMonster?.type"
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

    <!-- Monster Detail Modal -->
    <div
      v-if="selectedMonster"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      @click="closeMonsterDetail"
    >
      <div
        class="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <div
          class="text-center mb-4 p-4 rounded-lg border-4 relative overflow-hidden"
          :style="getMonsterCardStyle(selectedMonster)"
        >
          <!-- Dark overlay for readability -->
          <div
            v-if="selectedMonster.id"
            class="absolute inset-0 bg-black opacity-70 pointer-events-none"
          ></div>

          <div class="relative z-10">
            <h3 class="text-2xl font-bold mb-2">{{ selectedMonster.name }}</h3>
            <p
              class="text-sm uppercase tracking-wide"
              :class="getTypeTextColor(selectedMonster.type)"
            >
              {{ typeLabel(selectedMonster.type) }}
            </p>
          </div>
        </div>

        <div class="space-y-3 text-sm">
          <div class="bg-gray-700 rounded p-3">
            <h4 class="font-bold mb-2 text-yellow-400">ステータス</h4>
            <div class="space-y-1">
              <div class="flex justify-between">
                <span class="text-gray-400">HP:</span>
                <span class="font-bold">{{ selectedMonster.stats.hp }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">攻撃:</span>
                <span class="font-bold">{{
                  selectedMonster.stats.attack
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">防御:</span>
                <span class="font-bold">{{
                  selectedMonster.stats.defense
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">特攻:</span>
                <span class="font-bold">{{
                  selectedMonster.stats.magicAttack
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">特防:</span>
                <span class="font-bold">{{
                  selectedMonster.stats.magicDefense
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">素早さ:</span>
                <span class="font-bold">{{ selectedMonster.stats.speed }}</span>
              </div>
            </div>
          </div>

          <div
            v-if="selectedMonster.ability"
            class="bg-purple-900 bg-opacity-50 rounded p-3"
          >
            <h4 class="font-bold mb-1 text-purple-300">
              特性: {{ selectedMonster.ability.name }}
            </h4>
            <p class="text-gray-300 text-xs">
              {{ selectedMonster.ability.description }}
            </p>
          </div>

          <div class="bg-gray-700 rounded p-3">
            <h4 class="font-bold mb-2 text-blue-400">技</h4>
            <ul class="space-y-2">
              <li
                v-for="move in selectedMonster.moves"
                :key="move.id"
                class="p-2 rounded"
                :style="getMoveStyleForModal(move)"
              >
                <div class="font-medium">{{ move.name }}</div>
                <div class="text-xs opacity-90 mt-1">
                  威力: {{ move.power }} | {{ typeLabel(move.type) }} |
                  {{ getMoveCategoryLabel(move.category) }}
                </div>
                <div v-if="move.description" class="text-xs text-gray-300 mt-1">
                  {{ move.description }}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <button
          @click="closeMonsterDetail"
          class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

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
  winStreak: {
    type: Number,
    default: 0,
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

// 表示用のアクティブモンスター（演出タイミング制御用）
const displayedActivePlayerMonster = computed(() => {
  const member = displayedPlayerParty.value[displayedPlayerActiveIndex.value];
  return member?.monsterId || null;
});

const displayedActiveOpponentMonster = computed(() => {
  const member =
    displayedOpponentParty.value[displayedOpponentActiveIndex.value];
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

// バトルログの段階的表示用
const displayedLogs = ref([]);
const isProcessingLogs = ref(false);

// アニメーション用
const animatingMonster = ref(null);
const damagedMonster = ref(null);
const displayedPlayerHp = ref(0);
const displayedOpponentHp = ref(0);

// パーティの表示状態を管理
const displayedPlayerParty = ref([]);
const displayedOpponentParty = ref([]);
const displayedPlayerActiveIndex = ref(0);
const displayedOpponentActiveIndex = ref(0);

// 初期化とログ処理外での同期
const syncDisplayState = () => {
  if (isProcessingLogs.value) return;

  // プレイヤーパーティの同期
  if (props.playerParty && props.playerParty.length > 0) {
    displayedPlayerParty.value = JSON.parse(JSON.stringify(props.playerParty));
    displayedPlayerActiveIndex.value = props.playerActiveIndex;
    if (props.playerParty[props.playerActiveIndex]) {
      displayedPlayerHp.value =
        props.playerParty[props.playerActiveIndex].currentHp;
    }
  }

  // 相手パーティの同期
  if (props.opponentParty && props.opponentParty.length > 0) {
    displayedOpponentParty.value = JSON.parse(
      JSON.stringify(props.opponentParty)
    );
    displayedOpponentActiveIndex.value = props.opponentActiveIndex;
    if (props.opponentParty[props.opponentActiveIndex]) {
      displayedOpponentHp.value =
        props.opponentParty[props.opponentActiveIndex].currentHp;
    }
  }
};

// 初期化
watch(
  [() => props.playerParty, () => props.opponentParty],
  () => {
    if (displayedPlayerParty.value.length === 0) {
      syncDisplayState();
    }
  },
  { immediate: true, deep: true }
);

// ログ処理が終わった後に状態を同期
watch(isProcessingLogs, (processing) => {
  if (!processing) {
    syncDisplayState();
  }
});

// バトルログの段階的表示処理
watch(
  () => props.battleLog,
  async (newLogs) => {
    if (!newLogs || newLogs.length === 0) {
      displayedLogs.value = [];
      isProcessingLogs.value = false;
      return;
    }

    // 新しいログが追加された場合のみ処理
    if (newLogs.length > displayedLogs.value.length) {
      isProcessingLogs.value = true;

      // 新しいログを一行ずつ表示
      for (let i = displayedLogs.value.length; i < newLogs.length; i++) {
        const log = newLogs[i];

        // アニメーション処理
        await processLogAnimation(log);

        // ログを追加
        displayedLogs.value.push(log);

        // 0.5秒待つ
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      isProcessingLogs.value = false;
    }
  },
  { deep: true }
);

// ログに応じたアニメーションを実行
const processLogAnimation = async (log) => {
  console.log("processLogAnimation - 元のログ:", log);

  // ログを文字列に変換
  let logText = "";
  let logSide = "";

  if (typeof log === "object" && log !== null) {
    if (log.message) {
      logText = log.message;
      logSide = log.side || "";
    } else if (log.attacker && log.move) {
      logSide = log.side || "";
      logText = `${log.attacker}は${log.move}を使った！`;
      if (log.damage > 0) {
        logText += ` ${log.damage}ダメージ！`;
      }
    }
  } else {
    logText = String(log);
  }

  console.log("processLogAnimation - 変換後:", { logText, logSide });

  // 攻撃アニメーション - "playerの○○の技名！" または "enemyの○○の技名！" の形式に対応
  const attackPattern = /(player|enemy)の.+の.+！/;
  if (
    attackPattern.test(logText) &&
    !logText.includes("ひんし") &&
    !logText.includes("交代")
  ) {
    console.log("攻撃アニメーション判定: TRUE");

    // ログテキストから攻撃側を判定
    let side = logText.startsWith("player") ? "player" : "opponent";

    console.log("攻撃アニメーション - 対象側:", side);

    animatingMonster.value = side;
    await new Promise((resolve) => setTimeout(resolve, 400));
    animatingMonster.value = null;
  }

  // ダメージアニメーション - 攻撃ログに含まれる場合も対応
  if (logText.includes("ダメージ")) {
    console.log("ダメージアニメーション判定: TRUE");

    await new Promise((resolve) => setTimeout(resolve, 200));

    // ログテキストから攻撃側を判定
    let attackerSide = logText.startsWith("player") ? "player" : "enemy";

    // ダメージを受けるのは攻撃者の逆側
    const damagedSide = attackerSide === "player" ? "opponent" : "player";

    console.log(
      "ダメージアニメーション - 攻撃側:",
      attackerSide,
      "被ダメージ側:",
      damagedSide
    );

    damagedMonster.value = damagedSide;

    // HPバーのアニメーション
    if (damagedSide === "player") {
      const targetHp =
        props.playerParty[props.playerActiveIndex]?.currentHp || 0;
      animateHpChange(displayedPlayerHp, targetHp);
    } else {
      const targetHp =
        props.opponentParty[props.opponentActiveIndex]?.currentHp || 0;
      animateHpChange(displayedOpponentHp, targetHp);
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    damagedMonster.value = null;
  }

  // 回復アニメーション
  if (logText.includes("回復")) {
    let side =
      logSide === "player" ? "player" : logSide === "enemy" ? "opponent" : null;

    if (!side) {
      side = logText.startsWith("player") ? "player" : "opponent";
    }

    if (side === "player") {
      const targetHp =
        props.playerParty[props.playerActiveIndex]?.currentHp || 0;
      animateHpChange(displayedPlayerHp, targetHp);
    } else {
      const targetHp =
        props.opponentParty[props.opponentActiveIndex]?.currentHp || 0;
      animateHpChange(displayedOpponentHp, targetHp);
    }
  }

  // ひんし状態の処理
  if (logText.includes("ひんし") || logText.includes("倒れた")) {
    let side =
      logSide === "player" ? "player" : logSide === "enemy" ? "opponent" : null;

    if (!side) {
      side = logText.startsWith("player") ? "player" : "opponent";
    }

    if (side === "player") {
      const activeIndex = displayedPlayerActiveIndex.value;
      const newParty = [...displayedPlayerParty.value];
      newParty[activeIndex] = {
        ...newParty[activeIndex],
        isFainted: true,
        currentHp: 0,
      };
      displayedPlayerParty.value = newParty;
      displayedPlayerHp.value = 0;
    } else {
      const activeIndex = displayedOpponentActiveIndex.value;
      const newParty = [...displayedOpponentParty.value];
      newParty[activeIndex] = {
        ...newParty[activeIndex],
        isFainted: true,
        currentHp: 0,
      };
      displayedOpponentParty.value = newParty;
      displayedOpponentHp.value = 0;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // 交代処理
  if (logText.includes("交代") || logText.includes("出てきた")) {
    console.log("交代処理判定: TRUE");

    // 単純に現在のpropsの状態を反映（ひんし状態は保持）
    let side =
      logSide === "player" ? "player" : logSide === "enemy" ? "opponent" : null;

    if (!side) {
      side =
        logText.startsWith("player") || logText.includes("player")
          ? "player"
          : "opponent";
    }

    console.log("交代処理 - 対象側:", side);

    if (side === "player") {
      displayedPlayerActiveIndex.value = props.playerActiveIndex;
      const newParty = JSON.parse(JSON.stringify(props.playerParty));
      // ひんし状態を保持
      displayedPlayerParty.value.forEach((member, i) => {
        if (member?.isFainted) {
          newParty[i].isFainted = true;
          newParty[i].currentHp = 0;
        }
      });
      displayedPlayerParty.value = newParty;
      displayedPlayerHp.value =
        props.playerParty[props.playerActiveIndex]?.currentHp || 0;
    } else {
      displayedOpponentActiveIndex.value = props.opponentActiveIndex;
      const newParty = JSON.parse(JSON.stringify(props.opponentParty));
      // ひんし状態を保持
      displayedOpponentParty.value.forEach((member, i) => {
        if (member?.isFainted) {
          newParty[i].isFainted = true;
          newParty[i].currentHp = 0;
        }
      });
      displayedOpponentParty.value = newParty;
      displayedOpponentHp.value =
        props.opponentParty[props.opponentActiveIndex]?.currentHp || 0;
    }

    // モンスター切り替え後に少し待つ
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
};

// HP変化のアニメーション
const animateHpChange = (hpRef, targetHp) => {
  const startHp = hpRef.value;
  const diff = targetHp - startHp;
  const duration = 400; // ミリ秒
  const steps = 20;
  const stepDuration = duration / steps;
  const stepSize = diff / steps;

  let currentStep = 0;
  const interval = setInterval(() => {
    currentStep++;
    if (currentStep >= steps) {
      hpRef.value = targetHp;
      clearInterval(interval);
    } else {
      hpRef.value = Math.round(startHp + stepSize * currentStep);
    }
  }, stepDuration);
};

const formatBattleLog = (log) => {
  // オブジェクトの場合は文字列に変換
  let formatted = "";

  if (typeof log === "object" && log !== null) {
    if (log.message) {
      // messageプロパティがある場合はそれを使用
      formatted = log.message;
    } else if (log.attacker && log.move) {
      // 攻撃ログの場合
      const sidePrefix = log.side === "player" ? "player" : "enemy";
      formatted = `${sidePrefix} ${log.attacker}は${log.move}を使った！`;

      if (log.damage > 0) {
        formatted += ` ${log.damage}ダメージ！`;
      }

      if (log.statusInflicted) {
        formatted += ` ${log.statusInflicted}状態になった！`;
      }
    } else {
      // その他のオブジェクト
      formatted = JSON.stringify(log);
    }
  } else {
    formatted = String(log);
  }

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

// Monster detail modal
const selectedMonster = ref(null);

const openMonsterDetail = (monster) => {
  if (monster) {
    selectedMonster.value = monster;
  }
};

const closeMonsterDetail = () => {
  selectedMonster.value = null;
};

const getMonsterCardStyle = (monster) => {
  if (!monster || !monster.type) {
    return { backgroundColor: "#1e3a8a" };
  }

  const types = Array.isArray(monster.type) ? monster.type : [monster.type];
  let style = {};

  if (types.length === 1) {
    const color = typeColors[types[0]] || "#6b7280";
    style.borderColor = color;
  } else {
    const color1 = typeColors[types[0]] || "#6b7280";
    const color2 = typeColors[types[1]] || "#6b7280";
    style.borderImage = `linear-gradient(to right, ${color1} 50%, ${color2} 50%) 1`;
  }

  if (monster.id) {
    style.backgroundImage = `url('/images/monsters/${monster.id}.png')`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
    style.backgroundRepeat = "no-repeat";
  }

  return style;
};

const getTypeTextColor = (types) => {
  const typeTextColors = {
    fire: "text-red-400",
    water: "text-blue-400",
    grass: "text-green-400",
    normal: "text-white",
    light: "text-yellow-400",
    dark: "text-purple-400",
  };

  const typeArray = Array.isArray(types) ? types : [types];
  const firstType = typeArray[0];
  return typeTextColors[firstType] || "text-gray-400";
};

const getMoveStyleForModal = (move) => {
  const color = typeColors[move.type] || "#6b7280";
  return {
    backgroundColor: `${color}33`,
    borderLeft: `4px solid ${color}`,
  };
};

const getMoveCategoryLabel = (category) => {
  const categoryLabels = {
    physical: "物理",
    magical: "魔法",
  };
  return categoryLabels[category] || "物理";
};
</script>

<style scoped>
@keyframes monster-jump {
  0% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-25px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes monster-flash {
  0%,
  100% {
    opacity: 1;
  }
  25%,
  75% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

.monster-attack {
  animation: monster-jump 0.4s ease-in-out;
}

.monster-damage {
  animation: monster-flash 0.6s ease-in-out;
}
</style>
