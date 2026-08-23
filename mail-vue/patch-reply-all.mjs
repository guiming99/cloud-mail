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

// Email body reliability patch: always snapshot TinyMCE immediately before send.
let bodyText = readFileSync(path, 'utf8')
if (!bodyText.includes('const editorContent = editor.value?.getContent ? editor.value.getContent() : \'\';')) {
  const oldSend = `  if (!form.content) {
    form.content = editor.value.getContent();
  }

  form.content = applySignature(form.content, form.accountId);`
  const newSend = `  const editorContent = editor.value?.getContent ? editor.value.getContent() : '';
  const editorText = editor.value?.getContent ? editor.value.getContent({format: 'text'}) : '';
  if (editorContent) {
    form.content = editorContent;
  }
  if (editorText) {
    form.text = editorText;
  }

  form.content = applySignature(form.content, form.accountId);`
  if (!bodyText.includes(oldSend)) throw new Error('email-body: sendEmail target not found')
  bodyText = bodyText.replace(oldSend, newSend)
}

if (!bodyText.includes('function emailContentForQuote(email) {')) {
  const helper = `function emailContentForQuote(email) {
  const html = formatImage(email.content || '')
  const text = String(email.text || '').trim()
  if (!html) return text ? \`<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">\${escapeEmailText(text)}</pre>\` : ''
  if (!text) return html

  const htmlText = normalizeEmailText(stripEmailHtml(html))
  const normalizedText = normalizeEmailText(text)
  const sample = normalizedText.slice(0, Math.min(80, normalizedText.length))

  if (sample.length >= 20 && !htmlText.includes(sample) && normalizedText.length > htmlText.length + 20) {
    return \`<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">\${escapeEmailText(text)}</pre>\`
  }
  return html
}

function stripEmailHtml(html) {
  return String(html || '')
    .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')
    .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\\s+/g, ' ')
    .trim()
}

function normalizeEmailText(value) {
  return String(value || '').replace(/\\s+/g, ' ').trim()
}

function escapeEmailText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

`
  const marker = 'function openForward(email) {'
  if (!bodyText.includes(marker)) throw new Error('email-body: quote insertion point not found')
  bodyText = bodyText.replace(marker, helper + marker)

  const oldQuote = '${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}'
  const count = bodyText.split(oldQuote).length - 1
  if (count !== 2) throw new Error(`email-body: expected 2 quote fallback sites, found ${count}`)
  bodyText = bodyText.split(oldQuote).join('${emailContentForQuote(email)}')
}
writeFileSync(path, bodyText)
console.log('Email body send/reply/forward patch applied')

// Email detail patch: fall back to the complete plain-text part when the HTML
// part is stale or contains only a signature.
const contentPath = new URL('./src/views/content/index.vue', import.meta.url)
let contentText = readFileSync(contentPath, 'utf8')
if (!contentText.includes('const sample = text.slice(0, Math.min(80, text.length));')) {
  const oldDetail = `  const htmlText = stripHtml(email.content);
  const text = String(email.text).replace(/\\s+/g, ' ').trim();
  if (!htmlText) return false;

  // If the HTML is only a trailing signature while the plain-text body contains
  // substantially more content, prefer the complete plain-text body.
  if (text.length > htmlText.length && text.endsWith(htmlText)) {
    return false;
  }

  return true;`
  const newDetail = `  const htmlText = stripHtml(email.content);
  const text = String(email.text).replace(/\\s+/g, ' ').trim();
  if (!htmlText) return false;

  // If the HTML does not contain the beginning of the plain-text body and is
  // substantially shorter, it is usually a signature-only/stale HTML part.
  const sample = text.slice(0, Math.min(80, text.length));
  if (sample.length >= 20 && !htmlText.includes(sample) && text.length > htmlText.length + 20) {
    return false;
  }

  return true;`
  if (!contentText.includes(oldDetail)) throw new Error('email-body: detail fallback target not found')
  contentText = contentText.replace(oldDetail, newDetail)
  writeFileSync(contentPath, contentText)
  console.log('Email detail fallback patch applied')
}
