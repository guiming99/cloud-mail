<template>
  <div class="send" v-show="show">
    <div class="write-box">
      <div class="title">
        <div class="title-left">
          <span class="title-text">
            <Icon icon="hugeicons:quill-write-01" width="28" height="28"/>
          </span>
          <span class="sender">{{ $t('sender') }}:</span>
          <span class="sender-name">{{ form.name }}</span>
          <span class="send-email"><{{ form.sendEmail }}></span>
        </div>
        <div @click="close" style="cursor: pointer;">
          <Icon icon="material-symbols-light:close-rounded" width="22" height="22"/>
        </div>
      </div>
      <div class="container">
        <el-input-tag @add-tag="addTagChange" tag-type="primary" @input="inputChange" size="default" v-model="form.receiveEmail">
          <template #prefix>
            <div class="item-title">{{ $t('recipient') }}</div>
            <el-select
                ref="mySelect"
                class="write-select"
                popper-class="write-select"
                :show-arrow="false"
                :no-match-text="' '"
                :no-data-text="' '"
                @visible-change="selectStatusChange"
                @change="selectChange"
            >
              <el-option
                  v-for="item in selectRecipientList"
                  :key="item"
                  :label="item"
                  :value="item"
                  style="color: #999896;"
              />
            </el-select>
          </template>
          <template #suffix>
            <div style="display: flex;margin-right: 3px;">
              <Icon icon="fa7-solid:user-plus" width="20" height="20" class="add-contact" @click.stop="openContacts('receiveEmail')" />
            </div>
          </template>
        </el-input-tag>

        <div class="recipient-options">
          <el-button v-if="form.sendType === 'reply'" link size="small" @click="setReplyMode('sender')">回复发件人</el-button>
          <el-button v-if="form.sendType === 'reply'" link size="small" @click="setReplyMode('all')">回复全部</el-button>
          <el-button link size="small" @click="showCc = !showCc">抄送</el-button>
          <el-button link size="small" @click="showBcc = !showBcc">密送</el-button>
          <el-button link size="small" @click="editSignature">签名</el-button>
        </div>

        <el-input-tag v-if="showCc" v-model="form.cc" class="extra-recipient" placeholder="抄送邮箱，回车确认">
          <template #suffix>
            <div style="display: flex;margin-right: 3px;">
              <Icon icon="fa7-solid:user-plus" width="20" height="20" class="add-contact" @click.stop="openContacts('cc')" />
            </div>
          </template>
        </el-input-tag>
        <el-input-tag v-if="showBcc" v-model="form.bcc" class="extra-recipient" placeholder="密送邮箱，回车确认">
          <template #suffix>
            <div style="display: flex;margin-right: 3px;">
              <Icon icon="fa7-solid:user-plus" width="20" height="20" class="add-contact" @click.stop="openContacts('bcc')" />
            </div>
          </template>
        </el-input-tag>
        <el-input v-model="form.subject" :placeholder="t('subject')" />

        <div class="editor-wrapper">
          <tinyEditor :def-value="defValue" ref="editor" @change="change" @focus="focusChange" />
        </div>

        <div class="button-item">
          <div class="att-add" @click="chooseFile">
            <Icon icon="iconamoon:attachment-fill" width="24" height="24"/>
          </div>
          <div class="att-clear" @click="clearContent">
            <Icon icon="icon-park-outline:clear-format" width="24" height="24" />
          </div>
          <div class="att-list">
            <div class="att-item" v-for="(item,index) in form.attachments" :key="index">
              <Icon v-bind="getIconByName(item.filename)"/>
              <span class="att-filename">{{ item.filename }}</span>
              <span class="att-size">{{ formatBytes(item.size) }}</span>
              <Icon style="cursor: pointer;" icon="material-symbols-light:close-rounded" @click="delAtt(index)"
                    width="22" height="22"/>
            </div>
          </div>
          <div>
            <el-button type="primary" @click="sendEmail" v-if="form.sendType === 'reply'">{{ $t('reply') }}</el-button>
            <el-button type="primary" @click="sendEmail" v-else-if="form.sendType === 'forward'">{{ $t('forward') }}</el-button>
            <el-button type="primary" @click="sendEmail" v-else>{{ $t('send') }}</el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog top="10vh" v-model="showContacts" @closed="clearSelectContact" :title="t('recentContacts')">
      <el-table ref="contactsTabRef" row-key="email" :data="contacts" style="height: 445px">
        <el-table-column type="selection" width="32" />
        <el-table-column property="email" :label="t('emailAccount')">
          <template #default="props">
            <div class="email-row">{{ props.row.email }}</div>
          </template>
        </el-table-column>
        <el-table-column width="55" label="">
          <template #default>
            <div style="display: flex;">
              <Icon icon="mage:user" style="color: var(--el-text-color-primary)" width="22" height="22" color="#606266" />
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="contacts-bottom">
        <el-button type="default" @click="deleteContact">{{t('clear')}}</el-button>
        <el-button type="primary" @click="chooseContact">{{t('selectContacts')}}</el-button>
      </div>
    </el-dialog>

    <el-dialog
      v-model="showSignature"
      class="signature-dialog"
      title="邮件签名"
      width="560px"
      :close-on-click-modal="false"
    >
      <div class="signature-label">请输入签名，支持多行：</div>
      <el-input
        v-model="signatureDraft"
        type="textarea"
        :rows="8"
        resize="vertical"
        placeholder="例如：\nBest regards,\nGavin\nQJMOTOR International"
        autofocus
      />
      <template #footer>
        <el-button @click="showSignature = false">取消</el-button>
        <el-button type="primary" @click="saveSignature">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import tinyEditor from '@/components/tiny-editor/index.vue'
