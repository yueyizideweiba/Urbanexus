<template>
  <!-- 隐藏的文件选择输入框 -->
  <div>
    <input type="file" ref="gltfInput" style="display: none" @change="handleGLTFFile" accept=".gltf,.glb" />
    <input type="file" ref="tilesInput" style="display: none" @change="handleTilesFile" accept=".json,.3dtiles" />
    <input type="file" ref="geojsonInput" style="display: none" @change="handleGeojsonFile" accept=".geojson,.json" />
    <input type="file" ref="shpInput" style="display: none" @change="handleSHPFile" accept=".zip" />

    <!-- HTTP Tiles加载悬浮窗 -->
    <div v-if="httpTiles.showModal" class="floating-panel">
      <div class="panel-header">
        <h3>HTTP Tiles加载设置</h3>
        <button @click="httpTiles.closeModal" class="close-btn">&times;</button>
      </div>
      <div class="panel-content">
        <div class="form-group">
          <label>服务器端口:</label>
          <input type="number" v-model.number="httpTiles.port" placeholder="请输入http-server端口号" />
          <div class="help-text">在资源文件夹中使用http-server --cors命令行得到的端口号，默认为8080</div>
        </div>
        <div class="form-group">
          <label>tileset文件名:</label>
          <input type="text" v-model="httpTiles.tilesetName" placeholder="默认为tileset.json" />
          <div class="help-text">3D Tiles数据中的tileset文件名，可能不是默认的tileset.json</div>
        </div>
        <div class="panel-buttons">
          <button @click="httpTiles.loadTiles" class="primary-btn">加载</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as Cesium from 'cesium';
import shp from 'shpjs';
import { reactive, ref } from 'vue';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  }
});

const emit = defineEmits([
  'add-geojson-datasource', 
  'add-model-entity',
  'add-tileset-layer'
]);

// 文件输入引用
const gltfInput = ref(null);
const tilesInput = ref(null);
const geojsonInput = ref(null);
const shpInput = ref(null);

// HTTP Tiles加载模块
const httpTiles = reactive({
  showModal: false,
  port: 8080,
  tilesetName: 'tileset.json',
  
  openModal() {
    this.showModal = true;
  },
  
  closeModal() {
    this.showModal = false;
    this.port = 8080;
    this.tilesetName = 'tileset.json';
  },
  
  async loadTiles() {
    if (!this.port) {
      alert('请输入端口号');
      return;
    }
    
    if (!this.tilesetName) {
      alert('请输入tileset文件名');
      return;
    }
    
    const url = `http://localhost:${this.port}/${this.tilesetName}`;
    const tilesetOption = {
      skipLevelOfDetail: true,
      baseScreenSpaceError: 1024,
      skipScreenSpaceErrorFactor: 16,
      skipLevels: 1,
      immediatelyLoadDesiredLevelOfDetail: false,
      loadSiblings: false,
      cullWithChildrenBounds: true
    };
    
    try {
      console.log(`尝试加载 3D Tiles: ${url}`);
      const tileset = new Cesium.Cesium3DTileset({
        url: url,
        ...tilesetOption
      });
      
      await tileset.readyPromise;
      props.viewer.scene.primitives.add(tileset);
      tileset.name = 'HTTP 3D Tiles';
      emit('add-tileset-layer', tileset);
      props.viewer.zoomTo(tileset);
      console.log('HTTP 3D Tiles 数据加载完成', tileset);
      this.closeModal();
    } catch (error) {
      console.error('加载 HTTP 3D Tiles 数据失败:', error);
      alert(`加载 3D Tiles 失败: ${error.message}\n请确保:\n1. http-server 已启动\n2. 端口号正确\n3. tileset文件存在于指定路径`);
    }
  }
});

// 触发文件选择
function triggerFileInput(type) {
  if (type === 'gltf') {
    gltfInput.value && gltfInput.value.click();
  } else if (type === '3dtiles') {
    tilesInput.value && tilesInput.value.click();
  } else if (type === 'geojson') {
    geojsonInput.value && geojsonInput.value.click();
  } else if (type === 'shp') {
    shpInput.value && shpInput.value.click();
  }
}

