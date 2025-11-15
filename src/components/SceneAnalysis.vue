<template>
  <div>
    <!-- 路径规划面板（仅在 showRoutePlanning 为 true 时显示） -->
    <div class="route-planning" v-if="showRoutePlanning">
      <div class="route-planning-inputs">
        <!-- 起点输入框 -->
        <div class="location-search">
          <input 
            v-model="inputStart" 
            placeholder="请输入起点地点名称或坐标(纬度,经度)" 
            @focus="showStartResults = true"
            @input="searchStartLocation"
          />
          <!-- 起点搜索结果 -->
          <div class="search-results" v-if="showStartResults && startSearchResults.length > 0">
            <div 
              v-for="(result, index) in startSearchResults" 
              :key="'start-'+index" 
              class="search-result-item"
              @click="selectStartLocation(result)"
            >
              <div class="result-icon">📍</div>
              <div class="result-content">
                <div class="result-name">{{ result.name }}</div>
                <div class="result-address">{{ result.address }}</div>
              </div>
            </div>
          </div>
          <!-- 起点搜索加载中提示 -->
          <div class="search-loading" v-if="isStartSearching">
            <span class="loading-spinner"></span>
            <span class="loading-text">正在搜索...</span>
          </div>
        </div>
        
        <!-- 终点输入框 -->
        <div class="location-search">
          <input 
            v-model="inputEnd" 
            placeholder="请输入终点地点名称或坐标(纬度,经度)" 
            @focus="showEndResults = true"
            @input="searchEndLocation"
          />
          <!-- 终点搜索结果 -->
          <div class="search-results" v-if="showEndResults && endSearchResults.length > 0">
            <div 
              v-for="(result, index) in endSearchResults" 
              :key="'end-'+index" 
              class="search-result-item"
              @click="selectEndLocation(result)"
            >
              <div class="result-icon">📍</div>
              <div class="result-content">
                <div class="result-name">{{ result.name }}</div>
                <div class="result-address">{{ result.address }}</div>
              </div>
            </div>
          </div>
          <!-- 终点搜索加载中提示 -->
          <div class="search-loading" v-if="isEndSearching">
            <span class="loading-spinner"></span>
            <span class="loading-text">正在搜索...</span>
          </div>
        </div>
      </div>
      <div class="route-planning-buttons">
        <button @click="searchRoute" class="primary-btn">导航</button>
        <button @click="terminateRoutePlanning" class="cancel-btn">终止导航</button>
        <button @click="selectStartPoint">地图选择起点</button>
        <button @click="selectEndPoint">地图选择终点</button>
      </div>
    </div>

    <!-- 可视域分析参数设置悬浮框 -->
    <div v-if="showViewshedModal" class="viewshed-panel">
      <div class="viewshed-header">
        <h3>可视域分析参数设置</h3>
        <button @click="closeViewshedModal" class="close-btn">&times;</button>
      </div>
      <div class="viewshed-content">
        <div class="form-group">
          <label>水平视角（度）:</label>
          <input 
            type="number" 
            v-model.number="viewshedParams.horizontalViewAngle" 
            min="0" 
            max="360" 
            step="1"
            placeholder="请输入水平视角（默认90）" 
          />
        </div>
        <div class="form-group">
          <label>垂直视角（度）:</label>
          <input 
            type="number" 
            v-model.number="viewshedParams.verticalViewAngle" 
            min="0" 
            max="180" 
            step="1"
            placeholder="请输入垂直视角（默认60）" 
          />
        </div>
        <div class="form-group">
          <label>可见区域颜色:</label>
          <input 
            type="color" 
            v-model="viewshedParams.visibleAreaColor" 
          />
        </div>
        <div class="form-group">
          <label>不可见区域颜色:</label>
          <input 
            type="color" 
            v-model="viewshedParams.invisibleAreaColor" 
          />
        </div>
        <div class="viewshed-buttons">
          <button @click="startViewshedAnalysis" class="primary-btn">开始分析</button>
        </div>
      </div>
    </div>

    <!-- 添加地形分析参数设置悬浮框 -->
    <div v-if="showTerrainAnalysisModal" class="terrain-analysis-panel">
      <div class="viewshed-header">
        <h3>地形分析参数设置</h3>
        <button @click="closeTerrainAnalysisModal" class="close-btn">&times;</button>
      </div>
      <div class="viewshed-content">
        <div class="form-group">
          <label>分析类型:</label>
          <div class="analysis-type-buttons">
            <button 
              @click="setTerrainAnalysisType('display')" 
              :class="['analysis-type-btn', terrainAnalysisParams.type === 'display' ? 'active' : '']"
            >
              显示地形
            </button>
            <button 
              @click="setTerrainAnalysisType('slope')" 
              :class="['analysis-type-btn', terrainAnalysisParams.type === 'slope' ? 'active' : '']"
            >
              坡度分析
            </button>
            <button 
              @click="setTerrainAnalysisType('aspect')" 
              :class="['analysis-type-btn', terrainAnalysisParams.type === 'aspect' ? 'active' : '']"
            >
              坡向分析
            </button>
            <button 
              @click="setTerrainAnalysisType('contour')" 
              :class="['analysis-type-btn', terrainAnalysisParams.type === 'contour' ? 'active' : '']"
            >
              等高线
            </button>
          </div>
        </div>
        
        <!-- 等高线参数设置 -->
        <div v-if="terrainAnalysisParams.type === 'contour'" class="contour-params">
          <div class="form-group">
            <label>等高线颜色:</label>
            <input 
              type="color" 
              v-model="terrainAnalysisParams.contourColor" 
              @input="previewContourLines"
            />
          </div>
          <div class="form-group">
            <label>等高距 (米): {{ terrainAnalysisParams.contourSpacing }}m</label>
            <input 
              type="range" 
              v-model.number="terrainAnalysisParams.contourSpacing" 
              min="1" 
              max="100" 
              step="1"
              @input="previewContourLines"
            />
          </div>
          <div class="form-group">
            <label>线宽 (像素): {{ terrainAnalysisParams.contourWidth }}px</label>
            <input 
              type="range" 
              v-model.number="terrainAnalysisParams.contourWidth" 
              min="1" 
              max="5" 
              step="0.5"
              @input="previewContourLines"
            />
          </div>
        </div>
        
        <div class="viewshed-buttons">
          <button @click="startTerrainAnalysis" class="primary-btn">开始分析</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';
import * as Cesium from 'cesium';
import * as coordtransform from 'coordtransform';
import { reactive, ref } from 'vue';
import glsl from '../glsl2.js';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['add-navigation-route', 'add-viewshed-layer']);

// 路径规划相关状态
const showRoutePlanning = ref(false);
const inputStart = ref('');
const inputEnd = ref('');

// 搜索相关状态
const showStartResults = ref(false);
const showEndResults = ref(false);
const startSearchResults = ref([]);
const endSearchResults = ref([]);
const isStartSearching = ref(false);
const isEndSearching = ref(false);
const startLocationData = ref(null);
const endLocationData = ref(null);

// 高德与百度地图 API key
const aMapKey = '835e9f0656ea757f449995c40c9b9b6f';
const baiduKey = 'ZibhrJYCXS9Ylxpm4Vy49lAhDL5wboEB';

// 可视域分析相关状态
const showViewshedModal = ref(false);
const viewshedParams = reactive({
  horizontalViewAngle: 90,
  verticalViewAngle: 60,
  visibleAreaColor: '#00FF00',
  invisibleAreaColor: '#FF0000'
});

// 地形分析相关状态
const showTerrainAnalysisModal = ref(false);
const terrainAnalysisParams = reactive({
  type: 'display', // display, slope, aspect, contour
  contourColor: '#FF0000',
  contourSpacing: 20,
  contourWidth: 2
});

// 添加WebGL扩展检测函数
function checkWebGLExtension(extensionName) {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL不可用');
      return false;
    }
    const extension = gl.getExtension(extensionName);
    return !!extension;
  } catch (error) {
    console.error(`检查WebGL扩展${extensionName}失败:`, error);
    return false;
  }
}

// 场景分析类型处理函数
function handleAnalysis(type) {
  console.log(`执行场景分析: ${type}`);
  
  if (type === 'pathPlanning') {
    showRoutePlanning.value = true;
  } else if (type === 'viewshed') {
    startLineOfSightAnalysis();
  } else if (type === 'visualDomain') {
    showViewshedModal.value = true;
  } else if (type === 'terrainAnalysis') {
    showTerrainAnalysisModal.value = true;
  }
}

// 百度坐标系转WGS84
function bd09ToWgs84(bdLng, bdLat) {
  const gcj02 = coordtransform.bd09togcj02(bdLng, bdLat);
  const wgs84 = coordtransform.gcj02towgs84(gcj02[0], gcj02[1]);
  return wgs84;
}

// 通过地址获取坐标
async function getAddress(loc) {
  try {
    const response = await axios.get(`https://restapi.amap.com/v3/geocode/geo?address=${loc}&key=${aMapKey}`);
    if (response.data.geocodes && response.data.geocodes.length > 0) {
      return response.data.geocodes[0].location;
    } else {
      console.error("高德地图返回结果为空：", response.data);
      alert("地址解析失败，请检查地址名称是否正确。");
      return null;
    }
  } catch (error) {
    console.error("获取地址失败:", error);
    return null;
  }
}

// 获取百度地图导航路径
function getJsonpPosition(start, end, startName, endName) {
  $.ajax({
    url: `https://api.map.baidu.com/direction/v2/driving?origin=${start}&destination=${end}&ak=${baiduKey}`,
    type: "get",
    dataType: "jsonp",
    async: false,
    jsonp: "callback",
    success: (response) => {
      console.log(response);
      let resArr = [];
      if (response.status === 0) {
        response.result.routes[0].steps.forEach((item) => {
          const stringArr = item.path.split(';');
          stringArr.forEach(x => {
            const numArr = x.split(',');
            resArr.push(...numArr);
          });
        });
        resArr = resArr.map(item => Number(item));
        const randomColor = Cesium.Color.fromRandom({ alpha: 1.0 });
        const polyline = createPolyline(resArr, randomColor);
        const startCoords = start.split(',').map(Number);
        const startConverted = bd09ToWgs84(startCoords[1], startCoords[0]);
        const startLabel = props.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(startConverted[0], startConverted[1], 0),
          label: {
            text: startName,
            font: '16px sans-serif',
            fillColor: randomColor,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM
          }
        });
        const endCoords = end.split(',').map(Number);
        const endConverted = bd09ToWgs84(endCoords[1], endCoords[0]);
        const endLabel = props.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(endConverted[0], endConverted[1], 0),
          label: {
            text: endName,
            font: '16px sans-serif',
            fillColor: randomColor,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM
          }
        });
        
        const navigationRoute = {
          name: `${startName} -> ${endName}`,
          polyline: polyline,
          startLabel: startLabel,
          endLabel: endLabel,
          show: true
        };
        
        emit('add-navigation-route', navigationRoute);
        props.viewer.flyTo(polyline);
      } else {
        alert("路径规划失败，请检查输入或接口配置");
      }
    },
    error: (error) => {
      console.error("请求百度路径规划接口失败:", error);
    }
  });
}

// 创建折线
function createPolyline(positions, lineColor) {
  let converted = [];
  for (let i = 0; i < positions.length; i += 2) {
    const bd09Lng = positions[i],
          bd09Lat = positions[i + 1];
    const wgs84 = bd09ToWgs84(bd09Lng, bd09Lat);
    converted.push(wgs84[0], wgs84[1]);
  }
  const polyline = props.viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray(converted),
      width: 6,
      material: lineColor
    }
  });
  return polyline;
}

// 搜索起点位置
async function searchStartLocation() {
  if (!inputStart.value || inputStart.value.trim() === '' || inputStart.value.includes(',')) return;
  
  isStartSearching.value = true;
  startSearchResults.value = [];
  
  try {
    const response = await axios.get(`https://restapi.amap.com/v3/place/text`, {
      params: {
        keywords: inputStart.value,
        key: aMapKey,
        extensions: 'base',
        output: 'json'
      }
    });
    
    if (response.data.status === '1' && response.data.pois && response.data.pois.length > 0) {
      // 最多显示5个结果
      startSearchResults.value = response.data.pois.slice(0, 5).map(poi => ({
        id: poi.id,
        name: poi.name,
        address: poi.address || poi.pname + poi.cityname + poi.adname,
        location: poi.location,
        province: poi.pname,
        city: poi.cityname,
        district: poi.adname
      }));
    }
  } catch (error) {
    console.error('搜索起点位置失败:', error);
  } finally {
    isStartSearching.value = false;
  }
}

