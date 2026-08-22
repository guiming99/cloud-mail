<template>
  <div class="conversation-page">
    <div class="header-actions">
      <div class="header-left">
        <span class="count">{{ threads.length }} 个会话</span>
        <Icon class="icon" icon="ion:reload" width="18" height="18" @click="load" />
      </div>
      <div class="header-right">
        <Icon class="icon" @click="changeSort" :icon="timeSort ? 'material-symbols-light:timer-arrow-up-outline' : 'material-symbols-light:timer-arrow-down-outline'" width="26" height="26" />
      </div>
    </div>
    <div v-loading="loading" class="thread-list">
      <div v-for="item in sortedThreads" :key="item.threadId" class="thread-row" :class="{ unread: item.unreadCount > 0 }" @click="openThread(item)">
        <div class="avatar">{{ avatarText(item.latestSender) }}</div>
        <div class="thread-main">
          <div class="thread-top">
            <span class="sender">{{ item.latestSender || 'Unknown' }}</span>
            <span class="time">{{ formatDetailDate(item.latestTime) }}</span>
          </div>
          <div class="subject-line">
            <span class="subject">{{ item.subject || '(无主题)' }}</span>
            <span v-if="item.count > 1" class="count-badge">{{ item.count }}</span>
          </div>
          <div class="preview">{{ item.latestEmail?.text || '' }}</div>
        </div>
      </div>
      <el-empty v-if="!loading && sortedThreads.length === 0" description="暂无邮件" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import router from '@/router/index.js';
import { useAccountStore } from '@/store/account.js';
import { conversationList } from '@/request/conversation.js';
import { formatDetailDate } from '@/utils/day.js';

const accountStore = useAccountStore();
const threads = ref([]);
const loading = ref(false);
const timeSort = ref(0);

const sortedThreads = computed(() => {
  const list = [...threads.value];
  return timeSort.value ? list.reverse() : list;
});

function avatarText(value = '') {
  const text = String(value).trim();
  return text ? text[0].toUpperCase() : '?';
}

async function load() {
  if (!accountStore.currentAccountId) return;
  loading.value = true;
  try {
    const data = await conversationList(accountStore.currentAccountId);
    threads.value = data.list || [];
  } finally {
    loading.value = false;
  }
}

function changeSort() { timeSort.value = timeSort.value ? 0 : 1; }
function openThread(item) { router.push({ name: 'conversation', query: { threadId: item.threadId } }); }
watch(() => accountStore.currentAccountId, load);
onMounted(load);
</script>

<style scoped lang="scss">
.conversation-page { height:100%; overflow:hidden; display:flex; flex-direction:column; }
.header-actions { height:44px; flex:0 0 44px; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--light-border-color); }
.header-left,.header-right { display:flex; align-items:center; gap:16px; }
.count { font-weight:600; }
.icon { cursor:pointer; }
.thread-list { flex:1; overflow:auto; }
.thread-row { display:flex; gap:12px; padding:13px 18px; border-bottom:1px solid var(--light-border-color); cursor:pointer; transition:background .15s; }
.thread-row:hover { background:var(--light-ill); }
.thread-row.unread .sender,.thread-row.unread .subject { font-weight:700; }
.avatar { flex:0 0 40px; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--el-color-primary-light-8); color:var(--el-color-primary); font-weight:700; }
.thread-main { min-width:0; flex:1; }
.thread-top,.subject-line { display:flex; align-items:center; gap:8px; }
.sender,.subject { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sender { flex:1; }
.time { color:var(--secondary-text-color); font-size:12px; white-space:nowrap; }
.subject-line { margin-top:4px; }
.subject { flex:1; }
.count-badge { flex:0 0 auto; min-width:20px; height:20px; padding:0 6px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:var(--el-color-primary-light-8); color:var(--el-color-primary); font-size:12px; }
.preview { margin-top:4px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
</style>
