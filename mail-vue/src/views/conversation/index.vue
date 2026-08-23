<template>
  <div class="conversation-detail">
    <div class="toolbar">
      <Icon class="icon" icon="material-symbols-light:arrow-back-ios-new" width="20" height="20" @click="back" />
      <span class="title">{{ thread?.subject || '邮件会话' }}</span>
      <span class="message-count" v-if="thread">{{ thread.messages.length }} 封邮件</span>
      <Icon v-if="thread?.messages?.length" class="delete-thread" icon="material-symbols-light:delete-outline" width="21" height="21" title="删除整个会话" @click="deleteConversation" />
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
            <div class="head-meta">
              <div class="date">{{ formatDetailDate(mail.createTime) }}</div>
              <Icon class="chevron" :icon="collapsed[index] ? 'mingcute:down-small-fill' : 'mingcute:up-small-fill'" width="20" height="20" />
            </div>
          </div>
          <div v-show="!collapsed[index]" class="message-body">
            <ShadowHtml v-if="bodyHtml(mail)" :html="formatImage(bodyHtml(mail))" />
            <pre v-else>{{ mail.text || '' }}</pre>
            <div v-if="mail.attList?.length" class="attachments">
              <div class="att-title">附件（{{ mail.attList.length }}）</div>
              <div v-for="att in mail.attList" :key="att.attId" class="att-item">
                <span>{{ att.filename }}</span><span>{{ formatBytes(att.size) }}</span>
                <a :href="cvtR2Url(att.key)" download><Icon icon="system-uicons:push-down" width="21" height="21" /></a>
              </div>
            </div>
            <div class="message-actions">
              <el-button size="small" @click="reply(mail)">回复</el-button>
              <el-button size="small" @click="replyAll(mail)">回复全部</el-button>
              <el-button size="small" @click="forward(mail)">转发</el-button>
              <el-button size="small" type="danger" plain :loading="deletingIds.includes(mail.emailId)" @click="deleteMail(mail)">删除</el-button>
            </div>
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
import { emailDelete, emailRead, emailLatest } from '@/request/email.js';
import ShadowHtml from '@/components/shadow-html/index.vue';
import { formatDetailDate } from '@/utils/day.js';
import { formatBytes } from '@/utils/file-utils.js';
import { cvtR2Url, toOssDomain } from '@/utils/convert.js';
import { useSettingStore } from '@/store/setting.js';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const accountStore = useAccountStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const thread = ref(null);
const loading = ref(false);
const collapsed = ref({});
const deletingIds = ref([]);

function avatarText(value = '') { const s = String(value).trim(); return s ? s[0].toUpperCase() : '?'; }
function recipientText(value) { try { return JSON.parse(value || '[]').map(x => x.address).filter(Boolean).join(', '); } catch { return ''; } }
function formatImage(content) { return (content || '').replace(/{{domain}}/g, toOssDomain(settingStore.settings.r2Domain) + '/'); }
function toggle(index) { collapsed.value[index] = !collapsed.value[index]; }
function reply(mail) { uiStore.writerRef.openReply(mail); }
function replyAll(mail) { uiStore.writerRef.openReplyAll(mail); }
function forward(mail) { uiStore.writerRef.openForward(mail); }
function back() { router.back(); }

async function hydrateMessages() {
  const messages = thread.value?.messages || [];
  await Promise.all(messages.map(async (mail) => {
    try {
      const full = await emailLatest(mail.emailId, accountStore.currentAccountId, mail.allReceive ?? 0);
      if (full && typeof full === 'object') Object.assign(mail, full);
    } catch (error) {
      console.warn('Failed to load conversation email detail, using conversation row:', error);
    }
  }));
}

// The conversation API can return HTML in either content or text. The text
// field must not be forced through <pre> when it is actually an HTML body.
// Prefer the real HTML content, otherwise render HTML-looking text with the
// same ShadowHtml component used by the normal mail detail view.
function bodyHtml(mail) {
  const content = String(mail?.content || '').trim();
  if (content) return content;

  const text = String(mail?.text || '').trim();
  if (looksLikeHtml(text)) return text;

  return '';
}

function looksLikeHtml(value) {
  return /<(?:!doctype|html|head|body|div|p|br|span|table|thead|tbody|tr|td|th|a|img|ul|ol|li|h[1-6]|strong|b|em|i|blockquote|pre|hr)\b[^>]*>/i.test(value);
}