// 搜索终点位置
async function searchEndLocation() {
  if (!inputEnd.value || inputEnd.value.trim() === '' || inputEnd.value.includes(',')) return;
  
  isEndSearching.value = true;
  endSearchResults.value = [];
  
  try {
    const response = await axios.get(`https://restapi.amap.com/v3/place/text`, {
      params: {
        keywords: inputEnd.value,
        key: aMapKey,
        extensions: 'base',
        output: 'json'
      }
    });
    
    if (response.data.status === '1' && response.data.pois && response.data.pois.length > 0) {
      // 最多显示5个结果
      endSearchResults.value = response.data.pois.slice(0, 5).map(poi => ({
        id: poi.id,
        name: poi.name,
        address: poi.address || poi.pname + poi.cityname + poi.adname,
        location: poi.location,
        province: poi.pname,
        city: poi.cityname,
        district: poi.adname
      }));
    }
  } catch (error) {
    console.error('搜索终点位置失败:', error);
  } finally {
    isEndSearching.value = false;
  }
}

// 选择起点位置
function selectStartLocation(result) {
  if (!result || !result.location) return;
  
  inputStart.value = result.name;
  startLocationData.value = result;
  showStartResults.value = false;
}

// 选择终点位置
function selectEndLocation(result) {
  if (!result || !result.location) return;
  
  inputEnd.value = result.name;
  endLocationData.value = result;
  showEndResults.value = false;
}

// 点击外部区域关闭搜索结果面板
window.addEventListener('click', (e) => {
  const startSearch = document.querySelector('.location-search:first-child');
  const endSearch = document.querySelector('.location-search:last-child');
  
  if (startSearch && !startSearch.contains(e.target)) {
    showStartResults.value = false;
  }
  
  if (endSearch && !endSearch.contains(e.target)) {
    showEndResults.value = false;
  }
});

// 搜索导航路线
async function searchRoute() {
  if (!inputStart.value || !inputEnd.value) {
    alert('输入框不能为空！');
    return;
  }
  
  // 如果是通过搜索结果选择的地点
  if (startLocationData.value && endLocationData.value) {
    const startLoc = startLocationData.value.location;
    const endLoc = endLocationData.value.location;
    
    // 高德坐标(GCJ-02)转百度坐标(BD-09)
    const startGcj02 = startLoc.split(',').map(Number);
    const endGcj02 = endLoc.split(',').map(Number);
    
    const startBd09 = coordtransform.gcj02tobd09(startGcj02[0], startGcj02[1]);
    const endBd09 = coordtransform.gcj02tobd09(endGcj02[0], endGcj02[1]);
    
    // 百度API需要的坐标格式是"纬度,经度"
    const startStr = `${startBd09[1]},${startBd09[0]}`;
    const endStr = `${endBd09[1]},${endBd09[0]}`;
    
    console.log("起点坐标：", startStr, "终点坐标：", endStr);
    getJsonpPosition(startStr, endStr, startLocationData.value.name, endLocationData.value.name);
    return;
  }
  
  // 如果是直接输入坐标
  if (inputStart.value.includes(',') && inputEnd.value.includes(',')) {
    const startStr = inputStart.value.trim();
    const endStr = inputEnd.value.trim();
    console.log("起点坐标：", startStr, "终点坐标：", endStr);
    getJsonpPosition(startStr, endStr, startStr, endStr);
  } else {
    // 如果是输入地点名称但没有通过搜索结果选择
    const loc1 = await getAddress(inputStart.value);
    const loc2 = await getAddress(inputEnd.value);
    
    if (!loc1 || !loc2) {
      alert('地址解析失败，请检查输入');
      return;
    }
    
    const data1 = loc1.split(',');
    data1.reverse();
    const data_string1 = data1.join(',');
    
    const data2 = loc2.split(',');
    data2.reverse();
    const data_string2 = data2.join(',');
    
    console.log("起点坐标：", data_string1, "终点坐标：", data_string2);
    getJsonpPosition(data_string1, data_string2, inputStart.value, inputEnd.value);
  }
}

// 终止路径规划
function terminateRoutePlanning() {
  inputStart.value = '';
  inputEnd.value = '';
  startLocationData.value = null;
  endLocationData.value = null;
  showRoutePlanning.value = false;
}

