<template>
  <div class="auth-modal">
    <div class="auth-modal-container">
      <div class="auth-modal-header">
        <h2>用户注册</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <form @submit.prevent="register" class="auth-modal-body">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="userData.username" 
            placeholder="请输入用户名（至少4个字符）"
            :disabled="isLoading || registrationSuccess"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="userData.password" 
            placeholder="请输入密码（至少6个字符）"
            :disabled="isLoading || registrationSuccess"
            required
            minlength="6"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            placeholder="请再次输入密码"
            :disabled="isLoading || registrationSuccess"
            required
            minlength="6"
          />
        </div>
        
        <div class="form-group">
          <label for="email">邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="userData.email" 
            placeholder="请输入邮箱地址"
            :disabled="isLoading || registrationSuccess"
            required
          />
        </div>

        <div class="auth-modal-footer">
          <button 
            v-if="!registrationSuccess"
            type="submit"
            class="auth-button" 
            :disabled="isLoading"
          >
            {{ isLoading ? '注册中...' : '注册' }}
          </button>
          
          <button 
            v-if="registrationSuccess"
            type="button"
            class="auth-button success-button" 
            @click="$emit('switch-to-login')"
          >
            去登录
          </button>
          
          <div v-if="!registrationSuccess" class="auth-link">
            已有账号？
            <a href="#" @click.prevent="$emit('switch-to-login')">去登录</a>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { authAPI } from '../services/auth';

const emit = defineEmits(['close', 'register-success', 'switch-to-login']);

// 表单数据
const userData = reactive({
  username: '',
  password: '',
  email: ''
});
const confirmPassword = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const registrationSuccess = ref(false);

// 注册方法
async function register() {
  // 验证输入
  if (!userData.username || !userData.password || !confirmPassword.value || !userData.email) {
    errorMessage.value = '请填写所有必填字段';
    return;
  }
  
  if (userData.username.length < 4) {
    errorMessage.value = '用户名长度至少需要4个字符';
    return;
  }
  
  if (userData.password.length < 6) {
    errorMessage.value = '密码长度至少需要6个字符';
    return;
  }
  
  if (userData.password !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致';
    return;
  }
  
  if (!validateEmail(userData.email)) {
    errorMessage.value = '请输入有效的邮箱地址';
    return;
  }
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    successMessage.value = '';
    
    const result = await authAPI.register(userData);
    
    if (result.success) {
      registrationSuccess.value = true;
      successMessage.value = '注册成功！现在可以登录了。';
      emit('register-success');
    } else {
      errorMessage.value = result.error || '注册失败，请稍后再试';
    }
  } catch (error) {
    console.error('注册过程出错:', error);
    errorMessage.value = '注册过程出错，请稍后再试';
  } finally {
    isLoading.value = false;
  }
}

// 验证邮箱格式
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
</script>

<style scoped>
.auth-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.auth-modal-container {
  background-color: var(--bg-primary);
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: background-color var(--transition-normal);
}

.auth-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--primary-color);
  color: white;
}

.auth-modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

.auth-modal-body {
  padding: 20px;
}

.error-message {
  background-color: var(--error-bg);
  color: var(--error-color);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.form-group input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-light);
  outline: none;
}

.form-group input:disabled {
  background-color: var(--bg-disabled);
  cursor: not-allowed;
}

.auth-modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-button {
  width: 100%;
  padding: 12px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.auth-button:hover {
  background-color: var(--primary-dark);
}

.auth-button:disabled {
  background-color: var(--bg-disabled);
  cursor: not-allowed;
}

.success-button {
  background-color: #4caf50;
}

.auth-link {
  margin-top: 12px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.auth-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.auth-link a:hover {
  color: var(--primary-dark);
}
</style> 