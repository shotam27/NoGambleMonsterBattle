<template>
  <div class="admin-container">
    <h1>管理画面</h1>

    <!-- タブ切り替え -->
    <div class="tabs">
      <button
        :class="{ active: activeTab === 'monsters' }"
        @click="activeTab = 'monsters'"
      >
        モンスター管理
      </button>
      <button
        :class="{ active: activeTab === 'moves' }"
        @click="activeTab = 'moves'"
      >
        技管理
      </button>
    </div>

    <!-- モンスター管理タブ -->
    <div v-if="activeTab === 'monsters'" class="tab-content">
      <h2>モンスター管理</h2>

      <!-- モンスター追加フォーム -->
      <div class="form-section">
        <h3>新規モンスター追加</h3>
        <form @submit.prevent="addMonster">
          <div class="form-group">
            <label>名前:</label>
            <input v-model="newMonster.name" type="text" required />
          </div>

          <div class="form-group">
            <label>タイプ1:</label>
            <select v-model="newMonster.type1" required>
              <option value="">選択してください</option>
              <option v-for="type in types" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>タイプ2:</label>
            <select v-model="newMonster.type2">
              <option value="">なし</option>
              <option v-for="type in types" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>HP:</label>
            <input
              v-model.number="newMonster.stats.hp"
              type="number"
              required
              min="1"
            />
          </div>

          <div class="form-group">
            <label>攻撃:</label>
            <input
              v-model.number="newMonster.stats.attack"
              type="number"
              required
              min="1"
            />
          </div>

          <div class="form-group">
            <label>防御:</label>
            <input
              v-model.number="newMonster.stats.defense"
              type="number"
              required
              min="1"
            />
          </div>

          <div class="form-group">
            <label>特攻:</label>
            <input
              v-model.number="newMonster.stats.magicAttack"
              type="number"
              required
              min="1"
            />
          </div>

          <div class="form-group">
            <label>特防:</label>
            <input
              v-model.number="newMonster.stats.magicDefense"
              type="number"
              required
              min="1"
            />
          </div>

          <div class="form-group">
            <label>素早さ:</label>
            <input
              v-model.number="newMonster.stats.speed"
              type="number"
              required
              min="1"
            />
          </div>

          <div class="form-group">
            <label>覚える技:</label>
            <select
              v-model="newMonster.selectedMoves"
              multiple
              size="10"
              class="move-select"
            >
              <option v-for="move in moves" :key="move._id" :value="move._id">
                {{ move.name }} ({{ move.type }})
              </option>
            </select>
            <small>Ctrlキーを押しながらクリックで複数選択</small>
          </div>

          <button type="submit" class="btn-primary">モンスターを追加</button>
        </form>
      </div>

      <!-- モンスター一覧 -->
      <div class="list-section">
        <h3>モンスター一覧</h3>
        <div class="search-box">
          <input
            v-model="monsterSearchQuery"
            type="text"
            placeholder="モンスター名で検索..."
          />
        </div>

        <div class="monster-list">
          <div
            v-for="monster in filteredMonsters"
            :key="monster._id"
            class="monster-card"
          >
            <div class="monster-header">
              <h4>{{ monster.name }}</h4>
              <div class="monster-actions">
                <button @click="editMonster(monster)" class="btn-edit">
                  編集
                </button>
                <button @click="deleteMonster(monster._id)" class="btn-delete">
                  削除
                </button>
              </div>
            </div>

            <div class="monster-info">
              <div class="monster-types">
                <span
                  class="type-badge"
                  :class="`type-${monster.type1?.toLowerCase()}`"
                >
                  {{ monster.type1 }}
                </span>
                <span
                  v-if="monster.type2"
                  class="type-badge"
                  :class="`type-${monster.type2?.toLowerCase()}`"
                >
                  {{ monster.type2 }}
                </span>
              </div>

              <div class="monster-stats">
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
                class="monster-moves"
                v-if="monster.moves && monster.moves.length > 0"
              >
                <strong>覚える技:</strong>
                <span v-for="(move, idx) in monster.moves" :key="move._id">
                  {{ move.name
                  }}<span v-if="idx < monster.moves.length - 1">, </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- モンスター編集モーダル -->
      <div v-if="editingMonster" class="modal" @click.self="cancelEdit">
        <div class="modal-content">
          <h3>モンスター編集</h3>
          <form @submit.prevent="updateMonster">
            <div class="form-group">
              <label>名前:</label>
              <input v-model="editingMonster.name" type="text" required />
            </div>

            <div class="form-group">
              <label>タイプ1:</label>
              <select v-model="editingMonster.type1" required>
                <option value="">選択してください</option>
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
                v-model.number="editingMonster.stats.spAttack"
                type="number"
                required
                min="1"
              />
            </div>

            <div class="form-group">
              <label>特防:</label>
              <input
                v-model.number="editingMonster.stats.spDefense"
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

            <div class="form-group">
              <label>特性:</label>
              <input v-model="editingMonster.ability" type="text" required />
            </div>

            <div class="form-group">
              <label>画像URL:</label>
              <input v-model="editingMonster.imageUrl" type="text" />
            </div>

            <div class="form-group">
              <label>覚える技（カンマ区切り）:</label>
              <input
                v-model="editingMonsterMoves"
                type="text"
                placeholder="例: たいあたり,ひっかく,かみつく"
              />
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn-primary">更新</button>
              <button type="button" @click="cancelEdit" class="btn-secondary">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 技管理タブ -->
    <div v-if="activeTab === 'moves'" class="tab-content">
      <h2>技管理</h2>

      <!-- 技追加フォーム -->
      <div class="form-section">
        <h3>新規技追加</h3>
        <form @submit.prevent="addMove">
          <div class="form-group">
            <label>技名:</label>
            <input v-model="newMove.name" type="text" required />
          </div>

          <div class="form-group">
            <label>タイプ:</label>
            <select v-model="newMove.type" required>
              <option value="">選択してください</option>
              <option v-for="type in types" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>分類:</label>
            <select v-model="newMove.category" required>
              <option value="">選択してください</option>
              <option value="物理">物理</option>
              <option value="特殊">特殊</option>
              <option value="変化">変化</option>
            </select>
          </div>

          <div class="form-group">
            <label>威力:</label>
            <input v-model.number="newMove.power" type="number" min="0" />
            <small>変化技の場合は0</small>
          </div>

          <div class="form-group">
            <label>命中率:</label>
            <input
              v-model.number="newMove.accuracy"
              type="number"
              required
              min="0"
              max="100"
            />
          </div>

          <div class="form-group">
            <label>PP:</label>
            <input v-model.number="newMove.pp" type="number" required min="1" />
          </div>

          <div class="form-group">
            <label>優先度:</label>
            <input v-model.number="newMove.priority" type="number" value="0" />
            <small>通常は0、先制技は正の値、後攻技は負の値</small>
          </div>

          <div class="form-group">
            <label>説明:</label>
            <textarea v-model="newMove.description" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>追加効果:</label>
            <textarea
              v-model="newMove.effectsJson"
              rows="5"
              placeholder='{"type": "damage", "damage": 50}'
            ></textarea>
            <small>JSON形式で入力</small>
          </div>

          <button type="submit" class="btn-primary">技を追加</button>
        </form>
      </div>

      <!-- 技一覧 -->
      <div class="list-section">
        <h3>技一覧</h3>
        <div class="search-box">
          <input
            v-model="moveSearchQuery"
            type="text"
            placeholder="技名で検索..."
          />
        </div>

        <div class="move-list">
          <div v-for="move in filteredMoves" :key="move._id" class="move-card">
            <div class="move-header">
              <h4>{{ move.name }}</h4>
              <div class="move-actions">
                <button @click="editMove(move)" class="btn-edit">編集</button>
                <button @click="deleteMove(move._id)" class="btn-delete">
                  削除
                </button>
              </div>
            </div>

            <div class="move-info">
              <div class="move-basic">
                <span
                  class="type-badge"
                  :class="`type-${move.type?.toLowerCase()}`"
                >
                  {{ move.type }}
                </span>
                <span
                  class="category-badge"
                  :class="`category-${move.category}`"
                >
                  {{ move.category }}
                </span>
              </div>

              <div class="move-stats">
                <div class="stat">威力: {{ move.power || "-" }}</div>
                <div class="stat">命中: {{ move.accuracy }}%</div>
                <div class="stat">PP: {{ move.pp }}</div>
                <div class="stat">優先度: {{ move.priority || 0 }}</div>
              </div>

              <div class="move-description" v-if="move.description">
                {{ move.description }}
              </div>

              <div class="move-effects" v-if="move.effects">
                <strong>追加効果:</strong>
                <pre>{{ JSON.stringify(move.effects, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 技編集モーダル -->
      <div v-if="editingMove" class="modal" @click.self="cancelMoveEdit">
        <div class="modal-content">
          <h3>技編集</h3>
          <form @submit.prevent="updateMove">
            <div class="form-group">
              <label>技名:</label>
              <input v-model="editingMove.name" type="text" required />
            </div>

            <div class="form-group">
              <label>タイプ:</label>
              <select v-model="editingMove.type" required>
                <option value="">選択してください</option>
                <option v-for="type in types" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>分類:</label>
              <select v-model="editingMove.category" required>
                <option value="">選択してください</option>
                <option value="物理">物理</option>
                <option value="特殊">特殊</option>
                <option value="変化">変化</option>
              </select>
            </div>

            <div class="form-group">
              <label>威力:</label>
              <input v-model.number="editingMove.power" type="number" min="0" />
            </div>

            <div class="form-group">
              <label>命中率:</label>
              <input
                v-model.number="editingMove.accuracy"
                type="number"
                required
                min="0"
                max="100"
              />
            </div>

            <div class="form-group">
              <label>PP:</label>
              <input
                v-model.number="editingMove.pp"
                type="number"
                required
                min="1"
              />
            </div>

            <div class="form-group">
              <label>優先度:</label>
              <input v-model.number="editingMove.priority" type="number" />
            </div>

            <div class="form-group">
              <label>説明:</label>
              <textarea v-model="editingMove.description" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label>追加効果:</label>
              <textarea v-model="editingMoveEffects" rows="5"></textarea>
              <small>JSON形式で入力</small>
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn-primary">更新</button>
              <button
                type="button"
                @click="cancelMoveEdit"
                class="btn-secondary"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- メッセージ表示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const { apiUrl, apiBaseUrl } = useApi();

// タブ管理
const activeTab = ref("monsters");

// タイプ一覧
const types = ["normal", "fire", "water", "grass", "light", "dark"];

// メッセージ表示
const message = ref("");
const messageType = ref("success");

const showMessage = (msg, type = "success") => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = "";
  }, 3000);
};