// 在地图上选择起点
function selectStartPoint() {
  alert("请点击地图选择起点");
  const handler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  handler.setInputAction((clickEvent) => {
    const ray = props.viewer.camera.getPickRay(clickEvent.position);
    let cartesian = props.viewer.scene.globe.pick(ray, props.viewer.scene);
    if (cartesian) {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
      inputStart.value = `${latitude},${longitude}`;
      alert(`已选择起点: ${latitude},${longitude}`);
    }
    handler.destroy();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 在地图上选择终点
function selectEndPoint() {
  alert("请点击地图选择终点");
  const handler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  handler.setInputAction((clickEvent) => {
    const ray = props.viewer.camera.getPickRay(clickEvent.position);
    let endPosition = props.viewer.scene.globe.pick(ray, props.viewer.scene);
    if (endPosition) {
      const cartographic = Cesium.Cartographic.fromCartesian(endPosition);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
      inputEnd.value = `${latitude},${longitude}`;
      alert(`已选择终点: ${latitude},${longitude}`);
    }
    handler.destroy();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 通视分析
function startLineOfSightAnalysis() {
  // 清除之前可能存在的通视分析结果
  clearExistingAnalysis('lineOfSight');
  
  let clickCount = 0;
  let observerCartesian = null;
  let targetCartesian = null;
  let observerEntity = null;
  let targetEntity = null;
  let lineOfSightEntities = [];
  let analysisStart = null;
  
  const handler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  // 显示提示信息
  alert("请先点击选择观察点，再点击选择目标点");
  
  handler.setInputAction((clickEvent) => {
    clickCount++;
    // 先尝试从地形获取高度信息的点
    const ray = props.viewer.camera.getPickRay(clickEvent.position);
    let cartesian = props.viewer.scene.globe.pick(ray, props.viewer.scene);
    
    if (!cartesian) {
      // 如果从地形获取失败，则使用椭球体拾取
      const ellipsoidCartesian = props.viewer.camera.pickEllipsoid(clickEvent.position, props.viewer.scene.globe.ellipsoid);
      if (!ellipsoidCartesian) return;
      
      // 获取椭球体上的点的高度
      const cartographic = Cesium.Cartographic.fromCartesian(ellipsoidCartesian);
      const height = 0; // 默认高度为0
      
      // 创建新的笛卡尔坐标，包含高度信息
      cartesian = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        height
      );
    }
    
    if (clickCount === 1) {
      analysisStart = new Date(); // 记录开始时间用于生成唯一名称
      observerCartesian = cartesian;
      observerEntity = props.viewer.entities.add({
        position: cartesian,
        point: { 
          pixelSize: 12, 
          color: Cesium.Color.BLUE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: '观察点',
          font: '16px sans-serif',
          fillColor: Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          outlineColor: Cesium.Color.BLUE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          backgroundColor: Cesium.Color.BLUE.withAlpha(0.7),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(7, 5)
        },
        properties: {
          analysisType: 'lineOfSight'
        }
      });
      lineOfSightEntities.push(observerEntity);
      console.log('观察点已确定');
      
      // 添加鼠标移动时的动态连线效果
      handler.setInputAction((moveEvent) => {
        const moveRay = props.viewer.camera.getPickRay(moveEvent.endPosition);
        let moveCartesian = props.viewer.scene.globe.pick(moveRay, props.viewer.scene);
        
        if (!moveCartesian) {
          const moveEllipsoidCartesian = props.viewer.camera.pickEllipsoid(moveEvent.endPosition, props.viewer.scene.globe.ellipsoid);
          if (!moveEllipsoidCartesian) return;
          
          const moveCartographic = Cesium.Cartographic.fromCartesian(moveEllipsoidCartesian);
          const moveHeight = 0;
          moveCartesian = Cesium.Cartesian3.fromRadians(
            moveCartographic.longitude,
            moveCartographic.latitude,
            moveHeight
          );
        }
        
        // 如果已存在动态线，则移除
        if (lineOfSightEntities.length > 1) {
          for (let i = lineOfSightEntities.length - 1; i > 0; i--) {
            props.viewer.entities.remove(lineOfSightEntities[i]);
            lineOfSightEntities.pop();
          }
        }
        
        // 创建动态视线
        const dynamicLine = props.viewer.entities.add({
          polyline: {
            positions: [observerCartesian, moveCartesian],
            width: 2,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.YELLOW,
              dashLength: 8.0
            })
          },
          properties: {
            analysisType: 'lineOfSight'
          }
        });
        lineOfSightEntities.push(dynamicLine);
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      
    } else if (clickCount === 2) {
      targetCartesian = cartesian;
      
      // 移除动态线
      if (lineOfSightEntities.length > 1) {
        for (let i = lineOfSightEntities.length - 1; i > 0; i--) {
          props.viewer.entities.remove(lineOfSightEntities[i]);
          lineOfSightEntities.pop();
        }
      }
      
      targetEntity = props.viewer.entities.add({
        position: cartesian,
        point: { 
          pixelSize: 12, 
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: '目标点',
          font: '16px sans-serif',
          fillColor: Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          outlineColor: Cesium.Color.RED,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          backgroundColor: Cesium.Color.RED.withAlpha(0.7),
          showBackground: true,
          backgroundPadding: new Cesium.Cartesian2(7, 5)
        },
        properties: {
          analysisType: 'lineOfSight'
        }
      });
      lineOfSightEntities.push(targetEntity);
      console.log('目标点已确定');
      
      const observerCartographic = Cesium.Cartographic.fromCartesian(observerCartesian);
      const targetCartographic = Cesium.Cartographic.fromCartesian(targetCartesian);
      
      // 执行通视分析，并传递图层创建回调
      performLineOfSightAnalysis(
        observerCartographic, 
        targetCartographic, 
        lineOfSightEntities, 
        createLineOfSightLayer
      );
      
      // 销毁事件处理器
      handler.destroy();
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 创建通视分析图层并添加到图层管理器
function createLineOfSightLayer(entities, analysisResult) {
  // 创建一个时间戳用于唯一图层名称
  const timestamp = new Date().toLocaleTimeString();
  
  // 图层名称根据通视分析结果而定
  let layerName = '';
  if (analysisResult.hasOwnProperty('isVisible')) {
    // 常规通视分析
    const visibility = analysisResult.isVisible;
    layerName = `通视分析 ${visibility ? '可见' : '不可见'} (${timestamp})`;
  } else if (analysisResult.hasOwnProperty('isSimple') && analysisResult.isSimple) {
    // 简单通视分析(无地形)
    layerName = `通视分析 简易模式 (${timestamp})`;
  } else {
    // 默认情况
    layerName = `通视分析 (${timestamp})`;
  }
  
  // 创建图层对象
  const lineOfSightLayer = {
    name: layerName,
    show: true,
    entities: entities,
    
    // 控制图层可见性
    setVisibility: function(visible) {
      this.show = visible;
      this.entities.forEach(entity => {
        if (entity && entity.show !== undefined) {
          entity.show = visible;
        }
      });
    },
    
    // 清理图层资源
    clear: function() {
      this.entities.forEach(entity => {
        if (entity) {
          props.viewer.entities.remove(entity);
        }
      });
      this.entities = [];
    },
    
    // 兼容ViewshedAnalysis接口
    _visible: true,
    set visible(value) {
      this._visible = value;
      this.setVisibility(value);
    },
    get visible() {
      return this._visible;
    }
  };
  
  // 触发事件，将图层添加到图层管理器
  emit('add-viewshed-layer', lineOfSightLayer);
  
  return lineOfSightLayer;
}

// 清除已有的分析结果
function clearExistingAnalysis(type) {
  // 移除含有特定标识的实体
  const entitiesToRemove = [];
  props.viewer.entities.values.forEach(entity => {
    if (entity.properties && entity.properties.analysisType && entity.properties.analysisType.getValue() === type) {
      entitiesToRemove.push(entity);
    }
  });
  
  entitiesToRemove.forEach(entity => {
    props.viewer.entities.remove(entity);
  });
}

// 执行通视分析
function performLineOfSightAnalysis(observerCarto, targetCarto, lineOfSightEntities, callback) {
  const numSamples = 100; // 增加采样点数量以获得更精确的结果
  const positions = [];
  
  // 获取直线上的高程点
  for (let i = 0; i <= numSamples; i++) {
    const fraction = i / numSamples;
    const lon = Cesium.Math.lerp(observerCarto.longitude, targetCarto.longitude, fraction);
    const lat = Cesium.Math.lerp(observerCarto.latitude, targetCarto.latitude, fraction);
    const height = Cesium.Math.lerp(observerCarto.height || 0, targetCarto.height || 0, fraction);
    positions.push(new Cesium.Cartographic(lon, lat, height));
  }
  
  // 显示加载指示器
  const loadingIndicator = props.viewer.entities.add({
    position: Cesium.Cartesian3.fromRadians(
      (observerCarto.longitude + targetCarto.longitude) / 2, 
      (observerCarto.latitude + targetCarto.latitude) / 2, 
      Math.max(observerCarto.height || 0, targetCarto.height || 0) + 1000
    ),
    label: {
      text: '通视分析计算中...',
      font: '16px sans-serif',
      fillColor: Cesium.Color.WHITE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      outlineColor: Cesium.Color.BLACK,
      backgroundColor: Cesium.Color.BLACK.withAlpha(0.5),
      showBackground: true,
      backgroundPadding: new Cesium.Cartesian2(10, 5),
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER
    },
    properties: {
      analysisType: 'lineOfSight'
    }
  });
  lineOfSightEntities.push(loadingIndicator);
  
  // 检查地形提供程序是否可用
  const terrainProvider = props.viewer.terrainProvider;
  const isTerrainAvailable = 
    terrainProvider && 
    ((terrainProvider.hasOwnProperty('availability') && terrainProvider.availability) || 
    terrainProvider.constructor.name === 'CesiumTerrainProvider' ||
    terrainProvider.constructor.name === 'EllipsoidTerrainProvider');
  
  if (!isTerrainAvailable) {
    // 使用简单的直线通视分析（不考虑地形）
    performSimpleLineOfSightAnalysis(observerCarto, targetCarto, lineOfSightEntities, loadingIndicator, callback);
    return;
  }
  
  // 检查地形请求方法
  let terrainSamplingMethod;
  if (typeof Cesium.sampleTerrainMostDetailed === 'function') {
    terrainSamplingMethod = Cesium.sampleTerrainMostDetailed;
  } else if (typeof terrainProvider.sampleTerrainMostDetailed === 'function') {
    terrainSamplingMethod = (provider, positions) => provider.sampleTerrainMostDetailed(positions);
  } else if (typeof Cesium.sampleTerrain === 'function') {
    terrainSamplingMethod = (provider, positions) => Cesium.sampleTerrain(provider, 13, positions);
  } else {
    // 回退到简单分析
    console.warn("无法找到合适的地形采样方法，将使用简单通视分析");
    performSimpleLineOfSightAnalysis(observerCarto, targetCarto, lineOfSightEntities, loadingIndicator, callback);
    return;
  }
  
  // 执行地形采样
  try {
    terrainSamplingMethod(terrainProvider, positions)
      .then((updatedPositions) => {
        // 移除加载指示器
        props.viewer.entities.remove(loadingIndicator);
        lineOfSightEntities.pop();
        
        // 计算视线分段
        const segments = [];
        let currentSegment = { visible: null, positions: [] };
        let obstructionPoints = [];
        
        for (let i = 0; i < updatedPositions.length; i++) {
          const fraction = i / numSamples;
          // 计算视线光线的预期高度（线性插值）
          const expectedHeight = Cesium.Math.lerp(observerCarto.height || 0, targetCarto.height || 0, fraction);
          const sampled = updatedPositions[i];
          
          // 检查点是否可见（地形高度是否低于视线）
          const isVisible = sampled.height <= expectedHeight + 1.0;
          const carto = new Cesium.Cartographic(sampled.longitude, sampled.latitude, sampled.height);
          
          // 创建笛卡尔坐标以用于绘制
          const cartesian = Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, carto.height);
          
          // 如果地形高度高于视线，并且与前一点状态不同，则标记为阻挡点
          if (!isVisible && (i > 0 && i < updatedPositions.length - 1) && 
              (i === 0 || updatedPositions[i-1].height <= Cesium.Math.lerp(observerCarto.height || 0, targetCarto.height || 0, (i-1)/numSamples) + 1.0)) {
            obstructionPoints.push({
              position: cartesian,
              height: sampled.height,
              expectedHeight: expectedHeight
            });
          }
          
          // 构建线段
          if (currentSegment.visible === null) {
            currentSegment.visible = isVisible;
            currentSegment.positions.push(cartesian);
          } else if (currentSegment.visible === isVisible) {
            currentSegment.positions.push(cartesian);
          } else {
            segments.push(currentSegment);
            currentSegment = { visible: isVisible, positions: [cartesian] };
          }
        }
        
        // 添加最后一个线段
        if (currentSegment.positions.length > 0) {
          segments.push(currentSegment);
        }
        
        // 绘制直线连线
        const startPosition = Cesium.Cartesian3.fromRadians(
          observerCarto.longitude,
          observerCarto.latitude,
          observerCarto.height || 0
        );
        const endPosition = Cesium.Cartesian3.fromRadians(
          targetCarto.longitude,
          targetCarto.latitude,
          targetCarto.height || 0
        );
        
        // 添加直线连线
        const lineEntity = props.viewer.entities.add({
          polyline: {
            positions: [startPosition, endPosition],
            width: 4,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.2,
              color: Cesium.Color.GREEN.withAlpha(0.8)
            }),
            clampToGround: false
          },
          properties: {
            analysisType: 'lineOfSight'
          }
        });
        lineOfSightEntities.push(lineEntity);
        
        // 标记阻挡点
        obstructionPoints.forEach(point => {
          const obstructionEntity = props.viewer.entities.add({
            position: point.position,
            point: {
              pixelSize: 10,
              color: Cesium.Color.YELLOW,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2
            },
            label: {
              text: `视线阻挡点\n地形高: ${point.height.toFixed(2)}m\n视线高: ${point.expectedHeight.toFixed(2)}m`,
              font: '14px sans-serif',
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth: 2,
              outlineColor: Cesium.Color.BLACK,
              backgroundColor: Cesium.Color.YELLOW.withAlpha(0.7),
              showBackground: true,
              backgroundPadding: new Cesium.Cartesian2(7, 5),
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10)
            },
            properties: {
              analysisType: 'lineOfSight'
            }
          });
          lineOfSightEntities.push(obstructionEntity);
        });
        
        // 计算整体可见性
        const overallVisible = obstructionPoints.length === 0;
        
        // 添加结果标签
        const resultEntity = props.viewer.entities.add({
          position: Cesium.Cartesian3.fromRadians(
            (observerCarto.longitude + targetCarto.longitude) / 2,
            (observerCarto.latitude + targetCarto.latitude) / 2,
            Math.max(observerCarto.height || 0, targetCarto.height || 0) + 100
          ),
          label: {
            text: overallVisible ? '通视分析结果: 可见' : '通视分析结果: 不可见',
            font: '16px sans-serif',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            outlineColor: overallVisible ? Cesium.Color.GREEN : Cesium.Color.RED,
            backgroundColor: overallVisible ? Cesium.Color.GREEN.withAlpha(0.7) : Cesium.Color.RED.withAlpha(0.7),
            showBackground: true,
            backgroundPadding: new Cesium.Cartesian2(10, 5),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20)
          },
          properties: {
            analysisType: 'lineOfSight'
          }
        });
        lineOfSightEntities.push(resultEntity);
        
        // 添加距离信息
        const distance = Cesium.Cartesian3.distance(startPosition, endPosition);
        
        const distanceEntity = props.viewer.entities.add({
          position: Cesium.Cartesian3.fromRadians(
            (observerCarto.longitude + targetCarto.longitude) / 2,
            (observerCarto.latitude + targetCarto.latitude) / 2,
            (observerCarto.height + targetCarto.height) / 2 + 50
          ),
          label: {
            text: `距离: ${distance.toFixed(2)} 米`,
            font: '16px sans-serif',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            outlineColor: Cesium.Color.BLACK,
            backgroundColor: Cesium.Color.DARKBLUE.withAlpha(0.7),
            showBackground: true,
            backgroundPadding: new Cesium.Cartesian2(7, 5),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER
          },
          properties: {
            analysisType: 'lineOfSight'
          }
        });
        lineOfSightEntities.push(distanceEntity);
        
        // 如果提供了回调，则创建图层
        if (typeof callback === 'function') {
          callback(lineOfSightEntities, {
            isVisible: overallVisible,
            distance: distance,
            hasObstructions: obstructionPoints.length > 0,
            obstructionCount: obstructionPoints.length
          });
        }
      })
      .catch(error => {
        console.error("通视分析失败:", error);
        // 回退到简单分析
        performSimpleLineOfSightAnalysis(observerCarto, targetCarto, lineOfSightEntities, loadingIndicator, callback);
      });
  } catch (error) {
    console.error("尝试地形采样失败:", error);
    // 回退到简单分析
    performSimpleLineOfSightAnalysis(observerCarto, targetCarto, lineOfSightEntities, loadingIndicator, callback);
  }
}

// 简单通视分析（不使用地形）
function performSimpleLineOfSightAnalysis(observerCarto, targetCarto, lineOfSightEntities, loadingIndicator, callback) {
  try {
    if (loadingIndicator) {
      props.viewer.entities.remove(loadingIndicator);
      lineOfSightEntities.pop();
    }
    
    // 通知用户使用简化版本
    const notification = props.viewer.entities.add({
      position: Cesium.Cartesian3.fromRadians(
        (observerCarto.longitude + targetCarto.longitude) / 2, 
        (observerCarto.latitude + targetCarto.latitude) / 2, 
        Math.max(observerCarto.height || 0, targetCarto.height || 0) + 1000
      ),
      label: {
        text: '地形数据不可用，将使用简化通视分析',
        font: '14px sans-serif',
        fillColor: Cesium.Color.YELLOW,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        outlineColor: Cesium.Color.BLACK,
        backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
        showBackground: true,
        backgroundPadding: new Cesium.Cartesian2(7, 5),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, -40)
      },
      properties: {
        analysisType: 'lineOfSight'
      }
    });
    lineOfSightEntities.push(notification);
    
    // 不考虑地形，假设直线可见
    const startPosition = Cesium.Cartesian3.fromRadians(
      observerCarto.longitude, 
      observerCarto.latitude, 
      observerCarto.height || 0
    );
    const endPosition = Cesium.Cartesian3.fromRadians(
      targetCarto.longitude, 
      targetCarto.latitude, 
      targetCarto.height || 0
    );
    
    // 添加连线
    const lineEntity = props.viewer.entities.add({
      polyline: {
        positions: [startPosition, endPosition],
        width: 4,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: Cesium.Color.GREEN.withAlpha(0.8)
        }),
        clampToGround: false
      },
      properties: {
        analysisType: 'lineOfSight'
      }
    });
    lineOfSightEntities.push(lineEntity);
    
    // 添加距离信息
    const distance = Cesium.Cartesian3.distance(startPosition, endPosition);
    const distanceEntity = props.viewer.entities.add({
      position: Cesium.Cartesian3.fromRadians(
        (observerCarto.longitude + targetCarto.longitude) / 2,
        (observerCarto.latitude + targetCarto.latitude) / 2,
        (observerCarto.height + targetCarto.height) / 2 + 50
      ),
      label: {
        text: `距离: ${distance.toFixed(2)} 米`,
        font: '16px sans-serif',
        fillColor: Cesium.Color.WHITE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        outlineColor: Cesium.Color.BLACK,
        backgroundColor: Cesium.Color.DARKBLUE.withAlpha(0.7),
        showBackground: true,
        backgroundPadding: new Cesium.Cartesian2(7, 5),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER
      },
      properties: {
        analysisType: 'lineOfSight'
      }
    });
    lineOfSightEntities.push(distanceEntity);
    
    // 创建假设可见的结果标签
    const resultEntity = props.viewer.entities.add({
      position: endPosition,
      label: {
        text: '⚠️ 假设目标可见 (无地形数据)',
        font: '16px sans-serif',
        fillColor: Cesium.Color.WHITE,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        outlineColor: Cesium.Color.ORANGE,
        backgroundColor: Cesium.Color.ORANGE.withAlpha(0.7),
        showBackground: true,
        backgroundPadding: new Cesium.Cartesian2(7, 5),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20)
      },
      properties: {
        analysisType: 'lineOfSight'
      }
    });
    lineOfSightEntities.push(resultEntity);
    
    // 如果提供了回调，则创建图层
    if (typeof callback === 'function') {
      callback(lineOfSightEntities, {
        isSimple: true,
        distance: distance
      });
    }
    
  } catch (error) {
    console.error("简单通视分析失败:", error);
    alert("通视分析失败，请确保已加载地形数据");
  }
}