// 处理GLTF文件
async function handleGLTFFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const url = URL.createObjectURL(file);
  const position = Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 0);
  const heading = Cesium.Math.toRadians(135);
  const pitch = Cesium.Math.toRadians(0);
  const roll = 0;
  const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  
  try {
    const entity = props.viewer.entities.add({
      name: file.name || 'glTF模型',
      position,
      orientation,
      model: { 
        uri: url,
        scale: 1.0,
        minimumPixelSize: 128,
        maximumScale: 20000,
        incrementallyLoadTextures: true,
        runAnimations: true,
        clampAnimations: true,
        shadows: Cesium.ShadowMode.ENABLED,
        heightReference: Cesium.HeightReference.NONE
      },
      show: true
    });
    
    emit('add-model-entity', entity);
    props.viewer.trackedEntity = entity;
    props.viewer.zoomTo(entity);
    console.log('本地 glTF 模型加载完成');
  } catch (error) {
    console.error('加载 glTF 模型失败：', error);
  }
  
  event.target.value = '';
}

// 处理3D Tiles文件
async function handleTilesFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const url = URL.createObjectURL(file);
  const tilesetOption = {
    skipLevelOfDetail: true,
    baseScreenSpaceError: 1024,
    skipScreenSpaceErrorFactor: 16,
    skipLevels: 1,
    immediatelyLoadDesiredLevelOfDetail: false,
    loadSiblings: false,
    cullWithChildrenBounds: true
  };
  
  try {
    const tileset = await Cesium.Cesium3DTileset.fromUrl(url, tilesetOption);
    props.viewer.scene.primitives.add(tileset);
    tileset.name = file.name || '3D Tiles';
    emit('add-tileset-layer', tileset);
    props.viewer.zoomTo(tileset);
    console.log('本地 3D Tiles 数据加载完成', tileset);
  } catch (error) {
    console.error('加载本地 3D Tiles 数据失败:', error);
  }
  
  event.target.value = '';
}

// 处理GeoJSON文件
function handleGeojsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const url = URL.createObjectURL(file);
  Cesium.GeoJsonDataSource.load(url).then((datasource) => {
    datasource.name = file.name;
    props.viewer.dataSources.add(datasource);
    props.viewer.zoomTo(datasource);
    console.log('本地 Geojson 数据加载完成');
    
    // 生成统一颜色
    const uniformColor = Cesium.Color.fromRandom({ 
      maximumRed: 0.8,
      maximumBlue: 0.8,
      maximumGreen: 0.7,
      alpha: 0.5 
    });
    
    datasource.entities.values.forEach(entity => {
      if (Cesium.defined(entity.polygon)) {
        // 使用统一颜色
        entity.polygon.material = uniformColor;
        entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
        // 设置 entity 名称（例如用属性 XZQMC）
        entity.name = entity.properties && entity.properties.XZQMC ? entity.properties.XZQMC.getValue() : undefined;
        // 调整位置（计算中心点）
        const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now());
        if (hierarchy && hierarchy.positions && hierarchy.positions.length > 0) {
          const centerpoint = Cesium.BoundingSphere.fromPoints(hierarchy.positions).center;
          entity.position = centerpoint;
        }
        // 可选：设置标签
        entity.label = {
          text: entity.name || '',
          scale: 1,
          showBackground: true,
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000),
          scaleByDistance: new Cesium.NearFarScalar(0.5, 0.5, 3, 0.5)
        };
      }
    });
    
    emit('add-geojson-datasource', datasource);
  }).catch((error) => {
    console.error('加载本地 Geojson 数据失败:', error);
  });
  
  event.target.value = '';
}

// 处理SHP文件
async function handleSHPFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const geojson = await shp(arrayBuffer);
    
    Cesium.GeoJsonDataSource.load(geojson)
      .then((datasource) => {
        datasource.name = file.name;
        props.viewer.dataSources.add(datasource);
        props.viewer.zoomTo(datasource);
        console.log('本地 shp 数据加载完成');
        
        // 生成统一颜色
        const uniformColor = Cesium.Color.fromRandom({ 
          maximumRed: 0.8,
          maximumBlue: 0.8,
          maximumGreen: 0.7,
          alpha: 0.5 
        });
        
        datasource.entities.values.forEach(entity => {
          if (Cesium.defined(entity.polygon)) {
            entity.polygon.material = uniformColor;
            entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
            entity.name = entity.properties && entity.properties.XZQMC ? entity.properties.XZQMC.getValue() : undefined;
            const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now());
            if (hierarchy && hierarchy.positions && hierarchy.positions.length > 0) {
              const centerpoint = Cesium.BoundingSphere.fromPoints(hierarchy.positions).center;
              entity.position = centerpoint;
            }
            entity.label = {
              text: entity.name || '',
              scale: 1,
              showBackground: true,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000),
              scaleByDistance: new Cesium.NearFarScalar(0.5, 0.5, 3, 0.5)
            };
          }
        });
        
        emit('add-geojson-datasource', datasource);
      })
      .catch((error) => {
        console.error('加载 shp 转换后的 GeoJSON 数据失败:', error);
      });
  } catch (error) {
    console.error('加载本地 shp 数据失败:', error);
  }
  
  event.target.value = '';
}

