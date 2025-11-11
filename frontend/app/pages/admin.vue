<template>
  <div class="admin-container">
    <h1>管理画面</h1>

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

    <div class="tab-content">
      <MonsterManagement
        v-if="activeTab === 'monsters'"
        @message="showMessage"
      />
      <MoveManagement v-if="activeTab === 'moves'" @message="showMessage" />
    </div>

    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import MonsterManagement from "~/components/admin/MonsterManagement.vue";
import MoveManagement from "~/components/admin/MoveManagement.vue";

const activeTab = ref("monsters");
const message = ref("");
const messageType = ref("success");

const showMessage = (msg, type = "success") => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = "";
  }, 3000);
};
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

.tab-content {
  min-height: 400px;
}

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

@media (max-width: 768px) {
  .tabs {
    flex-direction: column;
  }

  .tabs button {
    width: 100%;
  }
}
</style>
