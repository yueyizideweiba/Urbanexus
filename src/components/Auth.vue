<template>
  <div>
    <Login 
      v-if="currentView === 'login'"
      @close="$emit('close')"
      @login-success="handleLoginSuccess"
      @switch-to-register="currentView = 'register'"
    />
    
    <Register 
      v-if="currentView === 'register'"
      @close="$emit('close')"
      @register-success="handleRegisterSuccess"
      @switch-to-login="currentView = 'login'"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Login from './Login.vue';
import Register from './Register.vue';

// 定义事件
const emit = defineEmits(['close', 'login-success']);

// 默认显示登录视图
const currentView = ref('login');

// 处理登录成功
function handleLoginSuccess(user) {
  emit('login-success', user);
}

// 处理注册成功
function handleRegisterSuccess() {
  // 注册成功后自动切换到登录页
  setTimeout(() => {
    currentView.value = 'login';
  }, 1000);
}
</script> 