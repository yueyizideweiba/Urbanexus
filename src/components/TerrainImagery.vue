<template>
  <div style="display: none;"></div>
</template>

<script setup>
import * as Cesium from 'cesium';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['imagery-layers-updated']);

// 影像数据切换
function switchImagery(type, customUrl) {
  try {
    const layers = props.viewer.imageryLayers;
    
    // 清除现有图层
    while (layers.length > 0) {
      layers.remove(layers.get(0));
    }
    
    let provider;
    
    if (type === 'customUrl' && customUrl) {
      // 使用自定义URL加载影像
      return loadCustomImagery(customUrl);
    } else if (type === 'cesiumDefault') {
      provider = new Cesium.IonImageryProvider({ assetId: 2 });
    } else if (type === 'openStreetMap') {
      provider = new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      });
    } else if (type === 'arcgis') {
      provider = new Cesium.ArcGisMapServerImageryProvider({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
      });
    }
    
    if (provider) {
      const layer = layers.addImageryProvider(provider);
      layer.name = type; // 添加名称便于识别
      
      // 通知影像图层更新
      emit('imagery-layers-updated');
      console.log(`成功切换到${type}影像图层`);
    }
  } catch (error) {
    console.error('切换影像图层失败:', error);
  }
}

// 添加自定义URL影像图层
function loadCustomImagery(url) {
  try {
    if (!url) {
      throw new Error('URL不能为空');
    }
    
    // 使用addImageryLayer方法加载自定义URL
    const layer = addImageryLayer(url, '自定义影像');
    
    // 通知影像图层更新
    emit('imagery-layers-updated');
    console.log(`成功加载自定义影像图层: ${url}`);
    
    return layer;
  } catch (error) {
    console.error('加载自定义影像图层失败:', error);
    throw error;
  }
}

