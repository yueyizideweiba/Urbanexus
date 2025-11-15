<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <Navbar 
      v-if="isInitialized"
      :viewer="viewer"
      :currentSkybox="currentSkybox"
      @geometry-show-tools="geometry?.showTools"
      @geometry-measure-distance="geometry?.measureDistance"
      @geometry-measure-area="geometry?.measureArea"
      @scene-analysis="handleAnalysis"
      @buffer-analysis-open="handleBufferAnalysisOpen"
      @geojson-styler-open="handleGeojsonStylerOpen"
      @extruder-open="handleExtruderOpen"
      @camera-set-view="handleCameraSetView"
      @camera-set-fov="handleCameraSetFov"
      @camera-reset="handleCameraReset"
      @terrain-switch="handleTerrainSwitch"
      @data-loader-trigger="handleDataLoaderTrigger"
      @data-loader-load-http-tiles="handleDataLoaderLoadHttpTiles"
      @layer-manager-open="handleLayerManagerOpen"
      @fly-to-location="handleFlyToLocation"
      @user-login-success="handleUserLoginSuccess"
      @user-logout="handleUserLogout"
      @theme-change="handleThemeChange"
      @skybox-change="handleSkyboxChange"
      @viewer-settings-change="handleViewerSettingsChange"
    />
    
    <div class="main-content">
      <!-- 左侧工具栏 -->
      <div class="sidebar left-sidebar" :class="{ 'collapsed': !leftSidebarVisible }">
        <div class="sidebar-toggle fancy-toggle" @click="toggleLeftSidebar">
          {{ leftSidebarVisible ? '‹' : '›' }}
        </div>
        <div v-if="leftSidebarVisible" class="sidebar-content">
          <div class="sidebar-header">
            <div class="sidebar-title">
              <span class="sidebar-icon">🛠️</span>
              <h3>功能<span class="highlight">工具</span></h3>
            </div>
          </div>
          <div class="sidebar-buttons">
            <div class="tool-group">
              <h4>几何工具</h4>
              <button @click="geometry?.showTools()" class="tool-button">
                <i class="icon">📏</i>基本要素
              </button>
              <button @click="geometry?.measureDistance()" class="tool-button">
                <i class="icon">📏</i>测距离
              </button>
              <button @click="geometry?.measureArea()" class="tool-button">
                <i class="icon">📐</i>测面积
              </button>
            </div>

            <div class="tool-group">
              <h4>场景分析</h4>
              <button @click="handleBuildingPlanningOpen()" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🏢</i>建筑规划
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="characterExplorer?.toggleActive()" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🧍</i>人物漫游
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleAnalysis('pathPlanning')" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🛣️</i>路径规划
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleAnalysis('viewshed')" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">👁️</i>通视分析
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleAnalysis('visualDomain')" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🔍</i>可视域分析
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleAnalysis('terrainAnalysis')" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🏔️</i>地形分析
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleBufferAnalysisOpen()" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">⚪</i>缓冲区分析
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleGeojsonStylerOpen()" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🎨</i>分色
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleExtruderOpen()" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🏙️</i>模型拉伸
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
            </div>
            
            <!-- 新增视觉效果工具组（加入权限检查） -->
            <div class="tool-group">
              <h4>视觉效果</h4>
              <button @click="handleVisualEffect('rain')" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🌧️</i>下雨效果
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleVisualEffect('snow')" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">❄️</i>下雪效果
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleVisualEffect('fog')" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🌫️</i>雾天效果
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleVisualEffect('nightVision')" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🌃</i>夜视效果
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleVisualEffect('postProcessedCloud')" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">☁️</i>体积云效果
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
              <button @click="handleVisualEffect('clear')" class="tool-button" :class="{'disabled': !hasFullAccess}">
                <i class="icon">🌞</i>清除特效
                <span v-if="!hasFullAccess" class="lock-icon">🔒</span>
              </button>
            </div>

            <!-- 数据加载工具组 -->
            <div class="tool-group">
              <h4>数据加载</h4>
              <button @click="realityCity?.openCitySelector()" class="tool-button">
                <i class="icon">🏙️</i>加载城市模型
              </button>
              <button @click="handleDataLoaderTrigger('gltf')" class="tool-button">
                <i class="icon">📦</i>加载glTF
              </button>
              <button @click="handleDataLoaderTrigger('3dtiles')" class="tool-button">
                <i class="icon">🏢</i>加载3D Tiles
              </button>
              <button @click="handleDataLoaderTrigger('geojson')" class="tool-button">
                <i class="icon">🗺️</i>加载GeoJSON
              </button>
              <button @click="handleDataLoaderTrigger('shp')" class="tool-button">
                <i class="icon">📊</i>加载SHP
              </button>
              <button @click="handleDataLoaderLoadHttpTiles()" class="tool-button">
                <i class="icon">🌐</i>加载HTTP Tiles
              </button>
            </div>
            
            <!-- 存储管理工具组 -->
            <div class="tool-group">
              <h4>数据发布</h4>
              <button @click="activeTab = 'storage'" class="tool-button">
                <i class="icon">💾</i>文件管理
              </button>
              <button @click="activeTab = 'backendLayers'" class="tool-button" v-if="isAdmin">
                <i class="icon">🗃️</i>已发布数据
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Cesium 容器 -->
      <div id="cesiumContainer"></div>
      
      <!-- 相机控制按钮 -->
      <CameraControl
        v-if="isInitialized"
        ref="cameraControl"
        :viewer="viewer"
        :isCoordinatePickingEnabled="isCoordinatePickingEnabled"
        :showRightSidebar="showRightSidebar"
        @toggle-coordinate-picking="toggleCoordinatePicking"
      />
      
      <!-- 几何工具组件 -->
      <GeometryTools
        v-if="isInitialized"
        ref="geometry"
        :viewer="viewer"
        @add-geojson-datasource="addGeojsonDataSource"
      />
      
      <!-- 人物漫游组件 -->
      <CharacterExplorer
        v-if="isInitialized"
        ref="characterExplorer"
        :viewer="viewer"
      />
      
      <!-- 右侧面板 - 图层管理和属性 -->
      <div class="sidebar right-sidebar" :class="{ 'collapsed': !showRightSidebar }">
        <div class="sidebar-toggle fancy-toggle" @click="toggleRightSidebar">
          {{ showRightSidebar ? '›' : '‹' }}
        </div>
        <div v-if="showRightSidebar" class="sidebar-content">
          <div class="tabs">
            <div class="tab" :class="{ 'active': activeTab === 'layers' }" @click="activeTab = 'layers'">图层</div>
            <div class="tab" :class="{ 'active': activeTab === 'terrain' }" @click="activeTab = 'terrain'">地形影像</div>
            <div class="tab" :class="{ 'active': activeTab === 'camera' }" @click="activeTab = 'camera'">相机</div>
            <div class="tab" :class="{ 'active': activeTab === 'storage' }" @click="activeTab = 'storage'">数据发布</div>
            <div class="tab" :class="{ 'active': activeTab === 'backendLayers' }" @click="activeTab = 'backendLayers'" v-if="isAdmin">已发布数据</div>
          </div>
          
          <div class="tab-content">
            <!-- 图层管理面板 -->
            <div v-if="activeTab === 'layers'" class="tab-pane layer-manager-content">
              <!-- 影像图层 -->
              <div class="layer-group">
                <div class="layer-group-header" @click="toggleLayerGroup('imagery')">
                  <span class="expand-icon">{{ layerGroupExpanded.imagery ? '▼' : '▶' }}</span>
                  <span>影像图层</span>
                </div>
                <div class="layer-group-content" v-if="layerGroupExpanded.imagery">
                  <div v-for="(item, index) in imageryLayersList" :key="'imagery-' + index" class="layer-item">
                    <input type="checkbox" :checked="item.show" @change="toggleImageryLayerVisibility(item, $event)" />
                    <span class="layer-name">{{ item.name }}</span>
                    <button class="layer-delete-btn" @click="deleteImageryLayer(index)">删除</button>
                  </div>
                  <div v-if="imageryLayersList.length === 0" class="empty-layer-message">
                    暂无影像图层
                  </div>
                </div>
              </div>
              
              <!-- 矢量图层 (GeoJSON) -->
              <div class="layer-group">
                <div class="layer-group-header" @click="toggleLayerGroup('vector')">
                  <span class="expand-icon">{{ layerGroupExpanded.vector ? '▼' : '▶' }}</span>
                  <span>矢量图层</span>
                </div>
                <div class="layer-group-content" v-if="layerGroupExpanded.vector">
                  <div v-for="(item, index) in vectorLayersList" :key="'vector-' + index" class="layer-item">
                    <input type="checkbox" :checked="item.show" @change="toggleVectorLayerVisibility(item, $event)" />
                    <span class="layer-name">{{ item.name }}</span>
                    <button class="layer-delete-btn" @click="deleteVectorLayer(index)">删除</button>
                  </div>
                  <div v-if="vectorLayersList.length === 0" class="empty-layer-message">
                    暂无矢量图层
                  </div>
                </div>
              </div>
              
              <!-- 3D 模型图层 -->
              <div class="layer-group">
                <div class="layer-group-header" @click="toggleLayerGroup('model')">
                  <span class="expand-icon">{{ layerGroupExpanded.model ? '▼' : '▶' }}</span>
                  <span>3D 模型图层</span>
                </div>
                <div class="layer-group-content" v-if="layerGroupExpanded.model">
                  <div v-for="(item, index) in modelEntitiesList" :key="'model-' + index" class="layer-item">
                    <input type="checkbox" :checked="item.show" @change="toggleModelEntityVisibility(item, $event)" />
                    <span class="layer-name">{{ item.name }}</span>
                    <button class="layer-delete-btn" @click="deleteModelEntity(index)">删除</button>
                  </div>
                  <div v-if="modelEntitiesList.length === 0" class="empty-layer-message">
                    暂无3D模型图层
                  </div>
                </div>
              </div>
              
              <!-- 3D Tiles 图层 -->
              <div class="layer-group">
                <div class="layer-group-header" @click="toggleLayerGroup('tileset')">
                  <span class="expand-icon">{{ layerGroupExpanded.tileset ? '▼' : '▶' }}</span>
                  <span>3D Tiles 图层</span>
                </div>
                <div class="layer-group-content" v-if="layerGroupExpanded.tileset">
                  <div v-for="(item, index) in tilesetLayersList" :key="'tileset-' + index" class="layer-item">
                    <input type="checkbox" :checked="item.show" @change="toggleTilesetVisibility(item, $event)" />
                    <span class="layer-name">{{ item.name }}</span>
                    <button class="layer-delete-btn" @click="deleteTileset(index)">删除</button>
                  </div>
                  <div v-if="tilesetLayersList.length === 0" class="empty-layer-message">
                    暂无3D Tiles图层
                  </div>
                </div>
              </div>
              
              <!-- 可视域图层 -->
              <div class="layer-group">
                <div class="layer-group-header" @click="toggleLayerGroup('viewshed')">
                  <span class="expand-icon">{{ layerGroupExpanded.viewshed ? '▼' : '▶' }}</span>
                  <span>场景分析图层</span>
                </div>
                <div class="layer-group-content" v-if="layerGroupExpanded.viewshed">
                  <div v-for="(item, index) in viewshedLayersList" :key="'viewshed-' + index" class="layer-item">
                    <input type="checkbox" :checked="item.show" @change="toggleViewshedLayerVisibility(item, $event)" />
                    <span class="layer-name">{{ item.name }}</span>
                    <button class="layer-delete-btn" @click="deleteViewshedLayer(index)">删除</button>
                  </div>
                  <div v-if="viewshedLayersList.length === 0" class="empty-layer-message">
                    暂无场景分析图层
                  </div>
                </div>
              </div>
              
              <!-- 导航图层 -->
              <div class="layer-group">
                <div class="layer-group-header" @click="toggleLayerGroup('navigation')">
                  <span class="expand-icon">{{ layerGroupExpanded.navigation ? '▼' : '▶' }}</span>
                  <span>导航图层</span>
                </div>
                <div class="layer-group-content" v-if="layerGroupExpanded.navigation">
                  <div v-for="(item, index) in navigationRoutesList" :key="'nav-' + index" class="layer-item">
                    <input type="checkbox" :checked="item.show" @change="toggleNavigationLayerVisibility(item, $event)" />
                    <span class="layer-name">{{ item.name }}</span>
                    <button class="layer-delete-btn" @click="deleteNavigationLayer(index)">删除</button>
                  </div>
                  <div v-if="navigationRoutesList.length === 0" class="empty-layer-message">
                    暂无导航图层
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 地形影像面板 -->
            <div v-if="activeTab === 'terrain'" class="tab-pane">
              <h4>影像切换</h4>
              <div class="button-group">
                <button @click="handleImagerySwitch('cesiumDefault')" class="option-button">Cesium默认</button>
                <button @click="handleImagerySwitch('openStreetMap')" class="option-button">OpenStreetMap</button>
                <button @click="handleImagerySwitch('arcgis')" class="option-button">ArcGIS</button>
              </div>
              
              <!-- 新增自定义URL影像加载 -->
              <h4>自定义影像URL</h4>
              <div class="custom-url-input">
                <input
                  type="text"
                  v-model="customImageryUrl"
                  placeholder="输入影像服务URL"
                  class="custom-url-field"
                />
                <button @click="handleLoadCustomImagery" class="custom-url-btn">加载</button>
              </div>
              
              <h4>地形切换</h4>
              <div class="button-group">
                <button @click="handleTerrainSwitch('worldTerrain')" class="option-button">Cesium全球地形</button>
                <button @click="handleTerrainSwitch('none')" class="option-button">无地形</button>
              </div>
              
              <!-- 替换天空盒按钮为下拉框 -->
              <h4>天空盒切换</h4>
              <div class="skybox-selector">
                <select v-model="selectedSkybox" @change="handleSkyboxChange(selectedSkybox)" class="skybox-select">
                  <option value="default">默认天空盒</option>
                  <option v-for="skybox in nonDefaultSkyboxes" :key="skybox" :value="skybox">
                    {{ skybox }}
                  </option>
                </select>
              </div>
            </div>
            
            <!-- 相机控制面板 -->
            <div v-if="activeTab === 'camera'" class="tab-pane">
              <h4>视角控制</h4>
              <div class="button-group">
                <button @click="handleCameraSetView('top')" class="option-button">正视俯视</button>
                <button @click="handleCameraSetView('side')" class="option-button">侧视角</button>
                <button @click="handleCameraSetView('oblique')" class="option-button">斜视视角</button>
                <button @click="handleCameraSetView('45degree')" class="option-button">45度视角</button>
                <button @click="handleCameraSetView('close')" class="option-button">近距离视角</button>
                <button @click="handleCameraReset()" class="option-button">复位相机</button>
              </div>
              
              <h4>视场角</h4>
              <div class="button-group">
                <button @click="handleCameraSetFov('normal')" class="option-button">常规视域</button>
                <button @click="handleCameraSetFov('wide')" class="option-button">广角视域</button>
                <button @click="handleCameraSetFov('ultraWide')" class="option-button">超广角视域</button>
              </div>
            </div>
            
            <!-- 存储管理面板 -->
            <div v-if="activeTab === 'storage'" class="tab-pane">
              <StorageManager 
                :viewer="viewer"
                @load-layer="handleStorageLayerLoad"
              />
            </div>
            
            <!-- 已发布管理面板 -->
            <div v-if="activeTab === 'backendLayers'" class="tab-pane">
              <div class="backend-layers-header">
                <h4>已发布数据管理</h4>
                <div>
                  <button @click="testBackendConnection" class="test-connection-btn">测试连接</button>
                  <button @click="openAddLayerModal" class="add-layer-btn">添加图层</button>
                </div>
              </div>
              
              <!-- 连接状态提示 -->
              <div v-if="connectionStatus === 'success'" class="connection-status success">
                后端服务连接正常
              </div>
              <div v-if="connectionStatus === 'error'" class="connection-status error">
                后端服务连接失败，请确保后端服务已启动
              </div>
              
              <!-- 加载状态提示 -->
              <div v-if="isLoadingData" class="loading-indicator">
                正在加载数据...
              </div>
              
              <!-- 加载错误提示 -->
              <div v-if="loadError" class="error-message">
                <div class="error-title">{{ loadError }}</div>
                <div v-if="errorDetails" class="error-details">
                  <div>详细错误信息:</div>
                  <pre>{{ errorDetails }}</pre>
                </div>
                <div class="error-actions">
                  <button @click="testBackendConnection" class="retry-btn">测试连接</button>
                  <button @click="loadLayersFromBackend" class="retry-btn">重试加载</button>
                  <button @click="showErrorHelp = !showErrorHelp" class="help-btn">
                    {{ showErrorHelp ? '隐藏帮助' : '显示帮助' }}
                  </button>
                </div>
              </div>
              
              <!-- 错误帮助信息 -->
              <div v-if="showErrorHelp" class="help-message">
                <h4>常见问题解决方法:</h4>
                <ol>
                  <li>确保后端服务已启动并在http://localhost:3000运行</li>
                  <li>确保数据库服务已启动并正确配置</li>
                  <li>检查浏览器控制台是否存在跨域(CORS)相关错误</li>
                  <li>确保网络连接畅通，没有防火墙阻止</li>
                  <li>刷新页面重新尝试连接</li>
                </ol>
                <p>启动后端服务的命令:</p>
                <pre>cd backend
npm run dev</pre>
              </div>
              
              <!-- 后端图层列表 -->
              <div v-if="!isLoadingData && !loadError" class="backend-layers-list">
                <div v-for="(layer, index) in backendLayers" :key="'backend-' + index" class="backend-layer-item">
                  <div class="layer-info">
                    <div class="layer-name-type">
                      <span class="layer-name">{{ layer.name }}</span>
                      <span class="layer-type">{{ getLayerTypeLabel(layer.type) }}</span>
                    </div>
                    <div class="layer-url">{{ shortenUrl(layer.url) }}</div>
                  </div>
                  <div class="layer-actions">
                    <button @click="loadLayerFromBackend(layer)" class="action-btn load-btn" title="加载到地图">
                      <span>加载</span>
                    </button>
                    <button @click="editBackendLayer(layer)" class="action-btn edit-btn" title="编辑图层">
                      <span>编辑</span>
                    </button>
                    <button @click="deleteBackendLayer(layer.id)" class="action-btn delete-btn" title="删除图层">
                      <span>删除</span>
                    </button>
                  </div>
                </div>
                <div v-if="backendLayers.length === 0" class="empty-layer-message">
                  暂无后端图层，请点击"添加图层"按钮创建
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 数据加载组件 -->
    <DataLoader
      v-if="isInitialized"
      ref="dataLoader"
      :viewer="viewer"
      @add-geojson-datasource="addGeojsonDataSource"
      @add-model-entity="addModelEntity"
      @add-tileset-layer="addTilesetLayer"
    />
    
    <!-- 分析模态框组件 -->
    <AnalysisModals
      v-if="isInitialized"
      ref="analysisModals"
      :viewer="viewer"
      :geojsonDataSources="geojsonDataSources"
      @add-geojson-datasource="addGeojsonDataSource"
    />
    
    <!-- 路径规划和场景分析 -->
    <SceneAnalysis
      v-if="isInitialized"
      ref="sceneAnalysis"
      :viewer="viewer"
      @add-navigation-route="addNavigationRoute"
      @add-viewshed-layer="addViewshedLayer"
    />
    
    <!-- 坐标拾取信息显示 -->
    <CoordinateDisplay
      v-if="isInitialized"
      :isCoordinatePickingEnabled="isCoordinatePickingEnabled"
      :selectedCoordinate="selectedCoordinate"
      :leftSidebarWidth="leftSidebarVisible ? 220 : 0"
      :showRightSidebar="showRightSidebar"
    />
    
    <!-- 地形与影像控制（无UI） -->
    <TerrainImagery
      v-if="isInitialized"
      ref="terrainImagery"
      :viewer="viewer"
      @imagery-layers-updated="refreshLayerLists"
    />
    
    <!-- 后端图层添加/编辑模态框 -->
    <div v-if="showLayerModal" class="modal-overlay" @click.self="closeLayerModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEditing ? '编辑图层' : '添加新图层' }}</h3>
          <button class="close-btn" @click="closeLayerModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="layerName">图层名称</label>
            <input type="text" id="layerName" v-model="layerForm.name" placeholder="请输入图层名称" />
          </div>
          
          <div class="form-group">
            <label for="layerType">图层类型</label>
            <select id="layerType" v-model="layerForm.type">
              <option value="imagery">影像图层</option>
              <option value="geojson">GeoJSON</option>
              <option value="3dtiles">3D Tiles</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="layerUrl">图层URL</label>
            <input type="text" id="layerUrl" v-model="layerForm.url" placeholder="请输入图层URL" />
          </div>
          
          <div class="form-group">
            <label for="layerProperties">属性 (JSON格式)</label>
            <textarea id="layerProperties" v-model="layerForm.propertiesText" 
                      placeholder='{"key": "value"}'
                      rows="4"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeLayerModal">取消</button>
          <button class="save-btn" @click="saveLayer">保存</button>
        </div>
      </div>
    </div>
    
    <!-- 添加GeoAI组件 -->
    <GeoAI
      v-if="isInitialized"
      :viewer="viewer"
      :isDarkMode="isDarkTheme"
      :isLoggedIn="isLoggedIn"
      :leftSidebarVisible="leftSidebarVisible"
      @show-tools="handleShowTools"
      @measure-distance="handleMeasureDistance"
      @measure-area="handleMeasureArea"
      @analysis="handleAnalysis"
      @buffer-analysis="handleBufferAnalysisOpen"
      @geojson-styler="handleGeojsonStylerOpen"
      @extruder="handleExtruderOpen"
      @visual-effect="handleVisualEffect"
      @data-loader-trigger="handleDataLoaderTrigger"
      @data-loader-load-http-tiles="handleDataLoaderLoadHttpTiles"
      @camera-set-view="handleCameraSetView"
      @camera-set-fov="handleCameraSetFov"
      @camera-reset="handleCameraReset"
      @terrain-switch="handleTerrainSwitch"
      @skybox-change="handleSkyboxChange"
      @execute-command="handleExecuteCommand"
    />
    
    <!-- RealityCity 组件 -->
    <RealityCity
      v-if="isInitialized"
      ref="realityCity"
      :viewer="viewer"
      @add-tileset-layer="addTilesetLayer"
    />
    
    <!-- 建筑规划组件 -->
    <BuildingPlanningEnhanced
      v-if="isInitialized && showBuildingPlanning"
      ref="buildingPlanningRef"
      :viewer="viewer"
      :isInBuildingEditMode="isInBuildingEditMode"
      @toggleEditMode="toggleBuildingEditMode"
      @close="handleBuildingPlanningClose"
      @disable-info-box="disableEntityClickHandler"
      @enable-info-box="enableEntityClickHandler"
    />
  </div>
