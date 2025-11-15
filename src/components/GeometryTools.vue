<template>
  <!-- 几何工具栏 -->
  <div class="geometry-toolbar" v-if="showGeometryToolbar">
    <button @click="addPolygon">添加多边形</button>
    <button @click="addPolyline">添加折线</button>
    <button @click="addPoint">添加点</button>
    <button @click="saveDrawings">保存为图层</button>
    <button @click="cancelDrawing">取消绘制</button>
    <button @click="closeToolbar">关闭</button>
  </div>
</template>

<script setup>
import * as Cesium from 'cesium';
import { onUnmounted, ref } from 'vue';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['add-geojson-datasource']);

// 几何工具相关状态
const showGeometryToolbar = ref(false);
const drawingMode = ref(null);
const currentPoints = ref([]);
const temporaryEntity = ref(null);
const drawnEntities = ref([]);
let eventHandler = null;

// 测量相关状态
const measurementMode = ref(null);
const measurementPoints = ref([]);
const measurementTemporaryEntity = ref(null);
let measurementHandler = null;

// 显示几何工具栏
function showTools() {
  showGeometryToolbar.value = true;
}

// 关闭几何工具栏
function closeToolbar() {
  cancelDrawing();
  showGeometryToolbar.value = false;
}

// 开始绘制
function startDrawing(mode) {
  cancelDrawing();
  drawingMode.value = mode;
  currentPoints.value = [];
  eventHandler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  if (drawingMode.value === 'point') {
    eventHandler.setInputAction((clickEvent) => {
      const cartesian = props.viewer.camera.pickEllipsoid(clickEvent.position, props.viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const pointEntity = props.viewer.entities.add({
          position: cartesian,
          point: {
            pixelSize: 10,
            color: Cesium.Color.YELLOW
          }
        });
        drawnEntities.value.push(pointEntity);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    
    eventHandler.setInputAction(() => {
      eventHandler.destroy();
      eventHandler = null;
      drawingMode.value = null;
      currentPoints.value = [];
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  } else if (drawingMode.value === 'polyline' || drawingMode.value === 'polygon') {
    eventHandler.setInputAction((clickEvent) => {
      const cartesian = props.viewer.camera.pickEllipsoid(clickEvent.position, props.viewer.scene.globe.ellipsoid);
      if (cartesian) {
        currentPoints.value.push(cartesian);
        if (!temporaryEntity.value) {
          if (drawingMode.value === 'polyline') {
            temporaryEntity.value = props.viewer.entities.add({
              polyline: {
                positions: new Cesium.CallbackProperty(() => currentPoints.value, false),
                width: 3,
                material: Cesium.Color.YELLOW
              }
            });
          } else if (drawingMode.value === 'polygon') {
            temporaryEntity.value = props.viewer.entities.add({
              polygon: {
                hierarchy: new Cesium.CallbackProperty(() => new Cesium.PolygonHierarchy(currentPoints.value), false),
                material: Cesium.Color.YELLOW.withAlpha(0.5),
                outline: true,
                outlineColor: Cesium.Color.BLACK
              }
            });
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    
    eventHandler.setInputAction((movement) => {
      if (currentPoints.value.length > 0) {
        const cartesian = props.viewer.camera.pickEllipsoid(movement.endPosition, props.viewer.scene.globe.ellipsoid);
        if (cartesian) {
          // 鼠标移动时的动态绘制效果可以在这里添加
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    eventHandler.setInputAction(() => {
      if (temporaryEntity.value && currentPoints.value.length > 1) {
        let finalizedEntity;
        if (drawingMode.value === 'polyline') {
          finalizedEntity = props.viewer.entities.add({
            polyline: {
              positions: [...currentPoints.value],
              width: 3,
              material: Cesium.Color.YELLOW
            }
          });
        } else if (drawingMode.value === 'polygon') {
          finalizedEntity = props.viewer.entities.add({
            polygon: {
              hierarchy: new Cesium.PolygonHierarchy([...currentPoints.value]),
              material: Cesium.Color.YELLOW.withAlpha(0.5),
              outline: true,
              outlineColor: Cesium.Color.BLACK
            }
          });
        }
        drawnEntities.value.push(finalizedEntity);
      }
      
      if (temporaryEntity.value) {
        props.viewer.entities.remove(temporaryEntity.value);
        temporaryEntity.value = null;
      }
      
      currentPoints.value = [];
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }
}

// 添加折线
function addPolyline() {
  startDrawing('polyline');
}

// 添加多边形
function addPolygon() {
  startDrawing('polygon');
}

// 添加点
function addPoint() {
  startDrawing('point');
}

// 保存绘制的图形为图层
function saveDrawings() {
  if (drawnEntities.value.length === 0) {
    alert("没有绘制任何图形");
    return;
  }
  
  const layerName = prompt("请输入图层名称", "绘制图层");
  if (!layerName) return;
  
  const dataSource = new Cesium.CustomDataSource(layerName);
  drawnEntities.value.forEach(entity => {
    dataSource.entities.add(entity);
  });
  
  props.viewer.dataSources.add(dataSource);
  emit('add-geojson-datasource', dataSource);
  
  drawnEntities.value.forEach(entity => {
    props.viewer.entities.remove(entity);
  });
  
  drawnEntities.value = [];
  alert("图形已保存为图层");
}

// 取消绘制
function cancelDrawing() {
  if (eventHandler) {
    eventHandler.destroy();
    eventHandler = null;
  }
  
  if (temporaryEntity.value) {
    props.viewer.entities.remove(temporaryEntity.value);
    temporaryEntity.value = null;
  }
  
  if (drawnEntities.value.length > 0) {
    drawnEntities.value.forEach(entity => {
      props.viewer.entities.remove(entity);
    });
    drawnEntities.value = [];
  }
  
  currentPoints.value = [];
}

// 测距
function measureDistance() {
  if (measurementHandler) {
    measurementHandler.destroy();
    measurementHandler = null;
  }
  
  measurementMode.value = 'distance';
  measurementPoints.value = [];
  measurementHandler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  measurementHandler.setInputAction((clickEvent) => {
    const cartesian = props.viewer.camera.pickEllipsoid(clickEvent.position, props.viewer.scene.globe.ellipsoid);
    if (cartesian) {
      measurementPoints.value.push(cartesian);
      if (!measurementTemporaryEntity.value) {
        measurementTemporaryEntity.value = props.viewer.entities.add({
          polyline: {
            positions: new Cesium.CallbackProperty(() => measurementPoints.value, false),
            width: 3,
            material: Cesium.Color.ORANGE
          }
        });
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  measurementHandler.setInputAction(() => {
    if (measurementPoints.value.length < 2) {
      alert("请至少选择两个点来测量距离");
      return;
    }
    
    let totalDistance = 0;
    for (let i = 1; i < measurementPoints.value.length; i++) {
      totalDistance += Cesium.Cartesian3.distance(
        measurementPoints.value[i - 1],
        measurementPoints.value[i]
      );
    }
    
    const labelEntity = {
      position: measurementPoints.value[measurementPoints.value.length - 1],
      label: {
        text: totalDistance.toFixed(2) + " m",
        font: '16px sans-serif',
        fillColor: Cesium.Color.ORANGE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20)
      }
    };
    
    const lineEntity = {
      polyline: {
        positions: [...measurementPoints.value],
        width: 3,
        material: Cesium.Color.ORANGE
      }
    };
    
    const measurementLayer = new Cesium.CustomDataSource("测距图层");
    measurementLayer.entities.add(lineEntity);
    measurementLayer.entities.add(labelEntity);
    props.viewer.dataSources.add(measurementLayer);
    emit('add-geojson-datasource', measurementLayer);
    
    if (measurementTemporaryEntity.value) {
      props.viewer.entities.remove(measurementTemporaryEntity.value);
    }
    
    measurementHandler.destroy();
    measurementHandler = null;
    measurementTemporaryEntity.value = null;
    measurementPoints.value = [];
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

// 测面积
function measureArea() {
  if (measurementHandler) {
    measurementHandler.destroy();
    measurementHandler = null;
  }
  
  measurementMode.value = 'area';
  measurementPoints.value = [];
  measurementHandler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  measurementHandler.setInputAction((clickEvent) => {
    const cartesian = props.viewer.camera.pickEllipsoid(clickEvent.position, props.viewer.scene.globe.ellipsoid);
    if (cartesian) {
      measurementPoints.value.push(cartesian);
      if (!measurementTemporaryEntity.value) {
        measurementTemporaryEntity.value = props.viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.CallbackProperty(() => new Cesium.PolygonHierarchy(measurementPoints.value), false),
            material: Cesium.Color.ORANGE.withAlpha(0.5),
            outline: true,
            outlineColor: Cesium.Color.ORANGE
          }
        });
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  measurementHandler.setInputAction(() => {
    if (measurementPoints.value.length < 3) {
      alert("请至少选择三个点来测量面积");
      return;
    }
    
    const cartographicPositions = measurementPoints.value.map(pos => {
      const carto = Cesium.Cartographic.fromCartesian(pos);
      return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)];
    });
    
    if (cartographicPositions.length > 0) {
      const first = cartographicPositions[0];
      const last = cartographicPositions[cartographicPositions.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        cartographicPositions.push(first);
      }
    }
    
    const geojsonFeature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [cartographicPositions]
      }
    };
    
    // Turf.js函数调用，需要保证turf在全局范围内可用
    // 如果不可用，需要引入或提供替代方案
    const area = turf.area(geojsonFeature);
    const centroid = turf.centroid(geojsonFeature);
    const centroidCoords = centroid.geometry.coordinates;
    
    const labelEntity = new Cesium.Entity({
      position: Cesium.Cartesian3.fromDegrees(centroidCoords[0], centroidCoords[1]),
      label: {
        text: area.toFixed(2) + "㎡",
        font: '16px sans-serif',
        fillColor: Cesium.Color.ORANGE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20)
      }
    });
    
    const polygonEntity = new Cesium.Entity({
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy([...measurementPoints.value]),
        material: Cesium.Color.ORANGE.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.ORANGE
      }
    });
    
    const measurementLayer = new Cesium.CustomDataSource("测面图层");
    measurementLayer.entities.add(polygonEntity);
    measurementLayer.entities.add(labelEntity);
    props.viewer.dataSources.add(measurementLayer);
    emit('add-geojson-datasource', measurementLayer);
    
    measurementHandler.destroy();
    measurementHandler = null;
    
    if (measurementTemporaryEntity.value) {
      props.viewer.entities.remove(measurementTemporaryEntity.value);
      measurementTemporaryEntity.value = null;
    }
    
    measurementPoints.value = [];
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

// 组件销毁时清理资源
onUnmounted(() => {
  cancelDrawing();
  if (measurementHandler) {
    measurementHandler.destroy();
  }
});

// 暴露方法给父组件
defineExpose({
  showTools,
  closeToolbar,
  addPolyline,
  addPolygon,
  addPoint,
  saveDrawings,
  cancelDrawing,
  measureDistance,
  measureArea,
  showGeometryToolbar
});
</script>

<style scoped>
.geometry-toolbar {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--bg-primary);
  padding: var(--space-3);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-fixed);
  display: flex;
  gap: var(--space-2);
  border: 1px solid var(--border-color);
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.geometry-toolbar button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.geometry-toolbar button:hover {
  background-color: var(--primary-dark);
}
</style> 