import Vue from 'vue'
import VueCesium from 'vue-cesium'
import App from './App.vue'

Vue.config.productionTip = false
Vue.use(VueCesium)

new Vue({
  render: h => h(App),
}).$mount('#app')