async function deleteMail(mail) {
  try {
    await ElMessageBox.confirm(`确定删除这封邮件吗？${mail.subject ? `\n${mail.subject}` : ''}`, '删除邮件', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' });
  } catch { return; }

  deletingIds.value.push(mail.emailId);
  try {
    await emailDelete(String(mail.emailId));
    const messages = thread.value?.messages || [];
    thread.value.messages = messages.filter(item => item.emailId !== mail.emailId);
    delete collapsed.value[thread.value.messages.length];
    ElMessage({ message: '邮件已删除', type: 'success', plain: true });
    if (thread.value.messages.length === 0) router.back();
  } catch (error) {
    ElMessage({ message: error?.message || '删除失败，请稍后重试', type: 'error', plain: true });
  } finally {
    deletingIds.value = deletingIds.value.filter(id => id !== mail.emailId);
  }
}

async function deleteConversation() {
  const messages = thread.value?.messages || [];
  if (!messages.length) return;
  try {
    await ElMessageBox.confirm(`确定删除整个会话吗？\n将删除其中的 ${messages.length} 封邮件。`, '删除会话', { confirmButtonText: '删除全部', cancelButtonText: '取消', type: 'warning' });
  } catch { return; }

  loading.value = true;
  try {
    await emailDelete(messages.map(item => item.emailId).join(','));
    ElMessage({ message: '会话已删除', type: 'success', plain: true });
    router.back();
  } catch (error) {
    ElMessage({ message: error?.message || '删除失败，请稍后重试', type: 'error', plain: true });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    thread.value = await conversationDetail(accountStore.currentAccountId, route.query.threadId);
    await hydrateMessages();
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
.icon { cursor:pointer; }.title { font-size:20px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }.message-count { color:var(--secondary-text-color); font-size:13px; white-space:nowrap; }.delete-thread { margin-left:auto; flex:0 0 auto; cursor:pointer; color:var(--el-color-danger); }
.scroll { flex:1; }.messages { max-width:1100px; margin:0 auto; padding:14px 20px 40px; }.message-card { border:1px solid var(--light-border-color); border-radius:8px; margin-bottom:12px; overflow:hidden; background:var(--el-bg-color); }.message-head { display:grid; grid-template-columns:38px minmax(0,1fr) auto; align-items:center; gap:12px; padding:14px 16px; cursor:pointer; }.avatar { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:var(--el-color-primary-light-8); color:var(--el-color-primary); font-weight:700; }.head-main { min-width:0; }.sender-line { display:flex; gap:6px; flex-wrap:wrap; min-width:0; }.sender-line strong,.sender-line span { overflow-wrap:anywhere; }.sender-line span,.recipient,.date { color:var(--secondary-text-color); font-size:13px; }.recipient { margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }.head-meta { display:flex; align-items:center; gap:8px; min-width:0; }.date { white-space:nowrap; }.chevron { flex:0 0 auto; }.message-body { padding:0 22px 18px 66px; }.message-body :deep(.shadow-html) { width:100%; } pre { font-family:inherit; white-space:pre-wrap; word-break:break-word; }.attachments { margin-top:18px; border:1px solid var(--light-border-color); border-radius:6px; padding:10px; max-width:700px; }.att-title { font-weight:700; margin-bottom:8px; }.att-item { display:flex; gap:12px; align-items:center; padding:7px 8px; background:var(--light-ill); border-radius:4px; margin-top:6px; }.att-item span:first-child { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.att-item span:nth-child(2) { color:var(--secondary-text-color); }.att-item a { color:var(--secondary-text-color); display:flex; }.message-actions { display:flex; gap:8px; margin-top:18px; flex-wrap:wrap; }
@media(max-width:767px){
  .toolbar{gap:10px;padding:0 12px}.title{font-size:17px}.message-count{font-size:12px}.messages{padding:10px}.message-head{grid-template-columns:38px minmax(0,1fr);align-items:start;padding:12px}.head-meta{grid-column:2;justify-content:space-between;margin-top:5px}.date{font-size:11px}.sender-line{line-height:1.4}.recipient{white-space:normal;overflow:visible;text-overflow:clip;overflow-wrap:anywhere;line-height:1.4}.message-body{padding:0 14px 16px}.message-actions{gap:6px}.message-actions .el-button{margin-left:0}
}
</style>
