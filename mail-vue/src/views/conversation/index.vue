<template>
  <div class="conversation-detail">
    <div class="toolbar">
      <Icon class="icon" icon="material-symbols-light:arrow-back-ios-new" width="20" height="20" @click="back" />
      <span class="title">{{ thread?.subject || '邮件会话' }}</span>
      <span class="message-count" v-if="thread">{{ thread.messages.length }} 封邮件</span>
    </div>
    <el-scrollbar class="scroll">
      <div class="messages" v-loading="loading">
        <div v-for="(mail, index) in thread?.messages || []" :key="mail.emailId" class="message-card">
          <div class="message-head" @click="toggle(index)">
            <div class="avatar">{{ avatarText(mail.name || mail.sendEmail) }}</div>
            <div class="head-main">
              <div class="sender-line"><strong>{{ mail.name || mail.sendEmail }}</strong><span>&lt;{{ mail.sendEmail }}&gt;</span></div>
              <div class="recipient">{{ mail.type === 1 ? '收件人：' + recipientText(mail.recipient) : '发件给：' + recipientText(mail.recipient) }}</div>
            </div>
            <div class="date">{{ formatDetailDate(mail.createTime) }}</div>
            <Icon class="chevron" :icon="collapsed[index] ? 'mingcute:down-small-fill' : 'mingcute:up-small-fill'" width="20" height="20" />
          </div>
          <div v-show="!collapsed[index]" class="message-body">
            <ShadowHtml v-if="mail.content" :html="formatImage(mail.content)" />
            <pre v-else>{{ mail.text }}</pre>
            <div v-if="mail.attList?.length" class="attachments">
              <div class="att-title">附件（{{ mail.attList.length }}）</div>
              <div v-for="att in mail.attList" :key="att.attId" class="att-item">
                <span>{{ att.filename }}</span><span>{{ formatBytes(att.size) }}</span>
                <a :href="cvtR2Url(att.key)" download><Icon icon="system-uicons:push-down" width="21" height="21" /></a>
              </div>
            </div>
            <div class="message-actions"><el-button size="small" @click="reply(mail)">回复</el-button><el-button size="small" @click="replyAll(mail)">回复全部</el-button><el-button size="small" @click="forward(mail)">转发</el-button></div>
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useRoute } from 'vue-router';
import router from '@/router/index.js';
import { useAccountStore } from '@/store/account.js';
import { useUiStore } from '@/store/ui.js';
import { conversationDetail } from '@/request/conversation.js';
import { emailRead } from '@/request/email.js';
import ShadowHtml from '@/components/shadow-html/index.vue';
import { formatDetailDate } from '@/utils/day.js';
import { formatBytes } from '@/utils/file-utils.js';
import { cvtR2Url, toOssDomain } from '@/utils/convert.js';
import { useSettingStore } from '@/store/setting.js';

const route = useRoute();
const accountStore = useAccountStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const thread = ref(null);
const loading = ref(false);
const collapsed = ref({});

function avatarText(value = '') { const s = String(value).trim(); return s ? s[0].toUpperCase() : '?'; }
function recipientText(value) { try { return JSON.parse(value || '[]').map(x => x.address).filter(Boolean).join(', '); } catch { return ''; } }
function formatImage(content) { return (content || '').replace(/{{domain}}/g, toOssDomain(settingStore.settings.r2Domain) + '/'); }
function toggle(index) { collapsed.value[index] = !collapsed.value[index]; }
function reply(mail) { uiStore.writerRef.openReply(mail); }
function replyAll(mail) { uiStore.writerRef.openReplyAll(mail); }
function forward(mail) { uiStore.writerRef.openForward(mail); }
function back() { router.back(); }

onMounted(async () => {
  loading.value = true;
  try {
    thread.value = await conversationDetail(accountStore.currentAccountId, route.query.threadId);
    const unreadIds = (thread.value?.messages || []).filter(mail => mail.type === 0 && mail.unread === 0).map(mail => mail.emailId);
    if (unreadIds.length) await emailRead(unreadIds);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.conversation-detail { height:100%; overflow:hidden; display:flex; flex-direction:column; }
.toolbar { height:48px; flex:0 0 48px; display:flex; align-items:center; gap:16px; padding:0 16px; border-bottom:1px solid var(--light-border-color); }
.icon { cursor:pointer; }.title { font-size:20px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.message-count { color:var(--secondary-text-color); font-size:13px; }.scroll { flex:1; }
.messages { max-width:1100px; margin:0 auto; padding:14px 20px 40px; }.message-card { border:1px solid var(--light-border-color); border-radius:8px; margin-bottom:12px; overflow:hidden; background:var(--el-bg-color); }.message-head { display:flex; align-items:center; gap:12px; padding:14px 16px; cursor:pointer; }.avatar { flex:0 0 38px; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--el-color-primary-light-8); color:var(--el-color-primary); font-weight:700; }.head-main { flex:1; min-width:0; }.sender-line { display:flex; gap:6px; flex-wrap:wrap; }.sender-line span,.recipient,.date { color:var(--secondary-text-color); font-size:13px; }.recipient { margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }.date { white-space:nowrap; }.chevron { flex:0 0 auto; }.message-body { padding:0 22px 18px 66px; }.message-body :deep(.shadow-html) { width:100%; } pre { font-family:inherit; white-space:pre-wrap; word-break:break-word; }.attachments { margin-top:18px; border:1px solid var(--light-border-color); border-radius:6px; padding:10px; max-width:700px; }.att-title { font-weight:700; margin-bottom:8px; }.att-item { display:flex; gap:12px; align-items:center; padding:7px 8px; background:var(--light-ill); border-radius:4px; margin-top:6px; }.att-item span:first-child { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.att-item span:nth-child(2) { color:var(--secondary-text-color); }.att-item a { color:var(--secondary-text-color); display:flex; }.message-actions { display:flex; gap:8px; margin-top:18px; }
@media(max-width:767px){ .messages{padding:10px}.message-body{padding:0 14px 16px}.date{font-size:11px}.title{font-size:17px} }
</style>
