<template>
  <div>
    <!-- GeoJSON 分色+注记设置悬浮框 -->
    <div v-if="geojsonStyler.showStylerModal" class="floating-panel">
      <div class="panel-header">
        <h3>GeoJSON 分色注记设置</h3>
        <button @click="geojsonStyler.closeStyler" class="close-btn">&times;</button>
      </div>
      <div class="panel-content">
        <div class="form-group">
          <label>选择图层:</label>
          <select v-model="geojsonStyler.selectedLayer">
            <option v-for="(layer, index) in geojsonDataSources" :value="index" :key="index">
              {{ layer.name || ('图层' + (index + 1)) }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>选择字段:</label>
          <select v-model="geojsonStyler.fieldName">
            <option v-for="field in availableFields" :value="field" :key="field">{{ field }}</option>
          </select>
        </div>
        <div class="panel-buttons">
          <button @click="geojsonStyler.applyStyling" class="primary-btn">应用</button>
        </div>
      </div>
    </div>

    <!-- 缓冲区分析设置悬浮框 -->
    <div v-if="bufferAnalysis.showModal" class="floating-panel">
      <div class="panel-header">
        <h3>缓冲区分析设置</h3>
        <button @click="bufferAnalysis.closeModal" class="close-btn">&times;</button>
      </div>
      <div class="panel-content">
        <div class="form-group">
          <label>选择图层:</label>
          <select v-model="bufferAnalysis.selectedLayer">
            <option v-for="(layer, index) in geojsonDataSources" :value="index" :key="index">
              {{ layer.name || ('图层' + (index + 1)) }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>缓冲半径（米）:</label>
          <input type="number" v-model.number="bufferAnalysis.bufferRadius" placeholder="请输入缓冲半径" />
        </div>
        <div class="panel-buttons">
          <button @click="bufferAnalysis.applyBuffer" class="primary-btn">应用</button>
        </div>
      </div>
    </div>

    <!-- 模型拉伸（建筑物）设置悬浮框 -->
    <div v-if="extruder.showModal" class="floating-panel">
      <div class="panel-header">
        <h3>模型拉伸设置</h3>
        <button @click="extruder.closeModal" class="close-btn">&times;</button>
      </div>
      <div class="panel-content">
        <div class="form-group">
          <label>选择图层:</label>
          <select v-model="extruder.selectedLayer">
            <option v-for="(layer, index) in geojsonDataSources" :value="index" :key="index">
              {{ layer.name || ('图层' + (index + 1)) }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>选择高度字段:</label>
          <select v-model="extruder.fieldName">
            <option v-for="field in extrusionAvailableFields" :value="field" :key="field">{{ field }}</option>
          </select>
        </div>
        <div class="panel-buttons">
          <button @click="extruder.applyExtrusion" class="primary-btn">应用</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as turf from '@turf/turf';
import * as Cesium from 'cesium';
import { computed, reactive } from 'vue';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  },
  geojsonDataSources: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['add-geojson-datasource']);

// GeoJSON样式器模块
const geojsonStyler = reactive({
  showStylerModal: false,
  selectedLayer: 0,
  fieldName: '',
  
  openStyler() {
    if (props.geojsonDataSources.length === 0) {
      alert('请先加载GeoJSON图层');
      return;
    }
    this.showStylerModal = true;
    if (this.selectedLayer === null) this.selectedLayer = 0;
  },
  
  closeStyler() {
    this.showStylerModal = false;
    this.fieldName = '';
  },
  
  applyStyling() {
    const dataSource = props.geojsonDataSources[this.selectedLayer];
    if (!dataSource) {
      alert('选择的图层不存在');
      return;
    }
    if (!this.fieldName) {
      alert('请选择字段名');
      return;
    }
    
    const valueColorMap = {};
    let colorIndex = 0;
    const currentTime = Cesium.JulianDate.now();
    
    dataSource.entities.values.forEach(entity => {
      let fieldValue = '';
      if (entity.properties && Cesium.defined(entity.properties[this.fieldName])) {
        fieldValue = entity.properties[this.fieldName].getValue();
      }
      
      if (!valueColorMap[fieldValue]) {
        const hue = ((colorIndex * 137.508) % 360) / 360;
        valueColorMap[fieldValue] = Cesium.Color.fromHsl(hue, 0.7, 0.5, 0.6);
        colorIndex++;
      }
      
      const assignedColor = valueColorMap[fieldValue];
      
      if (entity.polygon) {
        entity.polygon.material = new Cesium.ColorMaterialProperty(assignedColor);
        entity.polygon.outline = true;
        entity.polygon.outlineColor = Cesium.Color.BLACK;
      }
      
      if (entity.polyline) {
        entity.polyline.material = new Cesium.ColorMaterialProperty(assignedColor);
      }
      
      let labelPosition = null;
      let pixelOffset = new Cesium.Cartesian2(0, 0);
      let horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
      let verticalOrigin = Cesium.VerticalOrigin.CENTER;
      
      if (entity.point && entity.position) {
        labelPosition = entity.position;
        pixelOffset = new Cesium.Cartesian2(0, -20);
        verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
      } else if (entity.polyline && entity.polyline.positions) {
        const positions = entity.polyline.positions.getValue(currentTime);
        if (positions && positions.length > 0) {
          labelPosition = computePolylineMidpoint(positions);
        }
      } else if (entity.polygon && entity.polygon.hierarchy) {
        const hierarchy = entity.polygon.hierarchy.getValue(currentTime);
        if (hierarchy && hierarchy.positions && hierarchy.positions.length > 0) {
          labelPosition = computeCentroid(hierarchy.positions);
        }
      }
      
      if (labelPosition) {
        entity.position = labelPosition;
        
        entity.label = new Cesium.LabelGraphics({
          text: fieldValue ? String(fieldValue) : '',
          font: '36px bold sans-serif',
          fillColor: assignedColor,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          horizontalOrigin: horizontalOrigin,
          verticalOrigin: verticalOrigin,
          pixelOffset: pixelOffset,
          scaleByDistance: new Cesium.NearFarScalar(100, 1.0, 1000000, 0.5),
          show: true,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 10000000)
        });
      }
    });
    
    alert('分色渲染+注记应用完成');
    this.closeStyler();
  }
});

