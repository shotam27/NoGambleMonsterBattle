<template>
  <div class="management-section">
    <h2>モンスター管理</h2>

    <!-- モンスター追加ボタン -->
    <div class="add-button-section">
      <button @click="openAddModal" class="btn-primary">
        新規モンスター追加
      </button>
    </div>

    <!-- モンスター一覧 -->
    <div class="list-section">
      <h3>モンスター一覧</h3>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="モンスター名で検索..."
        />
      </div>

      <div class="item-list">
        <div
          v-for="monster in filteredMonsters"
          :key="monster._id"
          class="item-card"
        >
          <div class="item-header">
            <h4>{{ monster.name }}</h4>
            <div class="item-actions">
              <button @click="editMonster(monster)" class="btn-edit">
                編集
              </button>
              <button @click="deleteMonster(monster._id)" class="btn-delete">
                削除
              </button>
            </div>
          </div>

          <div class="item-info">
            <div class="type-badges">
              <span
                v-for="(t, idx) in (monster.type || [])"
                :key="idx"
                class="type-badge"
                :class="`type-${t?.toLowerCase()}`"
              >
                {{ t }}
              </span>
            </div>

            <div class="stats-grid">
              <div class="stat">HP: {{ monster.stats?.hp || 0 }}</div>
              <div class="stat">攻撃: {{ monster.stats?.attack || 0 }}</div>
              <div class="stat">防御: {{ monster.stats?.defense || 0 }}</div>
              <div class="stat">
                特攻: {{ monster.stats?.magicAttack || 0 }}
              </div>
              <div class="stat">
                特防: {{ monster.stats?.magicDefense || 0 }}
              </div>
              <div class="stat">素早さ: {{ monster.stats?.speed || 0 }}</div>
            </div>

            <div
              v-if="monster.moves && monster.moves.length > 0"
              class="moves-info"
            >
              <strong>技:</strong>
              <span v-for="(move, idx) in monster.moves" :key="move._id || idx">
                {{ typeof move === "string" ? move : move.name
                }}<span v-if="idx < monster.moves.length - 1">, </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 追加/編集モーダル -->
    <div v-if="editingMonster" class="modal" @click.self="cancelEdit">
      <div class="modal-content">
        <h3>{{ isAddMode ? "モンスター追加" : "モンスター編集" }}</h3>
        <form @submit.prevent="saveMonster">
          <div class="form-group">
            <label>モンスターID:</label>
            <input v-model="editingMonster.id" type="text" required :disabled="!isAddMode" />
            <small v-if="isAddMode">英数字で一意のIDを入力してください（例: pikachu, charizard）</small>
          </div>

          <div class="form-group">
            <label>名前:</label>
            <input v-model="editingMonster.name" type="text" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>タイプ1:</label>
              <select v-model="editingMonster.type1" required>
                <option v-for="type in types" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>タイプ2:</label>
              <select v-model="editingMonster.type2">
                <option value="">なし</option>
                <option v-for="type in types" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row stats-row">
            <div class="form-group">
              <label>HP:</label>
              <input
                v-model.number="editingMonster.stats.hp"
                type="number"
                required
                min="1"
              />
            </div>
            <div class="form-group">
              <label>攻撃:</label>
              <input
                v-model.number="editingMonster.stats.attack"
                type="number"
                required
                min="1"
              />
            </div>
            <div class="form-group">
              <label>防御:</label>
              <input
                v-model.number="editingMonster.stats.defense"
                type="number"
                required
                min="1"
              />
            </div>
            <div class="form-group">
              <label>特攻:</label>
              <input
                v-model.number="editingMonster.stats.magicAttack"
                type="number"
                required
                min="1"
              />
            </div>
            <div class="form-group">
              <label>特防:</label>
              <input
                v-model.number="editingMonster.stats.magicDefense"
                type="number"
                required
                min="1"
              />
            </div>
            <div class="form-group">
              <label>素早さ:</label>
              <input
                v-model.number="editingMonster.stats.speed"
                type="number"
                required
                min="1"
              />
            </div>
          </div>

          <div class="form-group">
            <label>技選択（最大4つ）:</label>
            <div class="moves-selection">
              <div
                v-for="(move, index) in editingMonster.moves"
                :key="index"
                class="move-slot"
              >
                <select
                  v-model="editingMonster.moves[index]"
                  class="move-select"
                >
                  <option value="">-- 技を選択 --</option>
                  <option
                    v-for="availMove in availableMoves"
                    :key="availMove._id"
                    :value="availMove._id"
                  >
                    {{ availMove.name }} ({{ availMove.type }})
                  </option>
                </select>
                <button
                  type="button"
                  @click="clearMoveSlot(index)"
                  class="btn-clear"
                  v-if="editingMonster.moves[index]"
                >
                  ✕
                </button>
              </div>
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

