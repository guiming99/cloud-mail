<template>
  <div class="content-box" ref="contentBox">
    <div ref="container" class="content-html"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  html: {
    type: String,
    required: true
  }
})

const container = ref(null)
const contentBox = ref(null)
let shadowRoot = null

function sanitizeHtml(html) {
  return String(html || '')
    // Mail HTML frequently contains head/style blocks whose rules can hide
    // the actual message body when rendered inside the viewer.
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Do not allow common web-mail hiding rules to hide the message body.
    .replace(/style\s*=\s*(["'])[^"']*(display\s*:\s*none|visibility\s*:\s*hidden)[^"']*\1/gi, '')
}

function updateContent() {
  if (!shadowRoot) return;

  const bodyStyleRegex = /<body[^>]*style="([^"]*)"[^>]*>/i;
  const bodyStyleMatch = props.html.match(bodyStyleRegex);
  const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : '';
  const cleanedHtml = sanitizeHtml(props.html).replace(/<\/?body[^>]*>/gi, '');

  shadowRoot.innerHTML = `
    <style>
      :host {
        all: initial;
        display: block;
        width: 100%;
        height: 100%;
        font-family: -apple-system, Inter, BlinkMacSystemFont,
                    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #13181D;
        word-break: break-word;
      }

      h1, h2, h3, h4 {
          font-size: 18px;
          font-weight: 700;
      }

      p {
        margin: 0;
      }

      a {
        text-decoration: none;
        color: #0E70DF;
      }

      .shadow-content {
        background: #FFFFFF;
        width: 100%;
        min-width: 0;
        height: fit-content;
        ${bodyStyle ? bodyStyle : ''}
      }

      img:not(table img) {
        max-width: 100%;
        height: auto !important;
      }
    </style>
    <div class="shadow-content">
      ${cleanedHtml}
    </div>
  `;
}

function autoScale() {
  // Do not use zoom based on scrollWidth here. Email HTML often contains
  // intentionally wide tables, and scaling the whole host can make text
  // disappear or become unreadably small on mobile browsers.
  if (!shadowRoot || !contentBox.value) return
  const hostElement = shadowRoot.host
  hostElement.style.zoom = ''
}

onMounted(async () => {
  shadowRoot = container.value.attachShadow({ mode: 'open' })
  updateContent()
  await nextTick()
  autoScale()
})

watch(() => props.html, async () => {
  updateContent()
  await nextTick()
  autoScale()
})
</script>

<style scoped>
.content-box {
  width: 100%;
  min-height: 40px;
  overflow: visible;
  font-family: -apple-system, Inter, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
}

.content-html {
  width: 100%;
  min-height: 40px;
}
</style>