// 修改loadHttpTiles函数
async function loadHttpTiles() {
  httpTiles.openModal();
}

// 修改 load3DTiles 方法
async function load3DTiles(url, name) {
  if (!url) {
    console.error('URL 不能为空');
    throw new Error('URL 不能为空');
  }

  if (!props.viewer) {
    console.error('Viewer 未初始化');
    throw new Error('Viewer 未初始化');
  }

  try {
    const tilesetOption = {
      skipLevelOfDetail: true,
      baseScreenSpaceError: 1024,
      skipScreenSpaceErrorFactor: 16,
      skipLevels: 1,
      immediatelyLoadDesiredLevelOfDetail: false,
      loadSiblings: false,
      cullWithChildrenBounds: true
    };
    
    console.log(`开始加载 3D Tiles: ${url}`);
    console.log('加载选项:', tilesetOption);
    
    // 检查URL是否为服务器上的3DTiles路径
    let tilesetUrl = url;
    let fileData = null;
    
    if (url.startsWith('/uploads/')) {
      // 这是从我们的服务器加载的文件
      // 转换为绝对URL，注意使用后端端口(3000)而不是前端端口(5173)
      const backendUrl = 'http://localhost:3000'; // 使用后端的URL
      tilesetUrl = `${backendUrl}${url}`;
      console.log(`转换为后端URL: ${tilesetUrl}`);
      
      // 检查文件是否存在且可以访问
      try {
        const response = await fetch(tilesetUrl);
        if (!response.ok) {
          throw new Error(`服务器返回错误状态码: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`服务器返回了HTML页面而不是JSON文件，可能是404或权限问题`);
        }
        
        // 尝试解析为JSON以验证格式
        try {
          fileData = await response.clone().json();
          if (!fileData.asset || !fileData.geometricError) {
            console.warn('注意: 文件似乎不是有效的3DTiles格式，但将继续尝试加载');
          }
        } catch (jsonError) {
          const text = await response.text();
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            throw new Error(`服务器返回了HTML页面而不是JSON文件，服务器响应的内容: ${text.substring(0, 100)}...`);
          }
          throw new Error(`文件不是有效的JSON格式: ${jsonError.message}，服务器响应的内容: ${text.substring(0, 100)}...`);
        }
      } catch (fetchError) {
        // 特殊情况：可能是Cesium原生支持的tileset目录结构，尝试不做预检直接加载
        console.warn(`预检tileset.json失败: ${fetchError.message}，尝试直接加载...`);
      }
    }
    
    console.log('Tileset 准备加载，URL:', tilesetUrl);
    
    // 正式加载
    let tileset;
    try {
      tileset = new Cesium.Cesium3DTileset({
        url: tilesetUrl,
        ...tilesetOption
      });
      
      console.log('Tileset 创建成功，等待加载完成...');
      await tileset.readyPromise;
    } catch (cesiumError) {
      console.error('直接加载失败:', cesiumError);
      
      // 如果直接加载失败，尝试其他策略
      if (url.startsWith('/uploads/tileset_')) {
        try {
          // 尝试另一种方式 - 使用完整的目录路径而不是tileset.json文件
          const backendUrl = 'http://localhost:3000'; // 使用后端的URL
          const dirUrl = `${backendUrl}${url.substring(0, url.lastIndexOf('/'))}`;
          console.log(`直接加载失败，尝试加载目录: ${dirUrl}`);
          
          // 明确指定tileset.json路径
          tileset = new Cesium.Cesium3DTileset({
            url: `${dirUrl}/tileset.json`,
            ...tilesetOption
          });
          
          console.log('使用目录URL创建Tileset，等待加载完成...');
          await tileset.readyPromise;
        } catch (dirError) {
          console.error('加载目录失败:', dirError);
          
          // 尝试第三种方式 - 为文件路径添加静态后缀
          const backendUrl = 'http://localhost:3000'; // 使用后端的URL
          const staticUrl = `${backendUrl}${url}?static=true`;
          console.log(`尝试加载带静态参数的URL: ${staticUrl}`);
          
          tileset = new Cesium.Cesium3DTileset({
            url: staticUrl,
            ...tilesetOption
          });
          
          console.log('使用静态参数URL创建Tileset，等待加载完成...');
          await tileset.readyPromise;
        }
      } else {
        throw cesiumError;
      }
    }
    
    console.log('Tileset 加载完成，准备添加到场景...');
    
    props.viewer.scene.primitives.add(tileset);
    tileset.name = name || '3D Tiles';
    emit('add-tileset-layer', tileset);
    
    console.log('Tileset 已添加到场景，准备缩放...');
    await props.viewer.zoomTo(tileset);
    console.log('3D Tiles 数据加载完成', tileset);
    
    return tileset;
  } catch (error) {
    console.error('加载 3D Tiles 数据失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      url: url,
      name: name
    });
    throw new Error(`加载 3D Tiles 失败: ${error.message}`);
  }
}

// 暴露方法给父组件
defineExpose({
  triggerFileInput,
  handleGLTFFile,
  handleTilesFile,
  handleGeojsonFile,
  handleSHPFile,
  loadHttpTiles,
  load3DTiles,
  // 关闭模态框
  closeModal: () => {
    httpTiles.showModal = false;
  },
  // 加载GeoJSON数据
  async loadGeoJSON(url, name) {
    try {
      console.log(`加载GeoJSON数据: ${name} (${url})`);
      
      // 获取文件内容进行检查
      const response = await fetch(url);
      let geojsonData;
      
      try {
        geojsonData = await response.json();
      } catch (error) {
        console.error('解析JSON失败:', error);
        throw new Error('无法解析GeoJSON文件，可能不是有效的JSON格式');
      }
      
      // 检查是否是有效的GeoJSON
      if (!geojsonData || !geojsonData.type) {
        // 尝试检查文件内容以查找可能的GeoJSON结构
        if (geojsonData && (geojsonData.features || geojsonData.geometry || geojsonData.coordinates)) {
          console.warn('GeoJSON格式不标准，尝试修复...');
          // 尝试构造一个有效的GeoJSON对象
          if (!geojsonData.type) {
            if (geojsonData.features) {
              geojsonData.type = 'FeatureCollection';
            } else if (geojsonData.geometry) {
              geojsonData.type = 'Feature';
            } else if (geojsonData.coordinates) {
              // 根据坐标数组的维度判断几何类型
              const coords = geojsonData.coordinates;
              if (Array.isArray(coords[0]) && !Array.isArray(coords[0][0])) {
                geojsonData.type = 'LineString';
              } else if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                geojsonData.type = 'Polygon';
              } else {
                geojsonData.type = 'Point';
              }
            }
          }
        } else {
          throw new Error('无效的GeoJSON格式：缺少必要的type字段');
        }
      }
      
      // 使用修复后的GeoJSON数据
      const datasource = await Cesium.GeoJsonDataSource.load(geojsonData);
      datasource.name = name || 'GeoJSON图层';
      await props.viewer.dataSources.add(datasource);
      props.viewer.zoomTo(datasource);
      
      // 生成统一颜色
      const uniformColor = Cesium.Color.fromRandom({ 
        maximumRed: 0.8,
        maximumBlue: 0.8,
        maximumGreen: 0.7,
        alpha: 0.5 
      });
      
      datasource.entities.values.forEach(entity => {
        if (Cesium.defined(entity.polygon)) {
          entity.polygon.material = uniformColor;
          entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
        }
      });
      
      // 通知父组件
      emit('add-geojson-datasource', datasource);
      console.log(`GeoJSON数据 "${name}" 加载完成`);
      return datasource;
    } catch (error) {
      console.error('加载GeoJSON数据失败:', error);
      throw error;
    }
  },
  
  // 加载GLTF模型
  async loadGLTF(url, name) {
    try {
      console.log(`加载GLTF模型: ${name} (${url})`);
      
      const position = Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 0);
      const heading = Cesium.Math.toRadians(135);
      const pitch = 0;
      const roll = 0;
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
      
      const entity = props.viewer.entities.add({
        name: name || 'GLTF模型',
        position,
        orientation,
        model: { 
          uri: url,
          scale: 1.0,
          minimumPixelSize: 128,
          maximumScale: 20000,
          incrementallyLoadTextures: true,
          runAnimations: true,
          clampAnimations: true,
          shadows: Cesium.ShadowMode.ENABLED,
          heightReference: Cesium.HeightReference.NONE
        }
      });
      
      // 设置相机位置并跟踪实体
      props.viewer.trackedEntity = entity;
      props.viewer.zoomTo(entity);
      
      // 通知父组件
      emit('add-model-entity', entity);
      console.log(`GLTF模型 "${name}" 加载完成`);
      return entity;
    } catch (error) {
      console.error('加载GLTF模型失败:', error);
      throw error;
    }
  },
  
  // 加载Shapefile
  async loadShapefile(url, name) {
    try {
      console.log(`加载Shapefile: ${name} (${url})`);
      
      // 检查URL是否是ZIP文件
      if (!url.toLowerCase().endsWith('.zip')) {
        throw new Error('Shapefile加载只支持ZIP文件格式。请将完整的Shapefile文件集(.shp, .dbf, .shx等)打包为ZIP格式后上传。');
      }
      
      // 获取文件
      const response = await fetch(url);
      
      // 获取并检查内容类型
      const contentType = response.headers.get('content-type');
      const isZip = contentType && (contentType.includes('application/zip') || 
                                   contentType.includes('application/x-zip-compressed') ||
                                   contentType.includes('application/octet-stream'));
      
      if (!isZip) {
        console.warn('文件内容类型不是ZIP格式，但我们将继续尝试解析。');
      }
      
      // 获取ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      
      // 使用shpjs解析为GeoJSON
      let geojson;
      
      try {
        geojson = await shp(arrayBuffer);
        
        // 检查返回结果
        if (!geojson) {
          throw new Error('无法从ZIP文件中提取Shapefile数据');
        }
      } catch (shpError) {
        console.error('Shapefile解析错误:', shpError);
        
        // 提供更友好的错误消息
        if (shpError.message && shpError.message.includes('but-unzip')) {
          throw new Error('Shapefile解析失败：ZIP文件格式不正确或损坏。请确保ZIP包中包含完整的Shapefile文件集(.shp, .dbf, .shx等)。');
        } else if (shpError.message && shpError.message.includes('dbf')) {
          throw new Error('Shapefile解析失败：缺少DBF文件。完整的Shapefile需要包含.shp、.dbf和.shx文件。');
        } else if (shpError.message && shpError.message.includes('shx')) {
          throw new Error('Shapefile解析失败：缺少SHX文件。完整的Shapefile需要包含.shp、.dbf和.shx文件。');
        }
        
        throw new Error(`Shapefile解析失败：${shpError.message || '未知错误'}`);
      }
      
      // 检查geojson格式
      let processedGeojson = geojson;
      
      // 处理多个图层的情况
      if (Array.isArray(geojson)) {
        console.log('检测到多个Shapefile图层，将合并为一个数据源');
        
        // 创建一个FeatureCollection来合并所有图层
        processedGeojson = {
          type: 'FeatureCollection',
          features: []
        };
        
        // 合并所有图层的特征
        geojson.forEach(layer => {
          if (layer && layer.features) {
            processedGeojson.features = processedGeojson.features.concat(layer.features);
          }
        });
      }
      
      // 加载GeoJSON数据
      const datasource = await Cesium.GeoJsonDataSource.load(processedGeojson);
      datasource.name = name || 'Shapefile图层';
      props.viewer.dataSources.add(datasource);
      props.viewer.zoomTo(datasource);
      
      // 生成统一颜色
      const uniformColor = Cesium.Color.fromRandom({ 
        maximumRed: 0.8,
        maximumBlue: 0.8,
        maximumGreen: 0.7,
        alpha: 0.5 
      });
      
      datasource.entities.values.forEach(entity => {
        if (Cesium.defined(entity.polygon)) {
          entity.polygon.material = uniformColor;
          entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
        }
      });
      
      // 通知父组件
      emit('add-geojson-datasource', datasource);
      console.log(`Shapefile "${name}" 加载完成`);
      return datasource;
    } catch (error) {
      console.error('加载Shapefile失败:', error);
      throw error;
    }
  }
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

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-light);
}

.help-text {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.4;
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