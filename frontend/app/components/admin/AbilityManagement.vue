<template>
  <div class="management-section">
    <h2>特性管理</h2>

    <!-- 特性追加ボタン -->
    <div class="add-button-section">
      <button @click="openAddModal" class="btn-primary">新規特性追加</button>
    </div>

    <!-- 特性一覧 -->
    <div class="list-section">
      <h3>特性一覧</h3>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="特性名で検索..."
        />
      </div>

      <div class="item-list">
        <div
          v-for="ability in filteredAbilities"
          :key="ability._id"
          class="item-card"
        >
          <div class="item-header">
            <h4>{{ ability.name }}</h4>
            <div class="item-actions">
              <button @click="editAbility(ability)" class="btn-edit">
                編集
              </button>
              <button @click="deleteAbility(ability._id)" class="btn-delete">
                削除
              </button>
            </div>
          </div>

          <div class="item-info">
            <div class="type-badges">
              <span
                class="category-badge"
                :class="`effect-${ability.effectType}`"
              >
                {{
                  ability.effectType === "statChange"
                    ? "能力操作"
                    : ability.effectType === "typeResistance"
                    ? "技タイプ耐性"
                    : "回復"
                }}
              </span>
            </div>

            <div v-if="ability.description" class="description">
              {{ ability.description }}
            </div>

            <div
              v-if="ability.effectType === 'statChange' && ability.statChange"
              class="move-effects"
            >
              <strong>効果:</strong>
              {{ getStatChangeLabel(ability.statChange) }}
            </div>

            <div
              v-if="
                ability.effectType === 'typeResistance' &&
                ability.typeResistance
              "
              class="move-effects"
            >
              <strong>耐性タイプ:</strong> {{ ability.typeResistance.type }} ({{
                getMultiplierLabel(ability.typeResistance.multiplier)
              }})
            </div>

            <div
              v-if="ability.effectType === 'heal' && ability.healPercentage"
              class="move-effects"
            >
              <strong>回復量:</strong> {{ ability.healPercentage }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 追加/編集モーダル -->
    <div v-if="editingAbility" class="modal" @click.self="cancelEdit">
      <div class="modal-content">
        <h3>{{ isAddMode ? "特性追加" : "特性編集" }}</h3>
        <form @submit.prevent="saveAbility">
          <div class="form-group">
            <label>特性ID:</label>
            <input
              v-model="editingAbility.id"
              type="text"
              required
              :disabled="!isAddMode"
            />
            <small v-if="isAddMode"
              >英数字で一意のIDを入力してください（例: intimidate,
              levitate）</small
            >
          </div>

          <div class="form-group">
            <label>特性名:</label>
            <input v-model="editingAbility.name" type="text" required />
          </div>

          <div class="form-group">
            <label>発動効果:</label>
            <select
              v-model="editingAbility.effectType"
              required
              @change="onEffectTypeChange"
            >
              <option value="statChange">能力操作</option>
              <option value="typeResistance">技タイプ耐性</option>
              <option value="heal">回復</option>
            </select>
          </div>

          <!-- 能力操作の場合 -->
          <div v-if="editingAbility.effectType === 'statChange'">
            <div class="form-row">
              <div class="form-group">
                <label>対象:</label>
                <select v-model="editingAbility.statChange.targetSide" required>
                  <option value="self">自分</option>
                  <option value="opponent">相手</option>
                </select>
              </div>
              <div class="form-group">
                <label>能力:</label>
                <select v-model="editingAbility.statChange.stat" required>
                  <option value="attack">攻撃</option>
                  <option value="defense">防御</option>
                  <option value="magicAttack">魔法攻撃</option>
                  <option value="magicDefense">魔法防御</option>
                  <option value="speed">素早さ</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>段階:</label>
              <input
                v-model.number="editingAbility.statChange.stages"
                type="number"
                min="-2"
                max="2"
                required
              />
              <small>-2から+2の範囲で入力してください</small>
            </div>
          </div>

          <!-- 技タイプ耐性の場合 -->
          <div v-if="editingAbility.effectType === 'typeResistance'">
            <div class="form-row">
              <div class="form-group">
                <label>耐性タイプ:</label>
                <select v-model="editingAbility.typeResistance.type" required>
                  <option v-for="type in types" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>ダメージ倍率:</label>
                <select
                  v-model.number="editingAbility.typeResistance.multiplier"
                  required
                >
                  <option :value="0">0倍 (無効)</option>
                  <option :value="0.25">0.25倍 (1/4)</option>
                  <option :value="0.5">0.5倍 (半減)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 回復の場合 -->
          <div v-if="editingAbility.effectType === 'heal'">
            <div class="form-group">
              <label>回復量(%):</label>
              <input
                v-model.number="editingAbility.healPercentage"
                type="number"
                min="1"
                max="100"
                required
              />
              <small>1から100の範囲で入力してください</small>
            </div>
          </div>

          <div class="form-group">
            <label>説明:</label>
            <textarea
              v-model="editingAbility.description"
              rows="3"
              required
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">保存</button>
            <button type="button" @click="cancelEdit" class="btn-cancel">
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const { apiBaseUrl } = useApi();

const emit = defineEmits(["message"]);

const abilities = ref([]);
const searchQuery = ref("");
const editingAbility = ref(null);
const isAddMode = ref(false);

const types = ["fire", "water", "grass", "normal", "light", "dark"];

const filteredAbilities = computed(() => {
  if (!searchQuery.value) return abilities.value;
  return abilities.value.filter((ability) =>
    ability.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const fetchAbilities = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/ability`);
    if (response.ok) {
      abilities.value = await response.json();
    } else {
      emit("message", "特性の取得に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error fetching abilities:", error);
    emit("message", "特性の取得に失敗しました", "error");
  }
};

const openAddModal = () => {
  isAddMode.value = true;
  editingAbility.value = {
    id: "",
    name: "",
    effectType: "statChange",
    statChange: {
      targetSide: "self",
      stat: "attack",
      stages: 1,
    },
    typeResistance: {
      type: "fire",
      multiplier: 0.5,
    },
    healPercentage: 25,
    description: "",
  };
};

const editAbility = (ability) => {
  isAddMode.value = false;
  editingAbility.value = {
    ...ability,
    statChange: ability.statChange || {
      targetSide: "self",
      stat: "attack",
      stages: 1,
    },
  };
};

const onEffectTypeChange = () => {
  if (editingAbility.value.effectType === "statChange") {
    editingAbility.value.statChange = {
      targetSide: "self",
      stat: "attack",
      stages: 1,
    };
    editingAbility.value.typeResistance = null;
    editingAbility.value.healPercentage = null;
  } else if (editingAbility.value.effectType === "typeResistance") {
    editingAbility.value.typeResistance = {
      type: "fire",
      multiplier: 0.5,
    };
    editingAbility.value.statChange = null;
    editingAbility.value.healPercentage = null;
  } else if (editingAbility.value.effectType === "heal") {
    editingAbility.value.healPercentage = 25;
    editingAbility.value.statChange = null;
    editingAbility.value.typeResistance = null;
  }
};

const saveAbility = async () => {
  try {
    const abilityData = {
      ...editingAbility.value,
    };

    // effectTypeに応じて不要なフィールドを削除
    if (abilityData.effectType === "statChange") {
      delete abilityData.typeResistance;
      delete abilityData.healPercentage;
    } else if (abilityData.effectType === "typeResistance") {
      delete abilityData.statChange;
      delete abilityData.healPercentage;
    } else if (abilityData.effectType === "heal") {
      delete abilityData.statChange;
      delete abilityData.typeResistance;
    }

    const url = isAddMode.value
      ? `${apiBaseUrl}/ability`
      : `${apiBaseUrl}/ability/${editingAbility.value._id}`;

    const method = isAddMode.value ? "POST" : "PUT";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(abilityData),
    });

    if (response.ok) {
      emit(
        "message",
        isAddMode.value ? "特性を追加しました" : "特性を更新しました"
      );
      await fetchAbilities();
      cancelEdit();
    } else {
      emit("message", "保存に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error saving ability:", error);
    emit("message", "保存に失敗しました: " + error.message, "error");
  }
};

const deleteAbility = async (id) => {
  if (!confirm("この特性を削除してもよろしいですか？")) return;

  try {
    const response = await fetch(`${apiBaseUrl}/ability/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      emit("message", "特性を削除しました");
      await fetchAbilities();
    } else {
      emit("message", "削除に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error deleting ability:", error);
    emit("message", "削除に失敗しました", "error");
  }
};

const cancelEdit = () => {
  editingAbility.value = null;
  isAddMode.value = false;
};

const getStatChangeLabel = (statChange) => {
  if (!statChange) return "";

  const targetLabel = statChange.targetSide === "self" ? "自分" : "相手";
  const statLabels = {
    attack: "攻撃",
    defense: "防御",
    magicAttack: "魔法攻撃",
    magicDefense: "魔法防御",
    speed: "素早さ",
  };
  const statLabel = statLabels[statChange.stat] || statChange.stat;
  const stageLabel =
    statChange.stages > 0
      ? `${statChange.stages}段階上げる`
      : `${Math.abs(statChange.stages)}段階下げる`;

  return `${targetLabel}の${statLabel}を${stageLabel}`;
};

const getMultiplierLabel = (multiplier) => {
  if (multiplier === 0) return "無効";
  if (multiplier === 0.25) return "1/4";
  if (multiplier === 0.5) return "半減";
  return String(multiplier);
};

onMounted(() => {
  fetchAbilities();
});
</script>

<style scoped src="./adminStyles.css"></style>