</template>

<script setup>
import * as Cesium from 'cesium';
import { computed, onMounted, reactive, ref, watch } from 'vue';

// 建筑规划组件引用
const buildingPlanningRef = ref(null);

// 导入组件
import AnalysisModals from './components/AnalysisModals.vue';
import BuildingPlanningEnhanced from './components/BuildingPlanningEnhanced.vue';
import CameraControl from './components/CameraControl.vue';
import CharacterExplorer from './components/CharacterExplorer.vue'; // 导入人物漫游组件
import CoordinateDisplay from './components/CoordinateDisplay.vue';
import DataLoader from './components/DataLoader.vue';
import GeoAI from './components/GeoAI.vue';
import GeometryTools from './components/GeometryTools.vue';
import Navbar from './components/Navbar.vue';
import RealityCity from './components/RealityCity.vue';
import SceneAnalysis from './components/SceneAnalysis.vue';
import StorageManager from './components/StorageManager.vue';
import TerrainImagery from './components/TerrainImagery.vue';

// 导入API服务
import { authAPI } from './services/auth';
import { layersAPI } from './services/layers';
import { skyboxAPI } from './services/skybox';

// 导入主题样式
import './assets/theme.css';

// 初始化状态
const isInitialized = ref(false);

// 主题状态
const isDarkTheme = ref(false);

// 用户认证状态
const currentUser = ref(null);
const isLoggedIn = computed(() => !!currentUser.value);
const isAdmin = computed(() => currentUser.value && currentUser.value.role === 'admin');

// 功能权限控制
const hasFullAccess = computed(() => isLoggedIn.value);

// Cesium Viewer 实例
const viewer = ref(null);

// 视觉效果变量
const currentVisualEffect = ref(null);
const lastStage = ref(null);
const currentSkybox = ref('default'); // 添加当前天空盒状态
const cloudCoverage = ref(0.5); // 添加云覆盖率变量
const currentCloudQuality = ref(1); // 默认使用中等质量

// 体积云质量设置
const cloudQualitySettings = [
  {
    label: '低',
    maxSteps: 64,
    marchStep: 600,
    densityMarchStep: 120,
    coverageMultiplier: 0.8
  },
  {
    label: '中',
    maxSteps: 96,
    marchStep: 500,
    densityMarchStep: 100,
    coverageMultiplier: 1.0
  },
  {
    label: '高',
    maxSteps: 128,
    marchStep: 400,
    densityMarchStep: 80,
    coverageMultiplier: 1.2
  },
  {
    label: '超高',
    maxSteps: 192,
    marchStep: 300,
    densityMarchStep: 60,
    coverageMultiplier: 1.5
  }
];

// 组件引用
const cameraControl = ref(null);
const geometry = ref(null);
const dataLoader = ref(null);
const terrainImagery = ref(null);
const layerManager = ref(null);
const sceneAnalysis = ref(null);
const analysisModals = ref(null);
const characterExplorer = ref(null); // 添加人物漫游组件引用
const realityCity = ref(null); // 添加实景城市组件引用

// 坐标拾取相关变量
const selectedCoordinate = ref(null);
const isCoordinatePickingEnabled = ref(false);
const currentMarker = ref(null); // 当前坐标拾取标记

// 数据源集合
const geojsonDataSources = ref([]);
const modelEntities = ref([]);
const tilesetLayers = ref([]);
const viewshedLayers = ref([]);
const navigationRoutes = ref([]);

// 侧边栏状态控制
const showRightSidebar = ref(true);
const leftSidebarVisible = ref(true); // 左侧边栏是否可见
const activeTab = ref('layers');

// 添加图层管理器所需的状态和计算属性
const imageryLayersVersion = ref(0);
const layerGroupExpanded = reactive({
  imagery: true,
  vector: true,
  model: true,
  tileset: true,
  viewshed: true,
  navigation: true
});

// 计算属性：各类图层列表
const imageryLayersList = computed(() => {
  const list = [];
  imageryLayersVersion.value; // 触发重新计算
  if (viewer.value && viewer.value.imageryLayers) {
    for (let i = 0; i < viewer.value.imageryLayers.length; i++) {
      const layer = viewer.value.imageryLayers.get(i);
      list.push({
        name: layer.name || `影像图层 ${i + 1}`,
        show: layer.show,
        instance: layer
      });
    }
  }
  return list;
});

const vectorLayersList = computed(() =>
  geojsonDataSources.value.map((ds, index) => ({
    name: ds.name || `GeoJSON 图层 ${index + 1}`,
    show: ds.show !== undefined ? ds.show : true,
    instance: ds
  }))
);

const modelEntitiesList = computed(() =>
  modelEntities.value.map((entity, index) => ({
    name: entity.name || `glTF 模型 ${index + 1}`,
    show: entity.show !== undefined ? entity.show : true,
    instance: entity
  }))
);

const tilesetLayersList = computed(() =>
  tilesetLayers.value.map((tileset, index) => ({
    name: tileset.name || `3D Tiles ${index + 1}`,
    show: tileset.show !== undefined ? tileset.show : true,
    instance: tileset
  }))
);

const viewshedLayersList = computed(() =>
  viewshedLayers.value.map((layer, index) => ({
    name: layer.sketch ? (layer.sketch.name || `可视域图层 ${index + 1}`) : `可视域图层 ${index + 1}`,
    show: layer._visible !== undefined ? layer._visible : true,
    instance: layer
  }))
);

const navigationRoutesList = computed(() =>
  navigationRoutes.value.map((route, index) => ({
    name: route.name || `导航路线 ${index + 1}`,
    show: route.show !== undefined ? route.show : true,
    instance: route
  }))
);

// 切换图层组展开状态
function toggleLayerGroup(groupName) {
  layerGroupExpanded[groupName] = !layerGroupExpanded[groupName];
}

// 图层管理相关方法
function toggleImageryLayerVisibility(item, event) {
  item.instance.show = event.target.checked;
}

function deleteImageryLayer(index) {
  const layer = viewer.value.imageryLayers.get(index);
  viewer.value.imageryLayers.remove(layer, true);
  imageryLayersVersion.value++; // 触发重新计算
}

function toggleVectorLayerVisibility(item, event) {
  item.instance.show = event.target.checked;
}

function deleteVectorLayer(index) {
  const dataSource = geojsonDataSources.value[index];
  dataSource.show = false;
  if (viewer.value.dataSources.contains(dataSource)) {
    viewer.value.dataSources.remove(dataSource, true);
  }
  if (dataSource.destroy) {
    dataSource.destroy();
  }
  
  const updatedSources = [...geojsonDataSources.value];
  updatedSources.splice(index, 1);
  geojsonDataSources.value = updatedSources;
}

function toggleModelEntityVisibility(item, event) {
  item.instance.show = event.target.checked;
}

function deleteModelEntity(index) {
  const entity = modelEntities.value[index];
  viewer.value.entities.remove(entity);
  
  const updatedEntities = [...modelEntities.value];
  updatedEntities.splice(index, 1);
  modelEntities.value = updatedEntities;
}

function toggleTilesetVisibility(item, event) {
  item.instance.show = event.event.checked;
}

function deleteTileset(index) {
  const tileset = tilesetLayers.value[index];
  viewer.value.scene.primitives.remove(tileset, true);
  
  const updatedTilesets = [...tilesetLayers.value];
  updatedTilesets.splice(index, 1);
  tilesetLayers.value = updatedTilesets;
}

function toggleViewshedLayerVisibility(item, event) {
  const visible = event.target.checked;
  
  // 处理通视分析图层 (包含entities数组的图层)
  if (item.instance.entities && Array.isArray(item.instance.entities)) {
    item.instance.entities.forEach(entity => {
      if (entity && entity.show !== undefined) {
        entity.show = visible;
      }
    });
  } 
  // 处理可视域分析图层 (有sketch属性的传统图层)
  else if (item.instance.sketch) {
    item.instance.sketch.show = visible;
  }
  
  // 处理图层自身的可见性属性
  if (typeof item.instance.setVisibility === 'function') {
    item.instance.setVisibility(visible);
  } else {
    item.instance._visible = visible;
  }
  
  // 确保show属性也被设置
  item.instance.show = visible;
}

function deleteViewshedLayer(index) {
  const vs = viewshedLayers.value[index];
  vs.clear && vs.clear();
  
  const updatedLayers = [...viewshedLayers.value];
  updatedLayers.splice(index, 1);
  viewshedLayers.value = updatedLayers;
}

function toggleNavigationLayerVisibility(item, event) {
  const visible = event.target.checked;
  item.instance.show = visible;
  
  if (item.instance.polyline) {
    item.instance.polyline.show = visible;
  }
  
  if (item.instance.startLabel) {
    item.instance.startLabel.show = visible;
  }
  
  if (item.instance.endLabel) {
    item.instance.endLabel.show = visible;
  }
}

function deleteNavigationLayer(index) {
  const route = navigationRoutes.value[index];
  
  if (route.polyline) {
    viewer.value.entities.remove(route.polyline);
  }
  
  if (route.startLabel) {
    viewer.value.entities.remove(route.startLabel);
  }
  
  if (route.endLabel) {
    viewer.value.entities.remove(route.endLabel);
  }
  
  const updatedRoutes = [...navigationRoutes.value];
  updatedRoutes.splice(index, 1);
  navigationRoutes.value = updatedRoutes;
}

// 切换坐标拾取功能
function toggleCoordinatePicking() {
  isCoordinatePickingEnabled.value = !isCoordinatePickingEnabled.value;
  console.log(`坐标拾取功能已 ${isCoordinatePickingEnabled.value ? '开启' : '关闭'}`);
  
  // 关闭坐标拾取时，移除标记
  if (!isCoordinatePickingEnabled.value && currentMarker.value) {
    viewer.value.entities.remove(currentMarker.value);
    currentMarker.value = null;
    selectedCoordinate.value = null;
  }
}

// 场景分析类型处理函数（加入权限检查）
function handleAnalysis(type) {
  const access = checkFeatureAccess();
  if (!access.allowed) {
    alert(access.message);
    return;
  }
  
  if (!sceneAnalysis.value) return;
  console.log(`执行场景分析: ${type}`);
  
  // 处理地形分析相关类型
  if (type === 'slope' || type === 'aspect' || type === 'contour' || type === 'terrainDisplay') {
    // 直接执行相应的地形分析，不再显示模态框
    // 设置默认参数
    if (type === 'slope') {
      // 直接创建坡度分析
      sceneAnalysis.value.createSlopeRamp();
    } else if (type === 'aspect') {
      // 直接创建坡向分析
      sceneAnalysis.value.createAspectRamp();
    } else if (type === 'contour') {
      // 设置等高线默认参数并直接生成
      sceneAnalysis.value.terrainAnalysisParams.contourSpacing = 20;
      sceneAnalysis.value.terrainAnalysisParams.contourWidth = 1.5;
      sceneAnalysis.value.generateContourLines();
    } else if (type === 'terrainDisplay') {
      // 直接显示地形
      sceneAnalysis.value.displayTerrain();
    }
  } else {
    // 其他场景分析类型
    sceneAnalysis.value.handleAnalysis(type);
  }
}

// 打开缓冲区分析模态框（加入权限检查）
function handleBufferAnalysisOpen() {
  const access = checkFeatureAccess();
  if (!access.allowed) {
    alert(access.message);
    return;
  }
  
  if (!analysisModals.value) return;
  analysisModals.value.bufferAnalysis.openModal();
}

// 打开GeoJSON样式器（加入权限检查）
function handleGeojsonStylerOpen() {
  const access = checkFeatureAccess();
  if (!access.allowed) {
    alert(access.message);
    return;
  }
  
  if (!analysisModals.value) return;
  analysisModals.value.geojsonStyler.openStyler();
}

// 打开模型拉伸器（加入权限检查）
function handleExtruderOpen() {
  const access = checkFeatureAccess();
  if (!access.allowed) {
    alert(access.message);
    return;
  }
  
  if (!analysisModals.value) return;
  analysisModals.value.extruder.openModal();
}

// 清除特效
const removeStage = () => {
  if (lastStage.value && viewer.value) {
    viewer.value.scene.postProcessStages.remove(lastStage.value);
    lastStage.value = null;
  }
};

// 下雨特效
const applyRainEffect = () => {
  removeStage();
  const rainStage = new Cesium.PostProcessStage({
    name: "czm_rain",
    fragmentShader: `
      uniform sampler2D colorTexture;
      varying vec2 v_textureCoordinates;
    
      float hash(float x){
        return fract(sin(x*133.3)*13.13);
      }
    
      void main(void){
        float time = czm_frameNumber / 60.0;
        vec2 resolution = czm_viewport.zw;
      
        vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
        vec3 c=vec3(.6,.7,.8);
      
        float a=-.4;
        float si=sin(a),co=cos(a);
        uv*=mat2(co,-si,si,co);
        uv*=length(uv+vec2(0,4.9))*.3+1.;
      
        float v=1.-sin(hash(floor(uv.x*100.))*100.);
        float b=clamp(abs(sin(15.*time*v+uv.y*(10./(2.+v))))-.95,0.,1.)*4.;
        c*=v*b; 
      
        gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c,1), 0.5);  
      }
    `
  });
  viewer.value.scene.postProcessStages.add(rainStage);
  lastStage.value = rainStage;
  currentVisualEffect.value = 'rain';
};

// 下雪特效
const applySnowEffect = () => {
  removeStage();
  const snowStage = new Cesium.PostProcessStage({
    name: "czm_snow",
    fragmentShader: `
      uniform sampler2D colorTexture;
      varying vec2 v_textureCoordinates;
      
      float snow(vec2 uv,float scale)
      {
          float time = czm_frameNumber / 60.0;
          float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;
          uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;
          uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;
          p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);
          k=smoothstep(0.,k,sin(f.x+f.y)*0.01);
          return k*w;
      }
      
      void main(void){
          vec2 resolution = czm_viewport.zw;
          vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
          vec3 finalColor=vec3(0);
          float c = 0.0;
          c+=snow(uv,30.)*.0;
          c+=snow(uv,20.)*.0;
          c+=snow(uv,15.)*.0;
          c+=snow(uv,10.);
          c+=snow(uv,8.);
          c+=snow(uv,6.);
          c+=snow(uv,5.);
          finalColor=(vec3(c)); 
          gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.5); 
      }
    `
  });
  viewer.value.scene.postProcessStages.add(snowStage);
  lastStage.value = snowStage;
  currentVisualEffect.value = 'snow';
};

// 雾天特效
const applyFogEffect = () => {
  removeStage();
  const fogStage = new Cesium.PostProcessStage({
    name: "czm_fog",
    fragmentShader: `
      uniform sampler2D colorTexture;
      varying vec2 v_textureCoordinates;
      
      void main(void) {
        vec4 color = texture2D(colorTexture, v_textureCoordinates);
        float fogFactor = 0.5;
        vec3 fogColor = vec3(0.7, 0.7, 0.7);
        gl_FragColor = mix(color, vec4(fogColor, 1.0), fogFactor);
      }
    `
  });
  viewer.value.scene.postProcessStages.add(fogStage);
  lastStage.value = fogStage;
  currentVisualEffect.value = 'fog';
};

// 夜视特效
const applyNightVisionEffect = () => {
  removeStage();
  const nightVisionStage = new Cesium.PostProcessStage({
    name: "czm_nightVision",
    fragmentShader: `
      uniform sampler2D colorTexture;
      varying vec2 v_textureCoordinates;
      
      void main(void) {
        vec4 color = texture2D(colorTexture, v_textureCoordinates);
        vec3 nightColor = vec3(0.0, 1.0, 0.0); // 绿色夜视效果
        float intensity = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor = vec4(nightColor * intensity, 1.0);
      }
    `
  });
  viewer.value.scene.postProcessStages.add(nightVisionStage);
  lastStage.value = nightVisionStage;
  currentVisualEffect.value = 'nightVision';
};

