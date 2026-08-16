<template>
  <div class="contacts-page">
    <div class="toolbar">
      <h2>Contacts CRM</h2>
      <input v-model="keyword" placeholder="Search name, company, email" />
    </div>
    <div class="layout">
      <div class="list">
        <div v-for="item in filtered" :key="item.email" class="card" @click="active=item">
          <b>{{ item.name }}</b>
          <div>{{ item.company }}</div>
          <small>{{ item.email }}</small>
          <span v-for="tag in item.tags" :key="tag" class="tag">{{tag}}</span>
        </div>
      </div>
      <div class="detail" v-if="active">
        <h3>{{active.name}}</h3>
        <p>{{active.company}}</p>
        <p>{{active.country}} · {{active.position}}</p>
        <hr/>
        <h4>AI Customer Profile</h4>
        <p>Customer analysis will be generated from email history.</p>
        <h4>Communication History</h4>
        <p>Last contact: {{active.lastContact}}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
const keyword = ref('')
const active = ref(null)
const contacts = ref([
 {name:'John Smith',company:'ABC Motorcycle Mexico',email:'john@abc.com',country:'Mexico',position:'Purchasing Manager',tags:['VIP','Quoted'],lastContact:'2026-08-15'},
])
const filtered = computed(()=>contacts.value.filter(x=>JSON.stringify(x).toLowerCase().includes(keyword.value.toLowerCase())))
</script>

<style scoped>
.contacts-page{padding:24px}.toolbar{display:flex;justify-content:space-between}.toolbar input{width:300px;padding:8px}.layout{display:flex;gap:20px;margin-top:20px}.list{width:40%}.detail{flex:1;background:#fafafa;padding:20px}.card{padding:15px;border-bottom:1px solid #ddd;cursor:pointer}.tag{margin:5px;padding:3px 8px;border-radius:10px;background:#eee;font-size:12px}
</style>