import {h, nextTick, onMounted, onUnmounted, reactive, ref, toRaw, computed} from "vue";
import {Icon} from "@iconify/vue";
import {useUserStore} from "@/store/user.js";
import {emailSend} from "@/request/email.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {fileToBase64, formatBytes} from "@/utils/file-utils.js";
import {getIconByName} from "@/utils/icon-utils.js";
import sendPercent from "@/components/send-percent/index.vue"
import {toOssDomain} from "@/utils/convert.js";
import {formatDetailDate} from "@/utils/day.js";
import {useSettingStore} from "@/store/setting.js";
import {userDraftStore} from "@/store/draft.js";
import {useWriterStore} from "@/store/writer.js";
import db from "@/db/db.js";
import dayjs from "dayjs";
import {useI18n} from "vue-i18n";
import router from "@/router/index.js";
import {ElMessageBox} from "element-plus";

defineExpose({
  open,
  openReply,
  openReplyAll,
  openForward,
  openDraft
})

const {t} = useI18n()
const writerStore = useWriterStore();
const draftStore = userDraftStore()
const settingStore = useSettingStore()
const emailStore = useEmailStore();
const accountStore = useAccountStore()
const editor = ref({})
const userStore = useUserStore();
const show = ref(false);
const percent = ref(0)
let percentMessage = null
let sending = false
const defValue = ref('')
const contactsTabRef = ref({})
const showContacts = ref(false)
const showCc = ref(false)
const showBcc = ref(false)
const showSignature = ref(false)
const signatureDraft = ref('')
const mySelect = ref()
const contactTarget = ref('receiveEmail')
const replyContext = reactive({ sender: '', allTo: [], allCc: [] })
let selectStatus = false
const backReply = reactive({
  receiveEmail: [],
  cc: [],
  bcc: [],
  subject: '',
  content: '',
  sendType: ''
})
const form = reactive({
  sendEmail: '',
  receiveEmail: [],
  cc: [],
  bcc: [],
  accountId: -1,
  name: '',
  subject: '',
  content: '',
  sendType: '',
  text: '',
  emailId: 0,
  attachments: [],
  draftId: null,
})

const selectRecipientList = ref([])