// 可视域分析
function startViewshedAnalysis() {
  showViewshedModal.value = false;
  let i = 0;
  let viewShed = null;
  const handler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  // 显示提示信息
  const notification = props.viewer.entities.add({
    position: props.viewer.camera.position,
    label: {
      text: '请点击选择观察点位置',
      font: '16px sans-serif',
      fillColor: Cesium.Color.WHITE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      outlineColor: Cesium.Color.BLACK,
      backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
      showBackground: true,
      backgroundPadding: new Cesium.Cartesian2(7, 5),
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER
    }
  });
  
  handler.setInputAction((clickEvent) => {
    i++;
    if (i === 1) {
      // 先尝试从地形获取高度信息的点
      const ray = props.viewer.camera.getPickRay(clickEvent.position);
      let startPosition = props.viewer.scene.globe.pick(ray, props.viewer.scene);
      
      if (!startPosition) {
        // 如果从地形获取失败，则使用椭球体拾取
        const ellipsoidCartesian = props.viewer.camera.pickEllipsoid(clickEvent.position, props.viewer.scene.globe.ellipsoid);
        if (!ellipsoidCartesian) return;
        
        // 获取椭球体上的点的高度
        const cartographic = Cesium.Cartographic.fromCartesian(ellipsoidCartesian);
        const height = 0; // 默认高度为0
        
        // 创建新的笛卡尔坐标，包含高度信息
        startPosition = Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          height
        );
      }
      
      // 更新提示信息
      notification.label.text = '请点击选择观察方向';
      
      viewShed = new ViewshedAnalysis(props.viewer, {
        viewPosition: startPosition,
        viewPositionEnd: startPosition,
        horizontalViewAngle: viewshedParams.horizontalViewAngle,
        verticalViewAngle: viewshedParams.verticalViewAngle,
        visibleAreaColor: Cesium.Color.fromCssColorString(viewshedParams.visibleAreaColor),
        invisibleAreaColor: Cesium.Color.fromCssColorString(viewshedParams.invisibleAreaColor)
      });
      
      handler.setInputAction((movement) => {
        const moveRay = props.viewer.camera.getPickRay(movement.endPosition);
        let endPosition = props.viewer.scene.globe.pick(moveRay, props.viewer.scene);
        
        if (!endPosition) {
          const moveEllipsoidCartesian = props.viewer.camera.pickEllipsoid(movement.endPosition, props.viewer.scene.globe.ellipsoid);
          if (!moveEllipsoidCartesian) return;
          
          const moveCartographic = Cesium.Cartographic.fromCartesian(moveEllipsoidCartesian);
          const moveHeight = 0;
          endPosition = Cesium.Cartesian3.fromRadians(
            moveCartographic.longitude,
            moveCartographic.latitude,
            moveHeight
          );
        }
        
        viewShed.updatePosition(endPosition);
        if (!viewShed.sketch) {
          viewShed.drawSketch();
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
    if (i === 2) {
      i = 0;
      // 先尝试从地形获取高度信息的点
      const ray = props.viewer.camera.getPickRay(clickEvent.position);
      let endPosition = props.viewer.scene.globe.pick(ray, props.viewer.scene);
      
      if (!endPosition) {
        // 如果从地形获取失败，则使用椭球体拾取
        const ellipsoidCartesian = props.viewer.camera.pickEllipsoid(clickEvent.position, props.viewer.scene.globe.ellipsoid);
        if (!ellipsoidCartesian) return;
        
        // 获取椭球体上的点的高度
        const cartographic = Cesium.Cartographic.fromCartesian(ellipsoidCartesian);
        const height = 0; // 默认高度为0
        
        // 创建新的笛卡尔坐标，包含高度信息
        endPosition = Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          height
        );
      }
      
      viewShed.updatePosition(endPosition);
      viewShed.update();
      emit('add-viewshed-layer', viewShed);
      handler.destroy();
      props.viewer.entities.remove(notification);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 可视域分析类
class ViewshedAnalysis {
  constructor(viewer, options) {
    this.viewer = viewer;
    this.viewPosition = options.viewPosition;
    this.viewPositionEnd = options.viewPositionEnd;
    this.viewDistance = this.viewPositionEnd
      ? Cesium.Cartesian3.distance(this.viewPosition, this.viewPositionEnd)
      : options.viewDistance || 100.0;
    this.viewHeading = this.viewPositionEnd
      ? this.getHeading(this.viewPosition, this.viewPositionEnd)
      : options.viewHeading || 0.0;
    this.viewPitch = this.viewPositionEnd
      ? this.getPitch(this.viewPosition, this.viewPositionEnd)
      : options.viewPitch || 0.0;
    this.horizontalViewAngle = options.horizontalViewAngle || 90.0;
    this.verticalViewAngle = options.verticalViewAngle || 60.0;
    this.visibleAreaColor = options.visibleAreaColor || Cesium.Color.GREEN;
    this.invisibleAreaColor = options.invisibleAreaColor || Cesium.Color.RED;
    this.enabled = typeof options.enabled === 'boolean' ? options.enabled : true;
    this.softShadows = typeof options.softShadows === 'boolean' ? options.softShadows : true;
    this.size = options.size || 4096; // 提高阴影贴图分辨率
    this._visible = true;
  }

  add() {
    this.createLightCamera();
    this.createShadowMap();
    // this.drawFrustumOutline(); // 注释掉这行，不绘制外部方形框
    this.drawSketch();
    this.createPostStage();
  }

  update() {
    this.clear();
    this.add();
  }

  updatePosition(viewPositionEnd) {
    this.viewPositionEnd = viewPositionEnd;
    this.viewDistance = Cesium.Cartesian3.distance(this.viewPosition, this.viewPositionEnd);
    this.viewHeading = this.getHeading(this.viewPosition, this.viewPositionEnd);
    this.viewPitch = this.getPitch(this.viewPosition, this.viewPositionEnd);
  }

  clear() {
    if (this.sketch) {
      this.viewer.entities.remove(this.sketch);
      this.sketch = null;
    }
    if (this.postStage) {
      this.viewer.scene.postProcessStages.remove(this.postStage);
      this.postStage = null;
    }
    if (this.frustumOutline) {
      this.viewer.scene.primitives.remove(this.frustumOutline);
      this.frustumOutline = null;
    }
  }

  createLightCamera() {
    this.lightCamera = new Cesium.Camera(this.viewer.scene);
    this.lightCamera.position = this.viewPosition;
    this.lightCamera.frustum.near = this.viewDistance * 0.001;
    this.lightCamera.frustum.far = this.viewDistance;
    const hr = Cesium.Math.toRadians(this.horizontalViewAngle);
    const vr = Cesium.Math.toRadians(this.verticalViewAngle);
    const aspectRatio = (this.viewDistance * Math.tan(hr / 2) * 2) / (this.viewDistance * Math.tan(vr / 2) * 2);
    this.lightCamera.frustum.aspectRatio = aspectRatio;
    this.lightCamera.frustum.fov = Math.max(hr, vr);
    this.lightCamera.setView({
      destination: this.viewPosition,
      orientation: {
        heading: Cesium.Math.toRadians(this.viewHeading || 0),
        pitch: Cesium.Math.toRadians(this.viewPitch || 0),
        roll: 0
      }
    });
  }

  createShadowMap() {
    this.shadowMap = new Cesium.ShadowMap({
      context: this.viewer.scene.context,
      lightCamera: this.lightCamera,
      enabled: this.enabled,
      isPointLight: true,
      pointLightRadius: this.viewDistance,
      cascadesEnabled: false,
      size: this.size,
      softShadows: this.softShadows,
      normalOffset: false,
      maximumDistance: this.viewDistance,
      bias: 0.00001, // 添加偏移值减少自阴影和锯齿问题
      darkness: 0.0, // 调整阴影暗度
      normalOffsetScale: 0.0, // 禁用法线偏移，减少条纹
      fromLightSource: false
    });
    this.viewer.scene.shadowMap = this.shadowMap;
  }

  createPostStage() {
    const fs = glsl;
    const postStage = new Cesium.PostProcessStage({
      fragmentShader: fs,
      uniforms: {
        shadowMap_textureCube: () => {
          this.shadowMap.update(this.viewer.scene._frameState);
          return this.shadowMap._shadowMapTexture;
        },
        shadowMap_matrix: () => {
          this.shadowMap.update(this.viewer.scene._frameState);
          return this.shadowMap._shadowMapMatrix;
        },
        shadowMap_lightPositionEC: () => {
          this.shadowMap.update(this.viewer.scene._frameState);
          return this.shadowMap._lightPositionEC;
        },
        shadowMap_normalOffsetScaleDistanceMaxDistanceAndDarkness: () => {
          this.shadowMap.update(this.viewer.scene._frameState);
          const bias = this.shadowMap._pointBias;
          return Cesium.Cartesian4.fromElements(
            bias.normalOffsetScale,
            this.shadowMap._distance,
            this.shadowMap.maximumDistance,
            0.0,
            new Cesium.Cartesian4()
          );
        },
        shadowMap_texelSizeDepthBiasAndNormalShadingSmooth: () => {
          this.shadowMap.update(this.viewer.scene._frameState);
          const bias = this.shadowMap._pointBias;
          const texelStepSize = new Cesium.Cartesian2(
            1.0 / this.shadowMap._textureSize.x,
            1.0 / this.shadowMap._textureSize.y
          );
          return Cesium.Cartesian4.fromElements(
            texelStepSize.x,
            texelStepSize.y,
            bias.depthBias,
            bias.normalShadingSmooth,
            new Cesium.Cartesian4()
          );
        },
        camera_projection_matrix: this.lightCamera.frustum.projectionMatrix,
        camera_view_matrix: this.lightCamera.viewMatrix,
        helsing_viewDistance: () => {
          return this.viewDistance;
        },
        helsing_visibleAreaColor: this.visibleAreaColor,
        helsing_invisibleAreaColor: this.invisibleAreaColor
      }
    });
    this.postStage = this.viewer.scene.postProcessStages.add(postStage);
  }

  drawFrustumOutline() {
    const scratchRight = new Cesium.Cartesian3();
    const scratchRotation = new Cesium.Matrix3();
    const scratchOrientation = new Cesium.Quaternion();
    const position = this.lightCamera.positionWC;
    const direction = this.lightCamera.directionWC;
    const up = this.lightCamera.upWC;
    let right = Cesium.Cartesian3.negate(this.lightCamera.rightWC, scratchRight);
    Cesium.Matrix3.setColumn(scratchRotation, 0, right, scratchRotation);
    Cesium.Matrix3.setColumn(scratchRotation, 1, up, scratchRotation);
    Cesium.Matrix3.setColumn(scratchRotation, 2, direction, scratchRotation);
    let orientation = Cesium.Quaternion.fromRotationMatrix(scratchRotation, scratchOrientation);
    let instance = new Cesium.GeometryInstance({
      geometry: new Cesium.FrustumOutlineGeometry({
        frustum: this.lightCamera.frustum,
        origin: this.viewPosition,
        orientation: orientation
      }),
      id: Math.random().toString(36).substr(2),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOWGREEN),
        show: new Cesium.ShowGeometryInstanceAttribute(true)
      }
    });
    this.frustumOutline = this.viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: [instance],
        appearance: new Cesium.PerInstanceColorAppearance({
          flat: true,
          translucent: false
        })
      })
    );
  }

  drawSketch() {
    this.sketch = this.viewer.entities.add({
      name: '可视域分析',
      position: this.viewPosition,
      orientation: new Cesium.CallbackProperty(() => {
        return Cesium.Transforms.headingPitchRollQuaternion(
          this.viewPosition,
          Cesium.HeadingPitchRoll.fromDegrees(this.viewHeading - this.horizontalViewAngle, this.viewPitch, 0.5)
        );
      }, false),
      ellipsoid: {
        radii: new Cesium.CallbackProperty(() => {
          return new Cesium.Cartesian3(this.viewDistance, this.viewDistance, this.viewDistance);
        }, false),
        innerRadii: new Cesium.Cartesian3(2.0, 2.0, 2.0),
        minimumClock: Cesium.Math.toRadians(-this.horizontalViewAngle / 2),
        maximumClock: Cesium.Math.toRadians(this.horizontalViewAngle / 2),
        minimumCone: Cesium.Math.toRadians(this.verticalViewAngle + 7.75),
        maximumCone: Cesium.Math.toRadians(90),
        fill: false,
        outline: true,
        subdivisions: 512, // 增加细分段数提高平滑度
        stackPartitions: 128, // 增加堆栈分区数量
        slicePartitions: 128, // 增加切片分区数量
        outlineColor: Cesium.Color.YELLOWGREEN.withAlpha(0.8), // 半透明效果
        outlineWidth: 2.0 // 增加轮廓线宽度
      }
    });
  }

  getHeading(fromPosition, toPosition) {
    let finalPosition = new Cesium.Cartesian3();
    let matrix4 = Cesium.Transforms.eastNorthUpToFixedFrame(fromPosition);
    Cesium.Matrix4.inverse(matrix4, matrix4);
    Cesium.Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
    Cesium.Cartesian3.normalize(finalPosition, finalPosition);
    return Cesium.Math.toDegrees(Math.atan2(finalPosition.x, finalPosition.y));
  }

  getPitch(fromPosition, toPosition) {
    let finalPosition = new Cesium.Cartesian3();
    let matrix4 = Cesium.Transforms.eastNorthUpToFixedFrame(fromPosition);
    Cesium.Matrix4.inverse(matrix4, matrix4);
    Cesium.Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
    Cesium.Cartesian3.normalize(finalPosition, finalPosition);
    return Cesium.Math.toDegrees(Math.asin(finalPosition.z));
  }
}

// 关闭可视域分析模态框
function closeViewshedModal() {
  showViewshedModal.value = false;
}

// 设置地形分析类型
function setTerrainAnalysisType(type) {
  terrainAnalysisParams.type = type;
  
  // 如果选择了等高线类型，立即预览
  if (type === 'contour') {
    // 延迟一点执行，确保UI已更新
    setTimeout(() => {
      previewContourLines();
    }, 100);
  }
}

// 关闭地形分析模态框
function closeTerrainAnalysisModal() {
  showTerrainAnalysisModal.value = false;
}

// 开始地形分析
function startTerrainAnalysis() {
  showTerrainAnalysisModal.value = false;
  
  // 移除之前可能存在的地形分析图层
  removeTerrainAnalysisLayers();
  
  // 显示加载提示
  const loadingNotification = props.viewer.entities.add({
    position: props.viewer.camera.position,
    label: {
      text: '正在加载地形数据...',
      font: '16px sans-serif',
      fillColor: Cesium.Color.WHITE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      outlineColor: Cesium.Color.BLACK,
      backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
      showBackground: true,
      backgroundPadding: new Cesium.Cartesian2(7, 5),
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER
    }
  });
  
  try {
    // 确保使用高精度地形
    console.log('正在加载高精度地形数据...');
    
    // 直接创建地形提供器（旧版Cesium中不返回Promise）
    const terrainProvider = Cesium.createWorldTerrain({
      requestVertexNormals: true,
      requestWaterMask: true
    });
    
    // 应用地形提供器
    props.viewer.terrainProvider = terrainProvider;
    console.log('地形数据加载成功');
    
    // 移除加载提示
    props.viewer.entities.remove(loadingNotification);
    
    // 设置全局地形配置
    props.viewer.scene.globe.depthTestAgainstTerrain = true;
    props.viewer.scene.globe.terrainExaggeration = 1.5;
    props.viewer.scene.globe.enableLighting = true;
    
    // 等待地形数据完全加载
    setTimeout(() => {
      // 根据分析类型执行不同的分析
      switch(terrainAnalysisParams.type) {
        case 'display':
          displayTerrain();
          break;
        case 'slope':
          createSlopeRamp();
          break;
        case 'aspect':
          createAspectRamp();
          break;
        case 'contour':
          generateContourLines();
          break;
      }
    }, 1500);
  } catch (error) {
    // 移除加载提示
    props.viewer.entities.remove(loadingNotification);
    
    console.error('加载地形数据失败:', error);
    showNotification('加载地形数据失败: ' + error.message);
    
    // 尝试使用已有地形
    console.log('尝试使用现有地形...');
    setTimeout(() => {
      switch(terrainAnalysisParams.type) {
        case 'display':
          displayTerrain();
          break;
        case 'slope':
          createSlopeRamp();
          break;
        case 'aspect':
          createAspectRamp();
          break;
        case 'contour':
          generateContourLines();
          break;
      }
    }, 500);
  }
}

// 显示地形
function displayTerrain() {
  try {
    console.log('启用地形显示');
    
    // 应用地形增强效果
    props.viewer.scene.globe.enableLighting = true;
    props.viewer.scene.globe.depthTestAgainstTerrain = true;
    props.viewer.scene.globe.terrainExaggeration = 1.5;
    
    // 移动相机到合适的位置来展示地形特征
    const position = Cesium.Cartesian3.fromDegrees(110.0, 35.0, 20000.0);
    props.viewer.camera.flyTo({
      destination: position,
      orientation: {
        heading: Cesium.Math.toRadians(30),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0.0
      },
      duration: 2.0,
      complete: function() {
        showNotification('地形显示模式已激活');
      }
    });
    
    // 创建一个实体来表示这是地形分析
    const entity = props.viewer.entities.add({
      name: '地形显示',
      position: props.viewer.camera.position,
      properties: {
        terrainAnalysisType: 'display'
      }
    });
  } catch (error) {
    console.error('启用地形显示失败:', error);
    showNotification('启用地形显示失败: ' + error.message);
  }
}

// 坡度分析
function analyzeSlopeTerrain() {
  // 移除之前可能存在的地形分析图层
  removeTerrainAnalysisLayers();
  
  try {
    console.log('开始坡度分析...');
    
    // 检查WebGL支持
    if (!checkWebGLExtension('OES_standard_derivatives')) {
      console.warn('警告: OES_standard_derivatives扩展不可用，着色器可能无法正常工作');
      showNotification('WebGL扩展受限，分析效果可能不理想');
    }
    
    // 检查Viewer和Scene是否可用
    if (!props.viewer || !props.viewer.scene || !props.viewer.scene.globe) {
      throw new Error('Cesium Viewer或Scene不可用');
    }
    
    // 确保地形已加载
    if (props.viewer.terrainProvider.constructor.name === 'EllipsoidTerrainProvider') {
      // 如果当前是椭球地形，先加载全球地形
      showNotification('正在加载地形数据...');
      console.log('加载全球地形数据...');
      
      try {
        // 直接创建地形提供器（旧版Cesium中不返回Promise）
        const terrainProvider = Cesium.createWorldTerrain({
          requestVertexNormals: true
        });
        
        console.log('地形数据加载成功，设置到Viewer中');
        props.viewer.terrainProvider = terrainProvider;
        
        // 等待地形加载完成
        console.log('等待地形渲染...');
        setTimeout(() => {
          console.log('开始创建坡度着色器材质');
          createSlopeRamp();
        }, 1500); // 增加延迟时间，确保地形加载完成
      } catch (error) {
        console.error('加载全球地形失败:', error);
        showNotification('加载全球地形失败: ' + error.message);
      }
    } else {
      console.log('使用现有地形数据进行坡度分析');
      // 检查是否有顶点法线
      const hasVertexNormals = props.viewer.terrainProvider.hasVertexNormals;
      console.log('地形是否有顶点法线:', hasVertexNormals);
      
      if (!hasVertexNormals) {
        console.warn('当前地形不包含顶点法线，可能影响分析效果');
        showNotification('当前地形不包含法线数据，分析效果可能不理想');
      }
      
      createSlopeRamp();
    }
  } catch (error) {
    console.error('坡度分析失败:', error);
    showNotification('坡度分析失败: ' + error.message);
  }
}

// 创建坡度颜色映射图层
function createSlopeRamp() {
  try {
    // 设置观察视角在陡峭地区
    const position = Cesium.Cartesian3.fromDegrees(110.0, 35.0, 40000.0);
    props.viewer.camera.flyTo({
      destination: position,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0
      },
      duration: 2.0,
      complete: function() {
        showNotification('已移动到示例区域，坡度分析需要有明显地形的区域才能看到效果');
      }
    });

    // 设置地形效果
    props.viewer.scene.globe.depthTestAgainstTerrain = true;
    props.viewer.scene.globe.terrainExaggeration = 1.5;
    props.viewer.scene.globe.enableLighting = true;
    
    // 检查WEBGL扩展支持
    const hasStandardDerivatives = checkWebGLExtension('OES_standard_derivatives');
    if (!hasStandardDerivatives) {
      console.warn('OES_standard_derivatives扩展不可用，将使用简化的着色器');
    }
    
    // 使用改进的基于着色器的材质 - 加强视觉效果
    const slopeRampMaterial = new Cesium.Material({
      fabric: {
        type: 'SlopeRamp',
        uniforms: {
          slopeAmount: 1.0
        },
        source: `
          uniform float slopeAmount;
          
          float getSlope(vec3 normal) {
            // 计算坡度（法线与垂直方向的夹角）
            return acos(normal.z);
          }
          
          vec3 getSlopeColor(float slope) {
            // 将弧度转换为角度
            float slopeDegree = degrees(slope);
            
            // 增强坡度色彩，使用更鲜明的颜色
            if (slopeDegree < 2.0) {
              return vec3(0.0, 0.3, 0.0); // 深绿色 - 平地
            } else if (slopeDegree < 5.0) {
              return vec3(0.0, 0.5, 0.0); // 绿色 - 微坡
            } else if (slopeDegree < 10.0) {
              return vec3(0.4, 0.8, 0.0); // 亮绿色 - 缓坡
            } else if (slopeDegree < 15.0) {
              return vec3(0.8, 0.8, 0.0); // 黄色 - 中坡
            } else if (slopeDegree < 30.0) {
              return vec3(0.8, 0.6, 0.0); // 橙黄色 - 陡坡
            } else if (slopeDegree < 45.0) {
              return vec3(0.8, 0.3, 0.0); // 橙红色 - 急坡
            } else {
              return vec3(0.7, 0.0, 0.0); // 红色 - 险坡
            }
          }
          
          czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            
            // 获取法线 - 转换为世界坐标系
            vec3 normalEC = normalize(materialInput.normalEC);
            vec3 normalWC = czm_inverseViewRotation * normalEC; // 转换为世界坐标系
            
            // 计算坡度 - 使用世界坐标系法线
            float slope = getSlope(normalWC);
            
            // 获取对应的颜色
            vec3 color = getSlopeColor(slope);
            
            // 添加阴影效果，增强立体感
            float lightIntensity = dot(normalEC, normalize(vec3(0.5, 0.5, 1.0)));
            lightIntensity = 0.7 + 0.3 * lightIntensity; // 减少阴影对颜色的影响
            
            // 应用颜色
            material.diffuse = color * lightIntensity;
            
            // 加强透明度对比度
            float slopeDegree = degrees(slope);
            material.alpha = 1.0;
            
            // 添加高光反射
            if (slopeDegree > 30.0) {
              float specular = pow(max(dot(normalize(vec3(0.5, 0.5, 1.0)), reflect(-normalize(vec3(0.5, 0.5, 1.0)), normalEC)), 0.0), 10.0);
              material.diffuse += vec3(specular * 0.3);
            }
            
            return material;
          }
        `
      }
    });
    
    // 应用着色器到地球
    props.viewer.scene.globe.material = slopeRampMaterial;
    
    // 创建一个实体来表示这是坡度分析
    const entity = props.viewer.entities.add({
      name: '坡度分析',
      position: props.viewer.camera.position,
      properties: {
        terrainAnalysisType: 'slope'
      }
    });
    
    // 添加图例
    createSlopeLegend();
    
    // 检查材质是否成功应用
    if (!checkMaterialApplication('坡度分析')) {
      showNotification('坡度分析可能未成功应用，请尝试刷新页面或重新加载地形');
    } else {
      // 提示用户
      showNotification('坡度分析已添加，请观察地形起伏显著的区域');
    }
    
    // 添加坡度分析图层到图层管理器
    const timestamp = new Date().toLocaleTimeString();
    const slopeLayer = {
      name: `坡度分析 (${timestamp})`,
      show: true,
      _visible: true,
      sketch: {
        name: `坡度分析 (${timestamp})`,
        show: true
      },
      
      // 控制图层可见性
      setVisibility: function(visible) {
        this._visible = visible;
        this.show = visible;
        
        if (visible) {
          // 恢复坡度着色
          if (props.viewer._slopeMaterial) {
            props.viewer.scene.globe.material = props.viewer._slopeMaterial;
          }
        } else {
          // 保存当前材质并移除
          if (props.viewer.scene.globe.material) {
            props.viewer._slopeMaterial = props.viewer.scene.globe.material;
            props.viewer.scene.globe.material = undefined;
          }
        }
      },
      
      // 清理图层资源
      clear: function() {
        // 移除地球材质
        if (props.viewer && props.viewer.scene && props.viewer.scene.globe) {
          props.viewer.scene.globe.material = undefined;
          props.viewer._slopeMaterial = undefined;
        }
        
        // 移除图例
        removeLegend();
      }
    };
    
    // 触发事件，将图层添加到图层管理器
    emit('add-viewshed-layer', slopeLayer);
    
    // 添加图例
    addSlopeLegend();
  } catch (error) {
    console.error('坡度分析失败:', error);
    showNotification('坡度分析失败: ' + error.message);
  }
}