// ===== モンスター管理 =====
const monsters = ref([]);
const monsterSearchQuery = ref("");
const newMonster = ref({
  name: "",
  type1: "",
  type2: "",
  stats: {
    hp: 0,
    attack: 0,
    defense: 0,
    spAttack: 0,
    spDefense: 0,
    speed: 0,
  },
  ability: "",
  imageUrl: "",
  learnableMoves: "",
});
const editingMonster = ref(null);
const editingMonsterMoves = ref("");

const filteredMonsters = computed(() => {
  if (!monsterSearchQuery.value) return monsters.value;
  const query = monsterSearchQuery.value.toLowerCase();
  return monsters.value.filter((m) => m.name?.toLowerCase().includes(query));
});

const fetchMonsters = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/monster`);
    if (response.ok) {
      monsters.value = await response.json();
    } else {
      showMessage("モンスター一覧の取得に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error fetching monsters:", error);
    showMessage("モンスター一覧の取得に失敗しました", "error");
  }
};

const addMonster = async () => {
  try {
    const monsterData = {
      ...newMonster.value,
      learnableMoves: newMonster.value.learnableMoves
        ? newMonster.value.learnableMoves
            .split(",")
            .map((m) => m.trim())
            .filter((m) => m)
        : [],
    };

    const response = await fetch(`${apiBaseUrl}/monster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(monsterData),
    });

    if (response.ok) {
      showMessage("モンスターを追加しました", "success");
      await fetchMonsters();
      resetMonsterForm();
    } else {
      const error = await response.json();
      showMessage(`追加に失敗しました: ${error.message}`, "error");
    }
  } catch (error) {
    console.error("Error adding monster:", error);
    showMessage("モンスターの追加に失敗しました", "error");
  }
};