// 体积云特效
const applyVolumetricCloudEffect = () => {
  removeStage();
  
  // 检查WebGL功能
  try {
    const canvas = viewer.value.canvas;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL不可用，无法创建体积云效果');
      return;
    }
  } catch (e) {
    console.error('检查WebGL时出错:', e);
    return;
  }
  
  // 确保每帧更新云动画
  const cloudAnimationCallback = () => {
    if (currentVisualEffect.value === 'volumetricCloud' && lastStage.value) {
      // 强制更新uniform以保证动画
      lastStage.value.dirty = true;
      // 请求下一帧继续更新
      requestAnimationFrame(cloudAnimationCallback);
    }
  };
  
  // 启动动画循环
  requestAnimationFrame(cloudAnimationCallback);
  
  // 获取当前质量设置
  const qualitySetting = cloudQualitySettings[currentCloudQuality.value];
  
  // 首先加载噪声纹理
  Cesium.Resource.createIfNeeded("./noise.png")
    .fetchImage()
    .then(noiseImage => {
      // 创建噪声纹理
      const noiseTexture = new Cesium.Texture({
        context: viewer.value.scene.context,
        source: noiseImage,
        sampler: new Cesium.Sampler({
          wrapS: Cesium.TextureWrap.REPEAT,
          wrapT: Cesium.TextureWrap.REPEAT,
          minificationFilter: Cesium.TextureMinificationFilter.LINEAR,
          magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR,
        })
      });
      
      // 创建体积云后处理阶段
  const cloudStage = new Cesium.PostProcessStage({
    name: "czm_volumetricCloud",
    fragmentShader: `
    // 后处理着色器uniforms
    uniform sampler2D colorTexture;
    uniform sampler2D depthTexture;
        uniform sampler2D noiseTexture;
    varying vec2 v_textureCoordinates;
    uniform float cloudCoverage;
    uniform float cloudMaxSteps;
    uniform float cloudMarchStep;
    uniform float cloudDensityMarchStep;
    uniform float cloudCoverageMultiplier;
    
        // 体积云常量定义
    const float PI = 3.14159265359;
    const float TWO_PI = 6.28318530718;
    const float FOUR_PI = 12.5663706144;
    
    #define CLOUDS_MAX_LOD 1
        #define MAXIMUM_CLOUDS_STEPS 300
    #define CLOUDS_MAX_VIEWING_DISTANCE 150000.0
    
    // 通用工具函数
    float saturate(float value) {
      return clamp(value, 0.0, 1.0);
    }
    
    // 2D噪声采样 - 基于Hash
    float noise2D(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(443.897, 441.423, 437.195));
      p3 += dot(p3, p3.yzx + 19.19);
      return fract((p3.x + p3.y) * p3.z);
    }
    
    // 3D噪声函数
    float noise3D(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      
      f = f * f * (3.0 - 2.0 * f);
      
      float n = i.x + i.y * 157.0 + 113.0 * i.z;
      
      return mix(
        mix(
          mix(noise2D(vec2(n + 0.0, n + 0.0)), noise2D(vec2(n + 1.0, n + 0.0)), f.x),
          mix(noise2D(vec2(n + 0.0, n + 1.0)), noise2D(vec2(n + 1.0, n + 1.0)), f.x),
          f.y
        ),
        mix(
          mix(noise2D(vec2(n + 0.0, n + 113.0)), noise2D(vec2(n + 1.0, n + 113.0)), f.x),
          mix(noise2D(vec2(n + 0.0, n + 114.0)), noise2D(vec2(n + 1.0, n + 114.0)), f.x),
          f.y
        ),
        f.z
      );
    }
    
    // 分形布朗运动 (FBM) - 使用多层噪声创建丰富细节
    float fbm(vec3 p) {
      float f = 0.0;
      float weight = 0.5;
      float scale = 1.0;
      
      for (int i = 0; i < 5; i++) {
        f += weight * noise3D(p * scale);
        weight *= 0.5;
        scale *= 2.0;
      }
      
      return f;
    }
    
    // Worley噪声，用于创建云的细胞状结构
    float worley(vec3 p, float frequency) {
      vec3 id = floor(p * frequency);
      vec3 localPos = fract(p * frequency);
      
      float minDist = 1.0;
      
      // 对相邻的27个单元格进行检查
      for (int z = -1; z <= 1; z++) {
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec3 cellId = id + vec3(x, y, z);
            
            // 使用基于单元格的哈希创建随机点
            vec3 cellHashValue = vec3(
              noise2D(vec2(cellId.x, cellId.y * 443.897 + cellId.z * 437.195)),
              noise2D(vec2(cellId.y, cellId.x * 441.423 + cellId.z * 439.231)),
              noise2D(vec2(cellId.z, cellId.x * 437.195 + cellId.y * 443.897))
            );
            
            vec3 pointInCell = cellHashValue;
            float dist = distance(cellId + pointInCell, p * frequency);
            
            minDist = min(minDist, dist);
          }
        }
      }
      
      return minDist;
    }
    
    // 云形状噪声函数 - 结合FBM和Worley噪声
    float cloudShapeNoise(vec3 worldPos) {
      // 基础尺度 - 较小的值创建更大的整体形状
      float baseScale = 0.00006;
      
      // 使用Perlin噪声创建基础云形状
      float baseShape = fbm(worldPos * baseScale);
      
      // 使用Worley噪声创建断层和空隙
      float cellNoise = worley(worldPos, 0.0001);
      
      // 组合多个噪声层
      float finalNoise = mix(baseShape, cellNoise, 0.4);
      
      // 重新映射到[0,1]范围
      return saturate(finalNoise);
    }
    
    // 云细节噪声 - 更小尺度的细节变化
    float cloudDetailNoise(vec3 worldPos) {
      float detailScale = 0.0004;
      float detail = fbm(worldPos * detailScale);
      
      // 添加一个额外的Worley噪声层,创建更真实的云空隙
      float detailWorley = worley(worldPos, 0.0008);
      
      // 混合并返回最终结果
      return mix(detail, detailWorley, 0.5);
    }
    
    // AABB射线交点
    vec4 rayBoxDst(vec3 boxMin, vec3 boxMax, vec3 rayOrigin, vec3 invRaydir) {
      vec3 t0 = (boxMin - rayOrigin) * invRaydir;
      vec3 t1 = (boxMax - rayOrigin) * invRaydir;
      vec3 tmin = min(t0, t1);
      vec3 tmax = max(t0, t1);
      
      float dstA = max(max(tmin.x, tmin.y), tmin.z);
      float dstB = min(min(tmax.x, tmax.y), tmax.z);
      
      float dstToBox = max(0.0, dstA);
      float dstInsideBox = max(0.0, dstB - dstToBox);
      
      return vec4(dstToBox, dstInsideBox, dstA, dstB);
    }
    
    // 相位函数 - Henyey-Greenstein近似
    float phaseHG(float cosTheta, float g) {
      float g2 = g * g;
      return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5) / FOUR_PI;
    }
    
    // 云密度采样函数
    float cloudDensity(vec3 worldPos, vec3 wind, inout float heightRatio) {
      // 基础覆盖率
      float coverage = cloudCoverage * cloudCoverageMultiplier;
      if (coverage <= 0.1) return 0.0;
      
      // 改进云层动态效果 - 添加多层次的风向和时间因子
      float time = float(czm_frameNumber) * 0.003; // 增大时间因子，使云动态更明显
      
      // 创建多层次的风速 - 不同高度的云层以不同速度移动
      vec3 windHigh = wind * 1.5;  // 高层云移动更快
      vec3 windMid = wind;         // 中层云正常速度
      vec3 windLow = wind * 0.8;   // 低层云移动较慢
      
      // 添加一些垂直运动和扭曲效果
      vec3 verticalMotion = vec3(
        sin(time * 0.3) * 20.0,
        cos(time * 0.2) * 15.0,
        sin(time * 0.5) * 25.0
      );
      
      // 计算当前世界位置的高度
      float height = length(worldPos) - 6378137.0;
      float cloudStart = 2200.0;
      float cloudEnd = 8000.0; 
      heightRatio = saturate((height - cloudStart) / (cloudEnd - cloudStart));
      
      // 高度范围外直接返回0
      if (heightRatio <= 0.0 || heightRatio >= 1.0) return 0.0;
      
      // 根据高度选择适当的风速
      vec3 finalWind;
      if (heightRatio > 0.7) {
        finalWind = windHigh;
      } else if (heightRatio > 0.3) {
        finalWind = mix(windMid, windHigh, (heightRatio - 0.3) / 0.4);
      } else {
        finalWind = mix(windLow, windMid, heightRatio / 0.3);
      }
      
      // 添加波状运动和旋转
      vec3 rotationalWind = vec3(
        finalWind.x + sin(time + worldPos.z * 0.0001) * 30.0,
        finalWind.y + cos(time * 0.7 + worldPos.x * 0.0001) * 20.0,
        finalWind.z + sin(time * 0.5 + worldPos.y * 0.0001) * 40.0
      );
      
      // 应用风和垂直运动到世界位置
      vec3 pos = worldPos + rotationalWind * time + verticalMotion * saturate(sin(time * 0.2) * 0.5 + 0.5);
      
      // 垂直形状曲线 - 更强的垂直轮廓
      float verticalProfile = pow(1.0 - abs(heightRatio - 0.2) * 2.0, 1.8); 
      verticalProfile = max(0.0, verticalProfile);
      
      // 获取云的整体形状 - 世界空间稳定性
      float baseShape = cloudShapeNoise(pos);
      
      // 使用baseShape计算云的分布 - 让云更加分散
      float cloudPresence = smoothstep(0.55 - coverage * 0.3, 0.85, baseShape); 
      
      // 只在cloudPresence较高的区域添加细节，形成离散的云团
      if (cloudPresence < 0.1) return 0.0;
      
      // 云的细节形状
      float detail = cloudDetailNoise(pos);
      
      // 基于高度的细节调整
      float heightDetail = mix(detail, 1.0 - detail, pow(heightRatio, 2.0));
      
      // 根据高度调整边缘锐利度 
      // 添加时间变化使云边缘动态变化
      float timeVariation = sin(time * 0.3 + pos.x * 0.0001 + pos.z * 0.0001) * 0.1;
      float edgeSharpness = mix(0.9, 0.2, heightRatio) + timeVariation;
      float cloudEdge = smoothstep(edgeSharpness - 0.05, edgeSharpness + 0.05, heightDetail);
      
      // 添加小幅度的密度波动，使云看起来在"呼吸"
      float densityPulsation = saturate(sin(time * 0.2 + worldPos.x * 0.00005) * 0.1 + 0.95);
      
      // 最终密度计算 - 基于高度分布和云形状，并随垂直高度变化
      float finalDensity = cloudPresence * cloudEdge * verticalProfile * densityPulsation;
      
      // 提高密度对比度
      finalDensity = pow(finalDensity, mix(1.5, 1.0, heightRatio));
      
      return finalDensity;
    }
    
    // 采样云内部光照
    float sampleCloudLight(vec3 position, vec3 lightDir, float height_ratio) {
      // 光照采样距离随高度变化 - 上部接收更多光照
      float distanceToSample = mix(500.0, 1000.0, height_ratio);
      
      // 光线追踪点
      vec3 lightSamplePoint = position + lightDir * distanceToSample;
      
      // 对光照采样点进行云密度采样
      float dummyHeight;
      float densityAtLight = cloudDensity(lightSamplePoint, vec3(0.0), dummyHeight);
      
      // 计算光衰减，高处云朵应接收更多光照
      float lightExtinction = exp(-densityAtLight * 2.0);
      
      // 增强上部光照和天光
      return mix(lightExtinction, 1.0, height_ratio * 0.6);
    }
    
    // 核心体积云计算函数 - 执行光线步进
    vec4 calculate_clouds(
      vec3 cameraPos,
      vec3 viewDir,
      float maxDistance,
      vec3 lightDir,
      vec3 wind,
      vec2 bounds,
      vec2 screenPos,
      float depth
    ) {
      vec4 cloudColor = vec4(0.0, 0.0, 0.0, 1.0);
      
      // 应用射线-体积相交
      float tmin = bounds.x;
      float tmax = min(bounds.y, maxDistance);
      
      if (tmin >= tmax) return cloudColor;
      
      // 选择合适的步长
      float longMarchStep = cloudMarchStep;
      float shortMarchStep = cloudDensityMarchStep;
      float marchStep = longMarchStep;
      
      // 起始距离略有抖动，提高采样质量
      float currentDistance = tmin + fract(noise2D(screenPos) * 747.5453) * longMarchStep * 0.5;
      
      // 光照参数
      vec3 sunlightColor = vec3(1.0, 0.9, 0.8) * 2.0; // 温暖的阳光色调
      vec3 skyAmbientColor = vec3(0.5, 0.7, 1.0) * 0.3; // 天空环境光
      vec3 groundAmbientColor = vec3(0.3, 0.2, 0.2) * 0.1; // 地面环境光
      
      // 散射颜色参数
      float forwardScattering = 0.8; // 前向散射系数(g值)
      float backScattering = -0.2; // 后向散射系数(g值)
      
      // 计算向前和向后散射系数
      float cosAngle = dot(viewDir, lightDir);
      float forwardPhase = phaseHG(cosAngle, forwardScattering);
      float backPhase = phaseHG(cosAngle, backScattering);
      float combinedScattering = mix(forwardPhase, backPhase, 0.5) * 2.0;
      
      // 循环参数
      vec3 accumulatedLight = vec3(0.0);
      float accumulatedDensity = 0.0;
      bool inCloud = false;
      int lightSampleCounter = 0;
      
      // 执行光线步进
      for (int i = 0; i < MAXIMUM_CLOUDS_STEPS; i++) {
        if (cloudColor.a <= 0.01 || currentDistance >= tmax || accumulatedDensity >= 1.0) break;
        
        // 计算当前采样位置
        vec3 position = cameraPos + viewDir * currentDistance;
        
        // 采样云密度
        float density = 0.0;
        float heightRatio;
        
        // 使用较大步长进行稀疏采样，找到云的边界
        density = cloudDensity(position, wind, heightRatio);
        
        // 进入云内部时使用较小步长
        if (density > 0.01) {
          if (!inCloud) {
            // 首次检测到云，回退一步并使用较小步长
            inCloud = true;
            currentDistance = max(tmin, currentDistance - longMarchStep * 0.5);
            marchStep = shortMarchStep;
            continue;
          }
          
          // 云内光照采样 - 不使用取模运算，改用计数器
          float lighting = 1.0;
          lightSampleCounter = lightSampleCounter + 1;
          if (lightSampleCounter >= 2) {
            lightSampleCounter = 0;
            lighting = sampleCloudLight(position, lightDir, heightRatio);
          }
          
          // 散射和消光
          float extinction = 0.1 * density;
          cloudColor.a *= exp(-extinction * marchStep);
          
          // 光照和散射颜色计算
          vec3 ambientLight = mix(groundAmbientColor, skyAmbientColor, heightRatio);
          vec3 sunLight = sunlightColor * lighting * combinedScattering;
          vec3 finalLight = mix(ambientLight, sunLight, lighting);
          
          vec3 cloudScattering = density * marchStep * 0.15 * finalLight;
          accumulatedLight += cloudColor.a * cloudScattering;
          accumulatedDensity += density * marchStep;
        } else if (inCloud) {
          // 离开云层，恢复使用大步长
          inCloud = false;
          marchStep = longMarchStep;
        }
        
        // 更新当前距离
        currentDistance += marchStep;
      }
      
      // 计算最终的颜色和透明度
      cloudColor.rgb = accumulatedLight;
      cloudColor.a = 1.0 - exp(-accumulatedDensity * 0.5);
      
      return cloudColor;
    }
    
    void main() {
      // 获取原始颜色
      vec4 colorSample = texture2D(colorTexture, v_textureCoordinates);
      
      // 降低分辨率提高性能 - 在非主要区域跳过计算
      vec2 screenPos = v_textureCoordinates;
      // 在屏幕边缘减少计算
      if (screenPos.x < 0.05 || screenPos.x > 0.95 || screenPos.y < 0.05 || screenPos.y > 0.95) {
        gl_FragColor = colorSample;
        return;
      }
      
      // 使用低精度深度获取，提高性能
      float depth = czm_readDepth(depthTexture, v_textureCoordinates);
      
      // 计算视线方向
      vec2 ndc = screenPos * 2.0 - 1.0;
      
      // 构建世界空间射线 - 优化矩阵计算
      vec4 rayEye = czm_inverseProjection * vec4(ndc, 1.0, 1.0);
      rayEye = vec4(rayEye.xyz / rayEye.w, 1.0);
      vec3 rayDir = normalize(rayEye.xyz);
      vec3 worldRayDir = normalize(czm_inverseViewRotation * rayDir);
      vec3 cameraPos = czm_viewerPositionWC;
      
      // 设置云层椭球体边界
      float earthRadius = 6378137.0;
          float cloudMinHeight = 2200.0; 
          float cloudMaxHeight = 8000.0;
      vec3 box_min = vec3(-earthRadius - cloudMaxHeight);
      vec3 box_max = vec3(earthRadius + cloudMaxHeight);
      
      // 检查射线是否与云层相交
      vec4 bounds = rayBoxDst(box_min, box_max, cameraPos, 1.0 / worldRayDir);
      if (bounds.y <= 0.0) {
        gl_FragColor = colorSample;
        return;
      }
      
      // 对深度值进行更快的处理
          float maxViewDistance = CLOUDS_MAX_VIEWING_DISTANCE;
      if (depth < 1.0) {
        maxViewDistance = min(maxViewDistance, 80000.0);
      }
      
          // 添加多层次风向
          // 基础风向
          vec3 baseWind = vec3(150.0, 50.0, 80.0);
          
          // 添加动态风向变化 - 加大时间系数和幅度
          float time = float(czm_frameNumber) * 0.003;
          vec3 dynamicWind = vec3(
            baseWind.x + sin(time * 0.2) * 80.0,
            baseWind.y + cos(time * 0.3) * 60.0,
            baseWind.z + sin(time * 0.1) * 100.0
          );
      
      // 执行主要的体积云渲染
      vec4 clouds = calculate_clouds(
        cameraPos,
        worldRayDir,
        maxViewDistance,
            normalize(czm_sunPositionWC), // 太阳方向
        dynamicWind,  // 使用动态风向
        bounds.xy,
        screenPos,
        depth
      );
      
          // 调整云的颜色 - 更柔和的白色
          clouds.rgb = mix(vec3(0.95, 0.97, 1.0), clouds.rgb, 0.7);
      
          // 将云与原始场景混合
          vec3 finalColor = mix(colorSample.rgb, clouds.rgb, clouds.a * 0.95);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
    `,
    uniforms: {
          noiseTexture: () => noiseTexture,
          cloudCoverage: () => cloudCoverage.value,
          cloudMaxSteps: () => qualitySetting.maxSteps,
          cloudMarchStep: () => qualitySetting.marchStep,
          cloudDensityMarchStep: () => qualitySetting.densityMarchStep,
          cloudCoverageMultiplier: () => qualitySetting.coverageMultiplier
    }
  });
  
  viewer.value.scene.postProcessStages.add(cloudStage);
  lastStage.value = cloudStage;
  currentVisualEffect.value = 'volumetricCloud';
  
  // 添加云覆盖率UI控件
  createCloudControlUI();
  
      console.log('体积云效果已启用 - 使用世界空间稳定采样，创建真实分散的云朵');
  
  // 启动性能监控
  startPerformanceMonitoring();
    })
    .catch(error => {
      console.error('加载噪声纹理失败:', error);
      alert('加载噪声纹理失败，无法创建体积云效果');
    });
};

// 视觉效果处理函数
const handleVisualEffect = (type) => {
  const access = checkFeatureAccess();
  if (!access.allowed) {
    alert(access.message);
    return;
  }
  
  if (!viewer.value) return;
  
  // 移除控制面板UI
  const cloudControl = document.getElementById('cloud-control-panel');
  if (cloudControl) {
    document.body.removeChild(cloudControl);
  }
  
  const globalCloudControl = document.getElementById('global-cloud-control');
  if (globalCloudControl) {
    document.body.removeChild(globalCloudControl);
  }
  
  const weatherControl = document.getElementById('weather-control-panel');
  if (weatherControl) {
    document.body.removeChild(weatherControl);
  }
  
  // 先清除之前的特效
  removeStage();
  
  // 防止脚本错误导致应用崩溃
  try {
    if (type === 'clear') {
      console.log('清除所有特效');
      currentVisualEffect.value = null;
      return;
    }
    
    switch (type) {
      case 'rain':
        applyRainEffect();
        break;
      case 'snow':
        applySnowEffect();
        break;
      case 'fog':
        applyFogEffect();
        break;
      case 'nightVision':
        applyNightVisionEffect();
        break;
      case 'postProcessedCloud':
        applyPostProcessedCloudEffect();
        break;
    }
  } catch (error) {
    console.error('应用视觉效果时出错:', error);
    alert('应用视觉效果失败，请检查控制台获取详细信息');
  }
};

// Cesium 初始化及鼠标事件绑定
onMounted(async () => {
  try {
    await initCesium();
    setupEventHandlers();
    setupEntityClickHandler();
    isInitialized.value = true;
    
    // 初始化用户信息
    initUserInfo();
    
    // 初始化完成后从后端加载图层数据
    loadLayersFromBackend();
    
    // 加载可用的天空盒列表
    loadAvailableSkyboxes();
  } catch (error) {
    console.error('初始化失败:', error);
  }
});

function initCesium() {
  return new Promise((resolve) => {
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiOTE1YmRiZi1hM2E3LTQ5NGUtYTI4Yy0yYTI1YjRmNmZiMzMiLCJpZCI6MjgyOTIwLCJpYXQiOjE3NDE2MTA2NTB9.bNbSodak59xJkrGIOiPcaAjaRQ3H4iJExEQiHjXDdqo';
    
    // 在创建时隐藏所有默认组件
    viewer.value = new Cesium.Viewer('cesiumContainer', {
      scene3DOnly: true,
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      fullscreenButton: false,
      shadows: false,
      terrainShadows: Cesium.ShadowMode.DISABLED,
    });
    
    // 移除Cesium logo和版权信息
    viewer.value._cesiumWidget._creditContainer.style.display = 'none';
    
    // 禁用天空大气层，移除地球边缘的白光效果
    viewer.value.scene.skyAtmosphere.show = false;
    
    // 设置初始相机位置为武汉
    viewer.value.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 150000),
      orientation: {
        heading: 0.0,
        pitch: -Cesium.Math.PI_OVER_TWO,
        roll: 0.0
      }
    });
    
    // 初始化各组件
    if (cameraControl.value) {
      cameraControl.value.initialize();
      console.log('相机控制组件初始化完成');
    }
    
    // 初始化地形影像组件
    if (terrainImagery.value) {
      terrainImagery.value.switchImagery('cesiumDefault');
      console.log('地形影像组件初始化完成');
    }
    
    resolve();
  });
}

// 记录信息窗口点击事件处理程序
let entityClickHandler = null;
let entityClickHandlerEnabled = true; // 添加状态变量跟踪是否启用

// 禁用实体点击处理功能
function disableEntityClickHandler() {
  entityClickHandlerEnabled = false;
  console.log('已禁用属性查询窗口功能');
}

// 启用实体点击处理功能
function enableEntityClickHandler() {
  entityClickHandlerEnabled = true;
  console.log('已恢复属性查询窗口功能');
}

