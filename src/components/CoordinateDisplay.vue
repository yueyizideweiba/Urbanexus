<template>
  <div class="coordinate-display" v-if="isCoordinatePickingEnabled" :style="coordinateDisplayPosition">
    <div class="coordinate-card">
      <div class="card-header">
        <span class="header-title">坐标拾取</span>
      </div>
      <div class="card-body">
        <div v-if="selectedCoordinate" class="coordinate-data">
          <div class="data-row">
            <span class="data-label">经度:</span>
            <span class="data-value">{{ selectedCoordinate.longitude }}°</span>
          </div>
          <div class="data-row">
            <span class="data-label">纬度:</span>
            <span class="data-value">{{ selectedCoordinate.latitude }}°</span>
          </div>
          <div class="data-row">
            <span class="data-label">高度:</span>
            <span class="data-value">{{ selectedCoordinate.height || '0.00' }} 米</span>
          </div>
          <!-- 笛卡尔坐标 -->
          <div class="cartesian-coordinates">
            <div class="data-row">
              <span class="data-label">X:</span>
              <span class="data-value">{{ selectedCoordinate.cartesianX || '0.00' }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Y:</span>
              <span class="data-value">{{ selectedCoordinate.cartesianY || '0.00' }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">Z:</span>
              <span class="data-value">{{ selectedCoordinate.cartesianZ || '0.00' }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <span class="empty-icon">📍</span>
          <p class="empty-text">点击地图获取坐标</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isCoordinatePickingEnabled: {
    type: Boolean,
    default: false
  },
  selectedCoordinate: {
    type: Object,
    default: null
  },
  leftSidebarWidth: {
    type: Number,
    default: 0
  },
  showRightSidebar: {
    type: Boolean,
    default: true
  }
});

// 计算坐标显示面板的位置
const coordinateDisplayPosition = computed(() => {
  // 设置为左侧面板宽度加上10px的间距
  return `left: ${props.leftSidebarWidth + 10}px;`;
});
</script>

<style scoped>
.coordinate-display {
  position: absolute;
  bottom: 20px;
  /* left值由计算属性动态设置 */
  z-index: var(--z-fixed);
  max-width: 300px;
  animation: fadeIn var(--transition-normal) ease-in-out;
  transition: left var(--transition-normal);
}

.coordinate-card {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
  width: 280px;
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.card-header {
  background-color: var(--primary-color);
  color: white;
  padding: var(--space-3);
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color var(--transition-normal);
}

.header-title {
  font-size: 1rem;
}

.card-body {
  padding: var(--space-3);
}

.coordinate-data {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-1) 0;
  border-bottom: 1px solid var(--border-color);
  transition: border-color var(--transition-normal);
}

.data-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: color var(--transition-normal);
}

.data-value {
  font-family: var(--font-mono);
  color: var(--text-primary);
  font-weight: 500;
  transition: color var(--transition-normal);
}

.cartesian-coordinates {
  margin-top: var(--space-2);
  padding: var(--space-2);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  border: 1px dashed var(--border-color);
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.cartesian-coordinates .data-row {
  border-bottom-color: var(--border-color);
}

.cartesian-coordinates .data-row:last-child {
  border-bottom: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4) 0;
  color: var(--text-secondary);
  transition: color var(--transition-normal);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: var(--space-2);
}

.empty-text {
  font-size: 0.875rem;
  text-align: center;
}
</style> 