const editMonster = (monster) => {
  editingMonster.value = JSON.parse(JSON.stringify(monster));
  editingMonsterMoves.value = monster.learnableMoves
    ? monster.learnableMoves.join(", ")
    : "";
};

const updateMonster = async () => {
  try {
    const monsterData = {
      ...editingMonster.value,
      learnableMoves: editingMonsterMoves.value
        ? editingMonsterMoves.value
            .split(",")
            .map((m) => m.trim())
            .filter((m) => m)
        : [],
    };

    const response = await fetch(
      `${apiBaseUrl}/monster/${editingMonster.value._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(monsterData),
      }
    );

    if (response.ok) {
      showMessage("モンスターを更新しました", "success");
      await fetchMonsters();
      cancelEdit();
    } else {
      const error = await response.json();
      showMessage(`更新に失敗しました: ${error.message}`, "error");
    }
  } catch (error) {
    console.error("Error updating monster:", error);
    showMessage("モンスターの更新に失敗しました", "error");
  }
};

const deleteMonster = async (id) => {
  if (!confirm("本当にこのモンスターを削除しますか？")) return;

  try {
    const response = await fetch(`${apiBaseUrl}/monster/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showMessage("モンスターを削除しました", "success");
      await fetchMonsters();
    } else {
      showMessage("削除に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error deleting monster:", error);
    showMessage("モンスターの削除に失敗しました", "error");
  }
};

const cancelEdit = () => {
  editingMonster.value = null;
  editingMonsterMoves.value = "";
};

const resetMonsterForm = () => {
  newMonster.value = {
    name: "",
    type1: "",
    type2: "",
    stats: {
      hp: 0,
      attack: 0,
      defense: 0,
      spAttack: 0,
      spDefense: 0,
      speed: 0,
    },
    ability: "",
    imageUrl: "",
    learnableMoves: "",
  };
};

// ===== 技管理 =====
const moves = ref([]);
const moveSearchQuery = ref("");
const newMove = ref({
  name: "",
  type: "",
  category: "",
  power: 0,
  accuracy: 100,
  pp: 10,
  priority: 0,
  description: "",
  effectsJson: "",
});
const editingMove = ref(null);
const editingMoveEffects = ref("");

const filteredMoves = computed(() => {
  if (!moveSearchQuery.value) return moves.value;
  const query = moveSearchQuery.value.toLowerCase();
  return moves.value.filter((m) => m.name?.toLowerCase().includes(query));
});

const fetchMoves = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/move`);
    if (response.ok) {
      moves.value = await response.json();
    } else {
      showMessage("技一覧の取得に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error fetching moves:", error);
    showMessage("技一覧の取得に失敗しました", "error");
  }
};

const addMove = async () => {
  try {
    const moveData = { ...newMove.value };

    // effectsJsonをパース
    if (moveData.effectsJson) {
      try {
        moveData.effects = JSON.parse(moveData.effectsJson);
      } catch (e) {
        showMessage("追加効果のJSON形式が不正です", "error");
        return;
      }
    }
    delete moveData.effectsJson;

    const response = await fetch(`${apiBaseUrl}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(moveData),
    });

    if (response.ok) {
      showMessage("技を追加しました", "success");
      await fetchMoves();
      resetMoveForm();
    } else {
      const error = await response.json();
      showMessage(`追加に失敗しました: ${error.message}`, "error");
    }
  } catch (error) {
    console.error("Error adding move:", error);
    showMessage("技の追加に失敗しました", "error");
  }
};

