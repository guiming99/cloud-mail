<template>
<div class="customer-detail" v-if="contact">
    <h2>{{contact.name}}</h2>
    <p>{{contact.company}}</p>
    <p>{{contact.email}}</p>
    <p>{{contact.country}}</p>

    <h3>Customer Tags</h3>
    <span v-for="tag in contact.tags" :key="tag">{{tag}}</span>

    <h3>AI Customer Insight</h3>
    <p>Score: {{score}} / 100</p>
    <p>{{suggestion}}</p>

    <h3>Communication History</h3>
    <p>Recent emails: {{contact.emailCount}}</p>
</div>
</template>

<script setup>
import { computed } from 'vue'
import { useContactStore } from '@/store/contact'
import { calculateCustomerScore, customerSuggestion } from '@/utils/customerScore'

const store = useContactStore()
const contact = computed(()=>store.selected)
const score = computed(()=>contact.value ? calculateCustomerScore(contact.value) : 0)
const suggestion = computed(()=>contact.value ? customerSuggestion(contact.value) : '')
</script>