// 缓冲区分析模块
const bufferAnalysis = reactive({
  showModal: false,
  selectedLayer: 0,
  bufferRadius: 100,
  
  openModal() {
    if (props.geojsonDataSources.length === 0) {
      alert('请先加载GeoJSON图层');
      return;
    }
    this.showModal = true;
  },
  
  closeModal() {
    this.showModal = false;
    this.bufferRadius = 100;
  },
  
  applyBuffer() {
    // 检查turf库是否可用
    if (!turf) {
      console.error('turf库未加载');
      alert('缓冲区分析所需的turf库未正确加载，请刷新页面重试');
      return;
    }
    
    const dataSource = props.geojsonDataSources[this.selectedLayer];
    if (!dataSource) {
      alert('选择的图层不存在');
      return;
    }
    if (!this.bufferRadius || this.bufferRadius <= 0) {
      alert('请输入有效的缓冲半径');
      return;
    }
    
    const currentTime = Cesium.JulianDate.now();
    const features = [];
    
    dataSource.entities.values.forEach((entity, index) => {
      let geojsonFeature = null;
      
      // 检查是否是点实体（可能是通过point、billboard或其他属性定义的）
      if ((entity.point || entity.billboard || entity.label) && entity.position) {
        // 处理点实体
        const position = entity.position.getValue(currentTime);
        if (position) {
          const cartographic = Cesium.Cartographic.fromCartesian(position);
          const lon = Cesium.Math.toDegrees(cartographic.longitude);
          const lat = Cesium.Math.toDegrees(cartographic.latitude);
          geojsonFeature = turf.point([lon, lat]);
          console.log("处理点要素:", [lon, lat]);
        }
      } else if (entity.polyline) {
        const positions = entity.polyline.positions.getValue(currentTime);
        if (positions && positions.length > 0) {
          const coords = positions.map(pos => {
            const carto = Cesium.Cartographic.fromCartesian(pos);
            return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)];
          });
          geojsonFeature = turf.lineString(coords);
          console.log("处理线要素，坐标数:", coords.length);
        }
      } else if (entity.polygon) {
        const hierarchy = entity.polygon.hierarchy.getValue(currentTime);
        if (hierarchy && hierarchy.positions && hierarchy.positions.length > 0) {
          const coords = hierarchy.positions.map(pos => {
            const carto = Cesium.Cartographic.fromCartesian(pos);
            return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)];
          });
          
          // 确保多边形是闭合的（首尾坐标相同）
          if (coords.length > 0 && 
              (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
            coords.push(coords[0]);
          }
          
          geojsonFeature = turf.polygon([coords]);
          console.log("处理面要素，坐标数:", coords.length);
        }
      }
      
      if (geojsonFeature) {
        geojsonFeature.properties = { index: index };
        features.push(geojsonFeature);
      }
    });
    
    if (features.length === 0) {
      console.error('没有找到可缓冲的要素', dataSource.entities.values.length);
      
      // 调试信息
      dataSource.entities.values.forEach((entity, index) => {
        console.log(`实体 ${index} 类型:`, 
                   entity.point ? 'point' : '',
                   entity.billboard ? 'billboard' : '',
                   entity.label ? 'label' : '',
                   entity.polyline ? 'polyline' : '',
                   entity.polygon ? 'polygon' : '',
                   '位置:', entity.position ? '有' : '无');
      });
      
      alert('所选图层中没有可缓冲的要素');
      return;
    }
    
    console.log(`找到 ${features.length} 个要素进行缓冲`);
    
    // 对每个要素执行缓冲分析
    const bufferedFeatures = features.map(feature =>
      turf.buffer(feature, this.bufferRadius, { units: 'meters' })
    );
    
    const finalFeature = {
      type: 'FeatureCollection',
      features: bufferedFeatures
    };
    
    // 将缓冲结果转为GeoJSON并加载
    const geojsonStr = JSON.stringify(finalFeature);
    const blob = new Blob([geojsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    Cesium.GeoJsonDataSource.load(url)
      .then((bufferDataSource) => {
        bufferDataSource.name = '缓冲区';
        props.viewer.dataSources.add(bufferDataSource);
        props.viewer.zoomTo(bufferDataSource);
        emit('add-geojson-datasource', bufferDataSource);
        alert('缓冲区分析完成');
      })
      .catch((error) => {
        console.error('加载缓冲区数据失败:', error);
      });
    
    this.closeModal();
  }
});