const editMove = (move) => {
  editingMove.value = JSON.parse(JSON.stringify(move));
  editingMoveEffects.value = move.effects
    ? JSON.stringify(move.effects, null, 2)
    : "";
};

const updateMove = async () => {
  try {
    const moveData = { ...editingMove.value };

    // effectsをパース
    if (editingMoveEffects.value) {
      try {
        moveData.effects = JSON.parse(editingMoveEffects.value);
      } catch (e) {
        showMessage("追加効果のJSON形式が不正です", "error");
        return;
      }
    }

    const response = await fetch(
      `${apiBaseUrl}/move/${editingMove.value._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moveData),
      }
    );

    if (response.ok) {
      showMessage("技を更新しました", "success");
      await fetchMoves();
      cancelMoveEdit();
    } else {
      const error = await response.json();
      showMessage(`更新に失敗しました: ${error.message}`, "error");
    }
  } catch (error) {
    console.error("Error updating move:", error);
    showMessage("技の更新に失敗しました", "error");
  }
};

const deleteMove = async (id) => {
  if (!confirm("本当にこの技を削除しますか？")) return;

  try {
    const response = await fetch(`${apiBaseUrl}/move/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showMessage("技を削除しました", "success");
      await fetchMoves();
    } else {
      showMessage("削除に失敗しました", "error");
    }
  } catch (error) {
    console.error("Error deleting move:", error);
    showMessage("技の削除に失敗しました", "error");
  }
};