// 添加坡度图例
function createSlopeLegend() {
  // 移除已有图例
  removeLegend();
  
  // 创建图例容器
  const legend = document.createElement('div');
  legend.id = 'terrain-analysis-legend';
  legend.className = 'terrain-analysis-legend';
  
  // 计算左侧边栏宽度，判断是否折叠
  const leftSidebar = document.querySelector('.left-sidebar');
  const leftSidebarWidth = leftSidebar && !leftSidebar.classList.contains('collapsed') ? 220 : 30;
  
  legend.style.cssText = `
    position: absolute;
    bottom: 30px;
    left: ${leftSidebarWidth + 10}px;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    font-family: 'Arial', sans-serif;
    max-width: 240px;
    transition: left 0.3s ease;
  `;
  
  // 添加标题
  const title = document.createElement('div');
  title.textContent = '坡度分析图例';
  title.style.cssText = `
    font-weight: bold;
    margin-bottom: 12px;
    text-align: center;
    font-size: 16px;
    color: #333;
    border-bottom: 1px solid #ddd;
    padding-bottom: 8px;
  `;
  legend.appendChild(title);
  
  // 坡度分类
  const slopeCategories = [
    { name: '平地 (0-2°)', color: 'rgb(24, 94, 24)' },
    { name: '微坡 (2-5°)', color: 'rgb(34, 139, 34)' },
    { name: '缓坡 (5-10°)', color: 'rgb(127, 205, 50)' },
    { name: '中坡 (10-15°)', color: 'rgb(218, 165, 32)' },
    { name: '陡坡 (15-30°)', color: 'rgb(205, 127, 50)' },
    { name: '急坡 (30-45°)', color: 'rgb(165, 42, 42)' },
    { name: '险坡 (>45°)', color: 'rgb(128, 0, 0)' }
  ];
  
  // 创建渐变色条
  const gradientBar = document.createElement('div');
  gradientBar.style.cssText = `
    height: 20px;
    width: 100%;
    margin: 10px 0 15px 0;
    background: linear-gradient(to right, 
      rgb(24, 94, 24),
      rgb(34, 139, 34),
      rgb(127, 205, 50),
      rgb(218, 165, 32),
      rgb(205, 127, 50),
      rgb(165, 42, 42),
      rgb(128, 0, 0)
    );
    border-radius: 3px;
    position: relative;
  `;
  
  // 添加坡度刻度
  const ticks = document.createElement('div');
  ticks.style.cssText = `
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
    font-size: 10px;
    color: #666;
  `;
  
  ['0°', '10°', '20°', '30°', '40°', '50°+'].forEach(tick => {
    const tickElem = document.createElement('span');
    tickElem.textContent = tick;
    ticks.appendChild(tickElem);
  });
  
  legend.appendChild(gradientBar);
  legend.appendChild(ticks);
  
  // 创建图例项
  const legendItems = document.createElement('div');
  legendItems.style.cssText = `
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 5px;
  `;
  
  slopeCategories.forEach(category => {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      font-size: 12px;
    `;
    
    const colorBox = document.createElement('div');
    colorBox.style.cssText = `
      width: 12px;
      height: 12px;
      background-color: ${category.color};
      margin-right: 5px;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    `;
    
    const label = document.createElement('div');
    label.textContent = category.name;
    
    item.appendChild(colorBox);
    item.appendChild(label);
    legendItems.appendChild(item);
  });
  
  legend.appendChild(legendItems);
  
  // 添加说明
  const description = document.createElement('div');
  description.textContent = '坡度是地形表面与水平面的夹角，常用于地形、水文和土地规划分析。';
  description.style.cssText = `
    font-size: 12px;
    margin-top: 15px;
    color: #555;
    line-height: 1.4;
    border-top: 1px solid #eee;
    padding-top: 8px;
  `;
  legend.appendChild(description);
  
  // 添加关闭按钮
  const closeButton = document.createElement('div');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    cursor: pointer;
    font-size: 18px;
    width: 20px;
    height: 20px;
    line-height: 18px;
    text-align: center;
    border-radius: 50%;
    color: #666;
    background: #f0f0f0;
  `;
  closeButton.onclick = removeLegend;
  legend.appendChild(closeButton);
  
  // 添加窗口大小改变时更新位置的监听
  window.addEventListener('resize', updateLegendPosition);
  
  // 添加左侧边栏变化监听
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        updateLegendPosition();
      }
    });
  });
  
  if (leftSidebar) {
    observer.observe(leftSidebar, { attributes: true });
  }
  
  function updateLegendPosition() {
    const leftSidebar = document.querySelector('.left-sidebar');
    const leftSidebarWidth = leftSidebar && !leftSidebar.classList.contains('collapsed') ? 220 : 30;
    const legendElement = document.getElementById('terrain-analysis-legend');
    if (legendElement) {
      legendElement.style.left = `${leftSidebarWidth + 10}px`;
    }
  }
  
  // 添加到页面
  document.body.appendChild(legend);
}

