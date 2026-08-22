import { readFileSync, writeFileSync } from 'node:fs'

const path = new URL('./src/layout/write/index.vue', import.meta.url)
let text = readFileSync(path, 'utf8')

if (!text.includes("@click=\"setReplyMode('all')\"")) {
  const oldOptions = `        <div class="recipient-options">
          <el-button link size="small" @click="showCc = !showCc">抄送</el-button>
          <el-button link size="small" @click="showBcc = !showBcc">密送</el-button>
          <el-button link size="small" @click="editSignature">签名</el-button>
        </div>`
  const newOptions = `        <div class="recipient-options">
          <el-button v-if="form.sendType === 'reply'" link size="small" @click="setReplyMode('sender')">回复发件人</el-button>
          <el-button v-if="form.sendType === 'reply'" link size="small" @click="setReplyMode('all')">回复全部</el-button>
          <el-button link size="small" @click="showCc = !showCc">抄送</el-button>
          <el-button link size="small" @click="showBcc = !showBcc">密送</el-button>
          <el-button link size="small" @click="editSignature">签名</el-button>
        </div>`
  if (!text.includes(oldOptions)) throw new Error('reply-all: recipient options block not found')
  text = text.replace(oldOptions, newOptions)

  const oldContext = `const contactTarget = ref('receiveEmail')
let selectStatus = false`
  const newContext = `const contactTarget = ref('receiveEmail')
const replyContext = reactive({ sender: '', allTo: [], allCc: [] })
let selectStatus = false`
  if (!text.includes(oldContext)) throw new Error('reply-all: context insertion point not found')
  text = text.replace(oldContext, newContext)

  const helper = `function parseRecipientAddresses(value) {
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

`
  const replyMarker = 'function openReply(email) {'
  if (!text.includes(replyMarker)) throw new Error('reply-all: openReply marker not found')
  text = text.replace(replyMarker, helper + replyMarker)

  const oldReplyStart = `function openReply(email) {
  resetForm();
  email.subject = email.subject || ''
  form.receiveEmail.push(email.sendEmail)`
  const newReplyStart = `function openReply(email) {
  resetForm();
  email.subject = email.subject || ''
  prepareReplyContext(email)
  form.receiveEmail.push(email.sendEmail)`
  if (!text.includes(oldReplyStart)) throw new Error('reply-all: openReply start not found')
  text = text.replace(oldReplyStart, newReplyStart)

  const oldReset = `  backReply.receiveEmail = []
  backReply.sendType = ''
  editor.value.clearEditor()`
  const newReset = `  backReply.receiveEmail = []
  backReply.sendType = ''
  replyContext.sender = ''
  replyContext.allTo = []
  replyContext.allCc = []
  editor.value.clearEditor()`
  if (!text.includes(oldReset)) throw new Error('reply-all: reset point not found')
  text = text.replace(oldReset, newReset)

  writeFileSync(path, text)
  console.log('Reply-all patch applied to mail-vue/src/layout/write/index.vue')
} else {
  console.log('Reply-all patch already present')
}