const cancelMoveEdit = () => {
  editingMove.value = null;
  editingMoveEffects.value = "";
};

const resetMoveForm = () => {
  newMove.value = {
    name: "",
    type: "",
    category: "",
    power: 0,
    accuracy: 100,
    pp: 10,
    priority: 0,
    description: "",
    effectsJson: "",
  };
};

// 初期化
onMounted(() => {
  fetchMonsters();
  fetchMoves();
});
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Arial", sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

h2 {
  color: #444;
  border-bottom: 2px solid #4caf50;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

h3 {
  color: #555;
  margin-bottom: 15px;
}

/* タブ */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #ddd;
}

.tabs button {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.3s;
}

.tabs button:hover {
  color: #4caf50;
}

.tabs button.active {
  color: #4caf50;
  border-bottom-color: #4caf50;
  font-weight: bold;
}

/* フォーム */
.form-section {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4caf50;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #888;
  font-size: 12px;
}

/* ボタン */
.btn-primary {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #666;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-left: 10px;
}

.btn-secondary:hover {
  background-color: #555;
}

.btn-edit {
  background-color: #2196f3;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 5px;
}

.btn-edit:hover {
  background-color: #0b7dda;
}

.btn-delete {
  background-color: #f44336;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-delete:hover {
  background-color: #da190b;
}

/* 検索ボックス */
.search-box {
  margin-bottom: 20px;
}

.search-box input {
  width: 100%;
  max-width: 400px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

/* モンスター・技一覧 */
.list-section {
  margin-bottom: 30px;
}

.monster-list,
.move-list {
  display: grid;
  gap: 20px;
}

.monster-card,
.move-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.monster-card:hover,
.move-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.monster-header,
.move-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.monster-header h4,
.move-header h4 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.monster-actions,
.move-actions {
  display: flex;
  gap: 5px;
}

.monster-info,
.move-info {
  color: #666;
}

.monster-types,
.move-basic {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.type-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
}

.category-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.category-物理 {
  background-color: #c92112;
}

.category-特殊 {
  background-color: #4a90a4;
}

.category-変化 {
  background-color: #7c7c7c;
}

/* タイプカラー */
.type-ノーマル {
  background-color: #a8a878;
}
.type-ほのお {
  background-color: #f08030;
}
.type-みず {
  background-color: #6890f0;
}
.type-でんき {
  background-color: #f8d030;
}
.type-くさ {
  background-color: #78c850;
}
.type-こおり {
  background-color: #98d8d8;
}
.type-かくとう {
  background-color: #c03028;
}
.type-どく {
  background-color: #a040a0;
}
.type-じめん {
  background-color: #e0c068;
}
.type-ひこう {
  background-color: #a890f0;
}
.type-エスパー {
  background-color: #f85888;
}
.type-むし {
  background-color: #a8b820;
}
.type-いわ {
  background-color: #b8a038;
}
.type-ゴースト {
  background-color: #705898;
}
.type-ドラゴン {
  background-color: #7038f8;
}
.type-あく {
  background-color: #705848;
}
.type-はがね {
  background-color: #b8b8d0;
}
.type-フェアリー {
  background-color: #ee99ac;
}

.monster-stats,
.move-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.stat {
  background: #f0f0f0;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.monster-ability,
.monster-moves,
.move-description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: 14px;
}

.move-effects {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.move-effects pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

/* モーダル */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* メッセージ */
.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  z-index: 2000;
  animation: slideIn 0.3s ease-out;
}

.message.success {
  background-color: #4caf50;
}

.message.error {
  background-color: #f44336;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* レスポンシブ */
@media (max-width: 768px) {
  .tabs {
    flex-direction: column;
  }

  .tabs button {
    width: 100%;
  }

  .monster-stats,
  .move-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-content {
    width: 95%;
    padding: 20px;
  }
}
</style>
