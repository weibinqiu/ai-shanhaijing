<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 全局中文文字样式修复 */
body {
  font-family: 'Arial', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  letter-spacing: 0px;
  word-spacing: 0px;
  background-color: #1a1a1a;
  color: #fff;
  overflow: visible;
  margin: 0;
  padding: 0;
}

/* 确保所有中文文字正常显示 */
h1, h2, h3, h4, h5, h6, p, span, button, input, textarea, select, option {
  letter-spacing: 0px;
  word-spacing: 0px;
}

/* 特殊处理按钮文字 */
button {
  letter-spacing: 0px !important;
  white-space: nowrap;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>
