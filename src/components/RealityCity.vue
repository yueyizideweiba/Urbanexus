<template>
    <div class="reality-city-container">
      <!-- 城市选择器悬浮框 -->
      <div class="city-selector" v-if="showCitySelector">
        <div class="city-selector-header">
          <h3>城市选择器</h3>
          <button class="close-btn" @click="closeCitySelector">&times;</button>
        </div>
        <div class="city-selector-body">
          <div class="city-search">
            <input 
              type="text" 
              v-model="citySearch" 
              placeholder="输入城市名称（例如：北京、上海、伦敦、纽约）" 
              @keyup.enter="searchCity"
            />
            <button class="search-btn" @click="searchCity">搜索</button>
          </div>
          <div class="search-results" v-if="searchResults.length > 0">
            <div 
              v-for="(result, index) in searchResults" 
              :key="index" 
              class="search-result-item"
              @click="selectCity(result)"
            >
              <div class="result-name">{{ result.name }}</div>
              <div class="result-location">{{ result.country }}</div>
            </div>
          </div>
          <div class="search-message" v-else-if="searchMessage">
            {{ searchMessage }}
          </div>
          <div class="city-popular" v-if="searchResults.length === 0 && !searchMessage">
            <h4>热门城市</h4>
            <div class="popular-cities">
              <div class="popular-city" @click="selectPopularCity('北京', 116.3912, 39.9073)">北京</div>
              <div class="popular-city" @click="selectPopularCity('上海', 121.4737, 31.2304)">上海</div>
              <div class="popular-city" @click="selectPopularCity('广州', 113.2644, 23.1291)">广州</div>
              <div class="popular-city" @click="selectPopularCity('深圳', 114.0579, 22.5431)">深圳</div>
              <div class="popular-city" @click="selectPopularCity('武汉', 114.3162, 30.5810)">武汉</div>
              <div class="popular-city" @click="selectPopularCity('成都', 104.0668, 30.5728)">成都</div>
              <div class="popular-city" @click="selectPopularCity('杭州', 120.1551, 30.2741)">杭州</div>
              <div class="popular-city" @click="selectPopularCity('西安', 108.9402, 34.3416)">西安</div>
              <div class="popular-city" @click="selectPopularCity('重庆', 106.5511, 29.5637)">重庆</div>
              <div class="popular-city" @click="selectPopularCity('纽约', -74.0060, 40.7128)">纽约</div>
              <div class="popular-city" @click="selectPopularCity('伦敦', -0.1278, 51.5074)">伦敦</div>
              <div class="popular-city" @click="selectPopularCity('东京', 139.6917, 35.6895)">东京</div>
              <div class="popular-city" @click="selectPopularCity('巴黎', 2.3522, 48.8566)">巴黎</div>
              <div class="popular-city" @click="selectPopularCity('新加坡', 103.8198, 1.3521)">新加坡</div>
              <div class="popular-city" @click="selectPopularCity('悉尼', 151.2093, -33.8688)">悉尼</div>
            </div>
            
            <div class="city-category">
              <h4>中国城市</h4>
              <div class="popular-cities">
                <div class="popular-city" @click="selectPopularCity('南京', 118.7969, 32.0603)">南京</div>
                <div class="popular-city" @click="selectPopularCity('天津', 117.1901, 39.1262)">天津</div>
                <div class="popular-city" @click="selectPopularCity('苏州', 120.5853, 31.2990)">苏州</div>
                <div class="popular-city" @click="selectPopularCity('厦门', 118.0894, 24.4798)">厦门</div>
                <div class="popular-city" @click="selectPopularCity('青岛', 120.3826, 36.0671)">青岛</div>
                <div class="popular-city" @click="selectPopularCity('长沙', 112.9388, 28.2282)">长沙</div>
                <div class="popular-city" @click="selectPopularCity('大连', 121.6147, 38.9140)">大连</div>
                <div class="popular-city" @click="selectPopularCity('香港', 114.1694, 22.3193)">香港</div>
                <div class="popular-city" @click="selectPopularCity('澳门', 113.5439, 22.1987)">澳门</div>
              </div>
            </div>
            
            <div class="city-category">
              <h4>国际城市</h4>
              <div class="popular-cities">
                <div class="popular-city" @click="selectPopularCity('洛杉矶', -118.2437, 34.0522)">洛杉矶</div>
                <div class="popular-city" @click="selectPopularCity('莫斯科', 37.6173, 55.7558)">莫斯科</div>
                <div class="popular-city" @click="selectPopularCity('柏林', 13.4050, 52.5200)">柏林</div>
                <div class="popular-city" @click="selectPopularCity('首尔', 126.9780, 37.5665)">首尔</div>
                <div class="popular-city" @click="selectPopularCity('迪拜', 55.2708, 25.2048)">迪拜</div>
                <div class="popular-city" @click="selectPopularCity('曼谷', 100.5018, 13.7563)">曼谷</div>
                <div class="popular-city" @click="selectPopularCity('罗马', 12.4964, 41.9028)">罗马</div>
                <div class="popular-city" @click="selectPopularCity('阿姆斯特丹', 4.9041, 52.3676)">阿姆斯特丹</div>
                <div class="popular-city" @click="selectPopularCity('温哥华', -123.1207, 49.2827)">温哥华</div>
              </div>
            </div>
          </div>
          <div class="loading-indicator" v-if="isLoading">
            正在搜索城市...
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import * as Cesium from 'cesium';
  
  export default {
    name: 'RealityCity',
    props: {
      viewer: {
        type: Object,
        required: true
      },
      isInitialized: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        osmBuildings: null,
        currentCityName: '', // 当前加载的城市名称
        
        // 城市选择器相关
        showCitySelector: false,
        citySearch: '',
        searchResults: [],
        searchMessage: '',
        isLoading: false,
        loadedTilesets: [] // 已加载的城市图层列表
      };
    },
    mounted() {
      // 初始化组件，不需要额外操作
    },
    beforeUnmount() {
      this.cleanup();
    },
    methods: {
      // 打开城市选择器
      openCitySelector() {
        this.showCitySelector = true;
        this.searchResults = [];
        this.searchMessage = '';
        this.citySearch = '';
      },
      
      // 关闭城市选择器
      closeCitySelector() {
        this.showCitySelector = false;
      },
      
      // 城市搜索
      async searchCity() {
        if (!this.citySearch.trim()) {
          this.searchMessage = '请输入城市名称';
          return;
        }
        
        this.isLoading = true;
        this.searchResults = [];
        this.searchMessage = '';
        
        try {
          // 使用内置城市数据库进行模糊匹配
          const cityMatches = this.searchInCityDatabase(this.citySearch);
          
          if (cityMatches && cityMatches.length > 0) {
            this.searchResults = cityMatches;
          } else {
            this.searchMessage = '未找到匹配的城市，请尝试其他城市名称';
          }
        } catch (error) {
          console.error('城市搜索失败:', error);
          this.searchMessage = '搜索失败，请使用热门城市列表';
        } finally {
          this.isLoading = false;
        }
      },
      
      // 在内置数据库中搜索城市
      searchInCityDatabase(keyword) {
        // 常用城市数据库
        const cityDatabase = [
          // 中国城市
          { name: '北京', fullName: '北京, 中国', longitude: 116.3912, latitude: 39.9073, country: '中国', importance: 0.9 },
          { name: '上海', fullName: '上海, 中国', longitude: 121.4737, latitude: 31.2304, country: '中国', importance: 0.9 },
          { name: '广州', fullName: '广州, 广东, 中国', longitude: 113.2644, latitude: 23.1291, country: '中国', importance: 0.85 },
          { name: '深圳', fullName: '深圳, 广东, 中国', longitude: 114.0579, latitude: 22.5431, country: '中国', importance: 0.85 },
          { name: '武汉', fullName: '武汉, 湖北, 中国', longitude: 114.3162, latitude: 30.5810, country: '中国', importance: 0.8 },
          { name: '成都', fullName: '成都, 四川, 中国', longitude: 104.0668, latitude: 30.5728, country: '中国', importance: 0.8 },
          { name: '杭州', fullName: '杭州, 浙江, 中国', longitude: 120.1551, latitude: 30.2741, country: '中国', importance: 0.8 },
          { name: '南京', fullName: '南京, 江苏, 中国', longitude: 118.7969, latitude: 32.0603, country: '中国', importance: 0.8 },
          { name: '西安', fullName: '西安, 陕西, 中国', longitude: 108.9402, latitude: 34.3416, country: '中国', importance: 0.8 },
          { name: '重庆', fullName: '重庆, 中国', longitude: 106.5511, latitude: 29.5637, country: '中国', importance: 0.8 },
          { name: '天津', fullName: '天津, 中国', longitude: 117.1901, latitude: 39.1262, country: '中国', importance: 0.8 },
          { name: '苏州', fullName: '苏州, 江苏, 中国', longitude: 120.5853, latitude: 31.2990, country: '中国', importance: 0.75 },
          { name: '厦门', fullName: '厦门, 福建, 中国', longitude: 118.0894, latitude: 24.4798, country: '中国', importance: 0.75 },
          { name: '青岛', fullName: '青岛, 山东, 中国', longitude: 120.3826, latitude: 36.0671, country: '中国', importance: 0.75 },
          { name: '长沙', fullName: '长沙, 湖南, 中国', longitude: 112.9388, latitude: 28.2282, country: '中国', importance: 0.75 },
          
          // 国际城市
          { name: '纽约', fullName: '纽约, 美国', longitude: -74.0060, latitude: 40.7128, country: '美国', importance: 0.95 },
          { name: '伦敦', fullName: '伦敦, 英国', longitude: -0.1278, latitude: 51.5074, country: '英国', importance: 0.95 },
          { name: '巴黎', fullName: '巴黎, 法国', longitude: 2.3522, latitude: 48.8566, country: '法国', importance: 0.9 },
          { name: '东京', fullName: '东京, 日本', longitude: 139.6917, latitude: 35.6895, country: '日本', importance: 0.9 },
          { name: '新加坡', fullName: '新加坡', longitude: 103.8198, latitude: 1.3521, country: '新加坡', importance: 0.85 },
          { name: '悉尼', fullName: '悉尼, 澳大利亚', longitude: 151.2093, latitude: -33.8688, country: '澳大利亚', importance: 0.85 },
          { name: '迪拜', fullName: '迪拜, 阿联酋', longitude: 55.2708, latitude: 25.2048, country: '阿联酋', importance: 0.85 },
          { name: '温哥华', fullName: '温哥华, 加拿大', longitude: -123.1207, latitude: 49.2827, country: '加拿大', importance: 0.8 },
          { name: '莫斯科', fullName: '莫斯科, 俄罗斯', longitude: 37.6173, latitude: 55.7558, country: '俄罗斯', importance: 0.85 },
          { name: '洛杉矶', fullName: '洛杉矶, 美国', longitude: -118.2437, latitude: 34.0522, country: '美国', importance: 0.85 },
          { name: '柏林', fullName: '柏林, 德国', longitude: 13.4050, latitude: 52.5200, country: '德国', importance: 0.85 },
          { name: '首尔', fullName: '首尔, 韩国', longitude: 126.9780, latitude: 37.5665, country: '韩国', importance: 0.85 },
          { name: '香港', fullName: '香港', longitude: 114.1694, latitude: 22.3193, country: '中国香港', importance: 0.85 },
          { name: '曼谷', fullName: '曼谷, 泰国', longitude: 100.5018, latitude: 13.7563, country: '泰国', importance: 0.8 },
          { name: '罗马', fullName: '罗马, 意大利', longitude: 12.4964, latitude: 41.9028, country: '意大利', importance: 0.8 },
          { name: '阿姆斯特丹', fullName: '阿姆斯特丹, 荷兰', longitude: 4.9041, latitude: 52.3676, country: '荷兰', importance: 0.8 },
          { name: '多伦多', fullName: '多伦多, 加拿大', longitude: -79.3832, latitude: 43.6532, country: '加拿大', importance: 0.8 },
          { name: '马德里', fullName: '马德里, 西班牙', longitude: -3.7038, latitude: 40.4168, country: '西班牙', importance: 0.8 },
          { name: '巴塞罗那', fullName: '巴塞罗那, 西班牙', longitude: 2.1734, latitude: 41.3851, country: '西班牙', importance: 0.8 },
          { name: '芝加哥', fullName: '芝加哥, 美国', longitude: -87.6298, latitude: 41.8781, country: '美国', importance: 0.8 }
        ];
        
        // 关键词模糊匹配
        const lowerKeyword = keyword.toLowerCase();
        return cityDatabase.filter(city => 
          city.name.toLowerCase().includes(lowerKeyword) || 
          city.fullName.toLowerCase().includes(lowerKeyword) || 
          city.country.toLowerCase().includes(lowerKeyword)
        ).slice(0, 5); // 最多返回5个结果
      },
      
      // 选择搜索结果中的城市
      selectCity(city) {
        this.loadCityBuildings(city.name, city.longitude, city.latitude);
        this.closeCitySelector();
      },
      
      // 选择热门城市
      selectPopularCity(name, longitude, latitude) {
        this.loadCityBuildings(name, longitude, latitude);
        this.closeCitySelector();
      },
      
      // 加载指定城市的建筑物数据
      async loadCityBuildings(cityName, longitude, latitude) {
        try {
          // 移除之前加载的相同城市
          if (this.osmBuildings && this.currentCityName === cityName) {
            this.viewer.scene.primitives.remove(this.osmBuildings);
            this.osmBuildings = null;
            
            // 从图层列表中移除
            const index = this.loadedTilesets.findIndex(t => t.name === `${cityName}实景建筑`);
            if (index !== -1) {
              this.loadedTilesets.splice(index, 1);
            }
            
            console.log(`已移除之前加载的${cityName}建筑物`);
            return;
          }
          
          // 设置相机飞行到指定城市
          this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 3500),
            orientation: {
              heading: Cesium.Math.toRadians(20),
              pitch: Cesium.Math.toRadians(-30),
              roll: 0.0
            },
            duration: 3
          });
          
          // 使用Rectangle限制OSM建筑数据的加载范围，仅加载指定城市周围区域
          const rectangle = Cesium.Rectangle.fromDegrees(
            longitude - 0.1, // 西边界
            latitude - 0.1,  // 南边界
            longitude + 0.1, // 东边界
            latitude + 0.1   // 北边界
          );
          
          // 加载OSM建筑物，限制在指定区域
          this.osmBuildings = await Cesium.createOsmBuildings({
            enableShowOutline: false,
            rectangleInMeters: 10000, // 10km范围
            maximumScreenSpaceError: 16
          });
          
          // 设置瓦片矩形范围
          this.osmBuildings._url += `?area=${longitude-0.1},${latitude-0.1},${longitude+0.1},${latitude+0.1}`;
          
          // 添加到场景中
          this.viewer.scene.primitives.add(this.osmBuildings);
          
          // 设置建筑物样式
          this.osmBuildings.style = new Cesium.Cesium3DTileStyle({
            color: 'rgba(57, 123, 192, 1)'
          });
          
          // 记录当前城市名
          this.currentCityName = cityName;
          
          // 为了适应图层管理器，为建筑物对象添加必要属性
          this.osmBuildings.name = `${cityName}实景建筑`;
          this.osmBuildings.show = true;
          
          // 添加到已加载图层列表
          this.loadedTilesets.push({
            name: `${cityName}实景建筑`,
            instance: this.osmBuildings,
            show: true
          });
          
          // 触发事件，通知父组件添加到图层管理器
          this.$emit('add-tileset-layer', this.osmBuildings);
          
          console.log(`${cityName}实景建筑加载成功`);
        } catch (error) {
          console.error(`加载${cityName}建筑物失败:`, error);
        }
      },
      
      // 清理资源
      cleanup() {
        if (this.osmBuildings) {
          this.viewer.scene.primitives.remove(this.osmBuildings);
          this.osmBuildings = null;
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .reality-city-container {
    position: relative;
    z-index: 10;
  }
  
  /* 城市选择器样式 */
  .city-selector {
    position: fixed;
    left: 230px; /* 从220px调整到230px，增加与左侧边栏的间距 */
    bottom: 20px;
    width: 400px;
    max-width: calc(100vw - 260px); /* 相应调整最大宽度 */
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    overflow: hidden;
    animation: slideUp 0.3s ease-out;
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
  
  .city-selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    color: white;
  }
  
  .city-selector-header h3 {
    margin: 0;
    font-size: 16px;
  }
  
  .city-selector-header .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
  }
  
  .city-selector-body {
    padding: 16px;
    max-height: 70vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--primary-color) #f0f0f0;
  }
  
  .city-selector-body::-webkit-scrollbar {
    width: 6px;
  }
  
  .city-selector-body::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 10px;
  }
  
  .city-selector-body::-webkit-scrollbar-thumb {
    background-color: var(--primary-color);
    border-radius: 10px;
  }
  
  .city-search {
    display: flex;
    margin-bottom: 16px;
  }
  
  .city-search input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px 0 0 4px;
    font-size: 14px;
  }
  
  .city-search .search-btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    padding: 10px 15px;
    cursor: pointer;
  }
  
  .search-results {
    margin-top: 16px;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .search-result-item {
    padding: 12px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .search-result-item:hover {
    background-color: rgba(var(--primary-rgb), 0.1);
  }
  
  .search-result-item:last-child {
    border-bottom: none;
  }
  
  .result-name {
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .result-location {
    font-size: 12px;
    color: #666;
  }
  
  .city-popular h4 {
    margin-top: 20px;
    margin-bottom: 12px;
    color: #333;
    font-size: 15px;
  }
  
  .popular-cities {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .popular-city {
    background-color: #f5f5f5;
    color: #333;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .popular-city:hover {
    background-color: var(--primary-light);
    color: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .search-message {
    padding: 16px;
    text-align: center;
    color: #666;
    font-style: italic;
  }
  
  .loading-indicator {
    text-align: center;
    padding: 20px;
    color: var(--primary-color);
  }
  
  /* 适配折叠的左侧边栏 */
  .left-sidebar.collapsed ~ .city-selector {
    left: 40px; /* 从30px调整到40px，增加与折叠侧边栏的间距 */
    max-width: calc(100vw - 60px);
  }
  
  .city-category {
    margin-top: 20px;
  }
  
  .city-category h4 {
    margin-top: 10px;
    margin-bottom: 12px;
    color: #333;
    font-size: 15px;
    padding-left: 5px;
    border-left: 3px solid var(--primary-color);
  }
  </style>