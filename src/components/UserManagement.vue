<template>
  <div class="user-management">
    <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEditing ? '编辑用户' : '添加用户' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
          
          <div class="form-group">
            <label for="username">用户名</label>
            <input type="text" id="username" v-model="userForm.username" :disabled="isEditing" />
          </div>
          
          <div class="form-group">
            <label for="email">电子邮箱</label>
            <input type="email" id="email" v-model="userForm.email" />
          </div>
          
          <div class="form-group">
            <label for="password">密码{{ isEditing ? '（留空保持不变）' : '' }}</label>
            <input type="password" id="password" v-model="userForm.password" />
          </div>
          
          <div class="form-group">
            <label for="role">角色</label>
            <select id="role" v-model="userForm.role">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="save-btn" @click="saveUser" :disabled="isLoading">
            {{ isLoading ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <div class="user-management-header">
      <h2>用户管理</h2>
      <button class="add-user-btn" @click="openAddUserModal">添加用户</button>
    </div>
    
    <div v-if="isLoading && !users.length" class="loading">正在加载用户数据...</div>
    
    <div v-if="error" class="error-message">{{ error }}</div>
    
    <div v-if="users.length" class="user-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>电子邮箱</th>
            <th>角色</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span :class="['role-badge', user.role === 'admin' ? 'admin' : 'user']">
                {{ user.role === 'admin' ? '管理员' : '普通用户' }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td class="actions">
              <button class="edit-btn" @click="openEditUserModal(user)">编辑</button>
              <button class="delete-btn" @click="confirmDeleteUser(user)" 
                      :disabled="user.role === 'admin' && currentUser.id !== user.id">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="!isLoading && !users.length && !error" class="no-data">
      暂无用户数据
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { authAPI } from '../services/auth';

// 用户列表
const users = ref([]);
const isLoading = ref(false);
const error = ref(null);
const successMessage = ref('');
const errorMessage = ref('');

// 模态框状态
const showModal = ref(false);
const isEditing = ref(false);
const currentUserId = ref(null);

// 获取当前登录用户
const currentUser = ref(authAPI.getCurrentUser());

// 用户表单
const userForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'user'
});

// 加载用户列表
const loadUsers = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await authAPI.getAllUsers();
    if (response.success) {
      users.value = response.data;
    } else {
      error.value = response.error || '获取用户列表失败';
    }
  } catch (err) {
    console.error('加载用户失败', err);
    error.value = '加载用户列表时出错';
  } finally {
    isLoading.value = false;
  }
};

// 打开添加用户模态框
const openAddUserModal = () => {
  userForm.value = {
    username: '',
    email: '',
    password: '',
    role: 'user'
  };
  isEditing.value = false;
  currentUserId.value = null;
  errorMessage.value = '';
  successMessage.value = '';
  showModal.value = true;
};

// 打开编辑用户模态框
const openEditUserModal = (user) => {
  userForm.value = {
    username: user.username,
    email: user.email,
    password: '', // 不显示密码
    role: user.role
  };
  isEditing.value = true;
  currentUserId.value = user.id;
  errorMessage.value = '';
  successMessage.value = '';
  showModal.value = true;
};

// 关闭模态框
const closeModal = () => {
  showModal.value = false;
};

// 保存用户
const saveUser = async () => {
  // 表单验证
  if (!userForm.value.username && !isEditing.value) {
    errorMessage.value = '请输入用户名';
    return;
  }
  
  if (!userForm.value.email) {
    errorMessage.value = '请输入电子邮箱';
    return;
  }
  
  if (!userForm.value.password && !isEditing.value) {
    errorMessage.value = '请输入密码';
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  
  try {
    let response;
    
    if (isEditing.value) {
      // 更新用户
      const updateData = { 
        email: userForm.value.email,
        role: userForm.value.role
      };
      
      // 如果提供了新密码，则包含密码
      if (userForm.value.password) {
        updateData.password = userForm.value.password;
      }
      
      response = await authAPI.updateUser(currentUserId.value, updateData);
    } else {
      // 使用注册API创建用户
      response = await authAPI.register({
        username: userForm.value.username,
        email: userForm.value.email,
        password: userForm.value.password,
        role: userForm.value.role
      });
    }
    
    if (response.success) {
      successMessage.value = isEditing.value ? '用户更新成功' : '用户创建成功';
      
      // 重新加载用户列表
      await loadUsers();
      
      // 2秒后关闭模态框
      setTimeout(() => {
        closeModal();
      }, 2000);
    } else {
      errorMessage.value = response.error || (isEditing.value ? '更新用户失败' : '创建用户失败');
    }
  } catch (err) {
    console.error(isEditing.value ? '更新用户失败' : '创建用户失败', err);
    errorMessage.value = '操作失败，请稍后再试';
  } finally {
    isLoading.value = false;
  }
};

// 确认删除用户
const confirmDeleteUser = async (user) => {
  if (user.role === 'admin' && currentUser.value.id !== user.id) {
    alert('您无法删除其他管理员用户');
    return;
  }
  
  if (user.id === currentUser.value.id) {
    alert('您不能删除自己的账户');
    return;
  }
  
  if (confirm(`确定要删除用户 "${user.username}" 吗？`)) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await authAPI.deleteUser(user.id);
      
      if (response.success) {
        // 重新加载用户列表
        await loadUsers();
      } else {
        error.value = response.error || '删除用户失败';
      }
    } catch (err) {
      console.error('删除用户失败', err);
      error.value = '删除用户时出错';
    } finally {
      isLoading.value = false;
    }
  }
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 组件加载时获取用户列表
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-management {
  padding: 20px;
  background-color: var(--bg-primary);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-user-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.user-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

th {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background-color: var(--primary-light);
  color: var(--primary-dark);
}

.role-badge.user {
  background-color: var(--neutral-200);
  color: var(--neutral-700);
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .delete-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.edit-btn {
  background-color: var(--secondary-color);
  color: white;
}

.delete-btn {
  background-color: var(--danger-color);
  color: white;
}

.delete-btn:disabled {
  background-color: var(--neutral-300);
  color: var(--neutral-500);
  cursor: not-allowed;
}

.loading, .no-data {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
}

.error-message {
  background-color: var(--danger-light);
  color: var(--danger-color);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.success-message {
  background-color: var(--success-light);
  color: var(--success-color);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  background-color: var(--neutral-200);
  color: var(--neutral-700);
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style> 