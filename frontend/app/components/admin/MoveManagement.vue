<template>
  <div class="management-section">
    <h2>技管理</h2>

    <!-- 技追加ボタン -->
    <div class="add-button-section">
      <button @click="openAddModal" class="btn-primary">新規技追加</button>
    </div>

    <!-- 技一覧 -->
    <div class="list-section">
      <h3>技一覧</h3>
      <div class="search-box">
        <input v-model="searchQuery" type="text" placeholder="技名で検索..." />
      </div>

      <div class="item-list">
        <div v-for="move in filteredMoves" :key="move._id" class="item-card">
          <div class="item-header">
            <h4>{{ move.name }}</h4>
            <div class="item-actions">
              <button @click="editMove(move)" class="btn-edit">編集</button>
              <button @click="deleteMove(move._id)" class="btn-delete">
                削除
              </button>
            </div>
          </div>

          <div class="item-info">
            <div class="type-badges">
              <span
                class="type-badge"
                :class="`type-${move.type?.toLowerCase()}`"
                >{{ move.type }}</span
              >
              <span
                class="category-badge"
                :class="`category-${move.category}`"
                >{{ move.category }}</span
              >
            </div>

            <div class="stats-grid">
              <div class="stat">威力: {{ move.power || "-" }}</div>
              <div class="stat">優先度: {{ move.priority || 0 }}</div>
            </div>

            <div v-if="move.description" class="description">
              {{ move.description }}
            </div>

            <div v-if="move.statusEffect" class="move-effects">
              <strong>状態異常:</strong>
              {{ getStatusEffectLabel(move.statusEffect) }}
            </div>

            <div
              v-if="move.statChange && move.statChange.stat"
              class="move-effects"
            >
              <strong>能力変化:</strong>
              {{ getStatChangeLabel(move.statChange) }}
            </div>

            <div v-if="move.switchAfterAttack" class="move-effects">
              <strong>効果:</strong> とんぼがえり（攻撃後交代）
            </div>

            <div v-if="move.createsSubstitute" class="move-effects">
              <strong>効果:</strong> 身代わり
            </div>

            <div v-if="move.causesInjection" class="move-effects">
              <strong>効果:</strong> 注射
            </div>

            <div v-if="move.isProtect" class="move-effects">
              <strong>効果:</strong> まもる（ガード技）
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 追加/編集モーダル -->
    <div v-if="editingMove" class="modal" @click.self="cancelEdit">
      <div class="modal-content">
        <h3>{{ isAddMode ? "技追加" : "技編集" }}</h3>
        <form @submit.prevent="saveMove">
          <div class="form-group">
            <label>技ID:</label>
            <input
              v-model="editingMove.id"
              type="text"
              required
              :disabled="!isAddMode"
            />
            <small v-if="isAddMode"
              >英数字で一意のIDを入力してください（例: tackle,
              flamethrower）</small
            >
          </div>

          <div class="form-group">
            <label>技名:</label>
            <input v-model="editingMove.name" type="text" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>タイプ:</label>
              <select v-model="editingMove.type" required>
                <option v-for="type in types" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>分類:</label>
              <select v-model="editingMove.category" required>
                <option value="physical">物理</option>
                <option value="magical">特殊</option>
                <option value="status">変化</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>威力:</label>
              <input v-model.number="editingMove.power" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>優先度:</label>
              <input v-model.number="editingMove.priority" type="number" />
            </div>
          </div>

          <div class="form-group">
            <label>説明:</label>
            <textarea v-model="editingMove.description" rows="2"></textarea>
          </div>

          <!-- 状態異常 -->
          <div class="form-group">
            <label>状態異常:</label>
            <select v-model="editingMove.statusEffect">
              <option value="">なし</option>
              <option value="poison">毒</option>
              <option value="paralysis">麻痺</option>
              <option value="sleep">眠り</option>
            </select>
          </div>

          <!-- 能力変化 -->
          <div class="form-section-inner">
            <h4>能力変化</h4>
            <div class="form-row">
              <div class="form-group">
                <label>対象:</label>
                <select v-model="statChangeTarget">
                  <option value="">なし</option>
                  <option value="self">自分</option>
                  <option value="opponent">相手</option>
                </select>
              </div>
              <div class="form-group">
                <label>能力:</label>
                <select v-model="statChangeStat">
                  <option value="">選択してください</option>
                  <option value="attack">攻撃</option>
                  <option value="defense">防御</option>
                  <option value="magicAttack">特攻</option>
                  <option value="magicDefense">特防</option>
                  <option value="speed">素早さ</option>
                </select>
              </div>
              <div class="form-group">
                <label>段階:</label>
                <select v-model.number="statChangeStages">
                  <option value="">選択してください</option>
                  <option :value="-2">-2</option>
                  <option :value="-1">-1</option>
                  <option :value="1">+1</option>
                  <option :value="2">+2</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 特殊効果 -->
          <div class="form-section-inner">
            <h4>特殊効果</h4>
            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  v-model="editingMove.switchAfterAttack"
                />
                とんぼがえり（攻撃後交代）
              </label>
            </div>
            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  v-model="editingMove.createsSubstitute"
                />
                身代わり
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="editingMove.causesInjection" />
                注射
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="editingMove.isProtect" />
                まもる（ガード技）
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn-primary">
              {{ isAddMode ? "追加" : "更新" }}
            </button>
            <button type="button" @click="cancelEdit" class="btn-secondary">
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

