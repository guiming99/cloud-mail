import {createRouter, createWebHistory} from 'vue-router'
import NProgress from 'nprogress';
import {useUiStore} from "@/store/ui.js";
import {useSettingStore} from "@/store/setting.js";
import {cvtR2Url} from "@/utils/convert.js";

const routes = [
    {
        path: '/', name:'layout', redirect:'/inbox', component:()=>import('@/layout/index.vue'),
        children:[
            {path:'/inbox',name:'email',component:()=>import('@/views/email/index.vue'),meta:{title:'inbox',name:'email',menu:true}},
            {path:'/mail',name:'content',component:()=>import('@/views/content/index.vue'),meta:{title:'message',name:'content',menu:false}},
            {path:'/contacts',name:'contacts',component:()=>import('@/views/contacts/index.vue'),meta:{title:'contacts',name:'contacts',menu:true}},
            {path:'/settings',name:'setting',component:()=>import('@/views/setting/index.vue'),meta:{title:'settings',name:'setting',menu:true}},
            {path:'/starred',name:'star',component:()=>import('@/views/star/index.vue'),meta:{title:'starred',name:'star',menu:true}},
        ]
    },
    {path:'/login',name:'login',component:()=>import('@/views/login/index.vue')},
    {path:'/test',name:'test',component:()=>import('@/views/test/index.vue')},
    {path:'/:pathMatch(.*)*',name:'404',component:()=>import('@/views/404/index.vue')}
]

const router=createRouter({history:createWebHistory(import.meta.env.BASE_URL),routes})
NProgress.configure({showSpinner:false,trickleSpeed:50,minimum:0.1})
let timer;let first=true
router.beforeEach((to,from,next)=>{
 if(timer)clearTimeout(timer)
 if(!first)timer=setTimeout(()=>NProgress.start(),100)
 const token=localStorage.getItem('token')
 if(!token&&to.name!=='login')return next({name:'login'})
 if(token&&to.name==='login')return next(from.path)
 if(!token&&to.name==='login')return loadBackground(next)
 next()
})
function loadBackground(next){const s=useSettingStore();if(s.settings.background){const i=new Image();i.src=cvtR2Url(s.settings.background);i.onload=()=>next();i.onerror=()=>next();setTimeout(()=>next(),3000)}else next()}
router.afterEach((to)=>{clearTimeout(timer);if(first)removeLoading();else NProgress.done();const uiStore=useUiStore();if(to.meta.menu)uiStore.accountShow=window.innerWidth>767;if(window.innerWidth<1025)uiStore.asideShow=false;first=false})
function removeLoading(){const doc=document.getElementById('loading-first');if(doc)doc.remove()}
export default router