// 创建坡向颜色映射图层
function createAspectRamp() {
  try {
    // 设置观察视角在有明显地形的区域
    const position = Cesium.Cartesian3.fromDegrees(110.0, 35.0, 40000.0);
    props.viewer.camera.flyTo({
      destination: position,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0
      },
      duration: 2.0,
      complete: function() {
        showNotification('已移动到示例区域，坡向分析需要有明显地形的区域才能看到效果');
      }
    });

    // 设置地形效果
    props.viewer.scene.globe.depthTestAgainstTerrain = true;
    props.viewer.scene.globe.terrainExaggeration = 1.5;
    props.viewer.scene.globe.enableLighting = true;
    
    // 检查WEBGL扩展支持
    const hasStandardDerivatives = checkWebGLExtension('OES_standard_derivatives');
    if (!hasStandardDerivatives) {
      console.warn('OES_standard_derivatives扩展不可用，将使用简化的着色器');
    }
    
    // 使用改进的基于着色器的材质 - 加强视觉效果
    const aspectRampMaterial = new Cesium.Material({
      fabric: {
        type: 'AspectRamp',
        uniforms: {
          aspectAmount: 1.0
        },
        source: `
          uniform float aspectAmount;
          
          vec3 getAspectColor(float aspectDegrees, float slope) {
            // 将坡度从弧度转为角度
            float slopeDegree = degrees(slope);
            
            // 计算强度因子 - 坡度越大，颜色越鲜明
            float intensityFactor = clamp(slopeDegree / 45.0, 0.2, 1.0);
            
            // 使用更强烈的饱和色，增强视觉效果
            vec3 aspectColor;
            
            // 北向：0°/360° - 蓝色
            if (aspectDegrees >= 337.5 || aspectDegrees < 22.5) {
              aspectColor = vec3(0.0, 0.0, 1.0);
            }
            // 东北向：22.5-67.5° - 蓝绿色
            else if (aspectDegrees < 67.5) {
              aspectColor = vec3(0.0, 0.7, 1.0);
            }
            // 东向：67.5-112.5° - 绿色
            else if (aspectDegrees < 112.5) {
              aspectColor = vec3(0.0, 1.0, 0.2);
            }
            // 东南向：112.5-157.5° - 黄绿色
            else if (aspectDegrees < 157.5) {
              aspectColor = vec3(0.6, 1.0, 0.0);
            }
            // 南向：157.5-202.5° - 黄色
            else if (aspectDegrees < 202.5) {
              aspectColor = vec3(1.0, 1.0, 0.0);
            }
            // 西南向：202.5-247.5° - 橙色
            else if (aspectDegrees < 247.5) {
              aspectColor = vec3(1.0, 0.5, 0.0);
            }
            // 西向：247.5-292.5° - 红色
            else if (aspectDegrees < 292.5) {
              aspectColor = vec3(1.0, 0.0, 0.0);
            }
            // 西北向：292.5-337.5° - 紫色
            else {
              aspectColor = vec3(0.8, 0.0, 1.0);
            }
            
            // 根据坡度调整颜色强度
            aspectColor *= intensityFactor;
            
            // 对于极小的坡度（接近水平），使用灰白色
            if (slopeDegree < 2.0) {
              aspectColor = mix(vec3(0.8), aspectColor, slopeDegree / 2.0);
            }
            
            return aspectColor;
          }
          
          czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            
            // 使用法线计算坡向 - 转换到世界坐标系
            vec3 normalEC = normalize(materialInput.normalEC);
            vec3 normalWC = czm_inverseViewRotation * normalEC; // 转换为世界坐标系
            
            // 计算坡度 - 使用世界坐标系法线
            float slope = acos(normalWC.z);
            
            // 只对非垂直表面的区域进行计算
            if (abs(normalWC.z) < 0.999) {
              // 计算坡向角度 (方位角) - 使用世界坐标法线
              float aspect = atan(normalWC.y, normalWC.x);
              // 转换到0-360度范围
              float aspectDegrees = degrees(aspect);
              if (aspectDegrees < 0.0) {
                aspectDegrees += 360.0;
              }
              
              // 获取坡向颜色
              vec3 aspectColor = getAspectColor(aspectDegrees, slope);
              
              // 添加地形光照效果增强立体感
              float lightIntensity = dot(normalEC, normalize(vec3(0.5, 0.5, 1.0)));
              lightIntensity = 0.7 + 0.3 * lightIntensity; // 减少阴影对颜色的影响
              
              material.diffuse = aspectColor * lightIntensity;
              
              // 添加高光效果
              float slopeDegree = degrees(slope);
              if (slopeDegree > 20.0) {
                float specular = pow(max(dot(normalize(vec3(0.5, 0.5, 1.0)), reflect(-normalize(vec3(0.5, 0.5, 1.0)), normalEC)), 0.0), 8.0);
                material.diffuse += vec3(specular * 0.2);
              }
            } else {
              // 几乎水平的表面使用灰色
              material.diffuse = vec3(0.8);
            }
            
            material.alpha = 1.0;
            return material;
          }
        `
      }
    });
    
    // 应用着色器到地球
    props.viewer.scene.globe.material = aspectRampMaterial;
    
    // 创建一个实体来表示这是坡向分析
    const entity = props.viewer.entities.add({
      name: '坡向分析',
      position: props.viewer.camera.position,
      properties: {
        terrainAnalysisType: 'aspect'
      }
    });
    
    // 添加图例
    createAspectLegend();
    
    // 检查材质是否成功应用
    if (!checkMaterialApplication('坡向分析')) {
      showNotification('坡向分析可能未成功应用，请尝试刷新页面或重新加载地形');
    } else {
      // 提示用户
      showNotification('坡向分析已添加，请观察地形起伏显著的区域');
    }
    
    // 添加坡向分析图层到图层管理器
    const timestamp = new Date().toLocaleTimeString();
    const aspectLayer = {
      name: `坡向分析 (${timestamp})`,
      show: true,
      _visible: true,
      sketch: {
        name: `坡向分析 (${timestamp})`,
        show: true
      },
      
      // 控制图层可见性
      setVisibility: function(visible) {
        this._visible = visible;
        this.show = visible;
        
        if (visible) {
          // 恢复坡向着色
          if (props.viewer._aspectMaterial) {
            props.viewer.scene.globe.material = props.viewer._aspectMaterial;
          }
        } else {
          // 保存当前材质并移除
          if (props.viewer.scene.globe.material) {
            props.viewer._aspectMaterial = props.viewer.scene.globe.material;
            props.viewer.scene.globe.material = undefined;
          }
        }
      },
      
      // 清理图层资源
      clear: function() {
        // 移除地球材质
        if (props.viewer && props.viewer.scene && props.viewer.scene.globe) {
          props.viewer.scene.globe.material = undefined;
          props.viewer._aspectMaterial = undefined;
        }
        
        // 移除图例
        removeLegend();
      }
    };
    
    // 触发事件，将图层添加到图层管理器
    emit('add-viewshed-layer', aspectLayer);
    
    // 添加图例
    addAspectLegend();
  } catch (error) {
    console.error('坡向分析失败:', error);
    showNotification('坡向分析失败: ' + error.message);
  }
}

