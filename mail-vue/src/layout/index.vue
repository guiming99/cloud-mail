<template>
  <el-container class="layout">
    <el-aside class="aside" :class="uiStore.asideShow ? 'aside-show' : 'el-aside-hide'">
      <Aside />
    </el-aside>
    <div :class="(uiStore.asideShow && isMobile)? 'overlay-show':'overlay-hide'" @click="uiStore.asideShow = false"></div>
    <el-container class="main-container">
      <el-main>
        <el-header><Header /></el-header>
        <Main />
      </el-main>
    </el-container>
  </el-container>
  <writer ref="writerRef" />
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import Header from '@/layout/header/index.vue'
import Main from '@/layout/main/index.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {useUiStore} from "@/store/ui.js";
import {useAccountStore} from "@/store/account.js";
import {useUserStore} from "@/store/user.js";
import {useSettingStore} from "@/store/setting.js";
import {toOssDomain} from "@/utils/convert.js";
import writer from '@/layout/write/index.vue'

const uiStore = useUiStore();
const accountStore = useAccountStore();
const userStore = useUserStore();
const settingStore = useSettingStore();
const writerRef = ref({})
const isMobile = ref(window.innerWidth < 1025)

function signatureHtml() {
  const accountId = accountStore.currentAccount?.accountId || userStore.user?.account?.accountId || -1
  const signature = localStorage.getItem(`cloudmail-signature-${accountId}`) || ''
  return signature ? `<div data-cloudmail-signature="1"><br><br>${signature}</div>` : ''
}

function recipientText(value) {
  try {
    return JSON.parse(value || '[]').map(item => item.address || item.name || '').filter(Boolean).join(', ')
  } catch {
    return value || ''
  }
}

function formatQuotedContent(email) {
  const content = email.content
    ? email.content.replace(/{{domain}}/g, toOssDomain(settingStore.settings.r2Domain) + '/')
    : `<pre style="font-family:inherit;white-space:pre-wrap;word-break:break-word;margin:0">${email.text || ''}</pre>`
  return content
}

function patchReplyForwardEditor(email, mode) {
  const started = Date.now()
  const run = () => {
    const editor = window.tinymce?.activeEditor
    if (!editor) {
      if (Date.now() - started < 3000) return setTimeout(run, 80)
      return
    }

    const signature = signatureHtml()
    const original = formatQuotedContent(email)
    let content = ''

    if (mode === 'forward') {
      content = `${signature}<div style="margin-top:12px;">---------- Forwarded message ---------</div><div>${email.createTime || ''} ${email.name || ''} &lt;${email.sendEmail || ''}&gt;</div><div>To: ${recipientText(email.recipient)}</div><div>Subject: ${email.subject || ''}</div><blockquote class="mceNonEditable" style="margin:8px 0 0 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex;"><article>${original}</article></blockquote>`
    } else {
      content = `${signature}<div><br>${email.createTime || ''} ${email.name || ''} &lt;${email.sendEmail || ''}&gt; wrote:</div><blockquote class="mceNonEditable" style="margin:0 0 0 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex;"><article>${original}</article></blockquote>`
    }

    editor.setContent(content)
    editor.focus()
  }
  setTimeout(run, 80)
}

const writerApi = {
  open: (...args) => writerRef.value?.open?.(...args),
  openDraft: (...args) => writerRef.value?.openDraft?.(...args),
  openReply: (email) => {
    writerRef.value?.openReply?.(email)
    patchReplyForwardEditor(email, 'reply')
  },
  openReplyAll: (email) => {
    writerRef.value?.openReplyAll?.(email)
    patchReplyForwardEditor(email, 'reply')
  },
  openForward: (email) => {
    writerRef.value?.openForward?.(email)
    patchReplyForwardEditor(email, 'forward')
  }
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 1025
  uiStore.asideShow = window.innerWidth > 1024;
}

onMounted(() => {
  uiStore.writerRef = writerApi
  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.el-aside-hide { position:fixed; left:0; height:100%; z-index:100; transform:translateX(-100%); transition:all 100ms ease; }
.aside-show { -webkit-box-shadow:var(--aside-right-border); box-shadow:var(--aside-right-border); transform:translateX(0); transition:all 100ms ease; z-index:101; }
@media (max-width:1025px){ .aside-show { position:fixed; top:0; left:0; height:100%; background:var(--el-bg-color); } }
.el-aside { width:auto; transition:all 100ms ease; }
.layout { height:100%; position:fixed; width:100%; top:0; left:0; overflow:hidden; }
.main-container { min-height:100%; background:var(--el-bg-color); overflow-y:auto; -webkit-overflow-scrolling:touch; }
.el-main { padding:0; }
.el-header { background:var(--el-bg-color); border-bottom:solid 1px var(--el-border-color); padding:0; }
.overlay-show { position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,.4); z-index:99; transition:all .3s; }
.overlay-hide { display:flex; pointer-events:none; opacity:0; }
</style>
