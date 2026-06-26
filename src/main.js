import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router/index.js'
import '@/assets/style/index.scss'
import App from './App.vue'

import '@/assets/style/index.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