// 添加坡向图例
function createAspectLegend() {
  // 移除已有图例
  removeLegend();
  
  // 创建图例容器
  const legend = document.createElement('div');
  legend.id = 'terrain-analysis-legend';
  legend.className = 'terrain-analysis-legend';
  
  // 计算左侧边栏宽度，判断是否折叠
  const leftSidebar = document.querySelector('.left-sidebar');
  const leftSidebarWidth = leftSidebar && !leftSidebar.classList.contains('collapsed') ? 220 : 30;
  
  legend.style.cssText = `
    position: absolute;
    bottom: 30px;
    left: ${leftSidebarWidth + 10}px;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    font-family: 'Arial', sans-serif;
    max-width: 240px;
    transition: left 0.3s ease;
  `;
  
  // 添加标题
  const title = document.createElement('div');
  title.textContent = '坡向分析图例';
  title.style.cssText = `
    font-weight: bold;
    margin-bottom: 12px;
    text-align: center;
    font-size: 16px;
    color: #333;
    border-bottom: 1px solid #ddd;
    padding-bottom: 8px;
  `;
  legend.appendChild(title);
  
  // 创建坡向玫瑰图
  const compassRose = document.createElement('div');
  compassRose.style.cssText = `
    width: 150px;
    height: 150px;
    margin: 0 auto 15px auto;
    position: relative;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(240,240,240,1) 70%, rgba(220,220,220,1) 100%);
    border: 1px solid #ddd;
  `;
  
  // 方向标识
  const directions = [
    { name: 'N', deg: 0, color: 'rgb(0, 0, 204)' },
    { name: 'NE', deg: 45, color: 'rgb(0, 128, 204)' },
    { name: 'E', deg: 90, color: 'rgb(0, 204, 51)' },
    { name: 'SE', deg: 135, color: 'rgb(153, 204, 0)' },
    { name: 'S', deg: 180, color: 'rgb(204, 204, 0)' },
    { name: 'SW', deg: 225, color: 'rgb(204, 102, 0)' },
    { name: 'W', deg: 270, color: 'rgb(204, 0, 0)' },
    { name: 'NW', deg: 315, color: 'rgb(153, 0, 204)' }
  ];
  
  // 添加扇形区域
  directions.forEach((dir, i) => {
    const next = directions[(i + 1) % directions.length];
    
    const wedge = document.createElement('div');
    wedge.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      clip-path: polygon(50% 50%, 
        ${50 + 45 * Math.cos((dir.deg - 22.5) * Math.PI / 180)}% ${50 - 45 * Math.sin((dir.deg - 22.5) * Math.PI / 180)}%, 
        ${50 + 45 * Math.cos((dir.deg + 22.5) * Math.PI / 180)}% ${50 - 45 * Math.sin((dir.deg + 22.5) * Math.PI / 180)}%);
      background-color: ${dir.color};
      opacity: 0.7;
      border-radius: 50%;
    `;
    compassRose.appendChild(wedge);
    
    // 添加方向标签
    const label = document.createElement('div');
    label.textContent = dir.name;
    label.style.cssText = `
      position: absolute;
      top: ${50 - 55 * Math.sin(dir.deg * Math.PI / 180)}%;
      left: ${50 + 55 * Math.cos(dir.deg * Math.PI / 180)}%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: bold;
      color: #333;
      text-shadow: 1px 1px 1px white;
    `;
    compassRose.appendChild(label);
  });
  
  // 添加中心点
  const center = document.createElement('div');
  center.style.cssText = `
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 10px; height: 10px;
    border-radius: 50%;
    background-color: #fff;
    border: 1px solid #333;
  `;
  compassRose.appendChild(center);
  
  legend.appendChild(compassRose);
  
  // 添加坡向说明
  const aspectCategories = [
    { name: '北向 (337.5°-22.5°)', color: 'rgb(0, 0, 204)' },
    { name: '东北向 (22.5°-67.5°)', color: 'rgb(0, 128, 204)' },
    { name: '东向 (67.5°-112.5°)', color: 'rgb(0, 204, 51)' },
    { name: '东南向 (112.5°-157.5°)', color: 'rgb(153, 204, 0)' },
    { name: '南向 (157.5°-202.5°)', color: 'rgb(204, 204, 0)' },
    { name: '西南向 (202.5°-247.5°)', color: 'rgb(204, 102, 0)' },
    { name: '西向 (247.5°-292.5°)', color: 'rgb(204, 0, 0)' },
    { name: '西北向 (292.5°-337.5°)', color: 'rgb(153, 0, 204)' }
  ];
  
  // 创建图例项
  const legendItems = document.createElement('div');
  legendItems.style.cssText = `
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 5px;
  `;
  
  aspectCategories.forEach(category => {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      font-size: 11px;
    `;
    
    const colorBox = document.createElement('div');
    colorBox.style.cssText = `
      width: 12px;
      height: 12px;
      background-color: ${category.color};
      margin-right: 5px;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-radius: 2px;
    `;
    
    const label = document.createElement('div');
    label.textContent = category.name;
    
    item.appendChild(colorBox);
    item.appendChild(label);
    legendItems.appendChild(item);
  });
  
  legend.appendChild(legendItems);
  
  // 添加说明
  const description = document.createElement('div');
  description.textContent = '坡向是指地形表面的朝向，通常表示为与正北方向的夹角，顺时针方向计算。平缓区域颜色较淡，陡峭区域颜色较深。';
  description.style.cssText = `
    font-size: 12px;
    margin-top: 15px;
    color: #555;
    line-height: 1.4;
    border-top: 1px solid #eee;
    padding-top: 8px;
  `;
  legend.appendChild(description);
  
  // 添加关闭按钮
  const closeButton = document.createElement('div');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    cursor: pointer;
    font-size: 18px;
    width: 20px;
    height: 20px;
    line-height: 18px;
    text-align: center;
    border-radius: 50%;
    color: #666;
    background: #f0f0f0;
  `;
  closeButton.onclick = removeLegend;
  legend.appendChild(closeButton);
  
  // 添加窗口大小改变时更新位置的监听
  window.addEventListener('resize', updateLegendPosition);
  
  // 添加左侧边栏变化监听
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        updateLegendPosition();
      }
    });
  });
  
  if (leftSidebar) {
    observer.observe(leftSidebar, { attributes: true });
  }
  
  function updateLegendPosition() {
    const leftSidebar = document.querySelector('.left-sidebar');
    const leftSidebarWidth = leftSidebar && !leftSidebar.classList.contains('collapsed') ? 220 : 30;
    const legendElement = document.getElementById('terrain-analysis-legend');
    if (legendElement) {
      legendElement.style.left = `${leftSidebarWidth + 10}px`;
    }
  }
  
  // 添加到页面
  document.body.appendChild(legend);
}

// 移除地形分析图例
function removeLegend() {
  const existingLegend = document.getElementById('terrain-analysis-legend');
  if (existingLegend) {
    existingLegend.remove();
  }
}

// 坡向分析
function analyzeAspectTerrain() {
  // 移除之前可能存在的地形分析图层
  removeTerrainAnalysisLayers();
  
  try {
    console.log('开始坡向分析...');
    
    // 检查WebGL支持
    if (!checkWebGLExtension('OES_standard_derivatives')) {
      console.warn('警告: OES_standard_derivatives扩展不可用，着色器可能无法正常工作');
      showNotification('WebGL扩展受限，分析效果可能不理想');
    }
    
    // 检查Viewer和Scene是否可用
    if (!props.viewer || !props.viewer.scene || !props.viewer.scene.globe) {
      throw new Error('Cesium Viewer或Scene不可用');
    }
    
    // 确保地形已加载
    if (props.viewer.terrainProvider.constructor.name === 'EllipsoidTerrainProvider') {
      // 如果当前是椭球地形，先加载全球地形
      showNotification('正在加载地形数据...');
      console.log('加载全球地形数据...');
      
      try {
        // 直接创建地形提供器（旧版Cesium中不返回Promise）
        const terrainProvider = Cesium.createWorldTerrain({
          requestVertexNormals: true
        });
        
        console.log('地形数据加载成功，设置到Viewer中');
        props.viewer.terrainProvider = terrainProvider;
        
        // 等待地形加载完成
        console.log('等待地形渲染...');
        setTimeout(() => {
          console.log('开始创建坡向着色器材质');
          createAspectRamp();
        }, 1500); // 增加延迟时间，确保地形加载完成
      } catch (error) {
        console.error('加载全球地形失败:', error);
        showNotification('加载全球地形失败: ' + error.message);
      }
    } else {
      console.log('使用现有地形数据进行坡向分析');
      // 检查是否有顶点法线
      const hasVertexNormals = props.viewer.terrainProvider.hasVertexNormals;
      console.log('地形是否有顶点法线:', hasVertexNormals);
      
      if (!hasVertexNormals) {
        console.warn('当前地形不包含顶点法线，可能影响分析效果');
        showNotification('当前地形不包含法线数据，分析效果可能不理想');
      }
      
      createAspectRamp();
    }
  } catch (error) {
    console.error('坡向分析失败:', error);
    showNotification('坡向分析失败: ' + error.message);
  }
}

// 移除地形分析图层
function removeTerrainAnalysisLayers() {
  try {
    console.log('正在移除地形分析图层...');
    
    // 首先移除图例
    removeLegend();
    
    // 移除地球材质
    if (props.viewer && props.viewer.scene && props.viewer.scene.globe) {
      // 保存临时材质变量以便后续需要恢复
      props.viewer._slopeMaterial = undefined;
      props.viewer._aspectMaterial = undefined;
      props.viewer._contourMaterial = undefined;
      
      props.viewer.scene.globe.material = undefined;
      
      // 重置地形夸张
      props.viewer.scene.globe.terrainExaggeration = 1.0;
      
      // 禁用地形照明
      props.viewer.scene.globe.enableLighting = false;
      
      // 禁用深度测试
      props.viewer.scene.globe.depthTestAgainstTerrain = false;
    }
    
    // 移除后处理阶段
    if (props.viewer && props.viewer.scene && props.viewer.scene.postProcessStages) {
      if (props.viewer._slopeStage) {
        props.viewer.scene.postProcessStages.remove(props.viewer._slopeStage);
        props.viewer._slopeStage = undefined;
      }
      
      if (props.viewer._aspectStage) {
        props.viewer.scene.postProcessStages.remove(props.viewer._aspectStage);
        props.viewer._aspectStage = undefined;
      }
    }
    
    // 移除与地形分析相关的实体
    if (props.viewer && props.viewer.entities) {
      const entitiesToRemove = [];
      props.viewer.entities.values.forEach(entity => {
        if (entity.properties && entity.properties.terrainAnalysisType) {
          entitiesToRemove.push(entity);
        }
      });
      
      entitiesToRemove.forEach(entity => {
        try {
          props.viewer.entities.remove(entity);
        } catch (e) {
          console.warn('移除实体失败:', e);
        }
      });
      
      console.log(`已移除 ${entitiesToRemove.length} 个地形分析相关实体`);
    }
    
    console.log('地形分析图层移除完成');
  } catch (error) {
    console.error('移除地形分析图层失败:', error);
    // 尝试使用更直接的方式重置
    try {
      if (props.viewer && props.viewer.scene && props.viewer.scene.globe) {
        props.viewer.scene.globe.material = undefined;
      }
    } catch (e) {
      console.error('重置材质失败:', e);
    }
  }
}

// 生成等高线
function generateContourLines() {
  // 移除之前可能存在的地形分析图层
  removeTerrainAnalysisLayers();
  
  try {
    // 创建自定义着色器材质
    const contourColor = Cesium.Color.fromCssColorString(terrainAnalysisParams.contourColor);
    const contourSpacing = terrainAnalysisParams.contourSpacing;
    const contourWidth = terrainAnalysisParams.contourWidth;
    
    const contourMaterial = new Cesium.Material({
      fabric: {
        type: 'ContourMap',
        uniforms: {
          contourColor: contourColor,
          spacing: contourSpacing,
          width: contourWidth
        },
        source: `
          uniform vec4 contourColor;
          uniform float spacing;
          uniform float width;
          
          czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            
            float height = materialInput.height;
            float contour = mod(height, spacing);
            float lineWidth = width;
            
            if (contour < lineWidth || contour > spacing - lineWidth) {
              material.diffuse = contourColor.rgb;
              material.alpha = contourColor.a;
            } else {
              material.alpha = 0.0;
            }
            
            return material;
          }
        `
      }
    });
    
    // 应用着色器到地球
    props.viewer.scene.globe.material = contourMaterial;
    
    // 创建一个实体来表示这是等高线分析
    const entity = props.viewer.entities.add({
      name: `等高线 (${contourSpacing}m)`,
      position: props.viewer.camera.position,
      properties: {
        terrainAnalysisType: 'contour'
      }
    });
    
    // 添加等高线图层到图层管理器
    const timestamp = new Date().toLocaleTimeString();
    const contourLayer = {
      name: `等高线 ${contourSpacing}m (${timestamp})`,
      show: true,
      _visible: true,
      sketch: {
        name: `等高线 ${contourSpacing}m (${timestamp})`,
        show: true
      },
      
      // 控制图层可见性
      setVisibility: function(visible) {
        this._visible = visible;
        this.show = visible;
        
        if (visible) {
          // 恢复等高线着色
          if (props.viewer._contourMaterial) {
            props.viewer.scene.globe.material = props.viewer._contourMaterial;
          }
        } else {
          // 保存当前材质并移除
          if (props.viewer.scene.globe.material) {
            props.viewer._contourMaterial = props.viewer.scene.globe.material;
            props.viewer.scene.globe.material = undefined;
          }
        }
      },
      
      // 清理图层资源
      clear: function() {
        // 移除地球材质
        if (props.viewer && props.viewer.scene && props.viewer.scene.globe) {
          props.viewer.scene.globe.material = undefined;
          props.viewer._contourMaterial = undefined;
        }
        
        // 移除实体
        if (entity) {
          props.viewer.entities.remove(entity);
        }
      }
    };
    
    // 触发事件，将图层添加到图层管理器
    emit('add-viewshed-layer', contourLayer);
    
    // 提示用户
    showNotification(`等高线已添加 (等高距: ${contourSpacing}m)`);
  } catch (error) {
    console.error('生成等高线失败:', error);
    showNotification('生成等高线失败，请检查Cesium版本');
  }
}

// 显示通知
function showNotification(message) {
  const notification = props.viewer.entities.add({
    position: props.viewer.camera.position,
    label: {
      text: message,
      font: '16px sans-serif',
      fillColor: Cesium.Color.WHITE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      outlineColor: Cesium.Color.BLACK,
      backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
      showBackground: true,
      backgroundPadding: new Cesium.Cartesian2(7, 5),
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER
    }
  });
  
  // 3秒后自动移除通知
  setTimeout(() => {
    props.viewer.entities.remove(notification);
  }, 3000);
}

// 暴露方法给父组件
defineExpose({
  handleAnalysis,
  showRoutePlanning,
  setRouteAndSearch
});

// 添加设置路线并搜索的方法
async function setRouteAndSearch(start, end) {
  // 确保路径规划面板已打开
  showRoutePlanning.value = true;
  
  console.log(`开始设置路线: 从 ${start} 到 ${end}`);
  
  // 清空之前的搜索结果
  startSearchResults.value = [];
  endSearchResults.value = [];
  showStartResults.value = false;
  showEndResults.value = false;
  
  // 设置起点和终点输入框的值
  inputStart.value = start;
  inputEnd.value = end;
  
  // 搜索起点
  isStartSearching.value = true;
  try {
    const startResponse = await axios.get(`https://restapi.amap.com/v3/place/text`, {
      params: {
        keywords: start,
        key: aMapKey,
        extensions: 'base',
        output: 'json'
      }
    });
    
    if (startResponse.data.status === '1' && startResponse.data.pois && startResponse.data.pois.length > 0) {
      // 获取第一个搜索结果
      const firstResult = startResponse.data.pois[0];
      console.log('起点搜索结果:', firstResult);
      
      startLocationData.value = {
        id: firstResult.id,
        name: firstResult.name,
        address: firstResult.address || firstResult.pname + firstResult.cityname + firstResult.adname,
        location: firstResult.location,
        province: firstResult.pname,
        city: firstResult.cityname,
        district: firstResult.adname
      };
      
      // 更新输入框显示搜索到的名称
      inputStart.value = firstResult.name;
    } else {
      console.warn('未找到起点位置:', start);
    }
  } catch (error) {
    console.error('搜索起点位置失败:', error);
  } finally {
    isStartSearching.value = false;
  }
  
  // 搜索终点
  isEndSearching.value = true;
  try {
    const endResponse = await axios.get(`https://restapi.amap.com/v3/place/text`, {
      params: {
        keywords: end,
        key: aMapKey,
        extensions: 'base',
        output: 'json'
      }
    });
    
    if (endResponse.data.status === '1' && endResponse.data.pois && endResponse.data.pois.length > 0) {
      // 获取第一个搜索结果
      const firstResult = endResponse.data.pois[0];
      console.log('终点搜索结果:', firstResult);
      
      endLocationData.value = {
        id: firstResult.id,
        name: firstResult.name,
        address: firstResult.address || firstResult.pname + firstResult.cityname + firstResult.adname,
        location: firstResult.location,
        province: firstResult.pname,
        city: firstResult.cityname,
        district: firstResult.adname
      };
      
      // 更新输入框显示搜索到的名称
      inputEnd.value = firstResult.name;
    } else {
      console.warn('未找到终点位置:', end);
    }
  } catch (error) {
    console.error('搜索终点位置失败:', error);
  } finally {
    isEndSearching.value = false;
  }
  
  // 等待一小段时间确保两个位置都已搜索完成
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 如果两个位置都找到了，自动搜索路线
  if (startLocationData.value && endLocationData.value) {
    console.log('开始搜索路线');
    searchRoute();
  } else {
    console.error('无法找到起点或终点位置');
  }
}