const types = ["normal", "fire", "water", "grass", "light", "dark"];

const emit = defineEmits(["message"]);

const moves = ref([]);
const searchQuery = ref("");
const editingMove = ref(null);
const isAddMode = ref(false);

// 能力変化用の分離されたデータ
const statChangeTarget = ref("");
const statChangeStat = ref("");
const statChangeStages = ref("");

const filteredMoves = computed(() => {
  if (!searchQuery.value) return moves.value;
  const query = searchQuery.value.toLowerCase();
  return moves.value.filter((m) => m.name?.toLowerCase().includes(query));
});

const getStatusEffectLabel = (effect) => {
  const labels = {
    poison: "毒",
    paralysis: "麻痺",
    sleep: "眠り",
  };
  return labels[effect] || effect;
};

const getStatChangeLabel = (statChange) => {
  const targetLabels = { self: "自分", opponent: "相手" };
  const statLabels = {
    attack: "攻撃",
    defense: "防御",
    magicAttack: "特攻",
    magicDefense: "特防",
    speed: "素早さ",
  };
  const target = targetLabels[statChange.target] || statChange.target;
  const stat = statLabels[statChange.stat] || statChange.stat;
  const stages =
    statChange.stages > 0 ? `+${statChange.stages}` : statChange.stages;
  return `${target}の${stat} ${stages}段階`;
};

const fetchMoves = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/move`);
    if (response.ok) {
      moves.value = await response.json();
    } else {
      emit("message", "技一覧の取得に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error fetching moves:", error);
    emit("message", "技一覧の取得に失敗しました", "error");
  }
};

const openAddModal = () => {
  isAddMode.value = true;
  editingMove.value = {
    id: "",
    name: "",
    type: "",
    category: "physical",
    power: 0,
    priority: 0,
    description: "",
    statusEffect: "",
    switchAfterAttack: false,
    createsSubstitute: false,
    causesInjection: false,
    isProtect: false,
  };
  statChangeTarget.value = "";
  statChangeStat.value = "";
  statChangeStages.value = "";
};

const editMove = (move) => {
  isAddMode.value = false;
  editingMove.value = JSON.parse(JSON.stringify(move));

  // 能力変化データを分離
  if (move.statChange && move.statChange.stat) {
    statChangeTarget.value = move.statChange.target || "";
    statChangeStat.value = move.statChange.stat || "";
    statChangeStages.value = move.statChange.stages || "";
  } else {
    statChangeTarget.value = "";
    statChangeStat.value = "";
    statChangeStages.value = "";
  }
};

const saveMove = async () => {
  try {
    const moveData = { ...editingMove.value };

    // 能力変化データを統合
    if (
      statChangeTarget.value &&
      statChangeStat.value &&
      statChangeStages.value
    ) {
      moveData.statChange = {
        target: statChangeTarget.value,
        stat: statChangeStat.value,
        stages: statChangeStages.value,
      };
    } else {
      delete moveData.statChange;
    }

    // 空の状態異常を削除
    if (!moveData.statusEffect) {
      delete moveData.statusEffect;
    }

    const url = isAddMode.value
      ? `${apiBaseUrl}/move`
      : `${apiBaseUrl}/move/${editingMove.value._id}`;

    const method = isAddMode.value ? "POST" : "PUT";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(moveData),
    });

    if (response.ok) {
      emit(
        "message",
        isAddMode.value ? "技を追加しました" : "技を更新しました",
        "success"
      );
      await fetchMoves();
      cancelEdit();
    } else {
      const error = await response.json();
      emit(
        "message",
        `${isAddMode.value ? "追加" : "更新"}に失敗しました: ${error.message}`,
        "error"
      );
    }
  } catch (error) {
    console.error("Error saving move:", error);
    emit(
      "message",
      `技の${isAddMode.value ? "追加" : "更新"}に失敗しました`,
      "error"
    );
  }
};

const deleteMove = async (id) => {
  if (!confirm("本当にこの技を削除しますか？")) return;

  try {
    const response = await fetch(`${apiBaseUrl}/move/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      emit("message", "技を削除しました", "success");
      await fetchMoves();
    } else {
      emit("message", "削除に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error deleting move:", error);
    emit("message", "技の削除に失敗しました", "error");
  }
};

const cancelEdit = () => {
  editingMove.value = null;
  isAddMode.value = false;
  statChangeTarget.value = "";
  statChangeStat.value = "";
  statChangeStages.value = "";
};

onMounted(() => {
  fetchMoves();
});
</script>

<style scoped>
@import "./adminStyles.css";
</style>
