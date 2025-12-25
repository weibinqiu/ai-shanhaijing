<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLoginMode = ref(true)
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  errorMessage.value = ''
  username.value = ''
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
}

const handleSubmit = () => {
  errorMessage.value = ''
  
  if (isLoginMode.value) {
    // Login
    if (!username.value || !password.value) {
      errorMessage.value = '请输入用户名和密码'
      return
    }
    
    const success = userStore.login(username.value, password.value)
    if (success) {
      router.push('/game')
    } else {
      errorMessage.value = '登录失败，请检查用户名和密码'
    }
  } else {
    // Register
    if (!username.value || !email.value || !password.value) {
      errorMessage.value = '请填写所有字段'
      return
    }
    
    if (password.value !== confirmPassword.value) {
      errorMessage.value = '两次输入的密码不一致'
      return
    }
    
    if (password.value.length < 6) {
      errorMessage.value = '密码长度至少为6个字符'
      return
    }
    
    const success = userStore.register(username.value, email.value, password.value)
    if (success) {
      router.push('/game')
    } else {
      errorMessage.value = '注册失败，请重试'
    }
  }
}

const handleGuestLogin = () => {
  const success = userStore.login('游客', 'guest123')
  if (success) {
    router.push('/game')
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-background">
      <div class="animated-bg"></div>
    </div>
    
    <div class="login-card">
      <div class="login-header">
        <h1 class="game-title">AI山海经</h1>
        <p class="game-subtitle">开启你的山海奇幻之旅</p>
      </div>
      
      <div class="login-form">
        <div class="form-tabs">
          <button 
            :class="['tab', { active: isLoginMode }]" 
            @click="isLoginMode = true"
          >
            登录
          </button>
          <button 
            :class="['tab', { active: !isLoginMode }]" 
            @click="isLoginMode = false"
          >
            注册
          </button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="username">用户名</label>
            <input 
              id="username"
              v-model="username" 
              type="text" 
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div v-if="!isLoginMode" class="form-group">
            <label for="email">邮箱</label>
            <input 
              id="email"
              v-model="email" 
              type="email" 
              placeholder="请输入邮箱"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <input 
              id="password"
              v-model="password" 
              type="password" 
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div v-if="!isLoginMode" class="form-group">
            <label for="confirm-password">确认密码</label>
            <input 
              id="confirm-password"
              v-model="confirmPassword" 
              type="password" 
              placeholder="请再次输入密码"
              required
            />
          </div>
          
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <button type="submit" class="submit-btn">
            {{ isLoginMode ? '登录' : '注册' }}
          </button>
        </form>
        
        <div class="divider">
          <span>或</span>
        </div>
        
        <button class="guest-btn" @click="handleGuestLogin">
          游客登录
        </button>
        
        <div class="form-footer">
          <p v-if="isLoginMode">
            还没有账号？
            <a href="#" @click.prevent="toggleMode">立即注册</a>
          </p>
          <p v-else>
            已有账号？
            <a href="#" @click.prevent="toggleMode">立即登录</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
}

.animated-bg {
  position: absolute;
  width: 200%;
  height: 200%;
  background: 
    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: bgMove 20s ease-in-out infinite;
}

@keyframes bgMove {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(-50px, 50px) rotate(180deg);
  }
}

.login-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  width: 90%;
  max-width: 450px;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.game-title {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.game-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.form-tabs {
  display: flex;
  margin-bottom: 30px;
  border-bottom: 2px solid #e0e0e0;
}

.tab {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: #999;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab.active {
  color: #667eea;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
}

.error-message {
  padding: 12px;
  background: #ffe0e0;
  border: 1px solid #ff6b6b;
  border-radius: 8px;
  color: #c92a2a;
  font-size: 14px;
  margin-bottom: 20px;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.submit-btn:active {
  transform: translateY(0);
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #999;
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.divider span {
  margin: 0 15px;
}

.guest-btn {
  width: 100%;
  padding: 14px;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.guest-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

.form-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.form-footer a:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    padding: 30px 20px;
    width: 95%;
  }
  
  .game-title {
    font-size: 28px;
  }
}
</style>
