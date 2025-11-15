<template>
  <div class="auth-modal">
    <div class="auth-modal-container">
      <div class="auth-modal-header">
        <h2>用户登录</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <form @submit.prevent="login" class="auth-modal-body">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="请输入用户名"
            :disabled="isLoading"
            required
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="请输入密码"
            :disabled="isLoading"
            required
            autocomplete="current-password"
            minlength="6"
          />
        </div>

        <div class="auth-modal-footer">
          <button 
            type="submit"
            class="auth-button" 
            :disabled="isLoading"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
          <div class="auth-link">
            还没有账号？
            <a href="#" @click.prevent="$emit('switch-to-register')">去注册</a>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { authAPI } from '../services/auth';

const emit = defineEmits(['close', 'login-success', 'switch-to-register']);

// 表单数据
const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

// 登录方法
async function login() {
  // 简单验证
  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码';
    return;
  }
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    const response = await authAPI.login(username.value, password.value);
    
    if (response.success) {
      // 发送登录成功事件，传递用户数据
      emit('login-success', response.data.user);
      // 关闭登录框
      emit('close');
    } else {
      // 显示错误信息
      errorMessage.value = response.error || response.errors?.join('\n') || '登录失败，请检查用户名和密码';
    }
  } catch (error) {
    console.error('登录过程出错:', error);
    // 处理不同类型的错误
    if (error.response) {
      // 服务器返回错误
      const errorData = error.response.data;
      errorMessage.value = errorData.error || errorData.errors?.join('\n') || '登录失败，请检查用户名和密码';
    } else if (error.request) {
      // 请求发送失败
      errorMessage.value = '无法连接到服务器，请检查网络连接';
    } else {
      // 其他错误
      errorMessage.value = '登录过程出错，请稍后再试';
    }
  } finally {
    isLoading.value = false;
  }
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
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 20px;
}

.error-message {
  background-color: var(--error-bg, #fee2e2);
  color: var(--error-color, #dc2626);
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-line;
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
  margin-top: auto;
  padding: 16px 0 0;
  border-top: 1px solid var(--border-color);
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

/* 添加表单相关样式 */
form {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 改进错误消息样式 */
.error-message {
  background-color: var(--error-bg, #fee2e2);
  color: var(--error-color, #dc2626);
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-line;
}
</style> 