function setupEventHandlers() {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.value.canvas);
  handler.setInputAction((clickEvent) => {
    if (!isCoordinatePickingEnabled.value) return;
    
    // 移除之前的标记
    if (currentMarker.value) {
      viewer.value.entities.remove(currentMarker.value);
      currentMarker.value = null;
    }
    
    // 先尝试从地形获取高度信息的点（包含高程值）
    const ray = viewer.value.camera.getPickRay(clickEvent.position);
    const cartesian = viewer.value.scene.globe.pick(ray, viewer.value.scene);
    
    if (cartesian) {
      // 从地形点获取坐标
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
      const height = cartographic.height.toFixed(2);
      
      // 保存详细坐标信息
      selectedCoordinate.value = {
        cartesian,
        longitude,
        latitude,
        height,
        // 添加笛卡尔坐标的格式化显示
        cartesianX: cartesian.x.toFixed(2),
        cartesianY: cartesian.y.toFixed(2),
        cartesianZ: cartesian.z.toFixed(2)
      };
      
      // 添加标记
      currentMarker.value = viewer.value.entities.add({
        position: cartesian,
        billboard: {
          image: createPinCanvas(),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 1.0,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    } else {
      // 如果从地形获取失败，则使用椭球体拾取（不包含高程）
      const ellipsoidCartesian = viewer.value.camera.pickEllipsoid(clickEvent.position, viewer.value.scene.globe.ellipsoid);
      if (ellipsoidCartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(ellipsoidCartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
        
        // 保存详细坐标信息（无高程值）
        selectedCoordinate.value = {
          cartesian: ellipsoidCartesian,
          longitude,
          latitude,
          height: '0.00',
          // 添加笛卡尔坐标的格式化显示
          cartesianX: ellipsoidCartesian.x.toFixed(2),
          cartesianY: ellipsoidCartesian.y.toFixed(2),
          cartesianZ: ellipsoidCartesian.z.toFixed(2)
        };
        
        // 添加标记
        currentMarker.value = viewer.value.entities.add({
          position: ellipsoidCartesian,
          billboard: {
            image: createPinCanvas(),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            scale: 1.0,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 创建包含📍的Canvas
function createPinCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = '50px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📍', 32, 25);
  return canvas;
}

// 切换右侧边栏显示/隐藏
function toggleRightSidebar() {
  showRightSidebar.value = !showRightSidebar.value;
}

// 添加refreshLayerLists函数
function refreshLayerLists() {
  // 更新影像图层版本，触发重新计算
  imageryLayersVersion.value++;
  
  // 其他类型的图层通过Vue的响应式数据自动更新
  // 如果有必要，这里可以进行其他更新操作
  
  console.log('已刷新图层列表');
}

// 添加处理飞行到搜索位置的函数
function handleFlyToLocation(location) {
  if (!location || !location.longitude || !location.latitude) return;
  
  // 创建位置标记
  const position = Cesium.Cartesian3.fromDegrees(
    location.longitude,
    location.latitude
  );
  
  // 创建标记实体
  const entity = viewer.value.entities.add({
    position: position,
    name: location.name,
    description: location.address,
    billboard: {
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iIzNCODJGNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI0Ii8+PC9zdmc+',
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      scale: 0.5
    },
    label: {
      text: location.name,
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      outlineColor: Cesium.Color.fromCssColorString('#3B82F6'),
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(0, 10)
    }
  });
  
  // 5秒后移除标记
  setTimeout(() => {
    viewer.value.entities.remove(entity);
  }, 10000);
  
  // 相机飞行到位置
  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      location.longitude,
      location.latitude,
      1500 // 高度
    ),
    orientation: {
      heading: 0.0,
      pitch: -Cesium.Math.PI_OVER_TWO, // 完全俯视
      roll: 0.0
    },
    duration: 3.0
  });
}

// 添加实体点击处理函数
function setupEntityClickHandler() {
  if (!viewer.value) return;

  // 如果已经存在处理程序，先移除它以避免重复
  if (entityClickHandler) {
    entityClickHandler.destroy();
    entityClickHandler = null;
  }
  
  // 先检查是否已经存在信息窗口元素，如果存在则移除
  const existingInfoBox = document.getElementById('customInfoBox');
  if (existingInfoBox) {
    document.body.removeChild(existingInfoBox);
  }
  
  // 创建自定义信息窗口元素
  const infoBoxContainer = document.createElement('div');
  infoBoxContainer.id = 'customInfoBox';
  infoBoxContainer.className = 'custom-info-box';
  document.body.appendChild(infoBoxContainer);
  
  // 点击事件处理
  entityClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.value.canvas);
  entityClickHandler.setInputAction((click) => {
    // 如果禁用了点击处理，则不处理点击事件
    if (!entityClickHandlerEnabled) return;
    
    const pickedObject = viewer.value.scene.pick(click.position);
    
    // 隐藏之前的信息窗口
    infoBoxContainer.style.display = 'none';
    
    // 如果没有点到任何物体，直接返回
    if (!Cesium.defined(pickedObject)) {
      return;
    }
    
    let content = '';
    let windowPosition = click.position;
    let entity = null;
    let entityType = '';
    
    // 处理3DTiles模型拾取
    if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
      const feature = pickedObject;
      const propertyIds = feature.getPropertyIds();
      const featureName = getFeaturePropertyValue(feature, ['name', 'Name', 'NAME', 'title', 'Title', 'id', 'ID']) || '未命名特征';
      entityType = '3D Tiles';
      
      // 创建内容
      content = `
        <div class="info-header">
          <h3 title="${featureName}">${featureName}</h3>
          <button class="close-btn" title="关闭">&times;</button>
        </div>
        <div class="info-body">
          <div class="entity-type-badge">${entityType}</div>
          <div class="description"><p>3D Tiles 特征</p></div>
      `;
      
      // 添加属性信息
      if (propertyIds && propertyIds.length > 0) {
        content += `
          <div class="properties">
            <div class="props-title">属性信息</div>
            <div class="props-container">
        `;
        
        propertyIds.forEach(propertyId => {
          const value = feature.getProperty(propertyId);
          if (value !== undefined && propertyId !== 'name' && propertyId !== 'Name') {
            content += `<div class="prop-row"><span>${propertyId}:</span> <span title="${value}">${value}</span></div>`;
          }
        });
        
        content += `
            </div>
          </div>
        `;
      }
      
      content += `
        <div class="info-footer">
          ${entityType === '点标记' ? '<button class="info-action-btn highlight-btn" title="高亮显示">高亮显示</button>' : ''}
        </div>
      </div>`;
    }
    // 处理普通实体拾取
    else if (Cesium.defined(pickedObject.id)) {
      entity = pickedObject.id;
      entityType = getEntityType(entity);
      
      // 获取实体名称（尝试多种可能的命名方式）
      let name = '未命名实体';
      if (typeof entity.name === 'string') {
        name = entity.name;
      } else if (entity.name && typeof entity.name.getValue === 'function') {
        const nameValue = entity.name.getValue(Cesium.JulianDate.now());
        if (nameValue) name = nameValue;
      } else if (entity.id && typeof entity.id === 'string') {
        name = entity.id;
      }
      
      // 获取描述
      let description = '无描述信息';
      if (entity.description) {
        if (typeof entity.description === 'string') {
          description = entity.description;
        } else if (typeof entity.description.getValue === 'function') {
          const descValue = entity.description.getValue(Cesium.JulianDate.now());
          if (descValue) description = descValue;
        }
      }
      
      // 创建内容
      content = `
        <div class="info-header">
          <h3 title="${name}">${name}</h3>
          <button class="close-btn" title="关闭">&times;</button>
        </div>
        <div class="info-body">
          <div class="entity-type-badge">${entityType}</div>
      `;
      
      // 如果是HTML描述
      if (description.includes('<')) {
        content += `<div class="description">${description}</div>`;
      } else {
        content += `<div class="description"><p>${description}</p></div>`;
      }
      
      // 如果有坐标信息
      if (entity.position) {
        let cartesian;
        if (typeof entity.position === 'object' && typeof entity.position.getValue === 'function') {
          cartesian = entity.position.getValue(Cesium.JulianDate.now());
        } else if (entity.position instanceof Cesium.Cartesian3) {
          cartesian = entity.position;
        }
        
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
          const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
          const height = cartographic.height.toFixed(2);
          
          content += `
            <div class="coordinates">
              <div class="coords-title">位置信息</div>
              <div class="coords-container">
                <div class="coords-row"><span>经度:</span> <span>${longitude}°</span></div>
                <div class="coords-row"><span>纬度:</span> <span>${latitude}°</span></div>
                <div class="coords-row"><span>高度:</span> <span>${height} 米</span></div>
                <div class="copy-coords-btn" data-coords="${latitude},${longitude}" title="复制坐标">复制坐标</div>
              </div>
            </div>
          `;
        }
      }
      
      // 如果有其他属性
      if (entity.properties) {
        let properties;
        if (typeof entity.properties.getValue === 'function') {
          properties = entity.properties.getValue(Cesium.JulianDate.now());
        } else {
          properties = entity.properties;
        }
        
        if (properties) {
          content += `
            <div class="properties">
              <div class="props-title">属性信息</div>
              <div class="props-container">
          `;
          
          for (const key in properties) {
            if (properties.hasOwnProperty(key) && key !== 'name' && key !== 'description') {
              let value = properties[key];
              if (typeof value === 'object' && value !== null && typeof value.getValue === 'function') {
                value = value.getValue(Cesium.JulianDate.now());
              }
              content += `<div class="prop-row"><span>${key}:</span> <span title="${value}">${value}</span></div>`;
            }
          }
          
          content += `
              </div>
            </div>
          `;
        }
      }
      
      content += `
        <div class="info-footer">
          ${entityType === '点标记' ? '<button class="info-action-btn highlight-btn" title="高亮显示">高亮显示</button>' : ''}
        </div>
      </div>`;
    } else {
      // 如果不是实体也不是3DTiles特征，可能是其他类型的primitive
      return;
    }
    
    // 更新信息窗口内容和位置
    infoBoxContainer.innerHTML = content;
    infoBoxContainer.style.left = `${windowPosition.x + 10}px`;
    infoBoxContainer.style.top = `${windowPosition.y - 10}px`;
    infoBoxContainer.style.display = 'block';
    
    // 处理关闭按钮点击
    const closeBtn = infoBoxContainer.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        infoBoxContainer.style.display = 'none';
      });
    }
    
    // 处理复制坐标按钮
    const copyBtn = infoBoxContainer.querySelector('.copy-coords-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        const coords = e.target.getAttribute('data-coords');
        navigator.clipboard.writeText(coords).then(() => {
          const originalText = e.target.textContent;
          e.target.textContent = '已复制！';
          e.target.style.backgroundColor = 'var(--success-color)';
          e.target.style.color = 'white';
          
          setTimeout(() => {
            e.target.textContent = originalText;
            e.target.style.backgroundColor = '';
            e.target.style.color = '';
          }, 1500);
        });
      });
    }
    
    // 处理高亮按钮
    const highlightBtn = infoBoxContainer.querySelector('.highlight-btn');
    if (highlightBtn && entity) {
      highlightBtn.addEventListener('click', () => {
        // 储存原始颜色
        const originalColor = entity.point?.color?.getValue(Cesium.JulianDate.now()) || Cesium.Color.WHITE;
        
        // 创建高亮闪烁效果
        let alpha = 1.0;
        let increasing = false;
        const highlightColor = Cesium.Color.YELLOW;
        
        const highlightInterval = setInterval(() => {
          if (alpha > 0.99) increasing = false;
          if (alpha < 0.5) increasing = true;
          
          alpha = increasing ? alpha + 0.05 : alpha - 0.05;
          
          if (entity.point) {
            entity.point.color = highlightColor.withAlpha(alpha);
          }
        }, 50);
        
        // 3秒后恢复原始颜色
        setTimeout(() => {
          clearInterval(highlightInterval);
          if (entity.point) {
            entity.point.color = originalColor;
          }
        }, 3000);
        
        // 更新按钮状态
        highlightBtn.textContent = '高亮中...';
        highlightBtn.disabled = true;
        
        setTimeout(() => {
          highlightBtn.textContent = '高亮显示';
          highlightBtn.disabled = false;
        }, 3000);
      });
    }
    
    // 添加拖动功能
    makeDraggable(infoBoxContainer);
    
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 辅助函数：判断实体类型
function getEntityType(entity) {
  if (entity.billboard) return '点标记';
  if (entity.polyline) return '线几何';
  if (entity.polygon) return '面几何';
  if (entity.model) return '3D模型';
  if (entity.label) return '标签';
  if (entity.rectangle) return '矩形';
  if (entity.ellipse) return '椭圆';
  if (entity.point) return '点';
  return '实体';
}

// 辅助函数：使元素可拖动
function makeDraggable(element) {
  let offsetX = 0, offsetY = 0;
  const header = element.querySelector('.info-header');
  
  if (!header) return;
  
  header.style.cursor = 'move';
  
  header.addEventListener('mousedown', (e) => {
    if (e.target.className === 'close-btn') return;
    
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    
    document.addEventListener('mousemove', moveElement);
    document.addEventListener('mouseup', stopMoving);
  });
  
  function moveElement(e) {
    element.style.left = (e.clientX - offsetX) + 'px';
    element.style.top = (e.clientY - offsetY) + 'px';
  }
  
  function stopMoving() {
    document.removeEventListener('mousemove', moveElement);
    document.removeEventListener('mouseup', stopMoving);
  }
}

// 辅助函数：从3DTiles特征获取属性值
function getFeaturePropertyValue(feature, possiblePropertyNames) {
  if (!feature) return null;
  
  for (const propertyName of possiblePropertyNames) {
    try {
      if (feature.hasProperty(propertyName)) {
        const value = feature.getProperty(propertyName);
        if (value !== undefined && value !== null) {
          return value;
        }
      }
    } catch (e) {
      console.warn(`获取属性 ${propertyName} 时出错:`, e);
    }
  }
  
  return null;
}

// 初始化用户信息
function initUserInfo() {
  const user = authAPI.getCurrentUser();
  if (user) {
    currentUser.value = user;
    console.log('用户已登录:', user.username);
  }
}

// 处理用户登录成功
function handleUserLoginSuccess(user) {
  currentUser.value = user;
  console.log('用户登录成功:', user.username);
}

// 处理用户登出
function handleUserLogout() {
  currentUser.value = null;
  console.log('用户已登出');
}

// 检查功能权限
function checkFeatureAccess() {
  if (!hasFullAccess.value) {
    return {
      allowed: false,
      message: '需要登录才能使用此功能'
    };
  }
  
  return {
    allowed: true
  };
}

// 后端图层管理相关状态
const backendLayers = ref([]);
const isLoadingData = ref(false);
const loadError = ref(null);
const errorDetails = ref(null);
const showErrorHelp = ref(false);
const connectionStatus = ref(null);
const showLayerModal = ref(false);
const isEditing = ref(false);
const layerForm = reactive({
  name: '',
  type: 'imagery',
  url: '',
  propertiesText: '{}'
});

// 测试后端连接
const testBackendConnection = async () => {
  try {
    connectionStatus.value = null;
    const response = await layersAPI.testConnection();
    connectionStatus.value = 'success';
    return true;
  } catch (error) {
    console.error('后端连接测试失败:', error);
    connectionStatus.value = 'error';
    return false;
  }
};

// 从后端加载图层
const loadLayersFromBackend = async () => {
  try {
    isLoadingData.value = true;
    loadError.value = null;
    errorDetails.value = null;
    
    const response = await layersAPI.getAll();
    if (response.success) {
      backendLayers.value = response.data;
    } else {
      throw new Error(response.error || '加载图层失败');
    }
  } catch (error) {
    console.error('加载图层失败:', error);
    loadError.value = '加载图层失败';
    errorDetails.value = error.message;
  } finally {
    isLoadingData.value = false;
  }
};

// 打开添加图层模态框
const openAddLayerModal = () => {
  isEditing.value = false;
  layerForm.name = '';
  layerForm.type = 'imagery';
  layerForm.url = '';
  layerForm.propertiesText = '{}';
  showLayerModal.value = true;
};

// 打开编辑图层模态框
const editBackendLayer = (layer) => {
  isEditing.value = true;
  layerForm.name = layer.name;
  layerForm.type = layer.type;
  layerForm.url = layer.url;
  layerForm.propertiesText = typeof layer.properties === 'string' 
    ? layer.properties 
    : JSON.stringify(layer.properties || {}, null, 2);
  showLayerModal.value = true;
};

// 关闭图层模态框
const closeLayerModal = () => {
  showLayerModal.value = false;
};

// 保存图层
const saveLayer = async () => {
  try {
    let properties;
    try {
      properties = JSON.parse(layerForm.propertiesText);
    } catch (e) {
      alert('属性必须是有效的JSON格式');
      return;
    }
    
    const layerData = {
      name: layerForm.name,
      type: layerForm.type,
      url: layerForm.url,
      properties
    };
    
    let response;
    if (isEditing.value) {
      response = await layersAPI.update(layerForm.id, layerData);
    } else {
      response = await layersAPI.create(layerData);
    }
    
    // 处理URL重复的情况
    if (response.message && response.message.includes('已存在')) {
      console.log('图层URL已存在，使用现有图层:', response.data);
      alert(`注意: ${response.message}`);
    }
    
    await loadLayersFromBackend();
    closeLayerModal();
  } catch (error) {
    console.error('保存图层失败:', error);
    
    // 检查是否是URL重复错误
    if (error.response && error.response.data && error.response.data.error && 
        error.response.data.error.includes('URL已被其他图层使用')) {
      alert('保存图层失败: ' + error.response.data.error);
    } else {
      alert('保存图层失败: ' + error.message);
    }
  }
};

// 删除后端图层
const deleteBackendLayer = async (id) => {
  if (!confirm('确定要删除这个图层吗？')) {
    return;
  }
  
  try {
    await layersAPI.delete(id);
    await loadLayersFromBackend();
  } catch (error) {
    console.error('删除图层失败:', error);
    alert('删除图层失败: ' + error.message);
  }
};

// 从后端加载图层到地图
const loadLayerFromBackend = async (layer) => {
  try {
    console.log('正在加载图层到地图:', layer);
    
    // 解析properties，确保它是一个对象
    let properties = layer.properties;
    if (typeof properties === 'string') {
      try {
        properties = JSON.parse(properties);
      } catch (e) {
        console.warn('解析图层属性失败，使用空对象');
        properties = {};
      }
    }
    
    // 我们将直接加载图层，而不需要手动再次添加
    // 因为DataLoader和TerrainImagery组件会通过事件自动添加
    
    switch (layer.type) {
      case 'imagery':
        // 使用 terrainImagery 组件的方法加载影像图层
        if (terrainImagery.value) {
          // 传递图层属性信息，支持矩形边界
          await terrainImagery.value.addImageryLayer(layer.url, layer.name, { properties });
          // 影像图层会通过事件自动刷新
        } else {
          throw new Error('地形影像组件未初始化');
        }
        break;
      case 'geojson':
        // 使用 dataLoader 组件的方法加载 GeoJSON
        if (dataLoader.value) {
          await dataLoader.value.loadGeoJSON(layer.url, layer.name);
          // GeoJSON数据源会通过事件自动添加
        } else {
          throw new Error('数据加载组件未初始化');
        }
        break;
      case '3dtiles':
      case 'tileset':
        // 使用 dataLoader 组件的方法加载 3D Tiles
        if (dataLoader.value) {
          await dataLoader.value.load3DTiles(layer.url, layer.name);
          // 3D Tiles图层会通过事件自动添加
        } else {
          throw new Error('数据加载组件未初始化');
        }
        break;
      case 'model':
      case 'gltf':
        // 使用 dataLoader 组件的方法加载 GLTF 模型
        if (dataLoader.value) {
          await dataLoader.value.loadGLTF(layer.url, layer.name);
          // 模型实体会通过事件自动添加
        } else {
          throw new Error('数据加载组件未初始化');
        }
        break;
      case 'terrain':
        // 使用 terrainImagery 组件的方法加载地形
        if (terrainImagery.value) {
          await terrainImagery.value.addTerrainLayer(layer.url, layer.name);
          // 地形没有在图层管理器中显示，只有提示消息
          console.log(`地形图层 "${layer.name}" 加载成功`);
        } else {
          throw new Error('地形影像组件未初始化');
        }
        break;
      case 'vector':
      case 'shp':
        // 使用 dataLoader 组件的方法加载 shapefile
        if (dataLoader.value) {
          await dataLoader.value.loadShapefile(layer.url, layer.name);
          // Shapefile数据源会通过事件自动添加
        } else {
          throw new Error('数据加载组件未初始化');
        }
        break;
      default:
        throw new Error('不支持的图层类型: ' + layer.type);
    }
    
    // 刷新所有图层列表
    refreshLayerLists();
    
    console.log(`图层 "${layer.name}" 加载成功`);
  } catch (error) {
    console.error('加载图层失败:', error);
    alert('加载图层失败: ' + error.message);
  }
};

// 获取图层类型标签
const getLayerTypeLabel = (type) => {
  const typeMap = {
    'imagery': '影像图层',
    'geojson': 'GeoJSON',
    '3dtiles': '3D Tiles'
  };
  return typeMap[type] || type;
};

// 缩短URL显示
const shortenUrl = (url) => {
  if (!url) return '';
  if (url.length <= 50) return url;
  return url.substring(0, 25) + '...' + url.substring(url.length - 25);
};

// 处理影像切换
function handleImagerySwitch(type) {
  if (!terrainImagery.value) {
    console.error('地形影像组件未初始化');
    return;
  }
  
  if (type === 'customUrl') {
    // 打开输入对话框或聚焦到输入框
    activeTab.value = 'terrain'; // 确保切换到地形影像面板
    // 等待DOM更新后聚焦输入框
    setTimeout(() => {
      const inputEl = document.querySelector('.custom-url-field');
      if (inputEl) inputEl.focus();
    }, 100);
    return;
  }
  
  terrainImagery.value.switchImagery(type);
}

// 处理地形切换
function handleTerrainSwitch(type) {
  if (!terrainImagery.value) {
    console.error('地形影像组件未初始化');
    return;
  }
  terrainImagery.value.switchTerrain(type);
}

// 相机控制处理函数
function handleCameraSetView(type) {
  if (!cameraControl.value) {
    console.error('相机控制组件未初始化');
    return;
  }
  
  console.log('设置相机视角:', type);
  switch (type) {
    case 'default':
      cameraControl.value.flyToWuhanTopView();
      break;
    case 'side':
      cameraControl.value.flyToWuhanSideView();
      break;
    case 'top':
      cameraControl.value.flyToWuhanTopView();
      break;
    case 'oblique':
      cameraControl.value.flyToWuhanOblique();
      break;
    case '45degree':
      cameraControl.value.flyToWuhan45Degree();
      break;
    case 'close':
      cameraControl.value.flyToCloseView();
      break;
    case 'night':
      cameraControl.value.flyToNightView();
      break;
    default:
      console.warn('未知的视角类型:', type);
  }
}

function handleCameraSetFov(type) {
  if (!cameraControl.value) {
    console.error('相机控制组件未初始化');
    return;
  }
  
  console.log('设置视场角:', type);
  switch (type) {
    case 'normal':
      cameraControl.value.setFovNormal();
      break;
    case 'wide':
      cameraControl.value.setFovWide();
      break;
    case 'ultraWide':
      cameraControl.value.setFovUltraWide();
      break;
    default:
      console.warn('未知的视场角类型:', type);
  }
}

function handleCameraReset() {
  if (!cameraControl.value) {
    console.error('相机控制组件未初始化');
    return;
  }
  console.log('重置相机位置');
  cameraControl.value.resetCamera();
}

// 添加处理图层添加事件的方法
function addGeojsonDataSource(dataSource) {
  if (!dataSource) return;
  geojsonDataSources.value.push(dataSource);
  console.log('添加 GeoJSON 数据源:', dataSource.name);
}

function addModelEntity(entity) {
  if (!entity) return;
  modelEntities.value.push(entity);
  console.log('添加模型实体:', entity.name);
}

function addTilesetLayer(tileset) {
  if (!tileset) return;
  tilesetLayers.value.push(tileset);
  console.log('添加 3D Tiles 图层:', tileset.name);
}

function addViewshedLayer(layer) {
  if (!layer) return;
  viewshedLayers.value.push(layer);
  console.log('添加可视域图层:', layer.name);
}

function addNavigationRoute(route) {
  if (!route) return;
  navigationRoutes.value.push(route);
  console.log('添加导航路线:', route.name);
}

// 数据加载处理函数
function handleDataLoaderTrigger(type) {
  if (!dataLoader.value) {
    console.error('数据加载组件未初始化');
    return;
  }
  dataLoader.value.triggerFileInput(type);
}

function handleDataLoaderLoadHttpTiles() {
  if (!dataLoader.value) {
    console.error('数据加载组件未初始化');
    return;
  }
  dataLoader.value.loadHttpTiles();
}

// 切换左侧边栏显示/隐藏
function toggleLeftSidebar() {
  leftSidebarVisible.value = !leftSidebarVisible.value;
}

// 处理图层管理器打开
function handleLayerManagerOpen() {
  showRightSidebar.value = true;
  activeTab.value = 'layers';
}

// 处理从存储加载图层
const handleStorageLayerLoad = async (layer) => {
  try {
    console.log('从存储加载图层:', layer);
    await loadLayerFromBackend(layer);
    
    // 注释掉这一行，因为在这个上下文中不需要关闭存储管理器
    // 存储管理器是嵌入在Tab中的，不是弹出式的模态框
    // showStorageManager.value = false;
    
    // 不需要再次从后端加载图层，因为loadLayerFromBackend已经将图层添加到相应的列表中
    // 否则会导致图层在列表中显示两次
    // await loadLayersFromBackend();
  } catch (error) {
    console.error('从存储加载图层失败:', error);
    alert('加载图层失败: ' + error.message);
  }
};

// 几何工具处理函数
function handleShowTools() {
  geometry.value?.showTools();
}

function handleMeasureDistance() {
  geometry.value?.measureDistance();
}

function handleMeasureArea() {
  geometry.value?.measureArea();
}

// 主题切换处理函数
function handleThemeChange(isDark) {
  isDarkTheme.value = isDark;
}

// 添加处理GeoAI命令的函数
function handleExecuteCommand(command) {
  console.log('收到GeoAI命令:', command);
  
  if (command.type === 'planRoute' && command.params) {
    const { start, end } = command.params;
    
    // 确保场景分析组件已初始化
    if (!sceneAnalysis.value) {
      console.error('场景分析组件未初始化');
      return;
    }
    
    // 调用场景分析组件的方法来设置起点和终点并搜索路线
    sceneAnalysis.value.setRouteAndSearch(start, end);
  }
  
  // 处理地形分析命令
  else if (command.type === 'contourAnalysis' && command.params) {
    // 确保场景分析组件已初始化
    if (!sceneAnalysis.value) {
      console.error('场景分析组件未初始化');
      return;
    }
    
    // 设置等高线参数
    if (command.params.spacing) {
      sceneAnalysis.value.terrainAnalysisParams.contourSpacing = command.params.spacing;
    } else {
      sceneAnalysis.value.terrainAnalysisParams.contourSpacing = 20; // 默认值
    }
    
    if (command.params.width) {
      sceneAnalysis.value.terrainAnalysisParams.contourWidth = command.params.width;
    } else {
      sceneAnalysis.value.terrainAnalysisParams.contourWidth = 1.5; // 默认值
    }
    
    // 直接生成等高线，不再显示模态框
    sceneAnalysis.value.generateContourLines();
  }
  
  // 处理天空盒切换命令
  else if (command.type === 'changeSkybox' && command.params) {
    const { skyboxType } = command.params;
    if (skyboxType) {
      handleSkyboxChange(skyboxType);
    }
  }
  
  // 处理人物漫游命令
  else if (command.type === 'startCharacterExplorer') {
    // 确保人物漫游组件已初始化
    if (!characterExplorer.value) {
      console.error('人物漫游组件未初始化');
      return;
    }
    
    // 启动人物漫游
    characterExplorer.value.toggleActive();
  }
  
  // 处理特定位置的人物漫游
  else if (command.type === 'characterExplorerAt' && command.params) {
    // 确保人物漫游组件已初始化
    if (!characterExplorer.value) {
      console.error('人物漫游组件未初始化');
      return;
    }
    
    const { location } = command.params;
    
    if (location) {
      // 打开人物漫游，并通过定位到指定位置
      // 首先飞行到指定位置
      if (cameraControl.value) {
        // 使用地理编码服务查找位置
        // 这里简化处理，假设是中国城市，使用固定的坐标数据
        const cityCoordinates = {
          '武汉': { longitude: 114.3162, latitude: 30.5810 },
          '北京': { longitude: 116.3912, latitude: 39.9073 },
          '上海': { longitude: 121.4737, latitude: 31.2304 },
          '广州': { longitude: 113.2644, latitude: 23.1291 },
          '深圳': { longitude: 114.0579, latitude: 22.5431 },
          '成都': { longitude: 104.0668, latitude: 30.5728 },
          '杭州': { longitude: 120.1551, latitude: 30.2741 },
          '西安': { longitude: 108.9402, latitude: 34.3416 },
          '重庆': { longitude: 106.5511, latitude: 29.5637 },
          '南京': { longitude: 118.7969, latitude: 32.0603 }
        };
        
        // 尝试匹配城市
        let coords = cityCoordinates[location];
        
        if (coords) {
          // 飞行到该位置
          viewer.value.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(coords.longitude, coords.latitude, 1000),
            orientation: {
              heading: 0.0,
              pitch: Cesium.Math.toRadians(-30),
              roll: 0.0
            },
            complete: function() {
              // 飞行完成后启动人物漫游
              setTimeout(() => {
                characterExplorer.value.toggleActive();
              }, 500);
            }
          });
        } else {
          // 如果找不到位置，直接启动人物漫游
          characterExplorer.value.toggleActive();
        }
      } else {
        // 如果相机控制不可用，直接启动人物漫游
        characterExplorer.value.toggleActive();
      }
    } else {
      // 没有位置信息，直接启动人物漫游
      characterExplorer.value.toggleActive();
    }
  }
  
  // 处理城市加载命令
  else if (command.type === 'loadCity' && command.params) {
    // 确保实景城市组件已初始化
    if (!realityCity.value) {
      console.error('实景城市组件未初始化');
      return;
    }
    
    const { city } = command.params;
    
    if (city) {
      // 查找城市坐标数据
      const cityCoordinates = {
        '武汉': { name: '武汉', longitude: 114.3162, latitude: 30.5810 },
        '北京': { name: '北京', longitude: 116.3912, latitude: 39.9073 },
        '上海': { name: '上海', longitude: 121.4737, latitude: 31.2304 },
        '广州': { name: '广州', longitude: 113.2644, latitude: 23.1291 },
        '深圳': { name: '深圳', longitude: 114.0579, latitude: 22.5431 },
        '成都': { name: '成都', longitude: 104.0668, latitude: 30.5728 },
        '杭州': { name: '杭州', longitude: 120.1551, latitude: 30.2741 },
        '西安': { name: '西安', longitude: 108.9402, latitude: 34.3416 },
        '重庆': { name: '重庆', longitude: 106.5511, latitude: 29.5637 },
        '南京': { name: '南京', longitude: 118.7969, latitude: 32.0603 }
      };
      
      // 尝试匹配城市
      const cityData = cityCoordinates[city];
      if (cityData) {
        // 直接加载城市，不再打开选择器
        realityCity.value.loadCityBuildings(cityData.name, cityData.longitude, cityData.latitude);
      } else {
        // 如果找不到城市，直接打开城市选择器让用户选择
        realityCity.value.openCitySelector();
      }
    } else {
      // 没有具体城市，打开城市选择器
      realityCity.value.openCitySelector();
    }
  }
  
  // 处理打开城市选择器命令
  else if (command.type === 'openCitySelector') {
    // 确保实景城市组件已初始化
    if (!realityCity.value) {
      console.error('实景城市组件未初始化');
      return;
    }
    
    // 打开城市选择器
    realityCity.value.openCitySelector();
  }
}