// 模型拉伸模块
const extruder = reactive({
  showModal: false,
  selectedLayer: 0,
  fieldName: '',
  
  openModal() {
    if (props.geojsonDataSources.length === 0) {
      alert('请先加载GeoJSON或SHP图层');
      return;
    }
    this.showModal = true;
    this.selectedLayer = 0;
  },
  
  closeModal() {
    this.showModal = false;
    this.fieldName = '';
  },
  
  applyExtrusion() {
    const dataSource = props.geojsonDataSources[this.selectedLayer];
    if (!dataSource) {
      alert('选择的图层不存在');
      return;
    }
    if (!this.fieldName) {
      alert('请选择字段名');
      return;
    }
    
    // 新建一个 CustomDataSource 用于存储拉伸后的建筑物
    const extrudedDataSource = new Cesium.CustomDataSource("拉伸建筑物");
    const currentTime = Cesium.JulianDate.now();
    
    dataSource.entities.values.forEach(entity => {
      if (entity.polygon) {
        const hierarchy = entity.polygon.hierarchy.getValue(currentTime);
        if (hierarchy && hierarchy.positions && hierarchy.positions.length > 0) {
          let height = 0;
          if (entity.properties && Cesium.defined(entity.properties[this.fieldName])) {
            height = Number(entity.properties[this.fieldName].getValue());
            if (isNaN(height)) height = 0;
          }
          
          // 创建拉伸建筑物实体：extrudedHeight 实现拉伸效果
          extrudedDataSource.entities.add({
            polygon: {
              hierarchy: hierarchy,
              material: Cesium.Color.fromRandom({ alpha: 0.6 }),
              extrudedHeight: height,
              closeTop: true,
              closeBottom: true
            },
            name: entity.name || "建筑物"
          });
        }
      }
    });
    
    props.viewer.dataSources.add(extrudedDataSource);
    emit('add-geojson-datasource', extrudedDataSource);
    alert('模型拉伸应用完成！');
    this.closeModal();
  }
});

// 计算可用字段（用于GeoJSON样式器）
const availableFields = computed(() => {
  const ds = props.geojsonDataSources[geojsonStyler.selectedLayer];
  if (ds && ds.entities.values.length > 0) {
    const firstEntity = ds.entities.values[0];
    if (firstEntity.properties && firstEntity.properties.propertyNames) {
      return firstEntity.properties.propertyNames;
    }
  }
  return [];
});

// 计算可用字段（用于模型拉伸）
const extrusionAvailableFields = computed(() => {
  const ds = props.geojsonDataSources[extruder.selectedLayer];
  if (ds && ds.entities.values.length > 0) {
    const firstEntity = ds.entities.values[0];
    if (firstEntity.properties && firstEntity.properties.propertyNames) {
      return firstEntity.properties.propertyNames;
    }
  }
  return [];
});

// 辅助函数：计算中心点
function computeCentroid(positions) {
  let sumX = 0, sumY = 0, sumZ = 0;
  positions.forEach(pos => {
    sumX += pos.x;
    sumY += pos.y;
    sumZ += pos.z;
  });
  const count = positions.length;
  return new Cesium.Cartesian3(sumX / count, sumY / count, sumZ / count);
}

// 辅助函数：计算折线中点
function computePolylineMidpoint(positions) {
  const n = positions.length;
  if (n === 0) return null;
  if (n % 2 === 1) {
    return positions[Math.floor(n / 2)];
  } else {
    const p1 = positions[n / 2 - 1];
    const p2 = positions[n / 2];
    return new Cesium.Cartesian3(
      (p1.x + p2.x) / 2,
      (p1.y + p2.y) / 2,
      (p1.z + p2.z) / 2
    );
  }
}

// 暴露方法给父组件
defineExpose({
  geojsonStyler,
  bufferAnalysis,
  extruder
});
</script>

<style scoped>
/* 悬浮面板通用样式 */
.floating-panel {
  position: fixed;
  left: 230px;
  bottom: 20px;
  background: var(--bg-primary);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  width: 300px;
  z-index: 1000;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 8px 8px 0 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.panel-content {
  padding: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  color: var(--text-secondary);
  font-size: 14px;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-light);
}

.panel-buttons {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.primary-btn {
  width: 100%;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.primary-btn:hover {
  background-color: var(--primary-dark);
}
</style> 