function signatureKey(accountId) { return `cloudmail-signature-${accountId}` }
function getSignature(accountId) { return localStorage.getItem(signatureKey(accountId)) || '' }
function signatureToText(value) {
  if (!value) return ''
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value.replace(/<br\s*\/?>/gi, '\n')
}
function signatureHtml(accountId) {
  const signature = getSignature(accountId)
  if (!signature) return ''
  return `<div data-cloudmail-signature="1"><br><br>${signature}</div>`
}
function applySignature(content, accountId) {
  const signatureBlock = signatureHtml(accountId)
  if (!signatureBlock) return content || ''
  const marker = /<div data-cloudmail-signature="1">[\s\S]*?<\/div>/i
  if (marker.test(content || '')) {
    return (content || '').replace(marker, signatureBlock)
  }
  return `${content || ''}${signatureBlock}`
}
function setSignatureFromAccount() {
  if (form.sendType === 'forward' || form.sendType === 'reply') return
  nextTick(() => {
    if (!editor.value || !editor.value.getContent) return
    const current = editor.value.getContent() || ''
    const content = applySignature(current, form.accountId)
    editor.value.setContent(content)
    form.content = content
  })
}

function editSignature() {
  const current = getSignature(form.accountId)
  signatureDraft.value = signatureToText(current)
  showSignature.value = true
}

function saveSignature() {
  const value = signatureDraft.value
  const html = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br>')
  localStorage.setItem(signatureKey(form.accountId), html)
  showSignature.value = false

  nextTick(() => {
    if (editor.value && editor.value.getContent) {
      const current = editor.value.getContent() || ''
      const content = value ? applySignature(current, form.accountId) : (current || '').replace(/<div data-cloudmail-signature="1">[\s\S]*?<\/div>/i, '')
      editor.value.setContent(content)
      form.content = content
    } else if (value) {
      defValue.value = applySignature(defValue.value || '', form.accountId)
    }
  })

  ElMessage({message: value ? '签名已保存，并已插入正文' : '签名已清除', type: 'success', plain: true})
}

const contacts = computed(() => writerStore.sendRecipientRecord.map(item => ({email: item})))

function openContacts(target = 'receiveEmail') {
  contactTarget.value = target
  showContacts.value = true
  nextTick(() => {
    const currentList = form[contactTarget.value] || []
    currentList.forEach(item => {
      if (writerStore.sendRecipientRecord.includes(item)) {
        contactsTabRef.value.toggleRowSelection({email: item});
      }
    })
  })
}

function deleteContact() {
  ElMessageBox.confirm(t('confirmDeletionOfContacts'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
    const target = contactTarget.value
    form[target] = (form[target] || []).filter(item => !contactList.includes(item));
    writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(item => !contactList.includes(item));
  })
}

function chooseContact() {
  const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
  const target = contactTarget.value
  const currentList = form[target] || []

  contactList.forEach(item => {
    if (!currentList.includes(item)) {
      currentList.push(item);
    }
  })

  form[target] = currentList.filter(item => {
    return contactList.includes(item) || !writerStore.sendRecipientRecord.includes(item);
  });

  showContacts.value = false
}

function clearSelectContact() {
  contactsTabRef.value.clearSelection();
}

function selectChange(value) {
  form.receiveEmail.push(value)
}

function selectStatusChange(status) {
  selectStatus = status
}

const openSelect = () => {
  mySelect.value.toggleMenu()
}

function inputChange(value) {
  selectRecipientList.value = writerStore.sendRecipientRecord.filter(item => value && !form.receiveEmail.includes(item) && item.startsWith(value)).slice(0, 10);

  if (!selectStatus && selectRecipientList.value.length > 0) {
    openSelect()
  }

  if (selectStatus && selectRecipientList.value.length === 0) {
    openSelect()
  }
}

function addTagChange(val) {
  const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  form.receiveEmail.splice(form.receiveEmail.length - 1, 1)

  let has = false
  emails.forEach(email => {
    if (isEmail(email) && !form.receiveEmail.includes(email)) {
      form.receiveEmail.push(email)
      has = true
    }
  })
  if (selectStatus && has) openSelect()
}

function clearContent() {
  ElMessageBox.confirm(t('clearContentConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    resetForm()
  })
}

function delAtt(index) {
  form.attachments.splice(index, 1);
}

function chooseFile() {
  const doc = document.createElement("input")
  doc.setAttribute("type", "file")
  doc.multiple = true;
  doc.click()
  doc.onchange = async (e) => {
    const fileList = e.target.files;

    for (const file of fileList) {
      const size = file.size
      const filename = file.name
      const contentType = file.type

      const content = await fileToBase64(file)
      form.attachments.push({content, filename, size, contentType})
    }
  }
}