// 新增自定义URL影像加载
const customImageryUrl = ref('');
const handleLoadCustomImagery = () => {
  if (!terrainImagery.value) return;
  
  if (!customImageryUrl.value.trim()) {
    alert('请输入有效的URL');
    return;
  }
  
  try {
    terrainImagery.value.loadCustomImagery(customImageryUrl.value);
    customImageryUrl.value = '';
  } catch (error) {
    console.error('加载自定义影像失败:', error);
    alert('加载影像失败: ' + error.message);
  }
};

// 监听activeTab变化，确保非管理员不能访问已发布数据页面

watch(activeTab, (newTab) => {
  if (newTab === 'backendLayers' && !isAdmin.value) {
    // 如果用户不是管理员但试图访问已发布数据页面，则自动切换到图层页面
    activeTab.value = 'layers';
    console.log('权限不足，无法访问已发布数据管理页面');
  }
});

// 添加处理实景城市事件的函数
function handleRealityCityEvent(eventType) {
  if (!realityCity.value) return;
  
  console.log(`执行实景城市事件: ${eventType}`);
  
  switch (eventType) {
    case 'load':
      realityCity.value.openCitySelector();
      break;
    case 'snow':
      realityCity.value.toggleSnowEffect();
      break;
    case 'rain':
      realityCity.value.toggleRainEffect();
      break;
    case 'clear':
      realityCity.value.clearEffects();
      break;
    default:
      console.warn('未知的实景城市事件类型:', eventType);
  }
}

// 处理天空盒切换
function handleSkyboxChange(type) {
  if (!viewer.value) return;
  
  // 记录当前天空盒类型
  currentSkybox.value = type;
  
  // 根据类型切换天空盒
  switch (type) {
    case 'default':
      // 恢复默认天空盒
      viewer.value.scene.skyBox = new Cesium.SkyBox({
        sources: {
          positiveX: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_px.jpg'),
          negativeX: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_mx.jpg'),
          positiveY: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_py.jpg'),
          negativeY: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_my.jpg'),
          positiveZ: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_pz.jpg'),
          negativeZ: Cesium.buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_mz.jpg')
        }
      });
      console.log('已切换到默认天空盒');
      break;
    default:
      // 动态加载其他天空盒
      viewer.value.scene.skyBox = new Cesium.SkyBox({
        sources: {
          positiveX: `skybox/${type}/px.png`,
          negativeX: `skybox/${type}/nx.png`,
          positiveY: `skybox/${type}/pz.png`,
          negativeY: `skybox/${type}/nz.png`,
          positiveZ: `skybox/${type}/py.png`,
          negativeZ: `skybox/${type}/ny.png`
        }
      });
      console.log(`已切换到${type}天空盒`);
  }
  
  // 强制场景刷新
  viewer.value.scene.requestRender();
}

// 替换天空盒按钮为下拉框
const selectedSkybox = ref('default');
const availableSkyboxes = ref(['default']);

// 添加计算属性筛选非default的天空盒
const nonDefaultSkyboxes = computed(() => {
  return availableSkyboxes.value.filter(skybox => skybox !== 'default');
});

// 添加加载可用天空盒列表的函数
async function loadAvailableSkyboxes() {
  try {
    const skyboxes = await skyboxAPI.getAll();
    if (Array.isArray(skyboxes) && skyboxes.length > 0) {
      // 确保'default'始终在列表中
      if (!skyboxes.includes('default')) {
        skyboxes.unshift('default');
      }
      availableSkyboxes.value = skyboxes;
    }
    console.log('可用天空盒:', availableSkyboxes.value);
  } catch (error) {
    console.error('加载天空盒列表失败:', error);
  }
}

// 创建云覆盖率UI控件
const createCloudCoverageUI = () => {
  // 移除可能存在的上一个控件
  const existingControl = document.getElementById('cloud-coverage-control');
  if (existingControl) {
    document.body.removeChild(existingControl);
  }
  
  // 创建新控件
  const controlDiv = document.createElement('div');
  controlDiv.id = 'cloud-coverage-control';
  controlDiv.className = 'cloud-coverage-control';
  
  const label = document.createElement('label');
  label.textContent = '云覆盖率:';
  label.className = 'cloud-coverage-label';
  
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '1';
  slider.step = '0.01';
  slider.value = cloudCoverage.value.toString();
  slider.className = 'cloud-coverage-slider';
  
  const valueDisplay = document.createElement('span');
  valueDisplay.textContent = slider.value;
  valueDisplay.className = 'cloud-coverage-value';
  
  slider.addEventListener('input', (e) => {
    const newValue = parseFloat(e.target.value);
    cloudCoverage.value = newValue;
    valueDisplay.textContent = newValue.toFixed(2);
  });
  
  controlDiv.appendChild(label);
  controlDiv.appendChild(slider);
  controlDiv.appendChild(valueDisplay);
  
  document.body.appendChild(controlDiv);
};

// 改进后的云控制UI，包含覆盖率和质量控制
const createCloudControlUI = () => {
  // 移除可能存在的上一个控件
  const existingControl = document.getElementById('cloud-control-panel');
  if (existingControl) {
    document.body.removeChild(existingControl);
  }
  
  // 创建控制面板
  const controlPanel = document.createElement('div');
  controlPanel.id = 'cloud-control-panel';
  controlPanel.className = 'cloud-control-panel';
  
  // 启用可拖动功能
  controlPanel.setAttribute('draggable', 'true');
  
  // 根据左侧边栏状态调整位置
  controlPanel.style.left = leftSidebarVisible.value ? 'calc(220px + 10px)' : '10px';
  // 在左侧边栏状态变化时调整位置
  const adjustPosition = () => {
    controlPanel.style.left = leftSidebarVisible.value ? 'calc(220px + 10px)' : '10px';
  };
  
  // 监听左侧边栏状态变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        adjustPosition();
      }
    });
  });
  
  // 获取左侧边栏元素
  setTimeout(() => {
    const sidebar = document.querySelector('.left-sidebar');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true });
    }
  }, 100);
  
  // 添加拖动功能
  let isDragging = false;
  let offsetX, offsetY;
  
  controlPanel.addEventListener('dragstart', (e) => {
    isDragging = true;
    const rect = controlPanel.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    // 创建一个透明的拖动图像
    const dragImg = new Image();
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(dragImg, 0, 0);
    
    controlPanel.style.opacity = '0.7';
  });
  
  controlPanel.addEventListener('dragend', (e) => {
    isDragging = false;
    controlPanel.style.opacity = '1';
    
    const left = e.clientX - offsetX;
    const top = e.clientY - offsetY;
    
    // 确保面板不会被拖出屏幕
    controlPanel.style.left = `${Math.max(0, Math.min(window.innerWidth - 250, left))}px`;
    controlPanel.style.top = `${Math.max(0, Math.min(window.innerHeight - 100, top))}px`;
    controlPanel.style.bottom = 'auto';
  });
  
  // 添加标题
  const title = document.createElement('h3');
  title.textContent = '体积云控制';
  title.className = 'cloud-control-title';
  controlPanel.appendChild(title);
  
  // 添加云覆盖率控制
  const coverageContainer = document.createElement('div');
  coverageContainer.className = 'cloud-control-container';
  
  const coverageLabel = document.createElement('label');
  coverageLabel.textContent = '云覆盖率:';
  coverageLabel.className = 'cloud-control-label';
  
  const coverageSlider = document.createElement('input');
  coverageSlider.type = 'range';
  coverageSlider.min = '0';
  coverageSlider.max = '1';
  coverageSlider.step = '0.01';
  coverageSlider.value = cloudCoverage.value.toString();
  coverageSlider.className = 'cloud-control-slider';
  
  const coverageValue = document.createElement('span');
  coverageValue.textContent = cloudCoverage.value.toFixed(2);
  coverageValue.className = 'cloud-control-value';
  
  coverageSlider.addEventListener('input', (e) => {
    const newValue = parseFloat(e.target.value);
    cloudCoverage.value = newValue;
    coverageValue.textContent = newValue.toFixed(2);
  });
  
  coverageContainer.appendChild(coverageLabel);
  coverageContainer.appendChild(coverageSlider);
  coverageContainer.appendChild(coverageValue);
  controlPanel.appendChild(coverageContainer);
  
  // 添加质量选择
  const qualityContainer = document.createElement('div');
  qualityContainer.className = 'cloud-control-container';
  
  const qualityLabel = document.createElement('label');
  qualityLabel.textContent = '云质量:';
  qualityLabel.className = 'cloud-control-label';
  
  const qualitySelect = document.createElement('select');
  qualitySelect.className = 'cloud-quality-selector';
  
  cloudQualitySettings.forEach((setting, index) => {
    const option = document.createElement('option');
    option.value = index.toString();
    option.text = `${setting.label}质量`;
    
    if (index === currentCloudQuality.value) {
      option.selected = true;
    }
    
    qualitySelect.appendChild(option);
  });
  
  qualitySelect.addEventListener('change', (e) => {
    const index = parseInt(e.target.value);
    currentCloudQuality.value = index;
    // 重新应用效果
    if (currentVisualEffect.value === 'volumetricCloud') {
      applyVolumetricCloudEffect();
    }
  });
  
  qualityContainer.appendChild(qualityLabel);
  qualityContainer.appendChild(qualitySelect);
  controlPanel.appendChild(qualityContainer);
  
  // FPS显示
  const fpsContainer = document.createElement('div');
  fpsContainer.className = 'cloud-control-container';
  
  const fpsLabel = document.createElement('label');
  fpsLabel.textContent = 'FPS:';
  fpsLabel.className = 'cloud-control-label';
  
  const fpsValue = document.createElement('span');
  fpsValue.id = 'cloud-fps-value';
  fpsValue.textContent = '-- FPS';
  fpsValue.className = 'cloud-control-value';
  
  fpsContainer.appendChild(fpsLabel);
  fpsContainer.appendChild(fpsValue);
  controlPanel.appendChild(fpsContainer);
  
  // 添加关闭按钮
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '<span>关闭面板</span>';
  closeButton.className = 'cloud-control-close';
  closeButton.addEventListener('click', () => {
    // 淡出动画
    controlPanel.style.opacity = '0';
    controlPanel.style.transform = 'scale(0.95)';
    setTimeout(() => {
      try {
        document.body.removeChild(controlPanel);
      } catch (e) {
        console.warn('移除控制面板失败:', e);
      }
    }, 300);
  });
  controlPanel.appendChild(closeButton);
  
  // 设置控制面板的初始转换效果
  controlPanel.style.opacity = '0';
  controlPanel.style.transform = 'scale(0.95)';
  
  // 添加到文档
  document.body.appendChild(controlPanel);
  
  // 触发渲染后淡入动画
  setTimeout(() => {
    controlPanel.style.opacity = '1';
    controlPanel.style.transform = 'scale(1)';
  }, 10);
};

// 性能监控功能
let fpsHistory = [];
let performanceMonitoringActive = false;
const targetFPS = 30;

// 开始性能监控
const startPerformanceMonitoring = () => {
  if (performanceMonitoringActive) return;
  
  performanceMonitoringActive = true;
  fpsHistory = [];
  
  const monitorPerformance = () => {
    if (currentVisualEffect.value !== 'volumetricCloud') {
      performanceMonitoringActive = false;
      return;
    }
    
    const fps = Math.round(1000 / (viewer.value.scene.frameState.deltaTime || 16.7));
    fpsHistory.push(fps);
    
    // 更新FPS显示
    const fpsElement = document.getElementById('cloud-fps-value');
    if (fpsElement) {
      fpsElement.textContent = `${fps} FPS`;
      
      // 根据FPS变化颜色提示性能
      if (fps < 20) {
        fpsElement.style.color = '#ff4d4d'; // 红色表示性能差
      } else if (fps < 30) {
        fpsElement.style.color = '#ffcc00'; // 黄色表示性能一般
      } else {
        fpsElement.style.color = '#66ff66'; // 绿色表示性能好
      }
    }
    
    // 自动降低质量以保持性能
    if (fpsHistory.length > 30) {
      fpsHistory.shift();
      const avgFPS = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
      
      // 性能过低时自动降低质量
      if (avgFPS < targetFPS * 0.7 && currentCloudQuality.value > 0) {
        currentCloudQuality.value--;
        console.log(`性能优化: 自动降低云质量以提高FPS (当前FPS: ${avgFPS.toFixed(1)})`);
        fpsHistory = [];
        applyVolumetricCloudEffect();
      }
    }
    
    requestAnimationFrame(monitorPerformance);
  };
  
  // 开始监控
  requestAnimationFrame(monitorPerformance);
};