const monsters = ref([]);
const availableMoves = ref([]);
const searchQuery = ref("");
const editingMonster = ref(null);
const isAddMode = ref(false);

const filteredMonsters = computed(() => {
  if (!searchQuery.value) return monsters.value;
  const query = searchQuery.value.toLowerCase();
  return monsters.value.filter((m) => m.name?.toLowerCase().includes(query));
});

const fetchMonsters = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/monster`);
    if (response.ok) {
      monsters.value = await response.json();
    } else {
      emit("message", "モンスター一覧の取得に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error fetching monsters:", error);
    emit("message", "モンスター一覧の取得に失敗しました", "error");
  }
};

const fetchMoves = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/move`);
    if (response.ok) {
      availableMoves.value = await response.json();
    }
  } catch (error) {
    console.error("Error fetching moves:", error);
  }
};

const openAddModal = () => {
  isAddMode.value = true;
  editingMonster.value = {
    id: "",
    name: "",
    type1: "",
    type2: "",
    stats: {
      hp: 50,
      attack: 50,
      defense: 50,
      magicAttack: 50,
      magicDefense: 50,
      speed: 50,
    },
    moves: ["", "", "", ""],
  };
};

const editMonster = (monster) => {
  isAddMode.value = false;
  const monsterCopy = JSON.parse(JSON.stringify(monster));

  // typeを type1, type2 に変換
  monsterCopy.type1 = monsterCopy.type?.[0] || "";
  monsterCopy.type2 = monsterCopy.type?.[1] || "";

  // movesを4枠に調整
  const moveIds = (monsterCopy.moves || []).map((m) =>
    typeof m === "string" ? m : m._id
  );
  monsterCopy.moves = [
    moveIds[0] || "",
    moveIds[1] || "",
    moveIds[2] || "",
    moveIds[3] || "",
  ];

  editingMonster.value = monsterCopy;
};

const saveMonster = async () => {
  try {
    // type1, type2 を type配列に変換
    const typeArray = [editingMonster.value.type1];
    if (editingMonster.value.type2) {
      typeArray.push(editingMonster.value.type2);
    }

    const monsterData = {
      id: editingMonster.value.id,
      name: editingMonster.value.name,
      type: typeArray,
      stats: editingMonster.value.stats,
      moves: editingMonster.value.moves.filter((m) => m !== ""),
    };

    const url = isAddMode.value
      ? `${apiBaseUrl}/monster`
      : `${apiBaseUrl}/monster/${editingMonster.value._id}`;

    const method = isAddMode.value ? "POST" : "PUT";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(monsterData),
    });

    if (response.ok) {
      emit(
        "message",
        isAddMode.value
          ? "モンスターを追加しました"
          : "モンスターを更新しました",
        "success"
      );
      await fetchMonsters();
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
    console.error("Error saving monster:", error);
    emit(
      "message",
      `モンスターの${isAddMode.value ? "追加" : "更新"}に失敗しました`,
      "error"
    );
  }
};

const deleteMonster = async (id) => {
  if (!confirm("本当にこのモンスターを削除しますか？")) return;

  try {
    const response = await fetch(`${apiBaseUrl}/monster/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      emit("message", "モンスターを削除しました", "success");
      await fetchMonsters();
    } else {
      emit("message", "削除に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error deleting monster:", error);
    emit("message", "モンスターの削除に失敗しました", "error");
  }
};

const clearMoveSlot = (index) => {
  editingMonster.value.moves[index] = "";
};

const cancelEdit = () => {
  editingMonster.value = null;
  isAddMode.value = false;
};

onMounted(() => {
  fetchMonsters();
  fetchMoves();
});
</script>

<style scoped>
@import "./adminStyles.css";
</style>