// 添加影像图层
async function addImageryLayer(url, name, options = {}) {
  try {
    let provider;
    
    // 从选项中获取矩形边界（如果有）
    const rectangle = options.rectangle || (options.properties && options.properties.rectangle);
    const useCustomBounds = options.useCustomBounds || (options.properties && options.properties.useCustomBounds);
    
    // 检测是否是本地图片路径（判断是否是栅格数据）
    const isLocalImage = url.includes('/uploads/') && 
      (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || 
       url.endsWith('.gif') || url.endsWith('.bmp') || url.endsWith('.tif') || 
       url.endsWith('.tiff'));
    
    // 根据URL类型创建不同的影像提供者
    if (url.includes('wms')) {
      provider = new Cesium.WebMapServiceImageryProvider({
        url: url,
        layers: '0',
        parameters: {
          format: 'image/png',
          transparent: true
        }
      });
    } else if (url.includes('wmts')) {
      provider = new Cesium.WebMapTileServiceImageryProvider({
        url: url,
        layer: '0',
        style: 'default',
        format: 'image/png',
        tileMatrixSetID: 'GoogleMapsCompatible'
      });
    } else if (url.includes('tile.openstreetmap.org')) {
      provider = new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      });
    } else if (url.includes('arcgisonline.com') || url.includes('arcgis.com')) {
      // 使用预定义的 ArcGIS 服务
      if (url.includes('World_Street_Map')) {
        provider = new Cesium.ArcGisMapServerImageryProvider({
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
        });
      } else if (url.includes('World_Imagery')) {
        provider = new Cesium.ArcGisMapServerImageryProvider({
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
        });
      } else if (url.includes('World_Terrain_Base')) {
        provider = new Cesium.ArcGisMapServerImageryProvider({
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer'
        });
      } else {
        // 尝试使用通用 ArcGIS 服务
        try {
          provider = new Cesium.ArcGisMapServerImageryProvider({
            url: url
          });
        } catch (error) {
          console.warn('ArcGIS 服务加载失败，尝试使用备用服务:', error);
          // 使用备用服务
          provider = new Cesium.UrlTemplateImageryProvider({
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            minimumLevel: 0,
            maximumLevel: 18,
            credit: 'ArcGIS'
          });
        }
      }
    } else if (url.includes('autonavi.com') || url.includes('amap.com')) {
      // 高德地图瓦片服务
      provider = new Cesium.UrlTemplateImageryProvider({
        url: url,
        minimumLevel: 1,
        maximumLevel: 18,
        credit: '高德地图'
      });
    } else if (url.includes('{x}') && url.includes('{y}') && url.includes('{z}')) {
      // 通用瓦片地图服务
      provider = new Cesium.UrlTemplateImageryProvider({
        url: url,
        minimumLevel: 1,
        maximumLevel: 18
      });
    } else if (isLocalImage && useCustomBounds && rectangle) {
      // 对于本地图片文件，使用特殊处理方式
      try {
        console.log(`使用Canvas处理本地图片: ${url}`);
        
        // 创建一个Promise来处理图片加载
        const imageDataUrl = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous'; // 尝试跨域加载
          
          img.onload = function() {
            // 创建Canvas绘制图片
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            
            // 转换为数据URL
            try {
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } catch (e) {
              console.error('Canvas转换失败:', e);
              reject(e);
            }
          };
          
          img.onerror = function(err) {
            console.error('图片加载失败:', err);
            reject(new Error('图片加载失败'));
          };
          
          // 添加时间戳避免缓存
          img.src = `${url}?t=${new Date().getTime()}`;
        });
        
        console.log('图片已转换为数据URL');
        
        // 将经度纬度边界转换为Cesium矩形对象
        const cesiumRectangle = Cesium.Rectangle.fromDegrees(
          rectangle.west,
          rectangle.south,
          rectangle.east,
          rectangle.north
        );
        
        console.log(`使用自定义边界加载图片: ${JSON.stringify(rectangle)}`);
        
        // 使用数据URL和指定的矩形边界创建提供者
        provider = new Cesium.SingleTileImageryProvider({
          url: imageDataUrl,
          rectangle: cesiumRectangle
        });
      } catch (error) {
        console.error('处理本地图片失败:', error);
        throw error;
      }
    } else {
      // 对于普通图片（如栅格数据），检查是否提供了矩形边界
      if (useCustomBounds && rectangle) {
        // 将经度纬度边界转换为Cesium矩形对象
        const cesiumRectangle = Cesium.Rectangle.fromDegrees(
          rectangle.west,
          rectangle.south,
          rectangle.east,
          rectangle.north
        );
        
        console.log(`使用自定义边界加载图片: ${JSON.stringify(rectangle)}`);
        
        // 使用指定的矩形边界创建提供者
        provider = new Cesium.SingleTileImageryProvider({
          url: url,
          rectangle: cesiumRectangle
        });
      } else {
        // 默认使用单张图片作为影像图层（无地理参考信息）
        provider = new Cesium.SingleTileImageryProvider({
          url: url
        });
      }
    }
    
    const layer = props.viewer.imageryLayers.addImageryProvider(provider);
    layer.name = name || '自定义影像图层';
    
    // 通知影像图层更新
    emit('imagery-layers-updated');
    
    return layer;
  } catch (error) {
    console.error('添加影像图层失败:', error);
    throw error;
  }
}

// 地形切换
function switchTerrain(type) {
  try {
    if (type === 'worldTerrain') {
      props.viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
        url: Cesium.IonResource.fromAssetId(1)
      });
      console.log('已切换到全球地形');
    } else if (type === 'none') {
      props.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      console.log('已切换到无地形模式');
    }
  } catch (error) {
    console.error('切换地形失败:', error);
  }
}

// 暴露方法给父组件
defineExpose({
  switchImagery,
  switchTerrain,
  addImageryLayer,
  loadCustomImagery,
  // 增加地形处理方法
  async addTerrainLayer(url, name) {
    try {
      console.log(`正在加载地形数据: ${name} (${url})`);
      
      // 根据URL创建地形提供者
      let terrainProvider;
      
      if (url.includes('quantized-mesh')) {
        terrainProvider = new Cesium.CesiumTerrainProvider({
          url: url,
          requestVertexNormals: true,
          requestWaterMask: true
        });
      } else if (url.includes('terrain')) {
        terrainProvider = new Cesium.CesiumTerrainProvider({
          url: url
        });
      } else {
        // 默认尝试作为Cesium地形服务加载
        terrainProvider = new Cesium.CesiumTerrainProvider({
          url: url
        });
      }
      
      // 等待地形提供者就绪
      await terrainProvider.readyPromise;
      
      // 设置为当前地形
      props.viewer.terrainProvider = terrainProvider;
      
      console.log(`地形数据 "${name}" 加载成功`);
      return terrainProvider;
    } catch (error) {
      console.error('添加地形图层失败:', error);
      throw error;
    }
  }
});
</script> 