async function sendEmail() {
  if (form.receiveEmail.length === 0) {
    ElMessage({message: t('emptyRecipientMsg'), type: 'error', plain: true})
    return
  }

  if (!form.subject) {
    ElMessage({message: t('emptySubjectMsg'), type: 'error', plain: true})
    return
  }

  const editorContent = editor.value?.getContent ? editor.value.getContent() : '';
  const editorText = editor.value?.getContent ? editor.value.getContent({format: 'text'}) : '';
  if (editorContent) {
    form.content = editorContent;
  }
  if (editorText) {
    form.text = editorText;
  }

  form.content = applySignature(form.content, form.accountId);

  if (!form.content) {
    ElMessage({message: t('emptyContentMsg'), type: 'error', plain: true})
    return
  }

  if (form.manyType === 'divide' && form.attachments.length > 0) {
    ElMessage({message: t('noSeparateSendMsg'), type: 'error', plain: true})
    return
  }

  if (sending) {
    ElMessage({message: t('sendingErrorMsg'), type: 'error', plain: true})
    return
  }

  percentMessage = ElMessage({
    message: () => h(sendPercent, {value: percent.value, desc: t('sending')}),
    dangerouslyUseHTMLString: true,
    plain: true,
    duration: 0,
    customClass: 'message-bottom'
  })

  sending = true
  show.value = false

  emailSend(form, (e) => {
    percent.value = Math.round((e.loaded * 98) / e.total)
  }).then(emailList => {
    const email = emailList[0]
    emailList.forEach(item => emailStore.sendScroll?.addItem(item))

    ElNotification({
      title: t('sendSuccessMsg'),
      type: "success",
      message: h('span', {style: 'color: teal'}, email.subject),
      position: 'bottom-right'
    })

    userStore.refreshUserInfo();
    addRecipientRecord();

    if (form.draftId) {
      form.subject = ''
      form.content = ''
      form.receiveEmail = []
      draftStore.setDraft = {...toRaw(form)}
    }

    show.value = false
    resetForm();
  }).catch((e) => {
    ElNotification({
      title: t('sendFailMsg'),
      type: e.code === 403 ? 'warning' : 'error',
      message: h('span', {style: 'color: teal'}, e.message),
      position: 'bottom-right'
    })
    if (e.code === 401) {
      localStorage.removeItem('token');
      router.replace('/login');
    }
    show.value = true
    addRecipientRecord();
  }).finally(() => {
    percentMessage.close()
    percent.value = 0
    sending = false
  })
}

function addRecipientRecord() {
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(email => !form.receiveEmail.includes(email));
  writerStore.sendRecipientRecord.unshift(...form.receiveEmail);
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.slice(0, 500);
}

function resetForm() {
  form.receiveEmail = []
  form.cc = []
  form.bcc = []
  showCc.value = false
  showBcc.value = false
  showSignature.value = false
  signatureDraft.value = ''
  contactTarget.value = 'receiveEmail'
  form.subject = ''
  form.content = ''
  form.manyType = null
  form.attachments = []
  form.sendType = ''
  form.emailId = 0
  form.draftId = null
  backReply.content = ''
  backReply.subject = ''
  backReply.receiveEmail = []
  backReply.sendType = ''
  replyContext.sender = ''
  replyContext.allTo = []
  replyContext.allCc = []
  editor.value.clearEditor()
}

function change(content, text) {
  form.content = content;
  form.text = text
}

function focusChange() {
  if (selectStatus) openSelect()
}

function emailContentForQuote(email) {
  const html = formatImage(email.content || '');
  const text = String(email.text || '').trim();
  if (!html) return text ? `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${escapeEmailText(text)}</pre>` : '';
  if (!text) return html;

  const htmlText = normalizeEmailText(stripEmailHtml(html));
  const normalizedText = normalizeEmailText(text);
  const sample = normalizedText.slice(0, Math.min(80, normalizedText.length));

  if (sample.length >= 20 && !htmlText.includes(sample) && normalizedText.length > htmlText.length + 20) {
    return `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${escapeEmailText(text)}</pre>`;
  }
  return html;
}

function stripEmailHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeEmailText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function escapeEmailText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function openForward(email) {
  resetForm();
  email.subject = email.subject || ''
  form.subject = email.subject
  form.sendType = 'forward'
  defValue.value = ''

  setTimeout(async () => {
    defValue.value = `
      ${emailContentForQuote(email)}
    `
    form.emailId = email.emailId
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })
  });
}

function openReplyAll(email) {
  openReply(email)
  nextTick(() => setReplyMode('all'))
}

function parseRecipientAddresses(value) {
  try {
    const list = JSON.parse(value || '[]')
    return list.map(item => typeof item === 'string' ? item : item.address).filter(Boolean)
  } catch (e) {
    return []
  }
}

function currentAccountEmails() {
  return new Set([
    form.sendEmail,
    userStore.user?.email,
    accountStore.currentAccount?.email
  ].filter(Boolean).map(email => String(email).trim().toLowerCase()))
}

function uniqueEmails(list) {
  const seen = new Set()
  return list.filter(email => {
    const value = String(email || '').trim()
    const key = value.toLowerCase()
    if (!value || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function prepareReplyContext(email) {
  const own = currentAccountEmails()
  const sender = String(email.sendEmail || '').trim()
  const originalTo = parseRecipientAddresses(email.recipient)
  const originalCc = parseRecipientAddresses(email.cc)
  const allTo = uniqueEmails([sender, ...originalTo]).filter(address => !own.has(address.toLowerCase()))
  const toSet = new Set(allTo.map(address => address.toLowerCase()))
  const allCc = uniqueEmails(originalCc).filter(address => !own.has(address.toLowerCase()) && !toSet.has(address.toLowerCase()))
  replyContext.sender = sender
  replyContext.allTo = allTo
  replyContext.allCc = allCc
}

function setReplyMode(mode) {
  if (form.sendType !== 'reply') return
  if (mode === 'all') {
    form.receiveEmail = [...replyContext.allTo]
    form.cc = [...replyContext.allCc]
    showCc.value = form.cc.length > 0
  } else {
    form.receiveEmail = replyContext.sender ? [replyContext.sender] : []
    form.cc = []
    showCc.value = false
  }
}

function openReply(email) {
  resetForm();
  email.subject = email.subject || ''
  prepareReplyContext(email)
  form.receiveEmail.push(email.sendEmail)
  form.subject = (
      email.subject.startsWith('Re:') ||
      email.subject.startsWith('Re：') ||
      email.subject.startsWith('回复：') ||
      email.subject.startsWith('回复:')) ? email.subject : 'Re: ' + email.subject
  form.sendType = 'reply'
  form.emailId = email.emailId
  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
    <div></div>
    <div>
    <br>
        ${formatDetailDate(email.createTime)} ${email.name} &lt${email.sendEmail}&gt ${t('wrote')}:
    </div>
    <blockquote class="mceNonEditable" style="margin: 0 0 0 0.8ex;border-left: 1px solid rgb(204,204,204);padding-left: 1ex;">
      <articl>
          ${emailContentForQuote(email)}
      </article>
    </blockquote>`
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })
  })
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function open() {
  if (!accountStore.currentAccount.email) {
    form.sendEmail = userStore.user.email;
    form.accountId = userStore.user.account.accountId;
    form.name = userStore.user.name;
  } else {
    form.sendEmail = accountStore.currentAccount.email;
    form.accountId = accountStore.currentAccount.accountId;
    form.name = accountStore.currentAccount.name;
  }
  show.value = true;
  setSignatureFromAccount();
  editor.value.focus()
}

function openDraft(draft) {
  Object.assign(form, {...draft})
  defValue.value = ''
  setTimeout(() => defValue.value = form.content)
  show.value = true;
  editor.value.focus()
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') close()
};

onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));

function close() {
  if (selectStatus) openSelect();

  if (!form.content) form.content = editor.value.getContent();

  if (form.draftId) {
    draftStore.setDraft = {...toRaw(form)}
    show.value = false
    resetForm()
    return;
  }

  if (!(form.content || form.subject || form.receiveEmail.length > 0)) {
    show.value = false
    resetForm()
    return;
  }

  if (backReply.sendType === 'reply' || backReply.sendType === 'forward') {
    let subjectFlag = form.subject === backReply.subject
    let contentFlag = editor.value.getContent() === backReply.content
    let receiveFlag = form.receiveEmail.length === 1 && form.receiveEmail[0] === backReply.receiveEmail[0]
    if (backReply.sendType === 'forward' && form.receiveEmail.length === 0) receiveFlag = true;
    if (subjectFlag && contentFlag && receiveFlag) {
      resetForm();
      close()
      return;
    }
  }

  ElMessageBox.confirm(t('saveDraftConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning',
    distinguishCancelAndClose: true
  }).then(async () => {
    const formData = {...toRaw(form)};
    delete formData.draftId
    delete formData.attachments
    formData.createTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
    const draftId = await db.value.draft.add({...formData})
    db.value.att.add({draftId, attachments: toRaw(form.attachments)})
    draftStore.refreshList++
    show.value = false
    await nextTick(() => resetForm())
  }).catch((action) => {
    if (action === 'cancel') {
      show.value = false
      resetForm()
    }
  })
}
</script>

<style>
.write-select .el-select-dropdown__list { padding: 4px 4px !important; }
.write-select .el-select-dropdown__item { padding: 0 10px 0 10px; }
.write-select .el-select-dropdown { min-width: 0 !important; }
</style>

<style scoped lang="scss">
.send {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .write-box {
    background: var(--el-bg-color);
    width: min(1367px, calc(100% - 80px));
    box-shadow: var(--el-box-shadow-light);
    border: 1px solid var(--el-border-color-light);
    transition: var(--el-transition-duration);
    padding: 15px;
    border-radius: 8px;
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    @media (max-width: 1024px) {
      width: 100%;
      height: 100%;
      border-radius: 0;
      border: 0;
      padding-top: 10px;
    }
    @media (min-width: 1025px) {
      height: min(800px, calc(100vh - 60px));
    }

    .title {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      .title-left {
        align-items: center;
        display: grid;
        grid-template-columns: auto auto auto 1fr;
      }
      .sender { margin-left: 8px; }
      .sender-name { margin-left: 8px; font-weight: bold; }
      .send-email {
        color: #999896;
        margin-left: 5px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      div { display: flex; align-items: center; }
    }

    .container {
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 15px;

      .item-title { }
      .recipient-options {
        display: flex;
        gap: 2px;
        margin-top: -10px;
        flex: 0 0 auto;
      }
      .extra-recipient {
        width: 100%;
        flex: 0 0 auto;
      }
      .editor-wrapper {
        flex: 1 1 auto;
        min-height: 0;
        overflow: hidden;
      }
      .editor-wrapper :deep(.editor-box),
      .editor-wrapper :deep(.tox-tinymce) {
        height: 100% !important;
      }
      .button-item {
        flex: 0 0 auto;
        min-height: 32px;
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        align-items: center;

        .att-add { cursor: pointer; }
        .att-clear { cursor: pointer; margin-left: 10px; }
        .att-list {
          display: grid;
          gap: 5px;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          padding-left: 10px;
          padding-right: 10px;
          max-height: 70px;
          overflow-y: auto;
          @media (max-width: 450px) {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
          .att-item {
            display: grid;
            grid-template-columns: auto 1fr auto auto;
            gap: 5px;
            height: 32px;
            font-size: 14px;
            padding: 4px 5px;
            background: var(--light-ill);
            border-radius: 4px;
            .att-filename {
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
            }
          }
        }
      }
    }
  }
}

.email-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-dialog) {
  width: 420px !important;
  @media (max-width: 460px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

:deep(.signature-dialog) {
  width: 560px !important;
  max-width: calc(100% - 40px) !important;
  @media (max-width: 600px) {
    width: calc(100% - 40px) !important;
  }
}

.signature-label {
  margin-bottom: 10px;
  color: var(--el-text-color-regular);
}

.contacts-bottom {
  display: flex;
  justify-content: end;
  margin-top: 10px;
}

.add-contact { color: var(--regular-text-color) }

.write-select {
  position: absolute;
  width: 300px;
  left: 60px;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
}

:deep(.el-input-tag__suffix) { padding-right: 4px; }
.icon { cursor: pointer; }
</style>