// 预览等高线
function previewContourLines() {
  // 移除之前可能存在的地形分析图层
  removeTerrainAnalysisLayers();
  
  try {
    // 确保地形已加载
    if (props.viewer.terrainProvider.constructor.name === 'EllipsoidTerrainProvider') {
      // 如果当前是椭球地形，先加载全球地形
      showNotification('正在加载地形数据...');
      try {
        // 直接创建地形提供器（旧版Cesium中不返回Promise）
        const terrainProvider = Cesium.createWorldTerrain({
          requestVertexNormals: true
        });
        props.viewer.terrainProvider = terrainProvider;
        setTimeout(() => applyContourPreview(), 1000); // 等待地形加载
      } catch (error) {
        console.error('加载地形数据失败:', error);
        showNotification('加载地形数据失败: ' + error.message);
      }
    } else {
      applyContourPreview();
    }
  } catch (error) {
    console.error('预览等高线失败:', error);
    showNotification('预览等高线失败，请检查Cesium版本');
  }
}

// 应用等高线预览
function applyContourPreview() {
  try {
    // 创建自定义着色器材质
    const contourColor = Cesium.Color.fromCssColorString(terrainAnalysisParams.contourColor);
    const contourSpacing = terrainAnalysisParams.contourSpacing;
    const contourWidth = terrainAnalysisParams.contourWidth;
    
    const contourMaterial = new Cesium.Material({
      fabric: {
        type: 'ContourMap',
        uniforms: {
          contourColor: contourColor,
          spacing: contourSpacing,
          width: contourWidth
        },
        source: `
          uniform vec4 contourColor;
          uniform float spacing;
          uniform float width;
          
          czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            
            float height = materialInput.height;
            float contour = mod(height, spacing);
            float lineWidth = width;
            
            if (contour < lineWidth || contour > spacing - lineWidth) {
              material.diffuse = contourColor.rgb;
              material.alpha = contourColor.a;
            } else {
              material.alpha = 0.0;
            }
            
            return material;
          }
        `
      }
    });
    
    // 应用着色器到地球
    props.viewer.scene.globe.material = contourMaterial;
    
    // 创建一个实体来表示这是等高线分析
    const entity = props.viewer.entities.add({
      name: `等高线 (${contourSpacing}m)`,
      position: props.viewer.camera.position,
      properties: {
        terrainAnalysisType: 'contour'
      }
    });
    
    // 不显示通知，避免频繁打扰用户
  } catch (error) {
    console.error('应用等高线预览失败:', error);
  }
}

// 检查材质是否成功应用
function checkMaterialApplication(materialType) {
  try {
    // 检查globe材质是否存在
    if (!props.viewer || !props.viewer.scene || !props.viewer.scene.globe) {
      console.error('无法检查材质: 视图不可用');
      return false;
    }
    
    const material = props.viewer.scene.globe.material;
    if (!material) {
      console.error(`材质检查失败: ${materialType}材质未应用`);
      return false;
    }
    
    console.log(`${materialType}材质已成功应用:`, material);
    
    // 尝试强制重新渲染一次
    try {
      props.viewer.scene.requestRender();
    } catch (e) {
      console.warn('请求重新渲染失败:', e);
    }
    
    return true;
  } catch (error) {
    console.error(`检查${materialType}材质失败:`, error);
    return false;
  }
}
</script>

<style scoped>
.route-planning {
  position: absolute;
  top: 55px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--bg-primary);
  padding: var(--space-3);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-fixed);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: auto;
  max-width: 90%;
  border: 1px solid var(--border-color);
  transition: background-color var(--transition-normal), border-color var(--transition-normal);
}

.route-planning-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.route-planning-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.route-planning input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  width: 100%;
  transition: border-color var(--transition-fast);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.route-planning input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.route-planning button {
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

.route-planning button:hover {
  background-color: var(--primary-dark);
}

.cancel-btn {
  background-color: var(--neutral-400) !important;
}

.cancel-btn:hover {
  background-color: var(--neutral-600) !important;
}

.primary-btn {
  background-color: var(--primary-color);
}

/* 可视域分析参数设置悬浮框样式 */
.viewshed-panel {
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

.viewshed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 8px 8px 0 0;
}

.viewshed-header h3 {
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

.viewshed-content {
  padding: 16px;
}

.viewshed-content .form-group {
  margin-bottom: 12px;
}

.viewshed-content label {
  display: block;
  margin-bottom: 4px;
  color: var(--text-secondary);
  font-size: 14px;
}

.viewshed-content input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.viewshed-content input[type="color"] {
  height: 36px;
  padding: 2px;
}

.viewshed-content input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-light);
}

.viewshed-buttons {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.viewshed-buttons .primary-btn {
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

.viewshed-buttons .primary-btn:hover {
  background-color: var(--primary-dark);
}

.location-search {
  position: relative;
  width: 100%;
}

.location-search input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.search-result-item {
  display: flex;
  padding: 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-icon {
  margin-right: 10px;
  color: #3B82F6;
}

.result-content {
  flex: 1;
  overflow: hidden;
}

.result-name {
  font-weight: 500;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-address {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-loading {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  padding: 10px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  border-top-color: #3B82F6;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #666;
}

/* 添加地形分析相关样式 */
.terrain-analysis-panel {
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

.analysis-type-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.analysis-type-btn {
  padding: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.analysis-type-btn:hover {
  background: var(--bg-hover);
}

.analysis-type-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.contour-params {
  border-top: 1px solid var(--border-color);
  margin-top: 12px;
  padding-top: 12px;
}

input[type="range"] {
  width: 100%;
  margin: 8px 0;
}
</style> 