// 检测设备类型
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 后处理体积云特效
const applyPostProcessedCloudEffect = () => {
  removeStage();
  
  // 检查WebGL功能
  try {
    const canvas = viewer.value.canvas;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL不可用，无法创建后处理体积云效果');
      return;
    }
  } catch (e) {
    console.error('检查WebGL时出错:', e);
    return;
  }
  
  // 确保每帧更新云动画
  const cloudAnimationCallback = () => {
    if (currentVisualEffect.value === 'postProcessedCloud' && lastStage.value) {
      // 强制更新uniform以保证动画
      lastStage.value.dirty = true;
      // 请求下一帧继续更新
      requestAnimationFrame(cloudAnimationCallback);
    }
  };
  
  // 启动动画循环
  requestAnimationFrame(cloudAnimationCallback);
  
  // 首先加载噪声纹理
  Cesium.Resource.createIfNeeded("./noise.png")
    .fetchImage()
    .then(noiseImage => {
      // 创建噪声纹理
      const noiseTexture = new Cesium.Texture({
        context: viewer.value.scene.context,
        source: noiseImage,
        sampler: new Cesium.Sampler({
          wrapS: Cesium.TextureWrap.REPEAT,
          wrapT: Cesium.TextureWrap.REPEAT,
          minificationFilter: Cesium.TextureMinificationFilter.LINEAR,
          magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR,
        })
      });
      
      // 定义云层参数
      const cloudParams = {
        cloudCover: 0.45,
        cloudBase: 2000,        // 云底高度
        cloudTop: 5000,         // 云顶高度
        cloudThickness: 3000,   // 云层厚度
        cloudBaseRadius: 6378137.0 + 2000,  // 地球半径 + 云底高度
        cloudTopRadius: 6378137.0 + 5000,   // 地球半径 + 云顶高度
        windVector: new Cesium.Cartesian3(150, 80, 50),  // 更丰富的风向向量
        windSpeed: 2.0,         // 风速系数，更快的默认速度
        cloudBrightness: 2.5,   // 云亮度系数
        exposure: 1.2,          // 曝光度
        cloudHeightOffset: 0.0, // 新增: 云层高度偏移量
        windTurbulence: 1.5     // 新增: 风向湍流系数
      };
      
      // 创建全球体积云着色器
      const globalCloudStage = new Cesium.PostProcessStage({
        name: "czm_globalVolumetricCloud",
        fragmentShader: `
          precision highp float;
          
          uniform sampler2D colorTexture;
          uniform sampler2D depthTexture;
          uniform sampler2D noiseMap;
          varying vec2 v_textureCoordinates;
          
          // 云层参数
          uniform float realPlanetRadius;
          uniform float cloudCover;
          uniform float cloudBase;
          uniform float cloudTop;
          uniform float cloudThickness;
          uniform float cloudBaseRadius;
          uniform float cloudTopRadius;
          uniform vec3 windVector;
          uniform float windSpeed;         // 风速系数
          uniform float cloudBrightness;   // 云亮度系数
          uniform float exposure;          // 曝光度
          uniform float cloudHeightOffset; // 云层高度偏移量
          uniform float windTurbulence;    // 风向湍流系数
          
          // 常量定义
          const float PI = 3.14159265359;
          const float TWO_PI = 6.28318530718;
          const float FOUR_PI = 12.5663706144;
          const float windSpeedRatio = 0.0002;
          
          #define CLOUDS_MAX_LOD 1
          #define CLOUDS_MARCH_STEP 500.0
          #define CLOUDS_DENS_MARCH_STEP 100.0
          #define MAXIMUM_CLOUDS_STEPS 300
          #define CLOUDS_MAX_VIEWING_DISTANCE 250000.0
          
          // 射线与球体相交
          vec2 raySphereIntersect(vec3 r0, vec3 rd, float sr) {
            float a = dot(rd, rd);
            float b = 2.0 * dot(rd, r0);
            float c = dot(r0, r0) - (sr * sr);
            float d = (b * b) - 4.0 * a * c;
            
            if (d < 0.0) return vec2(-1.0, -1.0);
            float squaredD = sqrt(d);
            
            return vec2(
              (-b - squaredD) / (2.0 * a),
              (-b + squaredD) / (2.0 * a)
            );
          }
          
          // 实用函数
          float saturate(float value) {
            return clamp(value, 0.0, 1.0);
          }
          
          float isotropic() {
            return 0.07957747154594767; // 1.0 / (4.0 * PI)
          }
          
          float rayleigh(float costh) {
            return (3.0 / (16.0 * PI)) * (1.0 + pow(costh, 2.0));
          }
          
          float Schlick(float k, float costh) {
            return (1.0 - k * k) / (FOUR_PI * pow(1.0 - k * costh, 2.0));
          }
          
          // 哈希函数
          float hash(float p) {
            p = fract(p * 0.1031);
            p *= p + 33.33;
            p *= p + p;
            return fract(p);
          }
          
          // 噪声函数
          float noise(in vec3 x) {
            vec3 p = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            
            float n = p.x + p.y * 157.0 + 113.0 * p.z;
            return mix(
              mix(
                mix(hash(n+0.0), hash(n+1.0), f.x),
                mix(hash(n+157.0), hash(n+158.0), f.x),
                f.y
              ),
              mix(
                mix(hash(n+113.0), hash(n+114.0), f.x),
                mix(hash(n+270.0), hash(n+271.0), f.x),
                f.y
              ),
              f.z
            );
          }
          
          // 云密度计算
          float cloudDensity(vec3 p, vec3 wind, int lod, inout float heightRatio) {
            float finalCoverage = cloudCover;
            if (finalCoverage <= 0.1) {
              return 0.0;
            }
            
            // 应用云层高度偏移量
            float heightOffset = cloudHeightOffset;
            
            // 计算高度比例
            float height = length(p) - realPlanetRadius;
            // 添加高度偏移到云层范围计算中
            heightRatio = saturate((height - (cloudBase + heightOffset)) / cloudThickness);
            if (heightRatio <= 0.0 || heightRatio >= 1.0) {
              return 0.0;
            }
            
            // 基础时间因子 - 增大系数使动画更明显
            float time = float(czm_frameNumber) * 0.002 * windSpeed;
            
            // 创建多层次风速 - 不同高度的云层以不同速度移动
            vec3 windHigh = wind * 1.8;  // 高层云移动更快
            vec3 windMid = wind;         // 中层云正常速度
            vec3 windLow = wind * 0.6;   // 低层云移动较慢
            
            // 根据高度使用不同速度的风
            vec3 layeredWind;
            if (heightRatio > 0.7) {
              layeredWind = windHigh;
            } else if (heightRatio > 0.3) {
              layeredWind = mix(windMid, windHigh, (heightRatio - 0.3) / 0.4);
            } else {
              layeredWind = mix(windLow, windMid, heightRatio / 0.3);
            }
            
            // 添加湍流和旋转运动，使云层运动更自然
            float turbulenceFactor = windTurbulence;
            vec3 turbulence = vec3(
              sin(time * 0.3 + p.z * 0.00008) * turbulenceFactor * 100.0,
              cos(time * 0.2 + p.x * 0.00007) * turbulenceFactor * 80.0,
              sin(time * 0.4 + p.y * 0.00009) * turbulenceFactor * 120.0
            );
            
            // 添加垂直运动
            vec3 verticalMotion = vec3(
              0.0,
              sin(time * 0.1 + p.x * 0.00005) * 20.0,
              0.0
            );
            
            // 让云层随风飘动，加入湍流和垂直运动
            vec3 pos = p + layeredWind * time + turbulence + verticalMotion * saturate(sin(time * 0.1) * 0.5 + 0.5);
            
            // 基础形状噪声
            float scale = 0.00006;
            float baseNoise = noise(pos * scale);
            float baseShape = baseNoise;
            
            // 添加更多细节噪声层
            if (lod < CLOUDS_MAX_LOD) {
              baseShape += noise(pos * scale * 2.0) * 0.5;
              baseShape += noise(pos * scale * 4.0) * 0.25;
              baseShape *= 0.57; // 归一化
            }
            
            // 计算云形状
            float shape = saturate((baseShape - (1.0 - finalCoverage * 1.2)) / (finalCoverage * 0.3));
            
            // 添加高度变化
            float shapeHeight = saturate(shape * 2.0);
            
            // 不同高度的云类型
            float cumuloNimbus = saturate((shapeHeight - 0.5) * 2.0);
            cumuloNimbus *= saturate(1.0 - pow(heightRatio - 0.5, 2.0) * 4.0);
            
            float cumulus = saturate(1.0 - pow(heightRatio - 0.25, 2.0) * 25.0) * shapeHeight;
            
            float stratoCumulus = saturate(1.0 - pow(heightRatio - 0.12, 2.0) * 60.0) * (1.0 - shapeHeight);
            
            // 计算细节
            float bnScale = 0.0004;
            float bn = 0.0;
            
            if (shape > 0.0) {
              bn = noise(pos * bnScale);
              if (lod < CLOUDS_MAX_LOD) {
                bn += noise(pos * bnScale * 2.0) * 0.5;
                bn += noise(pos * bnScale * 4.0) * 0.25;
                bn *= 0.57; // 归一化
              }
              bn = saturate(bn * 0.5 + 0.5);
            }
            
            // 最终密度计算
            float dens = saturate(stratoCumulus + cumulus + cumuloNimbus) * 2.0 * finalCoverage;
            dens -= 1.0 - shape;
            dens -= bn;
            
            return clamp(dens, 0.0, 1.0);
          }
          
          // 全球体积云计算
          vec4 calculate_clouds(
            vec3 start,
            vec3 dir,
            float maxDistance,
            vec3 light_dir,
            vec3 wind
          ) {
            vec4 cloud = vec4(0.0, 0.0, 0.0, 1.0);
            
            // 应用云层高度偏移到云层球壳半径计算中
            float adjustedCloudBaseRadius = cloudBaseRadius + cloudHeightOffset;
            float adjustedCloudTopRadius = cloudTopRadius + cloudHeightOffset;
            
            // 与云层球壳求交
            vec2 toTop = raySphereIntersect(start, dir, adjustedCloudTopRadius);
            vec2 toCloudBase = raySphereIntersect(start, dir, adjustedCloudBaseRadius);
            
            float startHeight = length(start) - realPlanetRadius;
            float absoluteMaxDistance = CLOUDS_MAX_VIEWING_DISTANCE;
            
            float tmin = 0.0;
            float tmax = 0.0;
            
            // 根据相机位置确定光线起点和终点
            if (startHeight > cloudTop + cloudHeightOffset) {
              // 相机在云层之上
              if (toTop.x < 0.0) return vec4(0.0); // 光线未与云层相交
              tmin = toTop.x;
              if (toCloudBase.x > 0.0) {
                tmax = min(toCloudBase.x, maxDistance);
              } else {
                tmax = min(toTop.y, maxDistance);
              }
            } else if (startHeight < cloudBase + cloudHeightOffset) {
              // 相机在云层之下
              tmin = toCloudBase.y;
              tmax = min(toTop.y, maxDistance);
            } else {
              // 相机在云层内部
              if (toCloudBase.x > 0.0) {
                tmax = min(toCloudBase.x, maxDistance);
              } else {
                tmax = min(toTop.y, maxDistance);
              }
            }
            
            float minDistance = 10.0; // 避免近处伪影
            tmin = max(tmin, minDistance);
            tmax = min(tmax, absoluteMaxDistance);
            
            if (tmax < tmin) return vec4(0.0); // 无交点或被物体遮挡
            
            // 光线步进设置
            float rayLength = tmax - tmin;
            float longMarchStep = rayLength / float(MAXIMUM_CLOUDS_STEPS);
            longMarchStep = max(longMarchStep, CLOUDS_MARCH_STEP);
            
            float shortMarchStep = CLOUDS_DENS_MARCH_STEP;
            float numberApproachSteps = (CLOUDS_MARCH_STEP / CLOUDS_DENS_MARCH_STEP) * 2.0;
            float distance = tmin;
            float dens = 0.0;
            float marchStep;
            
            // 散射参数
            float kInScattering = 0.99;
            float dotLightRay = dot(dir, light_dir);
            float inScattering = Schlick(kInScattering, dotLightRay);
            float outScattering = isotropic();
            float sunScatteringPhase = mix(outScattering, inScattering, dotLightRay);
            float ambientScatteringPhase = isotropic();
            
            bool inCloud = false;
            float stepsBeforeExitingCloud = 0.0;
            float heightRatio = 0.0;
            
            // 光线步进
            for (int i = 0; i < MAXIMUM_CLOUDS_STEPS; i++) {
              vec3 position = start + dir * distance;
              int qualityRatio = int(distance * 0.00005);
              int lod = CLOUDS_MAX_LOD - qualityRatio;
              // 修复错误：用条件运算符代替max函数
              lod = (lod < 0) ? 0 : lod;
              
              // 步进策略
              if (inCloud == true) {
                marchStep = shortMarchStep;
              } else {
                marchStep = longMarchStep;
                lod = 0;
              }
              
              // 采样云密度
              dens = cloudDensity(position, wind, lod, heightRatio);
              
              if (dens > 0.01) {
                if (inCloud != true) {
                  // 首次进入云团，后退一步并使用小步长
                  inCloud = true;
                  stepsBeforeExitingCloud = numberApproachSteps;
                  distance = max(tmin, distance - CLOUDS_MARCH_STEP);
                  continue;
                }
                
                // 云内光照采样
                float lighting = 1.0;
                vec3 toCameraDir = normalize(start - position);
                
                // 光照采样位置
                vec3 toSunDir = normalize(light_dir);
                vec3 stepToSun = position + toSunDir * 200.0;
                
                float dummyHeight;
                float lightDensity = cloudDensity(stepToSun, wind, CLOUDS_MAX_LOD, dummyHeight);
                
                // 计算光消散
                lighting = exp(-lightDensity * 3.0);
                
                // 散射和消光
                float scatteringCoeff = 0.15 * dens;
                float extinctionCoeff = 0.01 * dens;
                cloud.a *= exp(-extinctionCoeff * marchStep);
                
                // 光照计算
                float sunIntensityAtSurface = clamp(0.2 - dens, 0.0, 1.0);
                vec3 sunLight = lighting * vec3(1.0, 0.98, 0.9) * sunIntensityAtSurface;
                vec3 ambientSun = vec3(1.0, 0.98, 0.9) * sunIntensityAtSurface * isotropic();
                
                // 环境光
                vec3 skyAmbientColor = vec3(0.705, 0.850, 0.952);
                vec3 groundAmbientColor = vec3(0.741, 0.898, 0.823);
                vec3 skyAmbientLight = (skyAmbientColor + ambientSun);
                vec3 groundAmbientLight = (groundAmbientColor * 0.5 + ambientSun);
                vec3 ambientLight = mix(groundAmbientLight, skyAmbientLight, heightRatio);
                
                // 累积光照
                vec3 stepScattering = scatteringCoeff * marchStep * 
                  (sunScatteringPhase * sunLight + ambientScatteringPhase * ambientLight);
                cloud.rgb += cloud.a * stepScattering;
                
                // 透明度过低时退出
                if (cloud.a < 0.01) {
                  cloud.a = 0.0;
                  break;
                }
              } else {
                if (stepsBeforeExitingCloud > 0.0) {
                  stepsBeforeExitingCloud--;
                } else {
                  inCloud = false;
                }
              }
              
              // 前进
              distance += marchStep;
              
              // 超出范围退出
              if (distance > tmax) {
                break;
              }
            }
            
            // 透明度转换
            cloud.a = (1.0 - cloud.a);
            
            return cloud;
          }
          
          void main() {
            // 获取原始颜色
            vec4 color = texture2D(colorTexture, v_textureCoordinates);
            
            // 获取深度
            float depth = czm_readDepth(depthTexture, v_textureCoordinates);
            
            // 移除屏幕边缘优化，让云效果覆盖整个屏幕
            // vec2 screenPos = v_textureCoordinates;
            // if (screenPos.x < 0.05 || screenPos.x > 0.95 || screenPos.y < 0.05 || screenPos.y > 0.95) {
            //   gl_FragColor = color;
            //   return;
            // }
            
            // 从屏幕坐标重建世界空间光线
            vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
            vec3 eyeCoordinate3 = eyeCoordinate.xyz / eyeCoordinate.w;
            vec4 worldCoordinate = czm_inverseView * vec4(eyeCoordinate3, 1.0);
            vec3 worldPos = worldCoordinate.xyz / worldCoordinate.w;
            
            // 计算视线方向
            vec3 posToEye = worldPos - czm_viewerPositionWC;
            vec3 direction = normalize(posToEye);
            
            // 光线方向
            vec3 lightDirection = normalize(czm_sunPositionWC);
            
            // 距离计算
            float distance = length(posToEye);
            if (depth == 1.0) {
              distance = CLOUDS_MAX_VIEWING_DISTANCE;
            }
            
            // 风向计算 - 风速已经在主要着色器中应用
            vec3 wind = windVector * windSpeed;
            
            // 执行云渲染
            vec4 clouds = calculate_clouds(
              czm_viewerPositionWC,  // 相机位置
              direction,             // 视线方向
              distance,              // 最大距离
              lightDirection,        // 光源方向
              wind                   // 风向
            );
            
            // 调整云颜色亮度
            clouds.rgb *= cloudBrightness;
            
            // 混合
            color = mix(color, clouds, clouds.a * clouds.a);
            
            // 调整曝光
            color = vec4(1.0 - exp(-exposure * color.rgb), color.a);
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          noiseMap: () => noiseTexture,
          realPlanetRadius: 6378137.0,
          windVector: cloudParams.windVector,
          windSpeed: cloudParams.windSpeed,
          cloudCover: cloudParams.cloudCover,
          cloudBase: cloudParams.cloudBase,
          cloudTop: cloudParams.cloudTop,
          cloudThickness: cloudParams.cloudThickness,
          cloudBaseRadius: cloudParams.cloudBaseRadius,
          cloudTopRadius: cloudParams.cloudTopRadius,
          cloudBrightness: cloudParams.cloudBrightness,
          exposure: cloudParams.exposure,
          cloudHeightOffset: cloudParams.cloudHeightOffset, // 添加高度偏移量
          windTurbulence: cloudParams.windTurbulence // 添加风向湍流系数
        }
      });
      
      // 添加后处理阶段
      viewer.value.scene.postProcessStages.add(globalCloudStage);
      lastStage.value = globalCloudStage;
      currentVisualEffect.value = 'postProcessedCloud';
      
      console.log('全球体积云效果已启用');
      
      // 创建控制面板UI
      createGlobalCloudControlUI();
    })
    .catch(error => {
      console.error('加载噪声纹理失败:', error);
      alert('加载噪声纹理失败，无法创建全球体积云效果');
    });
};

// 创建全球体积云控制UI
const createGlobalCloudControlUI = () => {
  // 移除可能存在的上一个控件
  const existingControl = document.getElementById('global-cloud-control');
  if (existingControl) {
    document.body.removeChild(existingControl);
  }
  
  // 创建控制面板
  const controlPanel = document.createElement('div');
  controlPanel.id = 'global-cloud-control';
  controlPanel.className = 'cloud-control-panel';
  
  // 根据左侧边栏状态调整位置
  controlPanel.style.left = leftSidebarVisible.value ? 'calc(220px + 10px)' : '10px';
  
  // 在左侧边栏状态变化时调整位置
  const adjustPosition = () => {
    controlPanel.style.left = leftSidebarVisible.value ? 'calc(220px + 10px)' : '10px';
  };
  
  // 监听左侧边栏状态变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        adjustPosition();
      }
    });
  });
  
  // 获取左侧边栏元素
  setTimeout(() => {
    const sidebar = document.querySelector('.left-sidebar');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true });
    }
  }, 100);
  
  // 添加标题
  const title = document.createElement('h3');
  title.textContent = '全球体积云控制';
  title.className = 'cloud-control-title';
  controlPanel.appendChild(title);
  
  // 云覆盖率控制
  const coverageContainer = document.createElement('div');
  coverageContainer.className = 'cloud-control-container';
  
  const coverageLabel = document.createElement('label');
  coverageLabel.textContent = '云覆盖率:';
  coverageLabel.className = 'cloud-control-label';
  
  const coverageSlider = document.createElement('input');
  coverageSlider.type = 'range';
  coverageSlider.min = '0';
  coverageSlider.max = '1';
  coverageSlider.step = '0.01';
  coverageSlider.value = '0.45';
  coverageSlider.className = 'cloud-control-slider';
  
  const coverageValue = document.createElement('span');
  coverageValue.textContent = '0.45';
  coverageValue.className = 'cloud-control-value';
  
  coverageSlider.addEventListener('input', (e) => {
    const newValue = parseFloat(e.target.value);
    coverageValue.textContent = newValue.toFixed(2);
    // 更新云覆盖率
    if (lastStage.value && lastStage.value.uniforms && lastStage.value.uniforms.cloudCover) {
      lastStage.value.uniforms.cloudCover = newValue;
    }
  });
  
  coverageContainer.appendChild(coverageLabel);
  coverageContainer.appendChild(coverageSlider);
  coverageContainer.appendChild(coverageValue);
  controlPanel.appendChild(coverageContainer);
  

  
  // 风速控制
  const windSpeedContainer = document.createElement('div');
  windSpeedContainer.className = 'cloud-control-container';
  
  const windSpeedLabel = document.createElement('label');
  windSpeedLabel.textContent = '风速:';
  windSpeedLabel.className = 'cloud-control-label';
  
  const windSpeedSlider = document.createElement('input');
  windSpeedSlider.type = 'range';
  windSpeedSlider.min = '0';
  windSpeedSlider.max = '10';
  windSpeedSlider.step = '0.1';
  windSpeedSlider.value = '1.0';
  windSpeedSlider.className = 'cloud-control-slider';
  
  const windSpeedValue = document.createElement('span');
  windSpeedValue.textContent = '1.0';
  windSpeedValue.className = 'cloud-control-value';
  
  windSpeedSlider.addEventListener('input', (e) => {
    const newValue = parseFloat(e.target.value);
    windSpeedValue.textContent = newValue.toFixed(1);
    // 更新风速
    if (lastStage.value && lastStage.value.uniforms && lastStage.value.uniforms.windSpeed) {
      lastStage.value.uniforms.windSpeed = newValue;
    }
  });
  
  windSpeedContainer.appendChild(windSpeedLabel);
  windSpeedContainer.appendChild(windSpeedSlider);
  windSpeedContainer.appendChild(windSpeedValue);
  controlPanel.appendChild(windSpeedContainer);
  
  // 风向湍流控制
  const turbulenceContainer = document.createElement('div');
  turbulenceContainer.className = 'cloud-control-container';
  
  const turbulenceLabel = document.createElement('label');
  turbulenceLabel.textContent = '风向湍流:';
  turbulenceLabel.className = 'cloud-control-label';
  
  const turbulenceSlider = document.createElement('input');
  turbulenceSlider.type = 'range';
  turbulenceSlider.min = '0';
  turbulenceSlider.max = '5';
  turbulenceSlider.step = '0.1';
  turbulenceSlider.value = '1.5';
  turbulenceSlider.className = 'cloud-control-slider';
  
  const turbulenceValue = document.createElement('span');
  turbulenceValue.textContent = '1.5';
  turbulenceValue.className = 'cloud-control-value';
  
  turbulenceSlider.addEventListener('input', (e) => {
    const newValue = parseFloat(e.target.value);
    turbulenceValue.textContent = newValue.toFixed(1);
    // 更新风向湍流系数
    if (lastStage.value && lastStage.value.uniforms && lastStage.value.uniforms.windTurbulence) {
      lastStage.value.uniforms.windTurbulence = newValue;
    }
  });
  
  turbulenceContainer.appendChild(turbulenceLabel);
  turbulenceContainer.appendChild(turbulenceSlider);
  turbulenceContainer.appendChild(turbulenceValue);
  controlPanel.appendChild(turbulenceContainer);
  
  // 风向控制
  const windDirectionContainer = document.createElement('div');
  windDirectionContainer.className = 'cloud-control-container';
  
  const windDirectionLabel = document.createElement('label');
  windDirectionLabel.textContent = '风向:';
  windDirectionLabel.className = 'cloud-control-label';
  
  const windDirectionSelect = document.createElement('select');
  windDirectionSelect.className = 'cloud-quality-selector';
  
  const directions = [
    { label: "东风", value: new Cesium.Cartesian3(100, 0, 0) },
    { label: "南风", value: new Cesium.Cartesian3(0, 100, 0) },
    { label: "西风", value: new Cesium.Cartesian3(-100, 0, 0) },
    { label: "北风", value: new Cesium.Cartesian3(0, -100, 0) },
    { label: "东北风", value: new Cesium.Cartesian3(70, -70, 0) },
    { label: "东南风", value: new Cesium.Cartesian3(70, 70, 0) },
    { label: "西南风", value: new Cesium.Cartesian3(-70, 70, 0) },
    { label: "西北风", value: new Cesium.Cartesian3(-70, -70, 0) }
  ];
  
  directions.forEach((dir, index) => {
    const option = document.createElement('option');
    option.value = index.toString();
    option.text = dir.label;
    windDirectionSelect.appendChild(option);
  });
  
  windDirectionSelect.addEventListener('change', (e) => {
    const index = parseInt(e.target.value);
    const newDirection = directions[index].value;
    // 更新风向
    if (lastStage.value && lastStage.value.uniforms && lastStage.value.uniforms.windVector) {
      lastStage.value.uniforms.windVector = newDirection;
    }
  });
  
  windDirectionContainer.appendChild(windDirectionLabel);
  windDirectionContainer.appendChild(windDirectionSelect);
  controlPanel.appendChild(windDirectionContainer);
  
  // 云亮度控制
  const brightnessContainer = document.createElement('div');
  brightnessContainer.className = 'cloud-control-container';
  
  const brightnessLabel = document.createElement('label');
  brightnessLabel.textContent = '云亮度:';
  brightnessLabel.className = 'cloud-control-label';
  
  const brightnessSlider = document.createElement('input');
  brightnessSlider.type = 'range';
  brightnessSlider.min = '0.5';
  brightnessSlider.max = '5';
  brightnessSlider.step = '0.1';
  brightnessSlider.value = '2.5';
  brightnessSlider.className = 'cloud-control-slider';
  
  const brightnessValue = document.createElement('span');
  brightnessValue.textContent = '2.5';
  brightnessValue.className = 'cloud-control-value';
  
  brightnessSlider.addEventListener('input', (e) => {
    const newValue = parseFloat(e.target.value);
    brightnessValue.textContent = newValue.toFixed(1);
    // 更新云亮度
    if (lastStage.value && lastStage.value.uniforms && lastStage.value.uniforms.cloudBrightness) {
      lastStage.value.uniforms.cloudBrightness = newValue;
    }
  });
  
  brightnessContainer.appendChild(brightnessLabel);
  brightnessContainer.appendChild(brightnessSlider);
  brightnessContainer.appendChild(brightnessValue);
  controlPanel.appendChild(brightnessContainer);
  
  // 曝光控制
  const exposureContainer = document.createElement('div');
  exposureContainer.className = 'cloud-control-container';
  
  const exposureLabel = document.createElement('label');
  exposureLabel.textContent = '曝光度:';
  exposureLabel.className = 'cloud-control-label';
  
  const exposureSlider = document.createElement('input');
  exposureSlider.type = 'range';
  exposureSlider.min = '0.5';
  exposureSlider.max = '2.5';
  exposureSlider.step = '0.1';
  exposureSlider.value = '1.2';
  exposureSlider.className = 'cloud-control-slider';
  
  const exposureValue = document.createElement('span');
  exposureValue.textContent = '1.2';
  exposureValue.className = 'cloud-control-value';
  
  exposureSlider.addEventListener('input', (e) => {
    const newValue = parseFloat(e.target.value);
    exposureValue.textContent = newValue.toFixed(1);
    // 更新曝光度
    if (lastStage.value && lastStage.value.uniforms && lastStage.value.uniforms.exposure) {
      lastStage.value.uniforms.exposure = newValue;
    }
  });
  
  exposureContainer.appendChild(exposureLabel);
  exposureContainer.appendChild(exposureSlider);
  exposureContainer.appendChild(exposureValue);
  controlPanel.appendChild(exposureContainer);
  
  // 添加关闭按钮
  const closeButton = document.createElement('button');
  closeButton.textContent = '关闭';
  closeButton.className = 'cloud-control-close';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(controlPanel);
  });
  controlPanel.appendChild(closeButton);
  
  // 添加到文档
  document.body.appendChild(controlPanel);
};

// 建筑规划状态
const showBuildingPlanning = ref(false);

// 打开建筑规划面板
function handleBuildingPlanningOpen() {
  const access = checkFeatureAccess();
  if (!access.allowed) {
    alert(access.message);
    return;
  }
  
  showBuildingPlanning.value = true;
}

// 关闭建筑规划面板
function handleBuildingPlanningClose() {
  // 如果是建筑编辑模式，先关闭编辑模式
  if (isInBuildingEditMode.value) {
    toggleBuildingEditMode();
  }
  
  // 再次确保所有资源已清理
  if (buildingPlanningRef.value) {
    // 组件内部的cleanupAll方法会在closeBuildingPlanning中调用
    // 这里额外处理可能遗漏的资源
    console.log('关闭建筑规划窗口，清理资源');
  }
  
  showBuildingPlanning.value = false;
}

// 在script标签中，添加建筑规划编辑模式相关状态变量
const isInBuildingEditMode = ref(false);
const selectedBuildings = ref([]);

// 切换建筑编辑模式
function toggleBuildingEditMode() {
  isInBuildingEditMode.value = !isInBuildingEditMode.value;
  
  if (isInBuildingEditMode.value) {
    // 开启编辑模式
    enableBuildingEditMode();
  } else {
    // 关闭编辑模式
    disableBuildingEditMode();
  }
}

// 启用建筑编辑模式
function enableBuildingEditMode() {
  if (!viewer.value) return;
  
  // 设置为正俯视视角
  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      viewer.value.camera.positionCartographic.longitude * 180 / Math.PI,
      viewer.value.camera.positionCartographic.latitude * 180 / Math.PI,
      10000
    ),
    orientation: {
      heading: 0.0,
      pitch: -Cesium.Math.PI_OVER_TWO, // 正俯视
      roll: 0.0
    },
    duration: 1.5
  });
  
  // 禁用属性信息查看
  disableEntityClickHandler();
  
  // 禁用浏览器默认右键菜单 - 在Cesium画布上
  viewer.value.canvas.oncontextmenu = (e) => {
    e.preventDefault();
    return false;
  };
  
  // 全局禁用右键菜单
  document.oncontextmenu = (e) => {
    e.preventDefault();
    return false;
  };
  
  // 清空选中的建筑
  selectedBuildings.value = [];
  
  // 添加建筑选择和右键菜单处理器
  setupBuildingSelectionHandler();
  
  console.log('已启用建筑编辑模式');
}

// 禁用建筑编辑模式
function disableBuildingEditMode() {
  if (!viewer.value) return;
  
  // 启用属性信息查看
  enableEntityClickHandler();
  
  // 恢复浏览器默认右键菜单 - Cesium画布
  viewer.value.canvas.oncontextmenu = null;
  
  // 恢复全局右键菜单
  document.oncontextmenu = null;
  
  // 清理选择处理器
  if (buildingSelectionHandler) {
    buildingSelectionHandler.destroy();
    buildingSelectionHandler = null;
  }
  
  // 移除所有选中高亮
  removeAllBuildingSelectionHighlight();
  
  // 清空选中的建筑
  selectedBuildings.value = [];
  
  console.log('已禁用建筑编辑模式');
}

// 建筑选择处理器
let buildingSelectionHandler = null;

// 设置建筑选择和右键菜单处理
function setupBuildingSelectionHandler() {
  if (!viewer.value || buildingSelectionHandler) return;
  
  buildingSelectionHandler = new Cesium.ScreenSpaceEventHandler(viewer.value.canvas);
  
  // 处理左键点击选择建筑
  buildingSelectionHandler.setInputAction((click) => {
    const pickedObject = viewer.value.scene.pick(click.position);
    
    if (Cesium.defined(pickedObject) && 
        pickedObject.id && 
        pickedObject.id.isBuilding) {
      
      const building = pickedObject.id;
      
      // 检查是否按住了Ctrl键（多选）
      if (!Cesium.KeyboardEventModifier.CTRL) {
        // 单选模式 - 清除之前的选择
        removeAllBuildingSelectionHighlight();
        selectedBuildings.value = [building];
      } else {
        // 多选模式 - 切换选择状态
        const index = selectedBuildings.value.indexOf(building);
        if (index === -1) {
          // 添加到选中列表
          selectedBuildings.value.push(building);
        } else {
          // 从选中列表移除
          selectedBuildings.value.splice(index, 1);
          removeSelectionHighlight(building);
          return;
        }
      }
      
      // 高亮显示选中的建筑
      highlightSelectedBuilding(building);
    } else {
      // 点击空白处，清除所有选择
      removeAllBuildingSelectionHighlight();
      selectedBuildings.value = [];
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // 处理右键菜单
  buildingSelectionHandler.setInputAction((click) => {
    const pickedObject = viewer.value.scene.pick(click.position);
    
    if (Cesium.defined(pickedObject) && 
        pickedObject.id && 
        pickedObject.id.isBuilding) {
      
      const building = pickedObject.id;
      
      // 查看建筑规划组件是否在编辑模式，以使用其内部的多选功能
      const isInBuildingEditMode = buildingPlanningRef.value && buildingPlanningRef.value.isInEditMode;
      
      // 对于建筑规划编辑模式，我们让建筑规划组件处理选择逻辑
      // 如果不是编辑模式，或者没有建筑规划组件，则使用原来的逻辑
      if (!isInBuildingEditMode) {
        // 如果右键点击的建筑不在已选择的列表中，则先选择它
        if (!selectedBuildings.value.includes(building)) {
          removeAllBuildingSelectionHighlight();
          selectedBuildings.value = [building];
          highlightSelectedBuilding(building);
        }
      }
      
      // 显示右键菜单
      showBuildingContextMenu(click.position, building);
    }
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
}

// 高亮显示选中的建筑
function highlightSelectedBuilding(building) {
  if (!building || !building.polygon) return;
  
  // 存储原始材质
  if (!building.originalMaterial) {
    building.originalMaterial = building.polygon.material;
  }
  
  // 设置高亮材质
  building.polygon.material = new Cesium.ColorMaterialProperty(
    Cesium.Color.YELLOW.withAlpha(0.5)
  );
  
  // 添加选择边框
  if (!building.outlineEntity) {
    // 获取建筑的位置信息
    const positions = building.polygon.hierarchy.getValue().positions;
    
    // 创建边框实体
    building.outlineEntity = viewer.value.entities.add({
      polyline: {
        positions: positions.concat([positions[0]]), // 闭合轮廓
        width: 3,
        material: Cesium.Color.YELLOW,
        clampToGround: true
      }
    });
  }
}

// 移除选中高亮
function removeSelectionHighlight(building) {
  if (!building) return;
  
  // 恢复原始材质
  if (building.originalMaterial) {
    building.polygon.material = building.originalMaterial;
    building.originalMaterial = undefined;
  }
  
  // 移除边框实体
  if (building.outlineEntity) {
    viewer.value.entities.remove(building.outlineEntity);
    building.outlineEntity = undefined;
  }
}

// 移除所有选中高亮
function removeAllBuildingSelectionHighlight() {
  selectedBuildings.value.forEach(building => {
    removeSelectionHighlight(building);
  });
}

// 显示建筑右键菜单
function showBuildingContextMenu(position, building) {
  // 先检查是否已经存在菜单元素，如果存在则删除
  const existingMenu = document.getElementById('buildingContextMenu');
  if (existingMenu) {
    document.body.removeChild(existingMenu);
  }
  
  // 创建右键菜单元素
  const menuContainer = document.createElement('div');
  menuContainer.id = 'buildingContextMenu';
  menuContainer.className = 'building-context-menu';
  menuContainer.style.left = `${position.x}px`;
  menuContainer.style.top = `${position.y}px`;
  
  // 添加菜单项
  const menuItems = [
    {
      label: '复制建筑',
      icon: '📋',
      action: () => {
        copySelectedBuildings();
      }
    },
    {
      label: '删除建筑',
      icon: '🗑️',
      action: () => {
        deleteSelectedBuildings();
      }
    }
  ];
  
  // 创建菜单内容
  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'context-menu-item';
    menuItem.innerHTML = `<span class="menu-icon">${item.icon}</span>${item.label}`;
    menuItem.addEventListener('click', () => {
      item.action();
      // 点击后关闭菜单
      document.body.removeChild(menuContainer);
    });
    menuContainer.appendChild(menuItem);
  });
  
  // 添加到文档体
  document.body.appendChild(menuContainer);
  
  // 点击其他区域关闭菜单
  const closeMenu = (e) => {
    if (!menuContainer.contains(e.target)) {
      if (document.body.contains(menuContainer)) {
        document.body.removeChild(menuContainer);
      }
      document.removeEventListener('click', closeMenu);
    }
  };
  
  // 延迟一下再添加事件监听，避免立即触发
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 100);
}

// 复制选中的建筑
function copySelectedBuildings() {
  if (selectedBuildings.value.length === 0) return;
  
  // 如果只复制一个建筑，使用原有的单个复制功能
  if (selectedBuildings.value.length === 1) {
    const building = selectedBuildings.value[0];
    if (building.copyFunction && typeof building.copyFunction === 'function') {
      building.copyFunction();
    }
    return;
  }
  
  // 如果复制多个建筑，使用新的保持相对位置的复制功能
  if (buildingPlanningRef.value && buildingPlanningRef.value.copyMultipleBuildings) {
    buildingPlanningRef.value.copyMultipleBuildings(selectedBuildings.value);
  } else {
    console.error('多建筑复制功能不可用');
    // 如果新功能不可用，回退到旧方法
    selectedBuildings.value.forEach(building => {
      if (building.copyFunction && typeof building.copyFunction === 'function') {
        building.copyFunction();
      }
    });
  }
  
  console.log(`已复制${selectedBuildings.value.length}个建筑`);
}

// 删除选中的建筑
function deleteSelectedBuildings() {
  if (selectedBuildings.value.length === 0) return;
  
  // 如果要删除多个建筑，弹出确认对话框
  if (selectedBuildings.value.length > 1) {
    if (!confirm(`确定要删除选中的${selectedBuildings.value.length}个建筑吗？`)) {
      return;
    }
  }
  
  // 删除所有选中的建筑
  const toDelete = [...selectedBuildings.value];
  toDelete.forEach(building => {
    // 移除选中高亮
    removeSelectionHighlight(building);
    
    // 从选中列表移除
    const index = selectedBuildings.value.indexOf(building);
    if (index !== -1) {
      selectedBuildings.value.splice(index, 1);
    }
    
    // 从场景中移除实体
    if (viewer.value.entities.contains(building)) {
      viewer.value.entities.remove(building);
    }
  });
  
  console.log(`已删除${toDelete.length}个建筑`);
}

// 处理来自SettingsModal的Viewer设置变更
function handleViewerSettingsChange(settings) {
  console.log('Viewer设置变更:', settings);
  
  // 对于可以直接更改的设置，无需重新初始化
  if (settings.setting === 'antialias') {
    if (viewer.value) {
      viewer.value.scene.postProcessStages.fxaa.enabled = settings.enabled;
    }
    return;
  }
  
  if (settings.setting === 'shadows') {
    if (viewer.value) {
      viewer.value.shadows = settings.enabled;
    }
    return;
  }
  
  if (settings.setting === 'terrainShadows') {
    if (viewer.value) {
      viewer.value.terrainShadows = settings.enabled 
        ? Cesium.ShadowMode.ENABLED 
        : Cesium.ShadowMode.DISABLED;
    }
    return;
  }
  
  if (settings.setting === 'atmosphere') {
    if (viewer.value) {
      viewer.value.scene.skyAtmosphere.show = settings.enabled;
    }
    return;
  }
  
  // 需要重新初始化Viewer的控件设置
  // 保存当前相机状态
  let cameraPosition = null;
  let cameraHeading = null;
  let cameraPitch = null;
  let cameraRoll = null;
  
  if (viewer.value && viewer.value.camera) {
    cameraPosition = viewer.value.camera.position.clone();
    cameraHeading = viewer.value.camera.heading;
    cameraPitch = viewer.value.camera.pitch;
    cameraRoll = viewer.value.camera.roll;
  }
  
  // 保存当前的实体和图层
  const entities = [];
  const layers = [];
  const dataSources = [];
  
  if (viewer.value) {
    // 保存所有实体（除了标记实体）
    viewer.value.entities.values.forEach(entity => {
      if (entity.id !== 'currentMarker') {
        entities.push({
          position: entity.position && entity.position.getValue(Cesium.JulianDate.now()),
          properties: entity.properties,
          // 保存其他必要的属性...
        });
      }
    });
    
    // 保存影像图层
    for (let i = 1; i < viewer.value.imageryLayers.length; i++) {
      const layer = viewer.value.imageryLayers.get(i);
      layers.push(layer);
    }
    
    // 保存数据源
    for (let i = 0; i < viewer.value.dataSources.length; i++) {
      dataSources.push(viewer.value.dataSources.get(i));
    }
  }
  
  // 构建新的Viewer初始化选项
  const viewerOptions = {
    scene3DOnly: true,
    timeline: false,
    animation: false,
    infoBox: true,
    selectionIndicator: true,
    shadows: viewer.value?.shadows || false,
    terrainShadows: viewer.value?.terrainShadows || Cesium.ShadowMode.DISABLED,
    navigationInstructionsInitiallyVisible: false,
  };

  // 根据设置更新选项
  if (settings.setting === 'resetAll') {
    // 重置为默认选项（全部禁用）
    viewerOptions.baseLayerPicker = false;
    viewerOptions.geocoder = false;
    viewerOptions.homeButton = false;
    viewerOptions.sceneModePicker = false;
    viewerOptions.navigationHelpButton = false;
    viewerOptions.fullscreenButton = false;
  } else {
    // 更新特定选项
    if (settings.setting === 'baseLayerPicker') {
      viewerOptions.baseLayerPicker = settings.enabled;
    } else {
      viewerOptions.baseLayerPicker = !!viewer.value?.baseLayerPicker;
    }
    
    if (settings.setting === 'geocoder') {
      viewerOptions.geocoder = settings.enabled;
    } else {
      viewerOptions.geocoder = !!viewer.value?.geocoder;
    }
    
    if (settings.setting === 'homeButton') {
      viewerOptions.homeButton = settings.enabled;
    } else {
      viewerOptions.homeButton = !!viewer.value?.homeButton;
    }
    
    if (settings.setting === 'sceneModePicker') {
      viewerOptions.sceneModePicker = settings.enabled;
    } else {
      viewerOptions.sceneModePicker = !!viewer.value?.sceneModePicker;
    }
    
    if (settings.setting === 'navigationHelpButton') {
      viewerOptions.navigationHelpButton = settings.enabled;
    } else {
      viewerOptions.navigationHelpButton = !!viewer.value?.navigationHelpButton;
    }
    
    if (settings.setting === 'fullscreenButton') {
      viewerOptions.fullscreenButton = settings.enabled;
    } else {
      viewerOptions.fullscreenButton = !!viewer.value?.fullscreenButton;
    }
  }
  
  // 如果viewer已存在，则销毁它
  if (viewer.value) {
    try {
      viewer.value.destroy();
    } catch (error) {
      console.error('销毁Viewer失败:', error);
    }
  }
  
  // 创建新的Viewer实例
  try {
    console.log('使用以下选项创建新的Viewer:', viewerOptions);
    viewer.value = new Cesium.Viewer('cesiumContainer', viewerOptions);
    
    // 移除Cesium logo和版权信息
    viewer.value._cesiumWidget._creditContainer.style.display = 'none';
    
    // 恢复相机位置
    if (cameraPosition) {
      viewer.value.camera.setView({
        destination: cameraPosition,
        orientation: {
          heading: cameraHeading,
          pitch: cameraPitch,
          roll: cameraRoll
        }
      });
    }
    
    // 设置大气层状态
    viewer.value.scene.skyAtmosphere.show = settings.setting === 'atmosphere' ? 
      settings.enabled : viewer.value.scene.skyAtmosphere.show;
    
    // 恢复实体和图层（简化实现）
    // 这里可能需要根据您的应用程序进行调整
    
    // 重新初始化各组件
    if (cameraControl.value) {
      cameraControl.value.initialize();
    }
    
    // 重新设置事件处理程序
    setupEventHandlers();
    setupEntityClickHandler();
    
    console.log('Viewer已重新初始化，控件设置已更新');
  } catch (error) {
    console.error('创建新的Viewer失败:', error);
  }
}
</script>

<style>
/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  position: relative;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  width: 100%;
  height: calc(100% - 60px); /* 减去顶部导航栏高度 */
  position: relative;
  margin-top: 60px; /* 为导航栏留出空间 */
}

#cesiumContainer {
  flex: 1;
  height: 100%;
  position: relative;
}

/* 侧边栏样式 */
.sidebar {
  background-color: var(--neutral-50);
  height: calc(100% - 60px); /* 减去顶部导航栏高度 */
  z-index: var(--z-fixed);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  position: fixed;
  top: 60px; /* 从导航栏下方开始 */
}

.left-sidebar {
  width: 220px;
  border-right: 1px solid var(--neutral-200);
  left: 0;
}

.left-sidebar.collapsed {
  width: 0;
  border-right: none;
  left: 0;
  overflow: visible;
}

.right-sidebar {
  width: 320px;
  border-left: 1px solid var(--border-color);
  right: 0;
  background-color: var(--bg-primary);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.right-sidebar.collapsed {
  width: 0;
  right: 0;
  overflow: visible;
}

.sidebar-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  z-index: 1;
  border: none;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 添加高级动画效果的开关按钮 */
.fancy-toggle {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: 0 8px 8px 0;
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  font-size: 1.2rem;
  font-weight: bold;
  height: 60px;
  width: 28px;
  transition: all 0.3s ease;
}

.left-sidebar.collapsed .fancy-toggle {
  right: -28px;
}

.right-sidebar.collapsed .fancy-toggle {
  left: -28px;
}

.left-sidebar .sidebar-toggle {
  right: -24px;
  border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
}

.right-sidebar .sidebar-toggle {
  left: -24px;
  border-radius: var(--border-radius-md) 0 0 var(--border-radius-md);
}

.right-sidebar .fancy-toggle {
  left: -28px;
  border-radius: 8px 0 0 8px;
}

.sidebar-toggle:hover {
  background-color: var(--primary-dark);
  width: 28px;
}

.fancy-toggle:hover {
  background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-color) 100%);
  width: 32px;
  transform: translateY(-50%) translateX(-2px);
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.left-sidebar .sidebar-toggle:hover {
  right: -28px;
}

.left-sidebar .fancy-toggle:hover {
  right: -32px;
}

.right-sidebar .sidebar-toggle:hover {
  left: -28px;
}

.right-sidebar .fancy-toggle:hover {
  left: -32px;
}

.sidebar-toggle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 50%, var(--primary-light) 50%);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.sidebar-toggle:hover::before {
  opacity: 0.1;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.sidebar-content::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.sidebar-buttons {
  padding: var(--space-2);
  overflow-y: auto;
  flex: 1;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.sidebar-buttons::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.sidebar-header {
  padding: var(--space-2) var(--space-3);
  background-color: var(--primary-color);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* 新增样式 - 左侧工具栏标题 */
.sidebar-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 2px 0;
  width: 80%;
  margin: 0 auto;
  padding-left: 12px;
}

.sidebar-icon {
  font-size: 1.2rem;
  margin-right: 6px;
  animation: float 3s ease-in-out infinite;
}

.sidebar-title h3 {
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  font-size: 0.95rem;
}

.sidebar-title .highlight {
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  position: relative;
}

.sidebar-title .highlight::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.6);
  transform: scaleX(0.8);
  transform-origin: center;
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0.7;
}

.sidebar-title:hover .highlight::after {
  transform: scaleX(1);
}

.sidebar-buttons {
  padding: var(--space-2);
  overflow-y: auto;
  flex: 1;
}

/* 工具按钮组样式 */
.tool-group {
  margin-bottom: var(--space-4);
}

.tool-group h4 {
  margin-bottom: var(--space-2);
  color: var(--primary-color);
  font-size: 0.95rem;
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--neutral-200);
  position: relative;
  font-weight: 600;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
}

.tool-group h4::before {
  content: '';
  display: block;
  width: 3px;
  height: 14px;
  background-color: var(--primary-color);
  border-radius: 1.5px;
  margin-right: 8px;
  opacity: 0.9;
}

.tool-button {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  margin-bottom: var(--space-2);
  padding: var(--space-2);
  background-color: var(--neutral-100);
  color: var(--neutral-800);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--neutral-200);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tool-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--primary-rgb), 0.05);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tool-button::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 50px;
  height: 200%;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  transform: rotate(45deg) translateX(-200%);
  transition: transform 0.5s ease;
}

.tool-button:hover {
  background-color: var(--bg-hover);
  color: var(--primary-color);
  border-color: var(--border-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.tool-button:hover::before {
  opacity: 1;
}

.tool-button:hover::after {
  transform: rotate(45deg) translateX(200%);
}

.tool-button .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: rgba(var(--primary-rgb), 0.08);
  border-radius: 50%;
  margin-right: 10px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  font-style: normal;
}

.tool-button:hover .icon {
  transform: scale(1.05);
  background-color: rgba(var(--primary-rgb), 0.15);
}

/* 标签页样式 */
.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--space-3);
  background-color: var(--bg-secondary);
  padding: 0 var(--space-2);
  border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.tab {
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 60px;
  text-align: center;
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  background-color: var(--bg-primary);
  border-top-left-radius: var(--border-radius-sm);
  border-top-right-radius: var(--border-radius-sm);
}

.tab:hover:not(.active) {
  color: var(--primary-dark);
  background-color: var(--bg-hover);
}

.tab-pane {
  padding: var(--space-3);
  background-color: var(--bg-primary);
  border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
}

.tab-pane h4 {
  margin: var(--space-2) 0;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-color);
}

/* 按钮组样式 */
.button-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.option-button {
  text-align: center;
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  font-size: 0.875rem;
}

.option-button:hover {
  background-color: var(--primary-light);
  color: var(--primary-dark);
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.full-width-button {
  width: 100%;
  padding: var(--space-3);
  margin-bottom: var(--space-3);
}

/* 图层管理样式 */
.layer-manager-content {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

.layer-group {
  margin-bottom: var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background-color: var(--bg-secondary);
  transition: all var(--transition-fast);
}

.layer-group:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.layer-group-header {
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-secondary);
  cursor: pointer;
  font-weight: 500;
  color: var(--text-primary);
  transition: background-color var(--transition-fast);
}

.layer-group-header:hover {
  background-color: var(--bg-hover);
}

.expand-icon {
  margin-right: var(--space-2);
  font-size: 0.75rem;
  color: var(--text-secondary);
  transition: transform var(--transition-fast);
}

.layer-group-content {
  padding: var(--space-2);
  background-color: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.layer-item {
  display: flex;
  align-items: center;
  padding: var(--space-2);
  border-bottom: 1px solid var(--border-color);
  transition: background-color var(--transition-fast);
}

.layer-item:last-child {
  border-bottom: none;
}

.layer-item:hover {
  background-color: var(--bg-hover);
}

.layer-name {
  flex: 1;
  margin: 0 var(--space-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.layer-delete-btn {
  background-color: var(--danger-light);
  color: var(--danger-color);
  border: none;
  padding: 2px var(--space-2);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.75rem;
  transition: all var(--transition-fast);
}

.layer-delete-btn:hover {
  background-color: var(--danger-color);
  color: white;
}

.empty-layer-message {
  padding: var(--space-3);
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: center;
  font-style: italic;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  margin: var(--space-2) 0;
}

/* 自定义信息窗口样式 */
.custom-info-box {
  position: absolute;
  z-index: 9999;
  background-color: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 350px;
  max-height: 450px;
  overflow-y: auto;
  font-family: var(--font-sans);
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(15px);
  display: none;
  animation: infobox-fade-in 0.35s ease-out;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color) transparent;
}

.custom-info-box::-webkit-scrollbar {
  width: 6px;
}

.custom-info-box::-webkit-scrollbar-track {
  background: transparent;
}

.custom-info-box::-webkit-scrollbar-thumb {
  background-color: var(--primary-color);
  border-radius: 10px;
}

@keyframes infobox-fade-in {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.custom-info-box .info-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  padding: 14px 16px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1;
}

.custom-info-box .info-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 270px;
}

.custom-info-box .close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  margin: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: all 0.2s;
  border-radius: 50%;
}

.custom-info-box .close-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.custom-info-box .info-body {
  padding: 16px;
}

.custom-info-box .entity-type-badge {
  display: inline-block;
  background: var(--primary-light);
  color: var(--primary-dark);
  padding: 4px 10px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.custom-info-box .description {
  margin-bottom: 16px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.7);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.custom-info-box .description p {
  margin: 0 0 10px 0;
}

.custom-info-box .description p:last-child {
  margin-bottom: 0;
}

.custom-info-box .coordinates,
.custom-info-box .properties {
  margin-top: 16px;
  padding: 14px;
  background-color: #f7f9ff;
  border-radius: 10px;
  border-left: 4px solid var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.custom-info-box .coordinates:hover,
.custom-info-box .properties:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.custom-info-box .coords-title,
.custom-info-box .props-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--primary-dark);
  font-size: 16px;
  display: flex;
  align-items: center;
}

.custom-info-box .coords-title::before {
  content: "📍";
  margin-right: 6px;
}

.custom-info-box .props-title::before {
  content: "🔖";
  margin-right: 6px;
}

.custom-info-box .coords-row,
.custom-info-box .prop-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.08);
  font-size: 14px;
  transition: background-color 0.2s;
  padding: 4px 6px;
  border-radius: 4px;
}

.custom-info-box .coords-row:hover,
.custom-info-box .prop-row:hover {
  background-color: rgba(var(--primary-rgb), 0.05);
}

.custom-info-box .coords-row:last-child,
.custom-info-box .prop-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.custom-info-box .coords-row span:first-child,
.custom-info-box .prop-row span:first-child {
  color: #555;
  font-weight: 600;
}

.custom-info-box .coords-row span:last-child,
.custom-info-box .prop-row span:last-child {
  font-family: var(--font-mono);
  color: #222;
  background: rgba(var(--primary-rgb), 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-info-box .coords-container,
.custom-info-box .props-container {
  max-height: 180px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color) transparent;
  border-radius: 6px;
}

.custom-info-box .coords-container::-webkit-scrollbar,
.custom-info-box .props-container::-webkit-scrollbar {
  width: 4px;
}

.custom-info-box .coords-container::-webkit-scrollbar-track,
.custom-info-box .props-container::-webkit-scrollbar-track {
  background: transparent;
}

.custom-info-box .coords-container::-webkit-scrollbar-thumb,
.custom-info-box .props-container::-webkit-scrollbar-thumb {
  background-color: var(--primary-color);
  border-radius: 10px;
}

.custom-info-box .copy-coords-btn {
  font-size: 13px;
  color: var(--primary-dark);
  background-color: rgba(var(--primary-rgb), 0.1);
  border-radius: 4px;
  padding: 6px 10px;
  margin-top: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  user-select: none;
}

.custom-info-box .copy-coords-btn:hover {
  background-color: rgba(var(--primary-rgb), 0.2);
}

.custom-info-box .info-footer {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 14px;
}

.custom-info-box .info-action-btn {
  background-color: var(--primary-light);
  color: var(--primary-dark);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.custom-info-box .info-action-btn:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(var(--primary-rgb), 0.25);
}

.custom-info-box .info-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.custom-info-box .highlight-btn {
  background-color: rgba(255, 215, 0, 0.2);
  color: rgb(191, 144, 0);
}

.custom-info-box .highlight-btn:hover {
  background-color: rgb(255, 215, 0);
  color: rgb(102, 51, 0);
}

/* 添加动画效果 */
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(var(--primary-rgb), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0); }
}

.custom-info-box.new-item {
  animation: pulse 1.5s infinite;
}

/* 后端图层管理样式 */
.backend-layers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.add-layer-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 0.875rem;
}

.loading-indicator {
  text-align: center;
  padding: var(--space-4);
  color: var(--neutral-600);
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: var(--space-3);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--space-3);
}

.retry-btn {
  background-color: #c62828;
  color: white;
  border: none;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
  cursor: pointer;
  font-size: 0.75rem;
}

.backend-layers-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.backend-layer-item {
  display: flex;
  flex-direction: column;
  padding: var(--space-2);
  border: 1px solid var(--neutral-200);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--space-2);
  background-color: white;
}

.layer-info {
  margin-bottom: var(--space-2);
}

.layer-name-type {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.layer-name {
  font-weight: 500;
  color: var(--neutral-800);
}

.layer-type {
  font-size: 0.75rem;
  background-color: var(--primary-light);
  color: var(--primary-dark);
  padding: 1px 6px;
  border-radius: 10px;
}

.layer-url {
  font-size: 0.75rem;
  color: var(--neutral-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layer-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-1);
}

.action-btn {
  border: none;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.75rem;
  color: white;
}

.load-btn {
  background-color: var(--primary-color);
}

.edit-btn {
  background-color: var(--secondary-color);
}

.delete-btn {
  background-color: var(--danger-color);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-container {
  background-color: white;
  border-radius: var(--border-radius-lg);
  width: 500px;
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  border-bottom: 1px solid var(--neutral-200);
}

.modal-header h3 {
  margin: 0;
  color: var(--neutral-800);
}

.modal-header .close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--neutral-500);
}

.modal-body {
  padding: var(--space-3);
}

.form-group {
  margin-bottom: var(--space-3);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--neutral-700);
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--neutral-300);
  border-radius: var(--border-radius-md);
  font-family: inherit;
  font-size: 0.9rem;
}

.form-group textarea {
  resize: vertical;
  font-family: monospace;
}

.modal-footer {
  padding: var(--space-3);
  border-top: 1px solid var(--neutral-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.cancel-btn {
  background-color: var(--neutral-200);
  color: var(--neutral-700);
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.save-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  cursor: pointer;
}

.test-connection-btn {
  background-color: var(--secondary-color);
  color: white;
  border: none;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  margin-right: var(--space-2);
}

.connection-status {
  margin-bottom: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
}

.success {
  background-color: #dff2bf;
  color: #4f8a10;
}

.error {
  background-color: #ffd2d2;
  color: #a51b00;
}

.error-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.error-details {
  background-color: #ffebee;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
}

.error-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.help-btn {
  background-color: #f5f5f5;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
}

.help-message {
  background-color: #fff3e0;
  border: 1px solid #ffcc80;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
}

.help-message h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.help-message ol {
  padding-left: 20px;
}

.help-message p {
  margin-bottom: 10px;
}

.help-message pre {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
}

/* 添加权限锁定样式 */
.tool-button.disabled {
  opacity: 0.7;
  cursor: not-allowed;
  position: relative;
}

.lock-icon {
  position: absolute;
  right: 8px;
  font-size: 12px;
}

.custom-url-input {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.custom-url-field {
  flex: 1;
  padding: var(--space-2);
  border: 1px solid var(--neutral-300);
  border-radius: var(--border-radius-md);
  font-family: inherit;
  font-size: 0.9rem;
}

.custom-url-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 0.875rem;
}

.custom-url-btn:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.skybox-selector {
  margin-top: var(--space-3);
}

.skybox-select {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--neutral-300);
  border-radius: var(--border-radius-md);
  font-family: inherit;
  font-size: 0.9rem;
}

/* 体积云覆盖率控制器样式 */
.cloud-coverage-control {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.cloud-coverage-control:hover {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.cloud-coverage-label {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

.cloud-coverage-slider {
  width: 150px;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: linear-gradient(to right, #e0e0e0, #3490dc);
  border-radius: 3px;
  outline: none;
}

.cloud-coverage-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3490dc;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.cloud-coverage-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3490dc;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.cloud-coverage-value {
  min-width: 36px;
  text-align: center;
  font-weight: 500;
  color: #3490dc;
  background-color: rgba(52, 144, 220, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 全球体积云控制面板样式 */
.cloud-control-panel {
  position: fixed;
  bottom: 20px;
  left: calc(var(--left-sidebar-width, 220px) + 10px);
  background-color: var(--bg-primary, rgba(255, 255, 255, 0.95));
  color: var(--text-primary, #333);
  padding: 0;
  border-radius: var(--border-radius-lg, 8px);
  z-index: 1000;
  width: 320px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: var(--font-sans);
  transform-origin: bottom left;
  animation: fadeInScale 0.3s ease-out;
  overflow: hidden;
}

.cloud-control-panel:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
}

.cloud-control-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #333);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-secondary, #f5f7fa);
  border-radius: 8px 8px 0 0;
}

.cloud-control-title::before {
  content: "☁️";
  margin-right: 8px;
  font-size: 18px;
}

.cloud-control-container {
  margin: 0;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;
  border-bottom: 1px solid var(--border-light, rgba(0, 0, 0, 0.05));
}

.cloud-control-label {
  width: 85px;
  font-size: 14px;
  color: var(--text-secondary, #666);
  white-space: nowrap;
  font-weight: 500;
}

  .cloud-control-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: linear-gradient(to right, var(--slider-start, #e0e0e0), var(--primary-color, #3B82F6));
  border-radius: 4px;
  outline: none;
}

.cloud-control-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #3B82F6);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s;
}

.cloud-control-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.cloud-control-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color, #3B82F6);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s;
}

.cloud-control-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
}

.cloud-control-value {
  min-width: 36px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary, #333);
  background-color: var(--badge-bg, rgba(59, 130, 246, 0.1));
  padding: 3px 8px;
  border-radius: var(--border-radius-md, 4px);
  font-family: var(--font-mono, monospace);
  border: 1px solid var(--badge-border, rgba(59, 130, 246, 0.2));
}

.cloud-quality-selector {
  flex: 1;
  background-color: var(--input-bg, #fff);
  color: var(--text-primary, #333);
  border: 1px solid var(--input-border, rgba(0, 0, 0, 0.2));
  padding: 7px 12px;
  border-radius: var(--border-radius-md, 4px);
  outline: none;
  cursor: pointer;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.cloud-quality-selector:focus {
  border-color: var(--primary-color, #3B82F6);
  box-shadow: 0 0 0 2px var(--focus-ring, rgba(59, 130, 246, 0.25));
}

.cloud-quality-selector option {
  background-color: var(--dropdown-bg, #fff);
  color: var(--text-primary, #333);
  padding: 8px;
}

.cloud-control-close {
  width: calc(100% - 32px);
  margin: 16px;
  padding: 10px;
  background-color: var(--button-secondary-bg, #f0f0f0);
  color: var(--button-secondary-text, #333);
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
  border-radius: var(--border-radius-md, 4px);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cloud-control-close:hover {
  background-color: var(--button-secondary-hover, #e5e5e5);
  transform: translateY(-1px);
}

/* 添加面板动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.cloud-control-panel {
  transition: left 0.3s ease;
  box-sizing: border-box;
}

/* 建筑编辑模式工具栏样式 */
.building-edit-mode-toolbar {
  position: fixed;
  top: 100px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-mode-toggle {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-mode-toggle.active {
  background-color: var(--secondary-color);
}

.edit-mode-info {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.edit-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* 建筑右键菜单样式 */
.building-context-menu {
  position: fixed;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  min-width: 180px;
  overflow: hidden;
}

.context-menu-item {
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  color: var(--text-primary);
}

.context-menu-item:hover {
  background-color: var(--neutral-100);
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
}
</style>