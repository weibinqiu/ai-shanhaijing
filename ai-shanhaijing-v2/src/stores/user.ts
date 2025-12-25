import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  username: string
  email: string
  createdAt: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null)
  const isLoggedIn = computed(() => currentUser.value !== null)
  
  // Load user from localStorage on init
  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem('ai-shanhaijing-user')
    if (storedUser) {
      try {
        currentUser.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('ai-shanhaijing-user')
      }
    }
  }
  
  // Save user to localStorage
  const saveUserToStorage = (user: User) => {
    localStorage.setItem('ai-shanhaijing-user', JSON.stringify(user))
  }
  
  // Login action
  const login = (username: string, password: string): boolean => {
    // Simple validation - in a real app, this would call an API
    if (username && password) {
      const user: User = {
        id: `user-${Date.now()}`,
        username,
        email: `${username}@example.com`,
        createdAt: new Date().toISOString()
      }
      currentUser.value = user
      saveUserToStorage(user)
      return true
    }
    return false
  }
  
  // Register action
  const register = (username: string, email: string, password: string): boolean => {
    // Simple validation - in a real app, this would call an API
    if (username && email && password) {
      const user: User = {
        id: `user-${Date.now()}`,
        username,
        email,
        createdAt: new Date().toISOString()
      }
      currentUser.value = user
      saveUserToStorage(user)
      return true
    }
    return false
  }
  
  // Logout action
  const logout = () => {
    currentUser.value = null
    localStorage.removeItem('ai-shanhaijing-user')
  }
  
  // Initialize on store creation
  loadUserFromStorage()
  
  return {
    currentUser,
    isLoggedIn,
    login,
    register,
    logout
  }
})
