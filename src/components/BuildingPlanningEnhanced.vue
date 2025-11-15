<template>
  <div class="building-planning-container" v-if="showBuildingPlanning">
    <div class="building-planning-header">
      <h3>建筑规划</h3>
      <div class="header-controls">
        <!-- 编辑模式滑动开关 -->
        <div class="edit-mode-switch-container">
          <span class="switch-label">编辑模式</span>
          <label class="switch">
            <input type="checkbox" :checked="isInBuildingEditMode" @change="$emit('toggleEditMode')">
            <span class="slider round"></span>
          </label>
        </div>
        <button @click="closeBuildingPlanning" class="close-btn">&times;</button>
      </div>
    </div>
    
    <!-- 编辑模式提示信息 -->
    <div v-if="isInBuildingEditMode" class="edit-mode-info-banner">
      <span class="info-icon">ℹ️</span>
      <span class="info-text">编辑模式已开启，点击建筑可选择，右键菜单可复制或删除</span>
    </div>
    
    <div class="building-planning-tabs">
      <div 
        :class="['tab', activeTab === 'buildings' ? 'active' : '']"
        @click="activeTab = 'buildings'"
      >
        建筑群管理
      </div>
      <div 
        :class="['tab', activeTab === 'properties' ? 'active' : '']"
        @click="activeTab = 'properties'"
      >
        编辑属性
      </div>
      <div 
        :class="['tab', activeTab === 'geometry' ? 'active' : '']"
        @click="activeTab = 'geometry'"
      >
        编辑图形
      </div>
      <div 
        :class="['tab', activeTab === 'floors' ? 'active' : '']"
        @click="activeTab = 'floors'"
      >
        楼层管理
      </div>
      <div 
        :class="['tab', activeTab === 'export' ? 'active' : '']"
        @click="activeTab = 'export'"
      >
        导出/发布
      </div>
    </div>
    
    <div class="building-planning-content">
      <!-- 进度遮罩层 -->
      <div v-if="isProcessing" class="processing-overlay">
        <div class="processing-spinner"></div>
        <div class="processing-text">{{ processingMessage }}</div>
      </div>
      
      <!-- 建筑群管理面板 -->
      <div v-if="activeTab === 'buildings'" class="tab-content buildings-panel">
        <div class="buildings-header">
          <h4>建筑群列表</h4>
          <button @click="createNewBuildingGroup" class="primary-btn">新建建筑群</button>
        </div>
        
        <div class="buildings-list" v-if="buildingGroups.length > 0">
          <div 
            v-for="(group, index) in buildingGroups" 
            :key="index"
            :class="['building-group-item', { active: currentGroupIndex === index }]"
            @click="selectBuildingGroup(index)"
          >
            <div class="building-group-info">
              <div class="building-group-name">{{ group.name }}</div>
              <div class="building-group-stats">
                <span>{{ group.buildings.length }}个建筑</span>
              </div>
            </div>
            <div class="building-group-actions">
              <button @click.stop="toggleGroupVisibility(index)" class="icon-btn" :title="group.visible ? '隐藏' : '显示'">
                {{ group.visible ? '👁️' : '👁️‍🗨️' }}
              </button>
              <button @click.stop="duplicateBuildingGroup(index)" class="icon-btn" title="复制">📋</button>
              <button @click.stop="deleteBuildingGroup(index)" class="icon-btn delete" title="删除">🗑️</button>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-message">
          暂无建筑群，点击"新建建筑群"按钮创建
        </div>
        
        <!-- 当前选中的建筑群中的建筑列表 -->
        <div v-if="currentGroupIndex !== -1" class="buildings-in-group">
          <div class="buildings-in-group-header">
            <h4>{{ currentGroup.name }}中的建筑</h4>
            <div class="header-actions">
              <button @click="toggleMultiSelectMode" class="primary-btn small" :class="{ active: isMultiSelectMode }">
                <span class="btn-icon">{{ isMultiSelectMode ? '✓' : '☐' }}</span>多选模式
              </button>
              <button v-if="selectedBuildingIndices.length > 1" @click="batchCopyBuildings" class="accent-btn small" title="批量复制选中的建筑">
                <span class="btn-icon">📋</span>批量复制
              </button>
              <button @click="addBuildingToGroup" class="primary-btn small">添加建筑</button>
            </div>
          </div>
          
          <div class="buildings-in-group-list" v-if="currentGroup.buildings.length > 0">
            <div 
              v-for="(building, idx) in currentGroup.buildings" 
              :key="idx"
              :class="['building-item', { active: currentBuildingIndex === idx, selected: selectedBuildingIndices.includes(idx) }]"
              @click="selectBuilding(idx)"
            >
              <div class="building-info">
                <div class="building-name">{{ building.properties.name }}</div>
                <div class="building-height">高度: {{ building.properties.height }}米</div>
              </div>
              <div class="building-actions">
                <button @click.stop="startBuildingCopy(idx)" class="icon-btn" title="复制建筑">📋</button>
                <button @click.stop="toggleBuildingVisibility(idx)" class="icon-btn" :title="building.visible ? '隐藏' : '显示'">
                  {{ building.visible ? '👁️' : '👁️‍🗨️' }}
                </button>
                <button @click.stop="deleteBuilding(idx)" class="icon-btn delete" title="删除">🗑️</button>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-message">
            当前建筑群中暂无建筑，点击"添加建筑"按钮添加
          </div>
        </div>
      </div>
      
      <!-- 建筑属性编辑面板 -->
      <div v-if="activeTab === 'properties'" class="tab-content properties-panel">
        <div v-if="currentBuilding" class="building-properties-form">
          <div class="form-group">
            <label>建筑名称:</label>
            <input 
              type="text" 
              v-model="currentBuilding.properties.name" 
              placeholder="请输入建筑名称"
            />
          </div>
          <div class="form-group">
            <label>建筑简介:</label>
            <textarea 
              v-model="currentBuilding.properties.description" 
              placeholder="请输入建筑简介"
              rows="4"
            ></textarea>
          </div>
          <div class="form-group">
            <label>建筑高度 (米):</label>
            <input 
              type="number" 
              v-model.number="currentBuilding.properties.height" 
              min="1" 
              step="1"
              placeholder="请输入建筑高度"
              @input="onHeightChange"
            />
          </div>
          <div class="form-group">
            <label>楼层数:</label>
            <input 
              type="number" 
              v-model.number="currentBuilding.properties.floors" 
              min="1" 
              step="1"
              placeholder="请输入楼层数"
              @input="onFloorsChange"
            />
          </div>
          <div class="form-group">
            <label>层高 (米):</label>
            <input 
              type="number" 
              v-model.number="currentBuilding.properties.floorHeight" 
              min="0.1" 
              step="0.1"
              placeholder="请输入层高"
              @input="onFloorHeightChange"
            />
          </div>
          <div class="form-group">
            <label>建筑颜色:</label>
            <div class="color-with-alpha">
              <input 
                type="color" 
                v-model="currentBuilding.properties.color" 
                class="color-input"
              />
              <div class="alpha-slider">
                <label>透明度:</label>
                <input 
                  type="range" 
                  v-model.number="currentBuilding.properties.alpha" 
                  min="0" 
                  max="1" 
                  step="0.1"
                />
                <span>{{ currentBuilding.properties.alpha.toFixed(1) }}</span>
              </div>
            </div>
          </div>
          
          <!-- 特殊属性 -->
          <div class="special-properties">
            <div class="form-group">
              <label>材质类型:</label>
              <select v-model="currentBuilding.properties.materialType">
                <option value="solid">纯色</option>
                <option value="material1">材质一</option>
                <option value="material2">材质二</option>
                <option value="material3">材质三</option>
              </select>
              <div class="texture-preview-container" v-if="currentBuilding.properties.materialType !== 'solid'">
                <img 
                  :src="getMaterialPreviewUrl(currentBuilding.properties.materialType)" 
                  class="texture-preview"
                  @load="() => console.log('预览图加载成功')"
                  @error="() => console.error('预览图加载失败')"
                />
                <div class="texture-info">{{ currentBuilding.properties.materialType === 'material1' ? '材质一' : 
                                           currentBuilding.properties.materialType === 'material2' ? '材质二' : 
                                           currentBuilding.properties.materialType === 'material3' ? '材质三' : 
                                           currentBuilding.properties.materialType }}</div>
              </div>
            </div>
          </div>
          

          
          <div class="buttons-group">
            <button 
              @click="applyBuildingProperties" 
              class="primary-btn"
            >
              应用属性
            </button>
          </div>
        </div>
        
        <div v-else-if="currentGroupIndex !== -1" class="group-properties-form">
          <div class="form-group">
            <label>建筑群名称:</label>
            <input 
              type="text" 
              v-model="currentGroup.name" 
              placeholder="请输入建筑群名称"
            />
          </div>
          
          <div class="form-group">
            <label>批量设置高度 (米):</label>
            <div class="batch-input">
              <input 
                type="number" 
                v-model.number="batchHeight" 
                min="1" 
                step="1"
                placeholder="批量设置高度"
              />
              <button @click="applyBatchHeight" class="batch-btn">应用</button>
            </div>
          </div>
          
          <div class="form-group">
            <label>批量设置颜色:</label>
            <div class="batch-input">
              <input 
                type="color" 
                v-model="batchColor" 
                class="color-input"
              />
              <button @click="applyBatchColor" class="batch-btn">应用</button>
            </div>
          </div>
          
          <div class="form-group">
            <label>批量设置材质类型:</label>
            <div class="batch-input">
              <select v-model="batchMaterialType" class="batch-select">
                <option value="solid">纯色</option>
                <option value="material1">材质一</option>
                <option value="material2">材质二</option>
                <option value="material3">材质三</option>
              </select>
              <button @click="applyBatchMaterialType" class="batch-btn">应用</button>
            </div>
          </div>
          
          <div class="form-group">
            <label>建筑间距 (米):</label>
            <div class="batch-input">
              <input 
                type="number" 
                v-model.number="buildingSpacing" 
                min="0" 
                step="1"
                placeholder="建筑间距"
              />
              <button @click="applyBuildingSpacing" class="batch-btn">应用</button>
            </div>
          </div>
          
          <div class="batch-actions">
            <button @click="regenerateAllBuildings" class="primary-btn">重新生成所有建筑</button>
            <button @click="randomizeHeights" class="accent-btn">随机高度变化</button>
          </div>
        </div>
        
        <div v-else class="empty-message">
          请先选择一个建筑群或建筑
        </div>
      </div>
      
      <!-- 编辑几何面板 -->
      <div v-if="activeTab === 'geometry'" class="tab-content geometry-panel">
        <div v-if="currentBuilding" class="building-geometry-editor">
          <div class="drawing-status" v-if="isDrawing">
            <span class="status-icon">✏️</span>
            <div class="status-text-container">
              <span class="status-text">绘制模式：{{ holeDrawingMode ? '正在绘制内部孔洞' : '正在绘制建筑底面' }}</span>
              <span class="hint-text">
                {{ holeDrawingMode ? '点击地图添加孔洞顶点，右键点击结束绘制（底面已显示为黄色线框）' : '点击地图添加顶点，右键点击结束绘制' }}
              </span>
            </div>
          </div>
          
          <!-- 交互提示 -->
          <div class="interaction-tips" v-if="!isDrawing && currentBuilding.geometry.vertices.length > 0">
            <div class="tip-item">
              <span class="tip-icon">🖱️</span>
              <span class="tip-text">点击节点进行选择 (红色高亮)</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">✋</span>
              <span class="tip-text">拖拽选中节点进行位置调整</span>
            </div>
            <div class="tip-item" v-if="selectedVertexIndex !== -1">
              <button @click="deleteSelectedVertex" class="delete-selected-btn">
                <span class="btn-icon">🗑️</span>删除选中节点
              </button>
            </div>
          </div>
          
          <div class="vertices-list" v-if="currentBuilding.geometry.vertices.length > 0">
            <div class="section-header">
              <h4>顶点列表</h4>
              <span class="vertex-count">{{ currentBuilding.geometry.vertices.length }}个顶点</span>
            </div>
            <div class="vertices-table">
              <div class="table-header">
                <div class="column index">#</div>
                <div class="column">经度</div>
                <div class="column">纬度</div>
                <div class="column actions">操作</div>
              </div>
              <div 
                v-for="(vertex, index) in currentBuilding.geometry.vertices" 
                :key="index"
                :class="['table-row', { 'selected-row': selectedVertexIndex === index }]"
              >
                <div class="column index">{{ index + 1 }}</div>
                <div class="column">
                  <input 
                    type="number" 
                    v-model.number="vertex.longitude" 
                    step="0.000001"
                    @change="updateVertex(index)"
                  />
                </div>
                <div class="column">
                  <input 
                    type="number" 
                    v-model.number="vertex.latitude" 
                    step="0.000001"
                    @change="updateVertex(index)"
                  />
                </div>
                <div class="column actions">
                  <button @click="removeVertex(index)" class="small-btn delete-btn" title="删除">🗑️</button>
                  <button @click="selectVertex(index)" class="small-btn select-btn" title="选中">👁️</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 地面基点设置 -->
          <div class="ground-height-setting">
            <div class="section-header">
              <h4>高度参考设置</h4>
            </div>
            <div class="form-group">
              <label>地面高度基准:</label>
              <select v-model="currentBuilding.properties.heightReference">
                <option value="relative">相对地面</option>
                <option value="absolute">绝对高度</option>
                <option value="clamp">贴合地形</option>
              </select>
            </div>
          </div>
          
          <div class="buttons-group">
            <button 
              @click="startDrawing" 
              class="primary-btn"
              :disabled="isDrawing"
            >
              <span class="btn-icon">✏️</span>
              {{ currentBuilding.geometry.vertices.length > 0 ? '重新绘制底面' : '开始绘制底面' }}
            </button>
            <button 
              @click="clearDrawing" 
              class="cancel-btn"
              :disabled="currentBuilding.geometry.vertices.length === 0"
            >
              <span class="btn-icon">🧹</span>清除绘制
            </button>
            <button 
              @click="generateBuilding" 
              class="success-btn"
              :disabled="!canGenerateBuilding"
            >
              <span class="btn-icon">🏗️</span>生成建筑
            </button>
          </div>
          
          <!-- 高级几何操作 -->
          <div class="advanced-geometry-actions" v-if="currentBuilding.geometry.vertices.length > 0">
            <div class="section-header">
              <h4>高级几何操作</h4>
            </div>
            <div class="action-grid">
              <button @click="addHole" class="action-btn" :disabled="isDrawing" title="添加建筑内部的孔洞">
                <span class="btn-icon">⭕</span>添加内部孔洞
              </button>
              <button @click="offsetGeometry(2)" class="action-btn" title="将建筑边界向外扩展2米">
                <span class="btn-icon">↗️</span>外扩2米
              </button>
              <button @click="offsetGeometry(-2)" class="action-btn" :disabled="currentBuilding.geometry.vertices.length <= 4" title="将建筑边界向内缩小2米">
                <span class="btn-icon">↘️</span>内缩2米
              </button>
            </div>
          </div>
          
          <!-- 孔洞列表 -->
          <div class="holes-list" v-if="currentBuilding.geometry.holes && currentBuilding.geometry.holes.length > 0">
            <div class="section-header">
              <h4>孔洞列表</h4>
              <span class="hole-count">{{ currentBuilding.geometry.holes.length }}个孔洞</span>
            </div>
            <div class="holes-container">
              <div v-for="(hole, holeIndex) in currentBuilding.geometry.holes" :key="'hole-'+holeIndex" class="hole-item">
                <div class="hole-header">
                  <div class="hole-title">
                    <span class="hole-icon">⭕</span>
                    <span>孔洞 #{{ holeIndex + 1 }} ({{ hole.length }}个顶点)</span>
                  </div>
                  <div class="hole-actions">
                    <button @click="editHole(holeIndex)" class="small-btn" title="编辑孔洞">✏️</button>
                    <button @click="deleteHole(holeIndex)" class="small-btn delete-btn" title="删除孔洞">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="currentGroupIndex !== -1" class="group-geometry-editor">
          <div class="empty-message">
            <span class="empty-icon">🏙️</span>
            <span>请先选择一个建筑进行编辑</span>
            <span class="sub-message">从左侧的建筑列表中选择一个建筑</span>
          </div>
          
          <!-- 批量几何工具 -->
          <div class="batch-geometry-tools">
            <div class="section-header">
              <h4>批量几何工具</h4>
            </div>
            <div class="action-grid">
              <button @click="generateGridLayout" class="action-btn" title="创建网格排列的建筑群">
                <span class="btn-icon">🏙️</span>生成网格布局
              </button>
              <button @click="generateCircularLayout" class="action-btn" title="创建环形排列的建筑群">
                <span class="btn-icon">⭕</span>生成环形布局
              </button>
              <button @click="importFromGeoJSON" class="action-btn" title="从GeoJSON文件导入建筑数据">
                <span class="btn-icon">📤</span>从GeoJSON导入
              </button>
              <button @click="cloneBuildings" class="action-btn" :disabled="currentGroup.buildings.length === 0" title="复制并偏移所选建筑">
                <span class="btn-icon">📋</span>克隆所选建筑
              </button>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-message">
          <span class="empty-icon">🏙️</span>
          <span>请先选择一个建筑群或建筑</span>
          <span class="sub-message">从左侧的建筑群列表中选择</span>
        </div>
      </div>
      
      <!-- 楼层管理面板 -->
      <div v-if="activeTab === 'floors'" class="tab-content floors-panel">
        <div v-if="currentBuilding" class="floors-management">
          <div class="section-header compact">
            <h4>楼层划分</h4>
            <div class="header-actions">
              <button @click="generateFloors" class="primary-btn small">
                <span class="btn-icon">🏗️</span>生成楼层
              </button>
              <button @click="viewAllFloors" :disabled="!hasFloorData" class="accent-btn small">
                <span class="btn-icon">👁️</span>查看所有楼层
              </button>
            </div>
          </div>
          
          <div class="floor-info-panel">
            <div class="form-group">
              <label>建筑名称:</label>
              <input 
                type="text" 
                v-model="currentBuilding.properties.name" 
                placeholder="请输入建筑名称"
                disabled
              />
            </div>
            <div class="form-row compact">
              <div class="form-group compact">
                <label>高度(米):</label>
                <input 
                  type="number" 
                  v-model.number="currentBuilding.properties.height" 
                  min="1" 
                  step="1"
                  placeholder="建筑高度"
                  @input="onHeightChange"
                />
              </div>
              <div class="form-group compact">
                <label>楼层数:</label>
                <input 
                  type="number" 
                  v-model.number="currentBuilding.properties.floors" 
                  min="1" 
                  step="1"
                  placeholder="楼层数"
                  @input="onFloorsChange"
                />
              </div>
              <div class="form-group compact">
                <label>层高(米):</label>
                <input 
                  type="number" 
                  v-model.number="currentBuilding.properties.floorHeight" 
                  min="0.1" 
                  step="0.1"
                  placeholder="层高"
                  @input="onFloorHeightChange"
                />
              </div>
            </div>
          </div>
          
          <!-- 分层抽屉动画控制按钮 -->
          <div v-if="hasFloorData" class="floor-explode-controls">
            <button 
              @click="toggleFloorExplode" 
              class="primary-btn"
              :class="{ 'active': isFloorExploded }"
            >
              <span class="btn-icon">{{ isFloorExploded ? '🔄' : '🔀' }}</span>
              {{ isFloorExploded ? '收起楼层' : '展开楼层' }}
            </button>
            <div v-if="isFloorExploded" class="explode-slider-container">
              <label>楼层间距:</label>
              <input 
                type="range" 
                v-model.number="floorExplodeDistance" 
                min="1" 
                max="10" 
                step="0.5"
                @input="applyFloorExplode"
              />
              <span>{{ floorExplodeDistance }}米</span>
            </div>
          </div>
          
          <div v-if="hasFloorData" class="floors-view">
            <div class="floor-nav">
              <button 
                @click="viewAllFloors" 
                :class="['floor-nav-btn', { active: currentFloorIndex === -1 }]"
              >
                全部楼层
              </button>
              <button 
                v-for="(floor, index) in currentBuilding.properties.floorData" 
                :key="index"
                :class="['floor-nav-btn', { active: currentFloorIndex === index }]"
                @click="selectFloor(index)"
              >
                {{ floor.name }}
              </button>
            </div>
            
            <div v-if="currentFloorIndex !== -1" class="floor-edit-panel">
              <div class="section-header compact">
                <h4>编辑楼层: {{ currentFloor.name }}</h4>
              </div>
              
              <div class="form-row compact">
                <div class="form-group compact">
                  <label>名称:</label>
                  <input 
                    type="text" 
                    v-model="currentFloor.name" 
                    placeholder="楼层名称"
                  />
                </div>
                <div class="form-group compact">
                  <label>高度(米):</label>
                  <input 
                    type="number" 
                    v-model.number="currentFloor.height" 
                    min="0.1" 
                    step="0.1"
                    placeholder="楼层高度"
                    @input="updateFloorHeights"
                  />
                </div>
              </div>
              
              <div class="form-row compact">
                <div class="form-group compact">
                  <label>功能:</label>
                  <select v-model="currentFloor.function">
                    <option value="residential">住宅</option>
                    <option value="commercial">商业</option>
                    <option value="office">办公</option>
                    <option value="parking">停车场</option>
                    <option value="public">公共空间</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div class="form-group compact">
                  <label>颜色:</label>
                  <input 
                    type="color" 
                    v-model="currentFloor.color" 
                    class="color-input"
                    @input="applyFloorStyle"
                  />
                </div>
                <div class="form-group compact">
                  <label>透明度:</label>
                  <div class="alpha-slider compact">
                    <input 
                      type="range" 
                      v-model.number="currentFloor.alpha" 
                      min="0" 
                      max="1" 
                      step="0.1"
                      @input="applyFloorStyle"
                    />
                    <span>{{ currentFloor.alpha.toFixed(1) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="form-group compact">
                <label>备注:</label>
                <textarea 
                  v-model="currentFloor.notes" 
                  placeholder="添加楼层备注信息"
                  rows="1"
                ></textarea>
              </div>
              
              <div class="buttons-group">
                <button @click="applyFloorChanges" class="primary-btn small">应用更改</button>
              </div>
            </div>
            
            <div class="floor-batch-options">
              <div class="section-header compact">
                <h4>批量操作</h4>
              </div>
              
              <div class="form-row compact">
                <div class="form-group compact">
                  <label>操作类型:</label>
                  <select v-model="floorBatchOperation">
                    <option value="color">设置颜色</option>
                    <option value="function">设置功能</option>
                    <option value="equalHeight">均分楼层高度</option>
                  </select>
                </div>
                <div class="form-group compact">
                  <button @click="applyBatchFloorOperation" class="accent-btn small">应用批量操作</button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-message">
            <span class="empty-icon">🏢</span>
            <span>尚未划分楼层，请设置楼层数和层高后点击"生成楼层"按钮</span>
          </div>
        </div>
        
        <div v-else class="empty-message">
          <span class="empty-icon">🏙️</span>
          <span>请先选择一个建筑</span>
          <span class="sub-message">从建筑群管理中选择一个建筑以管理其楼层</span>
        </div>
      </div>
      
      <!-- 导出/发布面板 -->
      <div v-if="activeTab === 'export'" class="tab-content export-panel">
        <div class="export-options">
          <div class="section-header">
            <h4>导出选项</h4>
          </div>
          
          <div class="option-card">
            <div class="option-header">
              <div class="option-title">
                <span class="option-icon">📄</span>
                <h5>GeoJSON导出</h5>
              </div>
              <span class="badge">简易格式</span>
            </div>
            <p class="option-description">
              导出为GeoJSON格式，包含建筑几何形状和属性信息，可用于GIS软件和Web地图。
            </p>
            <div class="option-buttons">
              <button 
                @click="exportToGeoJSON(false)" 
                class="primary-btn"
                :disabled="!canExport"
                title="导出当前选中的建筑为GeoJSON格式"
              >
                <span class="btn-icon">📤</span>导出当前建筑
              </button>
              <button 
                @click="exportToGeoJSON(true)" 
                class="accent-btn"
                :disabled="!canExportGroup"
                title="导出整个建筑群为GeoJSON格式"
              >
                <span class="btn-icon">📤</span>导出整个建筑群
              </button>
            </div>
          </div>
          
          <div class="option-card">
            <div class="option-header">
              <div class="option-title">
                <span class="option-icon">🏗️</span>
                <h5>3D模型导出</h5>
              </div>
              <span class="badge">标准格式</span>
            </div>
            <p class="option-description">
              导出为通用3D模型格式，可在其他3D软件中使用，支持材质和纹理信息。
            </p>
            <div class="export-format-selector">
              <label>导出格式:</label>
              <select v-model="exportFormat" class="format-select">
                <option value="glb">glTF二进制(.glb)</option>
                <option value="gltf">glTF(.gltf)</option>
                <option value="obj">Wavefront(.obj)</option>
              </select>
            </div>
            <div class="option-buttons">
              <button 
                @click="exportTo3DModel(false)" 
                class="primary-btn"
                :disabled="!canExport"
                title="导出当前选中的建筑为3D模型格式"
              >
                <span class="btn-icon">📦</span>导出当前建筑
              </button>
              <button 
                @click="exportTo3DModel(true)" 
                class="accent-btn"
                :disabled="!canExportGroup"
                title="导出整个建筑群为3D模型格式"
              >
                <span class="btn-icon">📦</span>导出整个建筑群
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as Cesium from 'cesium';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  },
  isInBuildingEditMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'disable-info-box', 'enable-info-box', 'toggleEditMode']);

// 状态变量
const showBuildingPlanning = ref(true);
const activeTab = ref('buildings');

// 会话存储键
const SESSION_STORAGE_KEY = 'building_planning_data';

// 建筑群管理
const buildingGroups = ref([]);
const currentGroupIndex = ref(-1);
const currentBuildingIndex = ref(-1);

// 多选建筑相关状态
const selectedBuildingIndices = ref([]);
const isMultiSelectMode = ref(false);

// 绘制状态
const isDrawing = ref(false);
const isDragging = ref(false);
const selectedVertexIndex = ref(-1);
const drawingEntities = ref([]);
const vertexEntities = ref([]);
const lineEntities = ref([]);
const holeDrawingMode = ref(false);
const editingHoleIndex = ref(-1);

// 批量编辑属性
const batchHeight = ref(30);
const batchColor = ref('#FFFFFF');
const batchMaterialType = ref('solid');
const buildingSpacing = ref(5);

// 导出相关
const exportFormat = ref('glb');

// 楼层管理相关
const currentFloorIndex = ref(-1); // -1表示查看所有楼层
const floorBatchOperation = ref('color');
const floorEntities = ref([]); // 存储楼层实体
const defaultFloorColors = [
  '#FFB6C1', // 浅粉色
  '#ADD8E6', // 浅蓝色
  '#98FB98', // 浅绿色
  '#FFDAB9', // 桃色
  '#E6E6FA', // 薰衣草色
  '#F0E68C', // 卡其色
  '#DDA0DD', // 梅红色
  '#AFEEEE', // 苍白的绿宝石色
  '#D3D3D3', // 浅灰色
  '#FFE4B5'  // 摩卡色
];

// 分层抽屉动画相关变量
const isFloorExploded = ref(false);
const floorExplodeDistance = ref(3);
const selectedExplodedFloorIndex = ref(-1);
const floorDrawerAnimationDuration = 1000; // 抽屉动画持续时间(毫秒)
let floorDrawerAnimationTimeout = null;



// 添加处理中状态相关变量
const isProcessing = ref(false);
const processingMessage = ref('处理中...');

// 事件处理器
let drawHandler = null;
let vertexInteractionHandler = null;
let vertexDragHandler = null;

// 计算当前选中的建筑群
const currentGroup = computed(() => {
  if (currentGroupIndex.value === -1 || currentGroupIndex.value >= buildingGroups.value.length) {
    return null;
  }
  return buildingGroups.value[currentGroupIndex.value];
});

// 计算当前选中的建筑
const currentBuilding = computed(() => {
  if (!currentGroup.value || currentBuildingIndex.value === -1 || 
      currentBuildingIndex.value >= currentGroup.value.buildings.length) {
    return null;
  }
  return currentGroup.value.buildings[currentBuildingIndex.value];
});

// 判断是否可以生成建筑
const canGenerateBuilding = computed(() => {
  if (!currentBuilding.value) return false;
  
  return (
    currentBuilding.value.geometry.vertices.length >= 3 &&
    currentBuilding.value.properties.name.trim() !== '' &&
    currentBuilding.value.properties.height > 0
  );
});

// 获取当前选中的楼层
const currentFloor = computed(() => {
  if (!currentBuilding.value || 
      !currentBuilding.value.properties.floorData || 
      currentFloorIndex.value === -1 || 
      currentFloorIndex.value >= currentBuilding.value.properties.floorData.length) {
    return null;
  }
  return currentBuilding.value.properties.floorData[currentFloorIndex.value];
});

// 判断是否有楼层数据
const hasFloorData = computed(() => {
  return currentBuilding.value && 
         currentBuilding.value.properties.floorData && 
         currentBuilding.value.properties.floorData.length > 0;
});

// 判断是否可以导出
const canExport = computed(() => {
  return currentBuilding.value && currentBuilding.value.entity;
});

// 判断是否可以导出建筑群
const canExportGroup = computed(() => {
  return currentGroup.value && 
         currentGroup.value.buildings.length > 0 && 
         currentGroup.value.buildings.some(b => b.entity);
});



// 从点击获取笛卡尔坐标
const getCartesianFromClick = (clickPosition) => {
  const ray = props.viewer.camera.getPickRay(clickPosition);
  return props.viewer.scene.globe.pick(ray, props.viewer.scene);
};

// 辅助方法：笛卡尔坐标转经纬度
const cartesianToLatLon = (cartesian) => {
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    longitude: Cesium.Math.toDegrees(cartographic.longitude),
    latitude: Cesium.Math.toDegrees(cartographic.latitude),
    height: cartographic.height,
    cartesian: cartesian
  };
};

// 辅助方法：经纬度转笛卡尔坐标
const latLonToCartesian = (lon, lat, height = 0) => {
  return Cesium.Cartesian3.fromDegrees(lon, lat, height);
};

// 关闭建筑规划面板
const closeBuildingPlanning = () => {
  // 保存当前数据到会话存储
  saveBuildingData();
  
  showBuildingPlanning.value = false;
  cleanupAll();
  emit('close');
};

// 新建建筑群
const createNewBuildingGroup = () => {
  const newGroup = {
    name: `建筑群 ${buildingGroups.value.length + 1}`,
    buildings: [],
    visible: true, // 默认可见
    entities: [],
    asLayer: false
  };
  
  buildingGroups.value.push(newGroup);
  currentGroupIndex.value = buildingGroups.value.length - 1;
  currentBuildingIndex.value = -1;
};

// 选择建筑群
const selectBuildingGroup = (index) => {
  if (index >= 0 && index < buildingGroups.value.length) {
    currentGroupIndex.value = index;
    currentBuildingIndex.value = -1;
    
    // 自动飞行到选中的建筑群位置
    if (buildingGroups.value[index].buildings.length > 0) {
      // 短暂延迟确保UI更新后再飞行
      setTimeout(() => {
        flyToBuildingGroup();
      }, 100);
    }
  }
};

// 复制建筑群
const duplicateBuildingGroup = (index) => {
  if (index < 0 || index >= buildingGroups.value.length) return;
  
  const original = buildingGroups.value[index];
  const copy = JSON.parse(JSON.stringify(original));
  copy.name = `${copy.name} (复制)`;
  copy.entities = []; // 实体需要重新创建
  copy.visible = true; // 确保复制的建筑群默认可见
  
  // 创建新的实体
  // ...这部分将在后续编辑中完成
  
  buildingGroups.value.push(copy);
  currentGroupIndex.value = buildingGroups.value.length - 1;
};

// 删除建筑群
const deleteBuildingGroup = (index) => {
  if (index < 0 || index >= buildingGroups.value.length) return;
  
  if (!confirm(`确定要删除建筑群 "${buildingGroups.value[index].name}" 吗？`)) {
    return;
  }
  
  // 移除所有实体
  const group = buildingGroups.value[index];
  
  // ...这部分将在后续编辑中完成
  
  // 移除组
  buildingGroups.value.splice(index, 1);
  
  // 更新选中索引
  if (buildingGroups.value.length === 0) {
    currentGroupIndex.value = -1;
  } else if (currentGroupIndex.value >= buildingGroups.value.length) {
    currentGroupIndex.value = buildingGroups.value.length - 1;
  }
  
  currentBuildingIndex.value = -1;
};

// 添加建筑到群组
const addBuildingToGroup = () => {
  if (!currentGroup.value) return;
  
  // 创建新建筑对象
  const newBuilding = {
    properties: {
      name: `建筑 ${currentGroup.value.buildings.length + 1}`,
      description: '',
      height: 30,
      floors: 10,
      floorHeight: 3.0,
      color: '#FFFFFF',
      alpha: 0.8,
      roofStyle: 'flat',
      materialType: 'solid',
      heightReference: 'relative'
    },
    geometry: {
      vertices: [],
      holes: []
    },
    visible: true,
    entity: null
  };
  
  // 添加到当前建筑群
  currentGroup.value.buildings.push(newBuilding);
  
  // 选择新添加的建筑
  currentBuildingIndex.value = currentGroup.value.buildings.length - 1;
  
  // 切换到几何编辑标签
  activeTab.value = 'geometry';
  
  // 保存当前数据
  saveBuildingData();
};

// 选择建筑
const selectBuilding = (index) => {
  if (currentGroupIndex.value === -1) return;
  if (index < 0 || index >= currentGroup.value.buildings.length) return;
  
  // 检查是否按下了Shift键（多选模式）
  if (isMultiSelectMode.value) {
    const existingIndex = selectedBuildingIndices.value.indexOf(index);
    if (existingIndex === -1) {
      // 添加到选中集合
      selectedBuildingIndices.value.push(index);
      
      // 同步视图中的高亮
      const building = currentGroup.value.buildings[index];
      if (building && building.entity) {
        highlightBuilding(building.entity, true);
      }
    } else {
      // 从选中集合中移除
      selectedBuildingIndices.value.splice(existingIndex, 1);
      
      // 同步视图中的高亮
      const building = currentGroup.value.buildings[index];
      if (building && building.entity) {
        highlightBuilding(building.entity, false);
      }
    }
    
    // 同时更新当前建筑
    currentBuildingIndex.value = index;
  } else {
    // 单选模式，先清除之前的高亮
    clearAllHighlights();
    
    // 更新选择
    currentBuildingIndex.value = index;
    selectedBuildingIndices.value = [index];
    
    // 同步视图中的高亮
    const building = currentGroup.value.buildings[index];
    if (building && building.entity) {
      highlightBuilding(building.entity, true);
    }
  }
};

// 切换建筑可见性
const toggleBuildingVisibility = (index) => {
  if (currentGroupIndex.value === -1) return;
  if (index < 0 || index >= currentGroup.value.buildings.length) return;
  
  const building = currentGroup.value.buildings[index];
  building.visible = !building.visible;
  
  // 更新实体可见性
  if (building.entity) {
    building.entity.show = building.visible;
  }
};

// 切换建筑群可见性
const toggleGroupVisibility = (index) => {
  if (index < 0 || index >= buildingGroups.value.length) return;
  
  const group = buildingGroups.value[index];
  group.visible = !group.visible;
  
  // 更新群中所有建筑实体的可见性
  group.buildings.forEach(building => {
    if (building.entity) {
      building.entity.show = group.visible;
    }
    // 同步更新建筑的可见性状态以保持一致
    building.visible = group.visible;
  });
};

// 删除建筑
const deleteBuilding = (index) => {
  if (currentGroupIndex.value === -1) return;
  if (index < 0 || index >= currentGroup.value.buildings.length) return;
  
  if (!confirm(`确定要删除建筑 "${currentGroup.value.buildings[index].properties.name}" 吗？`)) {
    return;
  }
  
  const building = currentGroup.value.buildings[index];
  
  // 移除实体
  if (building.entity && props.viewer) {
    props.viewer.entities.remove(building.entity);
  }
  
  // 从列表中移除
  currentGroup.value.buildings.splice(index, 1);
  
  // 更新当前选中的建筑索引
  if (currentGroup.value.buildings.length === 0) {
    currentBuildingIndex.value = -1;
  } else if (currentBuildingIndex.value >= currentGroup.value.buildings.length) {
    currentBuildingIndex.value = currentGroup.value.buildings.length - 1;
  }
};

// 清理所有资源
const cleanupAll = () => {
  // 清理事件处理器
  if (drawHandler) {
    drawHandler.destroy();
    drawHandler = null;
  }
  
  if (vertexInteractionHandler) {
    vertexInteractionHandler.destroy();
    vertexInteractionHandler = null;
  }
  
  if (vertexDragHandler) {
    vertexDragHandler.destroy();
    vertexDragHandler = null;
  }
  
  // 清理绘制实体
  cleanupDrawingEntities();
  
  // 清理楼层实体
  cleanupFloorEntities();
  
  // 清理所有建筑实体
  buildingGroups.value.forEach(group => {
    group.buildings.forEach(building => {
      if (building.entity) {
        // 清理墙壁材质实体
        if (building.entity._wallEntities) {
          building.entity._wallEntities.forEach(wallEntity => {
            if (props.viewer.entities.contains(wallEntity)) {
              props.viewer.entities.remove(wallEntity);
            }
          });
          building.entity._wallEntities = [];
        }
        
        // 清理屋顶实体
        if (building.entity._roofEntity && props.viewer.entities.contains(building.entity._roofEntity)) {
          props.viewer.entities.remove(building.entity._roofEntity);
          building.entity._roofEntity = null;
        }
        
        // 移除主体建筑实体
        if (props.viewer.entities.contains(building.entity)) {
          props.viewer.entities.remove(building.entity);
        }
        building.entity = null;
      }
      
      // 清理楼层实体引用
      if (building.properties.floorData) {
        building.properties.floorData.forEach(floor => {
          if (floor.entity && props.viewer.entities.contains(floor.entity)) {
            props.viewer.entities.remove(floor.entity);
          }
          floor.entity = null;
        });
      }
    });
  });
};

// 组件加载时初始化数据
onMounted(() => {
  // 从会话存储加载数据
  loadBuildingData();
  
  // 如果没有数据，显示默认建筑群
  if (buildingGroups.value.length === 0) {
    createNewBuildingGroup();
  }
  
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  // 添加地图点击事件处理
  if (props.viewer) {
    props.viewer.screenSpaceEventHandler.setInputAction(
      (event) => {
        // 如果正在复制建筑，处理复制完成逻辑
        if (isCopyingBuilding.value) {
          const cartesian = getCartesianFromMousePosition(event.position);
          if (cartesian) {
            console.log('完成建筑复制操作，放置在点击位置');
            completeBuildingCopy(cartesian);
          } else {
            console.warn('无法获取点击位置的坐标');
          }
          return;
        }
        
        // 处理展开楼层的点击（实现抽屉动画）
        if (isFloorExploded.value) {
          const pickedObject = props.viewer.scene.pick(event.position);
          if (Cesium.defined(pickedObject) && pickedObject.id && 
              pickedObject.id.isFloor && pickedObject.id.isExploded) {
            // 点击了一个展开的楼层
            const index = pickedObject.id.floorIndex;
            if (index !== undefined) {
              console.log('点击了展开的楼层', index);
              toggleFloorDrawer(index);
              return; // 处理完楼层点击后不再处理其他点击逻辑
            }
          }
        }
        
        // 在视图中选择建筑
        if (props.isInBuildingEditMode) {
          const pickedObject = props.viewer.scene.pick(event.position);
          if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.isBuilding) {
            handleBuildingSelection(pickedObject.id);
          } else {
            // 如果点击空白区域且不是多选模式，则清除所有选择
            if (!isMultiSelectMode.value) {
              selectedBuildingIndices.value = [];
              currentBuildingIndex.value = -1;
            }
          }
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
    
    // 添加鼠标移动事件处理，用于显示复制预览
    props.viewer.screenSpaceEventHandler.setInputAction(
      (event) => {
        if (isCopyingBuilding.value) {
          showCopyPreview(event.endPosition);
        }
      },
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    );
  }
});

// 创建展开后的楼层实体
const createExplodedFloorEntity = (floorIndex, verticalOffset) => {
  if (!currentBuilding.value || 
      !currentBuilding.value.properties.floorData || 
      floorIndex >= currentBuilding.value.properties.floorData.length) return;
  
  const floor = currentBuilding.value.properties.floorData[floorIndex];
  
  // 获取建筑底面顶点
  const vertices = currentBuilding.value.geometry.vertices;
  
  // 计算轮廓的中心点
  const centerPoint = calculateCenter(vertices);
  
  // 创建楼层材质
  const floorMaterial = Cesium.Color.fromCssColorString(floor.color).withAlpha(floor.alpha);
  
  // 初始化楼层状态
  floor._currentOffset = verticalOffset;
  floor._horizontalOffset = {
    longitude: 0,
    latitude: 0
  };
  
  // 使用回调属性创建动态多边形层次结构
  const positionCallback = new Cesium.CallbackProperty((time, result) => {
    // 获取当前偏移
    const currentVerticalOffset = floor._currentOffset !== undefined ? floor._currentOffset : verticalOffset;
    const horizontalOffsetLon = floor._horizontalOffset ? floor._horizontalOffset.longitude : 0;
    const horizontalOffsetLat = floor._horizontalOffset ? floor._horizontalOffset.latitude : 0;
    
    // 提取顶点坐标
    const positions = vertices.map(vertex => {
      const dx = vertex.longitude - centerPoint.longitude;
      const dy = vertex.latitude - centerPoint.latitude;
      return Cesium.Cartesian3.fromDegrees(
        centerPoint.longitude + horizontalOffsetLon + dx,
        centerPoint.latitude + horizontalOffsetLat + dy,
        currentVerticalOffset
      );
    });
    
    // 创建多边形层次结构（包括孔洞）
    let hierarchyResult = new Cesium.PolygonHierarchy(positions);
    
    // 添加孔洞
    if (currentBuilding.value.geometry.holes && currentBuilding.value.geometry.holes.length > 0) {
      currentBuilding.value.geometry.holes.forEach(hole => {
        const holePositions = hole.map(vertex => {
          const dx = vertex.longitude - centerPoint.longitude;
          const dy = vertex.latitude - centerPoint.latitude;
          return Cesium.Cartesian3.fromDegrees(
            centerPoint.longitude + horizontalOffsetLon + dx,
            centerPoint.latitude + horizontalOffsetLat + dy,
            currentVerticalOffset
          );
        });
        
        if (holePositions.length > 0) {
          hierarchyResult.holes.push(new Cesium.PolygonHierarchy(holePositions));
        }
      });
    }
    
    return hierarchyResult;
  }, false);
  
  // 高度动态回调
  const heightCallback = new Cesium.CallbackProperty((time, result) => {
    const currentVerticalOffset = floor._currentOffset !== undefined ? floor._currentOffset : verticalOffset;
    return floor.baseHeight + currentVerticalOffset;
  }, false);
  
  // 楼层顶部高度动态回调
  const extrudedHeightCallback = new Cesium.CallbackProperty((time, result) => {
    const currentVerticalOffset = floor._currentOffset !== undefined ? floor._currentOffset : verticalOffset;
    return floor.baseHeight + currentVerticalOffset + floor.height;
  }, false);
  
  // 创建楼层实体
  const floorEntity = props.viewer.entities.add({
    name: `${currentBuilding.value.properties.name} - ${floor.name}`,
    position: Cesium.Cartesian3.fromDegrees(centerPoint.longitude, centerPoint.latitude, verticalOffset),
    polygon: {
      hierarchy: positionCallback,
      height: heightCallback,
      extrudedHeight: extrudedHeightCallback,
      material: floorMaterial,
      outline: true,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 1,
      closeTop: true,
      closeBottom: true
    }
  });
  
  // 添加标识，表示这是一个楼层实体
  floorEntity.isFloor = true;
  floorEntity.isExploded = true;
  floorEntity.floorIndex = floorIndex;
  floorEntity.buildingRef = currentBuilding.value;
  
  // 不在这里添加点击事件处理，而是使用统一的点击处理
  
  // 保存实体引用
  floor.entity = floorEntity;
  floorEntities.value.push(floorEntity);
  
  // 计算标签高度
  const labelHeight = floor.baseHeight + verticalOffset + floor.height;
  
  // 添加楼层标签
  addExplodedFloorLabel(floor, centerPoint, labelHeight);
  
  return floorEntity;
};

// 添加楼层平滑展开动画
const animateFloorsExplode = () => {
  if (!currentBuilding.value || !hasFloorData.value) return;
  
  const floorData = currentBuilding.value.properties.floorData;
  const totalFloors = floorData.length;
  
  // 动画持续时间（毫秒）
  const animationDuration = 1500;
  // 每个楼层的动画延迟，创建阶梯效应
  const delayPerFloor =
 150;
  // 动画开始时间
  const startTime = Date.now();
  
  // 存储每个楼层的原始位置和目标位置
  const floorAnimationData = floorData.map((floor, index) => {
    // 初始化楼层当前偏移量，用于动态更新
    floor._currentOffset = 0;
    
    return {
      floor,
      index,
      // 目标垂直偏移
      targetOffset: index * floorExplodeDistance.value,
      // 初始垂直偏移
      startOffset: 0,
      // 延迟开始时间
      startDelay: index * delayPerFloor,
      // 动画已完成
      completed: false
    };
  });
  
  // 创建缓动函数，使动画更加自然
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  
  // 弹性回弹效果
  const easeOutElastic = (t) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  };
  
  // 创建动画函数
  const animate = () => {
    const currentTime = Date.now();
    let allCompleted = true;
    
    // 更新每个楼层的位置
    floorAnimationData.forEach(data => {
      if (data.completed) return;
      
      // 计算该楼层的动画进度
      const elapsed = currentTime - startTime - data.startDelay;
      
      // 如果还没到开始时间，跳过
      if (elapsed < 0) {
        allCompleted = false;
        return;
      }
      
      // 计算动画进度 (0-1)
      let progress = Math.min(elapsed / animationDuration, 1);
      
      // 混合多种缓动函数创造更自然的效果
      let easedProgress;
      if (progress < 0.6) {
        // 前60%使用cubic缓动
        easedProgress = easeOutCubic(progress / 0.6);
      } else {
        // 后40%添加弹性效果
        const elasticT = (progress - 0.6) / 0.4;
        easedProgress = easeOutElastic(elasticT) * 0.1 + 0.9; // 轻微弹跳
      }
      
      // 计算当前偏移
      const currentOffset = data.startOffset + (data.targetOffset - data.startOffset) * easedProgress;
      
      // 直接更新楼层的_currentOffset属性，回调函数会使用这个值
      data.floor._currentOffset = currentOffset;
      
      // 更新标签位置
      if (data.floor.labelEntity) {
        const centerPoint = calculateCenter(currentBuilding.value.geometry.vertices);
        const labelHeight = data.floor.baseHeight + currentOffset + data.floor.height + 0.5;
        
        data.floor.labelEntity.position = Cesium.Cartesian3.fromDegrees(
          centerPoint.longitude, 
          centerPoint.latitude, 
          labelHeight
        );
      }
      
      // 检查是否完成
      if (progress >= 1) {
        data.completed = true;
      } else {
        allCompleted = false;
      }
    });
    
    // 通知Cesium进行视觉更新
    props.viewer.scene.requestRender();
    
    // 如果所有楼层都完成了动画，停止
    if (!allCompleted) {
      requestAnimationFrame(animate);
    }
  };
  
  // 开始动画
  requestAnimationFrame(animate);
};

// 为展开的楼层添加标签
const addExplodedFloorLabel = (floor, centerPoint, height) => {
  const labelEntity = props.viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      centerPoint.longitude, 
      centerPoint.latitude, 
      height + 0.5 // 稍微高于楼层顶部
    ),
    label: {
      text: floor.name,
      font: '12pt sans-serif',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      outlineColor: Cesium.Color.BLACK,
      fillColor: Cesium.Color.WHITE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -5),
      heightReference: Cesium.HeightReference.NONE, // 使用绝对高度
      disableDepthTestDistance: Number.POSITIVE_INFINITY // 确保标签始终可见
    }
  });
  
  // 将标签添加到楼层实体列表中，以便清理
  floorEntities.value.push(labelEntity);
  // 保存引用到楼层对象中，方便动画时更新位置
  floor.labelEntity = labelEntity;
  
  return labelEntity;
};

// 切换楼层抽屉效果
const toggleFloorDrawer = (floorIndex) => {
  if (!isFloorExploded.value || !currentBuilding.value || 
      !currentBuilding.value.properties.floorData) return;
  
  // 如果当前已有抽屉动画正在进行，清除它
  if (floorDrawerAnimationTimeout) {
    cancelAnimationFrame(floorDrawerAnimationTimeout);
    floorDrawerAnimationTimeout = null;
  }
  
  console.log(`切换楼层 ${floorIndex} 的抽屉效果，当前选中: ${selectedExplodedFloorIndex.value}`);
  
  // 如果点击的是当前已抽出的楼层，则收回它
  if (selectedExplodedFloorIndex.value === floorIndex) {
    console.log(`收回楼层 ${floorIndex}`);
    
    // 恢复原始材质和样式
    const floor = currentBuilding.value.properties.floorData[floorIndex];
    if (floor.entity && floor.entity._originalColor) {
      // 使用保存的颜色值创建新的材质
      floor.entity.polygon.material = floor.entity._originalColor;
      
      // 恢复轮廓设置
      if (floor.entity._originalOutlineWidth !== undefined) {
        floor.entity.polygon.outlineWidth = floor.entity._originalOutlineWidth;
      } else {
        floor.entity.polygon.outlineWidth = 1;
      }
      
      if (floor.entity._originalOutlineColor) {
        floor.entity.polygon.outlineColor = floor.entity._originalOutlineColor;
      } else {
        floor.entity.polygon.outlineColor = Cesium.Color.BLACK;
      }
    }
    
    // 重置水平偏移
    floor._horizontalOffset = {
      longitude: 0,
      latitude: 0
    };
    
    selectedExplodedFloorIndex.value = -1;
    // 重新应用普通的展开效果
    applyFloorExplode();
  } else {
    console.log(`抽出楼层 ${floorIndex}`);
    
    // 如果之前有选中的楼层，先恢复它的样式
    if (selectedExplodedFloorIndex.value !== -1) {
      const prevFloor = currentBuilding.value.properties.floorData[selectedExplodedFloorIndex.value];
      if (prevFloor.entity && prevFloor.entity._originalColor) {
        // 恢复原始颜色
        prevFloor.entity.polygon.material = prevFloor.entity._originalColor;
        
        // 恢复轮廓设置
        if (prevFloor.entity._originalOutlineWidth !== undefined) {
          prevFloor.entity.polygon.outlineWidth = prevFloor.entity._originalOutlineWidth;
        } else {
          prevFloor.entity.polygon.outlineWidth = 1;
        }
        
        if (prevFloor.entity._originalOutlineColor) {
          prevFloor.entity.polygon.outlineColor = prevFloor.entity._originalOutlineColor;
        } else {
          prevFloor.entity.polygon.outlineColor = Cesium.Color.BLACK;
        }
        
        // 重置之前楼层的水平偏移
        prevFloor._horizontalOffset = {
          longitude: 0,
          latitude: 0
        };
        
        // 重新渲染一次确保更新
        props.viewer.scene.requestRender();
      }
    }
    
    // 抽出该楼层
    selectedExplodedFloorIndex.value = floorIndex;
    
    // 确保楼层数据存在，如果不存在则创建
    if (!currentBuilding.value.properties.floorData[floorIndex].entity) {
      // 计算当前展开状态下的偏移量
      const offset = floorIndex * floorExplodeDistance.value;
      createExplodedFloorEntity(floorIndex, offset);
    }
    
    // 应用抽屉效果
    applyDrawerEffectToFloor(floorIndex);
  }
};

// 为指定楼层应用抽屉效果
const applyDrawerEffectToFloor = (floorIndex) => {
  if (!currentBuilding.value || 
      !currentBuilding.value.properties.floorData || 
      floorIndex >= currentBuilding.value.properties.floorData.length) return;
  
  const floor = currentBuilding.value.properties.floorData[floorIndex];
  
  // 如果该楼层实体不存在，先创建它
  if (!floor.entity) {
    // 计算当前展开状态下的偏移量
    const offset = floorIndex * floorExplodeDistance.value;
    createExplodedFloorEntity(floorIndex, offset);
  }
  
  // 获取建筑底面顶点
  const vertices = currentBuilding.value.geometry.vertices;
  const centerPoint = calculateCenter(vertices);
  
  // 计算抽屉效果的水平偏移方向，根据建筑大小动态调整
  // 获取建筑底面的尺寸
  const boundingRect = calculateBoundingRect(vertices);
  
  // 根据建筑大小计算合适的抽出距离（取建筑底面较短边的10%左右）
  const buildingSize = Math.min(boundingRect.width, boundingRect.length);
  const drawerOffset = Math.max(buildingSize * 0.1, 3); // 至少3米，最多为短边的30%
  
  console.log(`建筑大小: ${boundingRect.width.toFixed(1)}m x ${boundingRect.length.toFixed(1)}m, 抽出距离: ${drawerOffset.toFixed(1)}m`);
  
  // 获取当前相机位置，用于确定抽出方向
  const cameraPosition = props.viewer.camera.position;
  const cameraCartographic = Cesium.Cartographic.fromCartesian(cameraPosition);
  const floorCartographic = Cesium.Cartographic.fromDegrees(
    centerPoint.longitude, 
    centerPoint.latitude
  );
  
  // 计算楼层中心到相机的方向向量 (这样楼层会向着相机方向抽出)
  const direction = {
    longitude: cameraCartographic.longitude - floorCartographic.longitude,
    latitude: cameraCartographic.latitude - floorCartographic.latitude
  };
  
  // 归一化方向向量
  const length = Math.sqrt(direction.longitude * direction.longitude + direction.latitude * direction.latitude);
  if (length > 0) {
    direction.longitude /= length;
    direction.latitude /= length;
  }
  
  // 不需要反向，确保楼层向着相机方向抽出
  console.log(`抽出方向向量: (${direction.longitude.toFixed(5)}, ${direction.latitude.toFixed(5)})`);
  
  // 设置动画开始时间
  const startTime = Date.now();
  
  // 楼层的初始水平位置
  floor._horizontalOffset = {
    longitude: 0,
    latitude: 0
  };
  
  // 首先应用高亮颜色，使层更容易识别
  if (floor.entity && floor.entity.polygon) {
    // 保存原始颜色以便后续恢复 - 保存为颜色值而不是材质对象
    if (floor.entity.polygon.material instanceof Cesium.ColorMaterialProperty) {
      const color = floor.entity.polygon.material.color.getValue();
      floor.entity._originalColor = color.clone();
    } else {
      // 如果不是颜色材质，则简单记录为白色
      floor.entity._originalColor = Cesium.Color.WHITE.clone();
    }
    
    // 保存轮廓设置
    floor.entity._originalOutlineWidth = floor.entity.polygon.outlineWidth.getValue();
    floor.entity._originalOutlineColor = floor.entity.polygon.outlineColor.getValue().clone();
    
    // 应用高亮颜色 - 使用更明亮的黄色
    floor.entity.polygon.material = Cesium.Color.YELLOW.withAlpha(0.9);
    
    // 增加轮廓宽度，让其更突出
    floor.entity.polygon.outlineWidth = 3;
    floor.entity.polygon.outlineColor = Cesium.Color.WHITE;
  }
  
  // 确保楼层实体是可见的
  if (floor.entity) {
    floor.entity.show = true;
  }
  
  // 如果使用了动态回调，更新回调参数
  // 否则，直接更新楼层实体位置
  if (floor.entity && floor.entity.polygon) {
    if (floor.entity.polygon.hierarchy instanceof Cesium.CallbackProperty) {
      // 回调属性已经存在，确保状态正确初始化
      floor._horizontalOffset = {
        longitude: 0,
        latitude: 0
      };
      floor._currentOffset = floorIndex * floorExplodeDistance.value;
    } else {
      // 创建新的回调函数，考虑水平偏移和垂直偏移
      const positionCallback = new Cesium.CallbackProperty((time, result) => {
        // 获取当前的偏移量
        const verticalOffset = floor._currentOffset !== undefined ? floor._currentOffset : (floorIndex * floorExplodeDistance.value);
        const horizontalOffsetLon = floor._horizontalOffset ? floor._horizontalOffset.longitude : 0;
        const horizontalOffsetLat = floor._horizontalOffset ? floor._horizontalOffset.latitude : 0;
        
        // 获取建筑底面顶点
        const vertices = currentBuilding.value.geometry.vertices;
        
        // 计算平移后的顶点坐标
        const positions = vertices.map(vertex => {
          const dx = vertex.longitude - centerPoint.longitude;
          const dy = vertex.latitude - centerPoint.latitude;
          return Cesium.Cartesian3.fromDegrees(
            centerPoint.longitude + horizontalOffsetLon + dx,
            centerPoint.latitude + horizontalOffsetLat + dy,
            verticalOffset
          );
        });
        
        // 创建多边形层次结构
        let hierarchyResult = new Cesium.PolygonHierarchy(positions);
        
        // 添加孔洞
        if (currentBuilding.value.geometry.holes && currentBuilding.value.geometry.holes.length > 0) {
          currentBuilding.value.geometry.holes.forEach(hole => {
            const holePositions = hole.map(vertex => {
              const dx = vertex.longitude - centerPoint.longitude;
              const dy = vertex.latitude - centerPoint.latitude;
              return Cesium.Cartesian3.fromDegrees(
                centerPoint.longitude + horizontalOffsetLon + dx,
                centerPoint.latitude + horizontalOffsetLat + dy,
                verticalOffset
              );
            });
            
            if (holePositions.length > 0) {
              hierarchyResult.holes.push(new Cesium.PolygonHierarchy(holePositions));
            }
          });
        }
        
        return hierarchyResult;
      }, false);
      
      // 高度动态回调
      const heightCallback = new Cesium.CallbackProperty((time, result) => {
        // 如果楼层没有保存当前偏移量，使用默认值
        const offset = floor._currentOffset !== undefined ? floor._currentOffset : (floorIndex * floorExplodeDistance.value);
        return floor.baseHeight + offset;
      }, false);
      
      // 楼层顶部高度动态回调
      const extrudedHeightCallback = new Cesium.CallbackProperty((time, result) => {
        // 如果楼层没有保存当前偏移量，使用默认值
        const offset = floor._currentOffset !== undefined ? floor._currentOffset : (floorIndex * floorExplodeDistance.value);
        return floor.baseHeight + offset + floor.height;
      }, false);
      
      // 替换原有的hierarchy和高度属性
      floor.entity.polygon.hierarchy = positionCallback;
      floor.entity.polygon.height = heightCallback;
      floor.entity.polygon.extrudedHeight = extrudedHeightCallback;
      
      // 初始化状态
      floor._horizontalOffset = {
        longitude: 0,
        latitude: 0
      };
      floor._currentOffset = floorIndex * floorExplodeDistance.value;
    }
  }
  
  // 创建动画函数
  const animateDrawer = () => {
    const elapsedTime = Date.now() - startTime;
    const progress = Math.min(elapsedTime / floorDrawerAnimationDuration, 1);
    
    // 结合回弹和弹性效果
    const easeOutBackElastic = (t) => {
      if (t < 0.5) {
        // 前半段使用回弹效果
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const adjusted = t * 2; // 调整为0-1范围
        return 0.5 * (1 + c3 * Math.pow(adjusted - 1, 3) + c1 * Math.pow(adjusted - 1, 2));
      } else {
        // 后半段使用弹性效果，但强度降低
        const p = 0.4;
        const adjusted = (t - 0.5) * 2; // 调整为0-1范围
        const elastic = Math.pow(2, -12 * adjusted) * Math.sin((adjusted - p / 4) * (2 * Math.PI) / p) * 0.25 + 1;
        return 0.5 + 0.5 * elastic;
      }
    };
    
    const easeOutProgress = easeOutBackElastic(progress);
    
    // 计算当前偏移量，增大经纬度缩放因子，确保动画更加明显
    const currentOffset = drawerOffset * easeOutProgress;
    
    // 应用水平偏移
    const offsetFactor = 0.00015;
    floor._horizontalOffset = {
      longitude: direction.longitude * currentOffset * offsetFactor,
      latitude: direction.latitude * currentOffset * offsetFactor
    };
    
    // 在垂直方向添加轻微的上升再下降效果
    const verticalBoost = progress < 0.7 ? Math.sin(progress * Math.PI) * 0.5 : 0;
    // 保持当前的垂直偏移
    floor._currentOffset = floorIndex * floorExplodeDistance.value + verticalBoost;
    
    // 更新标签位置
    if (floor.labelEntity) {
      floor.labelEntity.position = Cesium.Cartesian3.fromDegrees(
        centerPoint.longitude + floor._horizontalOffset.longitude,
        centerPoint.latitude + floor._horizontalOffset.latitude,
        floor._currentOffset + floor.height + 0.5
      );
    }
    
    // 通知Cesium进行视觉更新
    props.viewer.scene.requestRender();
    
    // 如果动画未完成，使用requestAnimationFrame继续下一帧
    if (progress < 1) {
      // 保存requestAnimationFrame的ID以便后续取消
      floorDrawerAnimationTimeout = requestAnimationFrame(animateDrawer);
    } else {
      floorDrawerAnimationTimeout = null;
      
      // 创建一个闪烁效果，让用户注意到抽出的楼层
      flashFloorBorder();
    }
  };
  
  // 创建楼层边界闪烁效果
  const flashFloorBorder = () => {
    if (!floor.entity || !floor.entity.polygon) return;
    
    let flashCount = 0;
    const maxFlashes = 3;
    let isHighlighted = true;
    
    const flashInterval = setInterval(() => {
      if (flashCount >= maxFlashes) {
        clearInterval(flashInterval);
        return;
      }
      
      isHighlighted = !isHighlighted;
      
      if (isHighlighted) {
        floor.entity.polygon.outlineColor = Cesium.Color.WHITE;
        floor.entity.polygon.outlineWidth = 3;
      } else {
        floor.entity.polygon.outlineColor = Cesium.Color.BLACK;
        floor.entity.polygon.outlineWidth = 1;
      }
      
      flashCount++;
    }, 300);
  };
  
  // 开始动画
  animateDrawer();
};

// 组件卸载时清理资源
onUnmounted(() => {
  // 清理抽屉动画定时器
  if (floorDrawerAnimationTimeout) {
    cancelAnimationFrame(floorDrawerAnimationTimeout);
    floorDrawerAnimationTimeout = null;
  }
  
  // 重置分层抽屉动画状态
  isFloorExploded.value = false;
  selectedExplodedFloorIndex.value = -1;
  
  cleanupAll();
  
  // 清理复制预览
  cleanupCopyPreview();
  
  // 确保恢复属性查询窗口功能
  emit('enable-info-box');
  
  // 保存当前数据到会话存储
  saveBuildingData();
  
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});

// 暴露给父组件的方法
defineExpose({
  isInEditMode: computed(() => props.isInBuildingEditMode),
  copyMultipleBuildings: (buildings) => {
    if (buildings && buildings.length > 0 && currentGroup.value) {
      // 找到buildings中的所有建筑在当前组中的索引
      const buildingIndices = [];
      buildings.forEach(entity => {
        if (entity && entity.buildingRef) {
          const index = currentGroup.value.buildings.findIndex(b => b === entity.buildingRef);
          if (index !== -1) {
            buildingIndices.push(index);
          }
        }
      });
      
      // 如果找到了至少一个建筑，则更新选中列表并执行批量复制
      if (buildingIndices.length > 0) {
        selectedBuildingIndices.value = buildingIndices;
        if (buildingIndices.length === 1) {
          copySourceBuildingIndex.value = buildingIndices[0];
          startBuildingCopy(buildingIndices[0]);
        } else {
          batchCopyBuildings();
        }
      }
    }
  }
});

// 保存建筑数据到会话存储
const saveBuildingData = () => {
  try {
    // 创建没有实体引用和循环引用的深拷贝
    const serializedGroups = buildingGroups.value.map(group => {
      // 只复制必要的属性，避免复制可能包含循环引用的属性
      const groupCopy = {
        name: group.name,
        visible: group.visible,
        asLayer: group.asLayer,
        buildings: []
      };
      
      // 仅复制建筑的必要属性
      if (group.buildings && Array.isArray(group.buildings)) {
        groupCopy.buildings = group.buildings.map(building => {
          if (!building) return null;
          
          // 创建安全的建筑对象副本
          const buildingCopy = {
            properties: { ...building.properties },
            geometry: {
              vertices: building.geometry.vertices ? 
                building.geometry.vertices.map(v => ({ 
                  longitude: v.longitude, 
                  latitude: v.latitude,
                  height: v.height || 0
                })) : [],
              holes: []
            },
            visible: building.visible
          };
          
          // 安全地复制孔洞数据
          if (building.geometry.holes && Array.isArray(building.geometry.holes)) {
            buildingCopy.geometry.holes = building.geometry.holes.map(hole => {
              if (Array.isArray(hole)) {
                return hole.map(v => ({
                  longitude: v.longitude,
                  latitude: v.latitude,
                  height: v.height || 0
                }));
              }
              return [];
            });
          }
          
          // 确保properties是干净的对象
          if (buildingCopy.properties.floorData && Array.isArray(buildingCopy.properties.floorData)) {
            buildingCopy.properties.floorData = buildingCopy.properties.floorData.map(floor => {
              const floorCopy = { ...floor };
              delete floorCopy.entity; // 删除实体引用
              return floorCopy;
            });
          }
          
          return buildingCopy;
        }).filter(b => b !== null); // 过滤掉无效的建筑对象
      }
      
      return groupCopy;
    });
    
    // 保存到会话存储
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(serializedGroups));
    console.log('建筑规划数据已保存到会话存储');
  } catch (error) {
    console.error('保存建筑规划数据失败:', error);
  }
};

// 从会话存储加载建筑数据
const loadBuildingData = () => {
  try {
    const storedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      
      // 处理加载的数据
      buildingGroups.value = parsedData.map(group => {
        // 确保buildings属性存在并初始化
        if (!group.buildings) {
          group.buildings = [];
        }
        
        // 确保每个建筑都有正确的属性结构
        group.buildings = group.buildings.map(building => {
          // 确保几何属性存在
          if (!building.geometry) {
            building.geometry = { vertices: [], holes: [] };
          }
          
          // 确保属性存在
          if (!building.properties) {
            building.properties = createDefaultBuildingProperties();
          }
          
          // 确保visible属性存在
          if (building.visible === undefined) {
            building.visible = true;
          }
          
          return building;
        });
        
        // 确保实体数组初始化
        group.entities = [];
        
        // 确保建筑群visible属性存在
        if (group.visible === undefined) {
          group.visible = true;
        }
        
        return group;
      });
      
      console.log('已从会话存储加载建筑规划数据');
      
      // 重建实体
      rebuildAllEntities();
    }
  } catch (error) {
    console.error('加载建筑规划数据失败:', error);
    buildingGroups.value = [];
  }
};

// 重建所有实体
const rebuildAllEntities = () => {
  if (!props.viewer) return;
  
  buildingGroups.value.forEach(group => {
    group.buildings.forEach(building => {
      if (building.geometry.vertices.length >= 3 && building.properties.height > 0) {
        // 恢复笛卡尔坐标
        building.geometry.vertices.forEach(vertex => {
          if (!vertex.cartesian && vertex.longitude && vertex.latitude) {
            vertex.cartesian = latLonToCartesian(vertex.longitude, vertex.latitude, 0);
          }
        });
        
        // 如果有孔洞，也恢复其笛卡尔坐标
        if (building.geometry.holes) {
          building.geometry.holes.forEach(hole => {
            hole.forEach(vertex => {
              if (!vertex.cartesian && vertex.longitude && vertex.latitude) {
                vertex.cartesian = latLonToCartesian(vertex.longitude, vertex.latitude, 0);
              }
            });
          });
        }
        
        // 重建建筑实体
        createBuildingEntity(building);
        
        // 确保建筑可见性与所属群组一致
        if (building.entity && !group.visible) {
          building.entity.show = false;
          building.visible = false;
        }
        
        // 如果有楼层数据，也重新渲染楼层
        if (building.properties.floorData && building.properties.floorData.length > 0) {
          // 临时设置当前建筑和当前楼层索引，以便正确渲染楼层
          const prevBuilding = currentBuilding.value;
          const prevFloorIndex = currentFloorIndex.value;
          
          currentBuilding.value = building;
          // 设置为-1表示渲染所有楼层
          currentFloorIndex.value = -1;
          
          // 渲染所有楼层
          renderFloors();
          
          // 如果是当前选中的建筑，保持楼层视图状态
          if (building === prevBuilding) {
            currentFloorIndex.value = prevFloorIndex;
            if (prevFloorIndex !== -1) {
              // 如果之前是查看特定楼层，继续渲染特定楼层
              cleanupFloorEntities();
              createFloorEntity(prevFloorIndex);
            }
          } else {
            // 恢复之前的状态
            currentBuilding.value = prevBuilding;
            currentFloorIndex.value = prevFloorIndex;
          }
          
          // 隐藏整体建筑，显示楼层
          if (building.entity) {
            building.entity.show = false;
          }
        }
      }
    });
  });
};

  // 修改createBuildingEntity函数接受building参数
const createBuildingEntity = (building = null) => {
  const buildingToUse = building || currentBuilding.value;
  if (!buildingToUse) return;
  
  // 检查当前建筑所在的群组是否可见
  let groupVisible = true;
  if (building) {
    // 如果是通过参数传入的建筑，查找其所属的建筑群
    const groupIndex = buildingGroups.value.findIndex(group => 
      group.buildings.includes(buildingToUse)
    );
    if (groupIndex !== -1) {
      groupVisible = buildingGroups.value[groupIndex].visible;
    }
  } else if (currentGroup.value) {
    // 如果是当前选中的建筑，直接使用当前群组的可见性
    groupVisible = currentGroup.value.visible;
  }
  
  // 提取顶点坐标
  const positions = buildingToUse.geometry.vertices.map(vertex => 
    Cesium.Cartesian3.fromDegrees(vertex.longitude, vertex.latitude, 0)
  );
  
  // 计算轮廓的中心点
  const centerPoint = calculateCenter(buildingToUse.geometry.vertices);
  
  // 创建建筑材质
  const buildingMaterial = Cesium.Color.fromCssColorString(buildingToUse.properties.color)
    .withAlpha(buildingToUse.properties.alpha);
  
  // 创建多边形层次结构（包括孔洞）
  let hierarchy = { positions };
  
  // 添加孔洞
  if (buildingToUse.geometry.holes && buildingToUse.geometry.holes.length > 0) {
    hierarchy.holes = buildingToUse.geometry.holes.map(hole => {
      return {
        positions: hole.map(vertex => 
          Cesium.Cartesian3.fromDegrees(vertex.longitude, vertex.latitude, 0)
        )
      };
    });
  }
  
  // 创建建筑实体
  buildingToUse.entity = props.viewer.entities.add({
    name: buildingToUse.properties.name,
    description: buildingToUse.properties.description,
    position: Cesium.Cartesian3.fromDegrees(centerPoint.longitude, centerPoint.latitude, 0),
    polygon: {
      hierarchy: hierarchy,
      extrudedHeight: buildingToUse.properties.height,
      material: buildingMaterial,
      outline: true,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      closeTop: true,
      closeBottom: true
    },
    // 添加标识，表示这是一个建筑实体
    isBuilding: true,
    // 添加建筑属性引用
    buildingData: buildingToUse
  });
  
  // 应用建筑和建筑群的可见性设置
  buildingToUse.entity.show = buildingToUse.visible && groupVisible;
  
  // 根据材质类型应用特殊材质
  applyBuildingMaterial();
  
  // 应用建筑基本形状
  applyBuildingShape();
  
  // 将实体添加到当前建筑
  buildingToUse.entity.buildingRef = buildingToUse;
  
  // 添加复制功能
  buildingToUse.entity.copyFunction = () => {
    // 保存当前的isInBuildingEditMode和selectedBuildingIndices值的引用
    const isEditMode = props.isInBuildingEditMode;
    const selectedIndices = selectedBuildingIndices.value;
    const currentGroupRef = currentGroup.value;
    
    // 检查是否有多个建筑被选中
    if (isEditMode && selectedIndices.length > 1) {
      // 如果当前建筑在选中列表中，则复制所有选中的建筑
      const index = currentGroupRef.buildings.findIndex(b => b === buildingToUse);
      if (selectedIndices.includes(index)) {
        batchCopyBuildings();
        return;
      }
    }
    // 否则只复制单个建筑
    copyBuildingToPointer(buildingToUse);
  };
  
  // 添加标签
  addBuildingLabel();
  
  // 如果有楼层数据，隐藏整体建筑显示楼层
  if (buildingToUse.properties.floorData && 
      buildingToUse.properties.floorData.length > 0) {
    buildingToUse.entity.show = false;
    
    // 保存当前状态
    const prevBuilding = currentBuilding.value;
    const prevFloorIndex = currentFloorIndex.value;
    
    // 设置临时状态以便渲染楼层
    currentBuilding.value = buildingToUse;
    // 不改变当前选中的楼层索引，这样保持用户的选择状态
    
    // 渲染楼层
    renderFloors();
    
    // 恢复之前的状态（如果不是当前建筑）
    if (buildingToUse !== prevBuilding) {
      currentBuilding.value = prevBuilding;
      currentFloorIndex.value = prevFloorIndex;
    }
  }
};

// 计算多边形中心点
const calculateCenter = (vertices) => {
  if (!vertices || vertices.length === 0) return { longitude: 0, latitude: 0 };
  
  let sumLon = 0;
  let sumLat = 0;
  
  vertices.forEach(vertex => {
    sumLon += vertex.longitude;
    sumLat += vertex.latitude;
  });
  
  return {
    longitude: sumLon / vertices.length,
    latitude: sumLat / vertices.length
  };
};

// 计算建筑物底面的边界矩形尺寸
const calculateBoundingRect = (vertices) => {
  if (!vertices || vertices.length < 3) {
    return { width: 0, length: 0 };
  }
  
  // 找出最小和最大的经纬度值
  let minLon = vertices[0].longitude;
  let maxLon = vertices[0].longitude;
  let minLat = vertices[0].latitude;
  let maxLat = vertices[0].latitude;
  
  vertices.forEach(vertex => {
    minLon = Math.min(minLon, vertex.longitude);
    maxLon = Math.max(maxLon, vertex.longitude);
    minLat = Math.min(minLat, vertex.latitude);
    maxLat = Math.max(maxLat, vertex.latitude);
  });
  
  // 转换经纬度差值为近似米
  // 纬度1度约等于111km（111000m）
  const latDiff = (maxLat - minLat) * 111000;
  
  // 经度1度的距离随纬度变化，在赤道处是111km，在两极是0
  // 使用平均纬度来计算
  const avgLat = (minLat + maxLat) / 2;
  const lonDiff = (maxLon - minLon) * 111000 * Math.cos(avgLat * Math.PI / 180);
  
  return {
    width: Math.min(latDiff, lonDiff), // 较短的边作为宽
    length: Math.max(latDiff, lonDiff) // 较长的边作为长
  };
};

// 应用建筑材质
const applyBuildingMaterial = () => {
  if (!currentBuilding.value || !currentBuilding.value.entity) return;
  
  const entity = currentBuilding.value.entity;
  const materialType = currentBuilding.value.properties.materialType || 'solid';
  const color = Cesium.Color.fromCssColorString(currentBuilding.value.properties.color)
    .withAlpha(currentBuilding.value.properties.alpha);
    
  console.log('正在应用材质类型:', materialType, '颜色:', currentBuilding.value.properties.color);
  
  // 清除之前可能存在的墙壁实体
  if (entity._wallEntities) {
    entity._wallEntities.forEach(wallEntity => {
      if (props.viewer.entities.contains(wallEntity)) {
        props.viewer.entities.remove(wallEntity);
      }
    });
  }
  entity._wallEntities = [];
  
  // 清除之前可能存在的屋顶实体
  if (entity._roofEntity && props.viewer.entities.contains(entity._roofEntity)) {
    props.viewer.entities.remove(entity._roofEntity);
    entity._roofEntity = null;
  }
  
  // 纯色材质应用到所有面
  if (materialType === 'solid') {
    entity.polygon.material = color;
    entity.polygon.closeTop = true;
    entity.polygon.closeBottom = true;
    return;
  }
  
  // 创建具有不同材质的实体
  try {
    // 获取建筑底面顶点
    const positions = currentBuilding.value.geometry.vertices.map(vertex => 
      Cesium.Cartesian3.fromDegrees(vertex.longitude, vertex.latitude, 0)
    );
    
    // 计算中心点
    const centerPoint = calculateCenter(currentBuilding.value.geometry.vertices);
    
    // 设置建筑底座为透明
    entity.polygon.material = Cesium.Color.fromCssColorString(currentBuilding.value.properties.color)
      .withAlpha(0.2); // 半透明
    entity.polygon.closeTop = false; // 不使用默认封顶，我们将创建自定义封顶
    entity.polygon.closeBottom = true;
    
    // 为每对相邻顶点创建墙壁
    const height = currentBuilding.value.properties.height;
    const numPoints = positions.length;
    
    // 处理选择的材质
    let materialImage;
    let imagePath;
    
    switch (materialType) {
      case 'material1':
        imagePath = '/assets/textures/房子1.jpg';
        break;
      case 'material2':
        imagePath = '/assets/textures/房子2.jpg';
        break;
      case 'material3':
        imagePath = '/assets/textures/房子3.jpg';
        break;
      default:
        imagePath = '/assets/textures/房子1.jpg';
    }
    
    // 定义创建屋顶实体的函数
    const createRoofEntity = (positions, height, roofColor) => {
      // 创建屋顶多边形层次结构
      let hierarchy = new Cesium.PolygonHierarchy(positions);
      
      // 添加孔洞
      if (currentBuilding.value.geometry.holes && currentBuilding.value.geometry.holes.length > 0) {
        currentBuilding.value.geometry.holes.forEach(hole => {
          if (hole.length >= 3) {
            const holePositions = hole.map(vertex => 
              Cesium.Cartesian3.fromDegrees(vertex.longitude, vertex.latitude, 0)
            );
            hierarchy.holes.push(new Cesium.PolygonHierarchy(holePositions));
          }
        });
      }
      
      // 创建屋顶多边形实体（原色封顶）
      const roofEntity = props.viewer.entities.add({
        polygon: {
          hierarchy: hierarchy,
          height: height, // 设置在建筑顶部
          material: roofColor, // 使用原色
          outline: true,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1
        }
      });
      
      // 保存屋顶实体引用以便后续清理
      entity._roofEntity = roofEntity;
    };
    
    // 创建图片对象
    materialImage = new Image();
    materialImage.src = window.location.origin + imagePath;
    
    // 图片加载成功回调
    materialImage.onload = () => {
      console.log(`材质图片加载成功: ${imagePath}`);
      
      // 创建四周墙壁
      for (let i = 0; i < numPoints; i++) {
        const startIndex = i;
        const endIndex = (i + 1) % numPoints;
        
        const wallPositions = [
          positions[startIndex],
          positions[endIndex]
        ];
        
        // 创建墙实体
        const wallEntity = props.viewer.entities.add({
          wall: {
            positions: wallPositions,
            minimumHeights: [0, 0],
            maximumHeights: [height, height],
            material: new Cesium.ImageMaterialProperty({
              image: materialImage,
              color: color,
              repeat: new Cesium.Cartesian2(2, 2)
            }),
            outline: true,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1
          }
        });
        
        // 保存墙壁实体引用以便后续清理
        entity._wallEntities.push(wallEntity);
      }
      
      // 创建顶部封顶多边形（使用原色）
      createRoofEntity(positions, height, color);
    };
    
    // 图片加载失败回调
    materialImage.onerror = (err) => {
      console.error(`材质图片加载失败: ${imagePath}`, err);
      // 加载失败时应用纯色墙壁
      for (let i = 0; i < numPoints; i++) {
        const startIndex = i;
        const endIndex = (i + 1) % numPoints;
        
        const wallPositions = [
          positions[startIndex],
          positions[endIndex]
        ];
        
        // 创建纯色墙实体
        const wallEntity = props.viewer.entities.add({
          wall: {
            positions: wallPositions,
            minimumHeights: [0, 0],
            maximumHeights: [height, height],
            material: color,
            outline: true,
            outlineColor: Cesium.Color.BLACK
          }
        });
        
        // 保存墙壁实体引用以便后续清理
        entity._wallEntities.push(wallEntity);
      }
      
      // 加载失败时也创建顶部封顶
      createRoofEntity(positions, height, color);
    };
  } catch (error) {
    console.error('应用墙壁材质失败:', error);
    // 回退到纯色材质
    entity.polygon.material = color;
    entity.polygon.closeTop = true;
    entity.polygon.closeBottom = true;
  }
};

// 应用建筑基本形状
const applyBuildingShape = () => {
  if (!currentBuilding.value || !currentBuilding.value.entity) return;
  
  const entity = currentBuilding.value.entity;
  const buildingHeight = currentBuilding.value.properties.height || 30;
  
  // 设置基本建筑形状 - 标准挤出多边形
  entity.polygon.extrudedHeight = buildingHeight;
  
  // 移除任何已有的特殊屋顶实体
  if (entity._roofEntity && props.viewer.entities.contains(entity._roofEntity)) {
    props.viewer.entities.remove(entity._roofEntity);
    entity._roofEntity = null;
  }
};

// 添加建筑标签
const addBuildingLabel = () => {
  if (!currentBuilding.value || !currentBuilding.value.entity) return;
  
  const centerPoint = calculateCenter(currentBuilding.value.geometry.vertices);
  
  const labelEntity = props.viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      centerPoint.longitude, 
      centerPoint.latitude, 
      currentBuilding.value.properties.height + 5
    ),
    label: {
      text: currentBuilding.value.properties.name,
      font: '14pt sans-serif',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -10),
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
    }
  });
  
  // 将标签实体也添加到绘制实体列表中，以便清理
  drawingEntities.value.push(labelEntity);
};

  // 获取材质预览图URL
const getMaterialPreviewUrl = (materialType) => {
  const baseUrl = window.location.origin + '/assets/textures/';
  
  // 定义材质映射
  const materialImageMap = {
    'material1': '房子1.jpg',
    'material2': '房子2.jpg',
    'material3': '房子3.jpg',
    'default': '房子1.jpg'
  };
  
  // 获取对应材质图片名称
  const imageName = materialImageMap[materialType] || materialImageMap.default;
  const imageUrl = `${baseUrl}${imageName}`;
  
  // 检查图片是否可访问
  const checkImage = () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log(`材质预览图 ${imageUrl} 加载成功`);
        resolve(true);
      };
      img.onerror = () => {
        console.error(`材质预览图 ${imageUrl} 加载失败`);
        reject(false);
      };
      img.src = imageUrl;
    });
  };
  
  // 执行检查
  checkImage().catch(err => console.warn('图片访问检查失败:', err));
  
  // 返回完整路径
  return imageUrl;
};

  // 飞行到建筑位置
const flyToBuilding = () => {
  if (!currentBuilding.value || !currentBuilding.value.entity) return;
  
  props.viewer.flyTo(currentBuilding.value.entity, {
    duration: 2.0,
    offset: new Cesium.HeadingPitchRange(
      0,
      Cesium.Math.toRadians(-45), // 俯视角度
      currentBuilding.value.properties.height * 3  // 距离
    )
  });
};

// 设置顶点交互
const setupVertexInteraction = () => {
  if (!currentBuilding.value) return;
  
  // 清理之前的处理器
  if (vertexInteractionHandler) {
    vertexInteractionHandler.destroy();
  }
  
  if (vertexDragHandler) {
    vertexDragHandler.destroy();
  }
  
  // 创建新的顶点选择处理器
  vertexInteractionHandler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  // 单击选择顶点
  vertexInteractionHandler.setInputAction((click) => {
    if (isDrawing.value) return;
    
    const vertices = currentBuilding.value.geometry.vertices;
    if (!vertices || vertices.length === 0) return;
    
    // 找出点击位置附近的顶点
    const pickedPosition = click.position;
    let minDistance = 20; // 选择容差，单位为像素
    let closestVertexIndex = -1;
    
    // 检查每个顶点，找出最近的
    for (let i = 0; i < vertices.length; i++) {
      const vertexPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
        props.viewer.scene, 
        vertices[i].cartesian
      );
      
      if (vertexPosition) {
        const distance = Math.sqrt(
          Math.pow(pickedPosition.x - vertexPosition.x, 2) + 
          Math.pow(pickedPosition.y - vertexPosition.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestVertexIndex = i;
        }
      }
    }
    
    selectVertex(closestVertexIndex);
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // 设置拖动处理器
  vertexDragHandler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  // 左键按下开始拖动
  vertexDragHandler.setInputAction((mouseDown) => {
    if (selectedVertexIndex.value === -1 || isDrawing.value) return;
    
    // 获取当前选中顶点的位置
    const vertex = currentBuilding.value.geometry.vertices[selectedVertexIndex.value];
    if (!vertex) return;
    
    // 将顶点位置转换为屏幕坐标
    const vertexPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      props.viewer.scene, 
      vertex.cartesian
    );
    
    // 检查鼠标点击是否在顶点附近
    if (vertexPosition) {
      const distance = Math.sqrt(
        Math.pow(mouseDown.position.x - vertexPosition.x, 2) + 
        Math.pow(mouseDown.position.y - vertexPosition.y, 2)
      );
      
      if (distance < 20) { // 20像素的点击容差
        isDragging.value = true;
        props.viewer.scene.screenSpaceCameraController.enableRotate = false; // 禁用相机旋转，以便拖动
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
  
  // 鼠标移动拖动顶点
  vertexDragHandler.setInputAction((mouseMove) => {
    if (!isDragging.value || selectedVertexIndex.value === -1) return;
    
    const cartesian = getCartesianFromClick(mouseMove.endPosition);
    if (cartesian) {
      updateVertex(selectedVertexIndex.value, cartesian);
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  
  // 左键释放结束拖动
  vertexDragHandler.setInputAction(() => {
    if (isDragging.value) {
      isDragging.value = false;
      props.viewer.scene.screenSpaceCameraController.enableRotate = true; // 恢复相机旋转
      
      // 如果建筑实体存在，更新它以反映顶点变化
      if (currentBuilding.value && currentBuilding.value.entity) {
        updateBuildingEntity();
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_UP);
};

// 选中顶点
const selectVertex = (index) => {
  if (!currentBuilding.value) return;
  
  // 取消之前选中的顶点高亮
  if (selectedVertexIndex.value !== -1 && selectedVertexIndex.value < vertexEntities.value.length) {
    if (vertexEntities.value[selectedVertexIndex.value]) {
      vertexEntities.value[selectedVertexIndex.value].point.color = Cesium.Color.YELLOW;
    }
  }
  
  // 设置新的选中顶点
  selectedVertexIndex.value = index;
  
  // 高亮显示选中的顶点
  if (index !== -1 && index < vertexEntities.value.length && vertexEntities.value[index]) {
    vertexEntities.value[index].point.color = Cesium.Color.RED;
  }
};

// 更新顶点
const updateVertex = (index, cartesian = null) => {
  if (!currentBuilding.value || index < 0 || index >= currentBuilding.value.geometry.vertices.length) return;
  
  if (cartesian) {
    // 如果提供了笛卡尔坐标，使用它
    const vertexData = cartesianToLatLon(cartesian);
    currentBuilding.value.geometry.vertices[index] = vertexData;
  } else {
    // 否则，从当前输入值创建新的笛卡尔坐标
    const vertex = currentBuilding.value.geometry.vertices[index];
    const newCartesian = latLonToCartesian(vertex.longitude, vertex.latitude, vertex.height || 0);
    vertex.cartesian = newCartesian;
  }
  
  // 更新顶点实体位置
  if (index < vertexEntities.value.length && vertexEntities.value[index]) {
    vertexEntities.value[index].position = currentBuilding.value.geometry.vertices[index].cartesian;
  }
  
  // 更新相关线段
  updateConnectingLines(index);
};

// 更新连接线
const updateConnectingLines = (index) => {
  if (!currentBuilding.value) return;
  
  const vertices = currentBuilding.value.geometry.vertices;
  const n = vertices.length;
  if (n < 2) return;
  
  // 找出与此顶点相连的线段索引
  const prevIndex = (index - 1 + n) % n;
  const nextIndex = (index + 1) % n;
  
  // 更新前一条线
  if (prevIndex < lineEntities.value.length && lineEntities.value[prevIndex]) {
    lineEntities.value[prevIndex].polyline.positions = [
      vertices[prevIndex].cartesian,
      vertices[index].cartesian
    ];
  }
  
  // 更新后一条线
  if (index < lineEntities.value.length && lineEntities.value[index]) {
    lineEntities.value[index].polyline.positions = [
      vertices[index].cartesian,
      vertices[nextIndex].cartesian
    ];
  }
};

// 移除顶点
const removeVertex = (index) => {
  if (!currentBuilding.value || 
      index < 0 || 
      index >= currentBuilding.value.geometry.vertices.length) return;
  
  // 至少需要3个顶点
  if (currentBuilding.value.geometry.vertices.length <= 3) {
    alert('建筑底面至少需要3个顶点');
    return;
  }
  
  // 移除顶点
  currentBuilding.value.geometry.vertices.splice(index, 1);
  
  // 清理所有绘制实体并重新绘制
  cleanupDrawingEntities();
  redrawVerticesAndLines();
  
  // 重置选中顶点
  selectedVertexIndex.value = -1;
  
  // 如果存在建筑实体，也更新它
  if (currentBuilding.value.entity) {
    updateBuildingEntity();
  }
};

// 重新绘制所有顶点和线
const redrawVerticesAndLines = () => {
  if (!currentBuilding.value) return;
  
  const vertices = currentBuilding.value.geometry.vertices;
  const n = vertices.length;
  if (n === 0) return;
  
  // 清空实体数组但保持引用
  vertexEntities.value = [];
  lineEntities.value = [];
  
  // 绘制顶点
  for (let i = 0; i < n; i++) {
    const pointEntity = props.viewer.entities.add({
      position: vertices[i].cartesian,
      point: {
        pixelSize: 15, // 增加点的大小，让其更容易被选中
        color: i === selectedVertexIndex.value ? Cesium.Color.RED : Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
    
    drawingEntities.value.push(pointEntity);
    vertexEntities.value.push(pointEntity);
  }
  
  // 绘制线段
  for (let i = 0; i < n; i++) {
    const nextIndex = (i + 1) % n;
    
    const lineEntity = props.viewer.entities.add({
      polyline: {
        positions: [
          vertices[i].cartesian,
          vertices[nextIndex].cartesian
        ],
        width: 3,
        material: Cesium.Color.YELLOW,
        clampToGround: true
      }
    });
    
    drawingEntities.value.push(lineEntity);
    lineEntities.value.push(lineEntity);
  }
  
  // 重新设置交互
  if (!isDrawing.value && n >= 3) {
    setupVertexInteraction();
  }
};

// 删除选中顶点
const deleteSelectedVertex = () => {
  if (selectedVertexIndex.value === -1) {
    alert('请先选择要删除的顶点');
    return;
  }
  
  removeVertex(selectedVertexIndex.value);
};

// 更新建筑实体
const updateBuildingEntity = () => {
  if (!currentBuilding.value || !currentBuilding.value.entity) return;
  
  // 清理墙壁材质实体
  if (currentBuilding.value.entity._wallEntities) {
    currentBuilding.value.entity._wallEntities.forEach(wallEntity => {
      if (props.viewer.entities.contains(wallEntity)) {
        props.viewer.entities.remove(wallEntity);
      }
    });
    currentBuilding.value.entity._wallEntities = [];
  }
  
  // 清理屋顶实体
  if (currentBuilding.value.entity._roofEntity && props.viewer.entities.contains(currentBuilding.value.entity._roofEntity)) {
    props.viewer.entities.remove(currentBuilding.value.entity._roofEntity);
    currentBuilding.value.entity._roofEntity = null;
  }
  
  // 移除旧的建筑实体
  props.viewer.entities.remove(currentBuilding.value.entity);
  currentBuilding.value.entity = null;
  
  // 重新创建建筑实体
  createBuildingEntity();
  
  // 记住当前材质类型，用于检测材质变化
  if (currentBuilding.value.entity) {
    currentBuilding.value._previousMaterialType = currentBuilding.value.properties.materialType;
  }
};

// 应用建筑属性
const applyBuildingProperties = () => {
  if (!currentBuilding.value) return;
  
  // 仅应用基本属性，不涉及楼层划分
  
  // 如果已经有建筑实体，则更新它
  if (currentBuilding.value.entity) {
    // 应用新的高度、颜色和材质
    updateBuildingEntity();
    
    // 确保建筑可见性与所属群组一致
    if (currentGroup.value && !currentGroup.value.visible) {
      currentBuilding.value.entity.show = false;
      currentBuilding.value.visible = false;
    }
  }
  
  // 保存数据
  saveBuildingData();
  
  // 显示应用成功提示
  alert('基本属性已应用');
  
  // 保持在当前标签页
  // activeTab.value = 'geometry';
};

// 预览建筑
const previewBuilding = () => {
  if (!currentBuilding.value || !canGenerateBuilding.value) {
    alert('请确保至少有3个顶点且填写了有效的建筑属性');
    return;
  }
  
  // 生成或更新建筑
  if (currentBuilding.value.entity) {
    updateBuildingEntity();
  } else {
    generateBuilding();
  }
};

// 添加孔洞
const addHole = () => {
  if (!currentBuilding.value || isDrawing.value) return;
  
  // 设置为孔洞绘制模式
  holeDrawingMode.value = true;
  editingHoleIndex.value = -1; // 将创建新孔洞
  
  // 开始绘制
  startDrawing();
};

// 编辑孔洞
const editHole = (holeIndex) => {
  if (!currentBuilding.value || 
      !currentBuilding.value.geometry.holes || 
      holeIndex < 0 || 
      holeIndex >= currentBuilding.value.geometry.holes.length) return;
  
  // 清理之前的绘制
  cleanupDrawingEntities();
  
  // 设置为孔洞编辑模式
  holeDrawingMode.value = true;
  editingHoleIndex.value = holeIndex;
  
  // 绘制当前孔洞的顶点和线段
  const hole = currentBuilding.value.geometry.holes[holeIndex];
  hole.forEach((vertex, index) => {
    // 添加点实体
    const pointEntity = props.viewer.entities.add({
      position: vertex.cartesian,
      point: {
        pixelSize: 15,
        color: Cesium.Color.AQUA,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });
    
    drawingEntities.value.push(pointEntity);
    vertexEntities.value.push(pointEntity);
    
    // 绘制线段
    if (index > 0) {
      const prevIndex = index - 1;
      const lineEntity = props.viewer.entities.add({
        polyline: {
          positions: [
            hole[prevIndex].cartesian,
            vertex.cartesian
          ],
          width: 3,
          material: Cesium.Color.AQUA,
          clampToGround: true
        }
      });
      
      drawingEntities.value.push(lineEntity);
      lineEntities.value.push(lineEntity);
    }
  });
  
  // 添加闭合线
  if (hole.length > 2) {
    const closeLineEntity = props.viewer.entities.add({
      polyline: {
        positions: [
          hole[hole.length - 1].cartesian,
          hole[0].cartesian
        ],
        width: 3,
        material: Cesium.Color.AQUA,
        clampToGround: true
      }
    });
    
    drawingEntities.value.push(closeLineEntity);
    lineEntities.value.push(closeLineEntity);
  }
  
  // 设置顶点可选择和拖动
  setupVertexInteraction();
};

// 删除孔洞
const deleteHole = (holeIndex) => {
  if (!currentBuilding.value || 
      !currentBuilding.value.geometry.holes || 
      holeIndex < 0 || 
      holeIndex >= currentBuilding.value.geometry.holes.length) return;
  
  currentBuilding.value.geometry.holes.splice(holeIndex, 1);
  
  // 如果存在建筑实体，也更新它
  if (currentBuilding.value.entity) {
    updateBuildingEntity();
  }
};

// 导出为GeoJSON
const exportToGeoJSON = (isGroup = false) => {
  if (isGroup && (!currentGroup.value || currentGroup.value.buildings.length === 0)) {
    alert('当前没有可以导出的建筑群');
    return;
  }
  
  if (!isGroup && (!currentBuilding.value || !currentBuilding.value.entity)) {
    alert('当前没有可以导出的建筑');
    return;
  }
  
  try {
    let exportData;
    
    if (isGroup) {
      // 导出整个建筑群
      exportData = {
        type: 'FeatureCollection',
        name: currentGroup.value.name,
        features: []
      };
      
      // 遍历所有建筑
      currentGroup.value.buildings.forEach(building => {
        if (building.geometry.vertices.length >= 3) {
          const feature = createGeoJSONFeature(building);
          if (feature) {
            exportData.features.push(feature);
          }
        }
      });
    } else {
      // 导出单个建筑
      exportData = createGeoJSONFeature(currentBuilding.value);
    }
    
    if (!exportData) {
      alert('导出失败：无法创建有效的GeoJSON数据');
      return;
    }
    
    // 转换为JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isGroup ? 
                  `${currentGroup.value.name || 'building_group'}.geojson` : 
                  `${currentBuilding.value.properties.name || 'building'}.geojson`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    console.error('导出GeoJSON时发生错误:', error);
    alert(`导出失败: ${error.message}`);
  }
};

// 创建GeoJSON特征对象
const createGeoJSONFeature = (building) => {
  if (!building || building.geometry.vertices.length < 3) return null;
  
  // 提取顶点坐标
  const coordinates = building.geometry.vertices.map(vertex => [
    vertex.longitude,
    vertex.latitude
  ]);
  
  // 闭合多边形（首尾顶点相同）
  if (coordinates.length > 0 && 
      (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
       coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
    coordinates.push([...coordinates[0]]);
  }
  
  // 创建几何体
  const geometry = {
    type: 'Polygon',
    coordinates: [coordinates]
  };
  
  // 如果有孔洞，添加到几何体
  if (building.geometry.holes && building.geometry.holes.length > 0) {
    building.geometry.holes.forEach(hole => {
      if (hole.length >= 3) {
        const holeCoordinates = hole.map(vertex => [
          vertex.longitude,
          vertex.latitude
        ]);
        
        // 闭合孔洞
        if (holeCoordinates.length > 0 && 
            (holeCoordinates[0][0] !== holeCoordinates[holeCoordinates.length - 1][0] || 
             holeCoordinates[0][1] !== holeCoordinates[holeCoordinates.length - 1][1])) {
          holeCoordinates.push([...holeCoordinates[0]]);
        }
        
        geometry.coordinates.push(holeCoordinates);
      }
    });
  }
  
  // 创建并返回特征对象
  return {
    type: 'Feature',
    properties: { ...building.properties },
    geometry: geometry
  };
};

// 导出为3D模型
const exportTo3DModel = (isGroup = false) => {
  if (isGroup && (!currentGroup.value || currentGroup.value.buildings.length === 0)) {
    alert('当前没有可以导出的建筑群');
    return;
  }
  
  if (!isGroup && (!currentBuilding.value || !currentBuilding.value.entity)) {
    alert('当前没有可以导出的建筑');
    return;
  }
  
  // 显示处理中状态
  isProcessing.value = true;
  processingMessage.value = `正在导出${isGroup ? '建筑群' : '建筑'}为${exportFormat.value.toUpperCase()}格式...`;
  
  // 使用setTimeout确保UI更新
  setTimeout(() => {
    try {
      // 导入必要的Three.js模块
      import('three').then((THREE) => {
        import('three/examples/jsm/exporters/GLTFExporter.js').then(({ GLTFExporter }) => {
          // 创建Three.js场景
          const scene = new THREE.Scene();
          
          // 创建要导出的3D对象
          if (isGroup) {
            // 导出整个建筑群
            currentGroup.value.buildings.forEach(building => {
              if (building.geometry.vertices.length >= 3) {
                const buildingMesh = createBuildingMesh(building, THREE);
                if (buildingMesh) {
                  scene.add(buildingMesh);
                }
              }
            });
          } else {
            // 导出单个建筑
            const buildingMesh = createBuildingMesh(currentBuilding.value, THREE);
            if (buildingMesh) {
              scene.add(buildingMesh);
            }
          }
          
          // 创建导出器实例
          const exporter = new GLTFExporter();
          
          // 执行导出
          exporter.parse(
            scene,
            (gltf) => {
              // 导出成功回调
              const output = exportFormat.value === 'glb' ? gltf : JSON.stringify(gltf, null, 2);
              const blob = new Blob([output], { 
                type: exportFormat.value === 'glb' ? 'application/octet-stream' : 'application/json' 
              });
              
              // 创建下载链接
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = isGroup ? 
                            `${currentGroup.value.name || 'building_group'}.${exportFormat.value}` : 
                            `${currentBuilding.value.properties.name || 'building'}.${exportFormat.value}`;
              
              // 触发下载
              document.body.appendChild(link);
              link.click();
              
              // 清理
              setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                // 隐藏处理中状态
                isProcessing.value = false;
              }, 100);
            },
            (error) => {
              // 导出失败回调
              console.error('导出3D模型时发生错误:', error);
              alert(`导出失败: ${error.message}`);
              isProcessing.value = false;
            },
            // 导出选项
            { 
              binary: exportFormat.value === 'glb', // GLB为二进制格式
              includeCustomExtensions: true
            }
          );
        }).catch(error => {
          console.error('加载GLTFExporter时发生错误:', error);
          alert(`导出失败: 无法加载必要的模块`);
          isProcessing.value = false;
        });
      }).catch(error => {
        console.error('加载Three.js时发生错误:', error);
        alert(`导出失败: 无法加载Three.js库`);
        isProcessing.value = false;
      });
    } catch (error) {
      console.error('导出3D模型时发生错误:', error);
      alert(`导出失败: ${error.message}`);
      isProcessing.value = false;
    }
  }, 100);
};

// 创建建筑的3D网格
const createBuildingMesh = (building, THREE) => {
  if (!building || building.geometry.vertices.length < 3) return null;
  
  try {
    // 创建建筑底面几何体
    const shape = new THREE.Shape();
    
    // 移动到第一个顶点
    const firstVertex = building.geometry.vertices[0];
    shape.moveTo(firstVertex.longitude, firstVertex.latitude);
    
    // 连接其余顶点
    for (let i = 1; i < building.geometry.vertices.length; i++) {
      const vertex = building.geometry.vertices[i];
      shape.lineTo(vertex.longitude, vertex.latitude);
    }
    
    // 闭合形状
    shape.closePath();
    
    // 添加孔洞（如果有）
    if (building.geometry.holes && building.geometry.holes.length > 0) {
      building.geometry.holes.forEach(hole => {
        if (hole.length >= 3) {
          const holeShape = new THREE.Path();
          
          // 移动到第一个孔洞顶点
          const firstHoleVertex = hole[0];
          holeShape.moveTo(firstHoleVertex.longitude, firstHoleVertex.latitude);
          
          // 连接其余孔洞顶点
          for (let i = 1; i < hole.length; i++) {
            const holeVertex = hole[i];
            holeShape.lineTo(holeVertex.longitude, holeVertex.latitude);
          }
          
          // 闭合孔洞
          holeShape.closePath();
          
          // 添加到主形状
          shape.holes.push(holeShape);
        }
      });
    }
    
    // 创建挤出几何体
    const extrudeSettings = {
      depth: building.properties.height,
      bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // 创建材质
    let material;
    
    // 根据建筑材质类型创建对应的Three.js材质
    if (building.properties.materialType === 'solid' || !building.properties.materialType) {
      // 纯色材质
      const color = building.properties.color || '#FFFFFF';
      const alpha = building.properties.alpha !== undefined ? building.properties.alpha : 1.0;
      
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        transparent: alpha < 1.0,
        opacity: alpha,
        side: THREE.DoubleSide
      });
    } else {
      // 使用基本材质，真实环境可以加载纹理
      const color = building.properties.color || '#FFFFFF';
      const alpha = building.properties.alpha !== undefined ? building.properties.alpha : 1.0;
      
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        transparent: alpha < 1.0,
        opacity: alpha,
        side: THREE.DoubleSide
      });
    }
    
    // 创建网格
    const mesh = new THREE.Mesh(geometry, material);
    
    // 设置网格名称
    mesh.name = building.properties.name || 'Building';
    
    // 旋转以适应坐标系（Cesium和Three.js坐标系不同）
    mesh.rotation.x = Math.PI / 2;
    
    return mesh;
  } catch (error) {
    console.error('创建建筑网格时发生错误:', error);
    return null;
  }
};



// 处理键盘按下事件
const handleKeyDown = (event) => {
  // Shift键按下时启用多选模式
  if (event.key === 'Shift') {
    isMultiSelectMode.value = true;
  }
};

// 处理键盘释放事件
const handleKeyUp = (event) => {
  // Shift键释放时关闭多选模式
  if (event.key === 'Shift') {
    isMultiSelectMode.value = false;
  }
};

// 在视图中处理建筑选择
const handleBuildingSelection = (entityId) => {
  if (!entityId || !entityId.buildingRef) return;
  
  // 找到建筑在当前组中的索引
  const foundIndex = currentGroup.value.buildings.findIndex(b => b === entityId.buildingRef);
  if (foundIndex === -1) return;
  
  // 处理多选模式
  if (isMultiSelectMode.value) {
    const existingIndex = selectedBuildingIndices.value.indexOf(foundIndex);
    if (existingIndex === -1) {
      // 添加到选中集合
      selectedBuildingIndices.value.push(foundIndex);
      // 更新视觉反馈
      highlightBuilding(entityId, true);
    } else {
      // 从选中集合中移除
      selectedBuildingIndices.value.splice(existingIndex, 1);
      // 更新视觉反馈
      highlightBuilding(entityId, false);
    }
    
    // 同时更新当前建筑
    currentBuildingIndex.value = foundIndex;
  } else {
    // 单选模式，先清除之前的选择
    clearAllHighlights();
    
    // 设置新的选择
    currentBuildingIndex.value = foundIndex;
    selectedBuildingIndices.value = [foundIndex];
    
    // 高亮显示
    highlightBuilding(entityId, true);
  }
};

// 视觉上高亮显示或取消高亮建筑
const highlightBuilding = (entity, isHighlighted) => {
  if (!entity || !entity.polygon) return;
  
  if (isHighlighted) {
    // 添加高亮效果
    entity._originalOutlineColor = entity.polygon.outlineColor.getValue();
    entity._originalOutlineWidth = entity.polygon.outlineWidth.getValue();
    
    entity.polygon.outlineColor = Cesium.Color.YELLOW;
    entity.polygon.outlineWidth = 3;
  } else {
    // 恢复原始样式
    if (entity._originalOutlineColor) {
      entity.polygon.outlineColor = entity._originalOutlineColor;
    }
    if (entity._originalOutlineWidth) {
      entity.polygon.outlineWidth = entity._originalOutlineWidth;
    }
  }
};

// 清除所有建筑高亮
const clearAllHighlights = () => {
  if (!currentGroup.value) return;
  
  // 恢复所有建筑的原始样式
  selectedBuildingIndices.value.forEach(idx => {
    const building = currentGroup.value.buildings[idx];
    if (building && building.entity) {
      highlightBuilding(building.entity, false);
    }
  });
};

// 批量应用高度
const applyBatchHeight = () => {
  if (!currentGroup.value || currentGroup.value.buildings.length === 0) return;
  
  currentGroup.value.buildings.forEach(building => {
    building.properties.height = batchHeight.value;
    
    // 如果已设置楼层数，则更新层高
    if (building.properties.floors && building.properties.floors > 0) {
      building.properties.floorHeight = parseFloat((batchHeight.value / building.properties.floors).toFixed(1));
    } else {
      // 如果没有楼层数，但有层高，则更新楼层数
      if (building.properties.floorHeight && building.properties.floorHeight > 0) {
        building.properties.floors = Math.round(batchHeight.value / building.properties.floorHeight);
      } else {
        // 两者都没有，设置默认值
        building.properties.floors = 10;
        building.properties.floorHeight = parseFloat((batchHeight.value / 10).toFixed(1));
      }
    }
    
    // 如果建筑已经有实体，更新它
    if (building.entity) {
      props.viewer.entities.remove(building.entity);
      building.entity = null;
      
      // 重新生成建筑
      const prevBuilding = currentBuilding.value;
      currentBuilding.value = building;
      createBuildingEntity();
      currentBuilding.value = prevBuilding;
    }
  });
};

// 批量应用颜色
const applyBatchColor = () => {
  if (!currentGroup.value || currentGroup.value.buildings.length === 0) return;
  
  currentGroup.value.buildings.forEach(building => {
    building.properties.color = batchColor.value;
    
    // 如果建筑已经有实体，更新它
    if (building.entity) {
      // 直接更新颜色而不重建实体
      const color = Cesium.Color.fromCssColorString(batchColor.value)
        .withAlpha(building.properties.alpha);
      
      if (building.entity.polygon) {
        building.entity.polygon.material = color;
      }
    }
  });
};

// 批量应用材质类型
const applyBatchMaterialType = () => {
  if (!currentGroup.value || currentGroup.value.buildings.length === 0) return;
  
  currentGroup.value.buildings.forEach(building => {
    building.properties.materialType = batchMaterialType.value;
    
    // 如果建筑已经有实体，更新它
    if (building.entity) {
      // 保存当前建筑引用
      const prevBuilding = currentBuilding.value;
      
      // 临时设置当前建筑为这个建筑
      currentBuilding.value = building;
      
      // 应用新材质
      applyBuildingMaterial();
      
      // 恢复当前建筑引用
      currentBuilding.value = prevBuilding;
    }
  });
  
  alert(`已将 ${currentGroup.value.buildings.length} 个建筑的材质类型设置为 ${batchMaterialType.value}`);
};

// 应用建筑间距
const applyBuildingSpacing = () => {
  if (!currentGroup.value || currentGroup.value.buildings.length <= 1) return;
  
  alert('建筑间距调整将在重新生成建筑布局时生效');
};

// 重新生成所有建筑
const regenerateAllBuildings = () => {
  if (!currentGroup.value || currentGroup.value.buildings.length === 0) return;
  
  const prevBuilding = currentBuilding.value;
  
  // 重新生成每个建筑
  currentGroup.value.buildings.forEach(building => {
    if (building.geometry.vertices.length >= 3) {
      // 移除旧的实体
      if (building.entity) {
        props.viewer.entities.remove(building.entity);
        building.entity = null;
      }
      
      // 临时将当前建筑设为这个建筑
      currentBuilding.value = building;
      createBuildingEntity();
    }
  });
  
  // 恢复当前建筑
  currentBuilding.value = prevBuilding;
  
  // 飞行到建筑群
  flyToBuildingGroup();
};

// 随机高度变化
const randomizeHeights = () => {
  if (!currentGroup.value || currentGroup.value.buildings.length === 0) return;
  
  // 计算当前高度的平均值
  let avgHeight = 0;
  currentGroup.value.buildings.forEach(building => {
    avgHeight += building.properties.height;
  });
  avgHeight /= currentGroup.value.buildings.length;
  
  // 在平均值的基础上添加随机变化
  currentGroup.value.buildings.forEach(building => {
    // 生成-30%到+30%之间的随机变化
    const variation = (Math.random() * 0.6 - 0.3);
    building.properties.height = Math.max(5, Math.round(avgHeight * (1 + variation)));
    
    // 更新楼层数和层高
    if (building.properties.floors && building.properties.floors > 0) {
      building.properties.floorHeight = parseFloat((building.properties.height / building.properties.floors).toFixed(1));
    } else if (building.properties.floorHeight && building.properties.floorHeight > 0) {
      building.properties.floors = Math.round(building.properties.height / building.properties.floorHeight);
    } else {
      // 两者都没有设置默认值
      building.properties.floors = 10;
      building.properties.floorHeight = parseFloat((building.properties.height / 10).toFixed(1));
    }
    
    // 如果建筑已经有实体，更新它
    if (building.entity) {
      // 更新挤压高度
      if (building.entity.polygon) {
        building.entity.polygon.extrudedHeight = building.properties.height;
      }
    }
  });
};

// 生成网格布局
const generateGridLayout = () => {
  if (!currentGroup.value) return;
  
  // 询问用户网格参数
  const rows = parseInt(prompt('请输入行数:', '3')) || 3;
  const cols = parseInt(prompt('请输入列数:', '3')) || 3;
  const spacing = parseInt(prompt('请输入间距(米):', '20')) || 20;
  const buildingSize = parseInt(prompt('请输入建筑尺寸(米):', '15')) || 15;
  
  // 获取当前视图中心作为起点
  const center = getCameraCenter();
  if (!center) {
    alert('无法获取当前位置');
    return;
  }
  
  // 清理当前组中的所有建筑
  clearGroupBuildings();
  
  // 生成网格
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 计算当前建筑的中心位置
      const offsetX = (c - (cols - 1) / 2) * (buildingSize + spacing);
      const offsetY = (r - (rows - 1) / 2) * (buildingSize + spacing);
      
      // 创建新的建筑
      const building = createGridBuilding(
        center.longitude, center.latitude, 
        buildingSize, offsetX, offsetY, 
        `建筑 ${r * cols + c + 1}`
      );
      
      currentGroup.value.buildings.push(building);
    }
  }
  
  // 更新选择的建筑
  if (currentGroup.value.buildings.length > 0) {
    currentBuildingIndex.value = 0;
  }
  
  // 生成所有建筑
  regenerateAllBuildings();
};

// 创建网格建筑
const createGridBuilding = (centerLon, centerLat, size, offsetX, offsetY, name) => {
  // 转换米到经纬度的粗略近似
  // 注意：这只是一个简化计算，实际应用中应考虑地球曲率和实际位置
  const metersToLonFactor = 1 / (111320 * Math.cos(centerLat * Math.PI / 180));
  const metersToLatFactor = 1 / 110540;
  
  const lonOffset = offsetX * metersToLonFactor;
  const latOffset = offsetY * metersToLatFactor;
  
  const halfSize = size / 2;
  const lonHalfSize = halfSize * metersToLonFactor;
  const latHalfSize = halfSize * metersToLatFactor;
  
  // 创建正方形顶点
  const vertices = [
    { 
      longitude: centerLon + lonOffset - lonHalfSize, 
      latitude: centerLat + latOffset - latHalfSize,
      cartesian: latLonToCartesian(centerLon + lonOffset - lonHalfSize, centerLat + latOffset - latHalfSize)
    },
    { 
      longitude: centerLon + lonOffset + lonHalfSize, 
      latitude: centerLat + latOffset - latHalfSize,
      cartesian: latLonToCartesian(centerLon + lonOffset + lonHalfSize, centerLat + latOffset - latHalfSize)
    },
    { 
      longitude: centerLon + lonOffset + lonHalfSize, 
      latitude: centerLat + latOffset + latHalfSize,
      cartesian: latLonToCartesian(centerLon + lonOffset + lonHalfSize, centerLat + latOffset + latHalfSize)
    },
    { 
      longitude: centerLon + lonOffset - lonHalfSize, 
      latitude: centerLat + latOffset + latHalfSize,
      cartesian: latLonToCartesian(centerLon + lonOffset - lonHalfSize, centerLat + latOffset + latHalfSize)
    }
  ];
  
  // 创建随机高度和颜色
  const height = Math.floor(Math.random() * 30) + 15; // 15-45米之间的随机高度
  
  // 生成随机颜色
  const colors = [
    '#FFFFFF', // 白色
    '#D3D3D3', // 淡灰色
    '#A9A9A9', // 深灰色
    '#E0E0E0', // 银灰色
    '#F5F5F5', // 烟白色
    '#F0F8FF', // 爱丽丝蓝
    '#E6E6FA'  // 淡紫色
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // 随机屋顶样式
  const roofStyles = ['flat', 'pyramid', 'dome', 'gabled'];
  const roofStyle = roofStyles[Math.floor(Math.random() * roofStyles.length)];
  
  // 创建并返回建筑
  return {
    properties: {
      name: name,
      description: '自动生成的网格建筑',
      height: height,
      color: color,
      alpha: 0.9,
      materialType: 'solid',
      roofStyle: roofStyle,
      heightReference: 'relative'
    },
    geometry: {
      vertices: vertices,
      holes: []
    },
    visible: true,
    entity: null
  };
};

// 生成环形布局
const generateCircularLayout = () => {
  if (!currentGroup.value) return;
  
  // 询问用户环形参数
  const count = parseInt(prompt('请输入建筑数量:', '8')) || 8;
  const radius = parseInt(prompt('请输入半径(米):', '50')) || 50;
  const buildingSize = parseInt(prompt('请输入建筑尺寸(米):', '15')) || 15;
  
  // 获取当前视图中心作为圆心
  const center = getCameraCenter();
  if (!center) {
    alert('无法获取当前位置');
    return;
  }
  
  // 清理当前组中的所有建筑
  clearGroupBuildings();
  
  // 生成环形布局
  for (let i = 0; i < count; i++) {
    // 计算角度
    const angle = (i / count) * 2 * Math.PI;
    
    // 计算偏移
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;
    
    // 创建新的建筑
    const building = createGridBuilding(
      center.longitude, center.latitude, 
      buildingSize, offsetX, offsetY, 
      `建筑 ${i + 1}`
    );
    
    currentGroup.value.buildings.push(building);
  }
  
  // 更新选择的建筑
  if (currentGroup.value.buildings.length > 0) {
    currentBuildingIndex.value = 0;
  }
  
  // 生成所有建筑
  regenerateAllBuildings();
};

// 从GeoJSON导入
const importFromGeoJSON = () => {
  // 创建隐藏的文件输入元素
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.geojson,.json';
  fileInput.style.display = 'none';
  
  // 处理文件选择
  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        processGeoJSON(data);
      } catch (error) {
        console.error('解析GeoJSON时出错:', error);
        alert('导入失败: ' + error.message);
      }
    };
    
    reader.readAsText(file);
  };
  
  // 触发文件选择对话框
  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
};

// 处理GeoJSON数据
const processGeoJSON = (data) => {
  if (!currentGroup.value) return;
  
  // 确保处理的是有效的GeoJSON
  if (!data || (!data.features && data.type !== 'Feature')) {
    alert('无效的GeoJSON数据');
    return;
  }
  
  // 获取要处理的要素
  const features = data.type === 'FeatureCollection' ? data.features : [data];
  
  // 处理每个要素
  features.forEach((feature, index) => {
    if (feature.geometry && feature.geometry.type === 'Polygon') {
      // 处理多边形几何体
      const coordinates = feature.geometry.coordinates[0]; // 外环
      if (coordinates && coordinates.length >= 4) { // 至少需要3个点加闭合点
        // 创建建筑
        const building = {
          properties: {
            name: feature.properties?.name || `导入建筑 ${index + 1}`,
            description: feature.properties?.description || '',
            height: feature.properties?.height || 30,
            color: feature.properties?.color || '#FFFFFF',
            alpha: feature.properties?.alpha || 0.8,
            materialType: feature.properties?.materialType || 'solid',
            roofStyle: feature.properties?.roofStyle || 'flat',
            heightReference: feature.properties?.heightReference || 'relative'
          },
          geometry: {
            vertices: [],
            holes: []
          },
          visible: true,
          entity: null
        };
        
        // 处理顶点
        coordinates.forEach(coord => {
          if (coord.length >= 2) {
            const lon = coord[0];
            const lat = coord[1];
            const cartesian = latLonToCartesian(lon, lat);
            
            building.geometry.vertices.push({
              longitude: lon,
              latitude: lat,
              height: 0,
              cartesian: cartesian
            });
          }
        });
        
        // 处理内环(孔洞)
        if (feature.geometry.coordinates.length > 1) {
          for (let i = 1; i < feature.geometry.coordinates.length; i++) {
            const holeCoords = feature.geometry.coordinates[i];
            const hole = [];
            
            holeCoords.forEach(coord => {
              if (coord.length >= 2) {
                const lon = coord[0];
                const lat = coord[1];
                const cartesian = latLonToCartesian(lon, lat);
                
                hole.push({
                  longitude: lon,
                  latitude: lat,
                  height: 0,
                  cartesian: cartesian
                });
              }
            });
            
            if (hole.length >= 3) {
              building.geometry.holes.push(hole);
            }
          }
        }
        
        // 添加建筑到建筑群
        if (building.geometry.vertices.length >= 3) {
          currentGroup.value.buildings.push(building);
        }
      }
    }
  });
  
  // 更新选择的建筑
  if (currentGroup.value.buildings.length > 0) {
    currentBuildingIndex.value = currentGroup.value.buildings.length - 1;
  }
  
  // 生成所有建筑
  regenerateAllBuildings();
  
  alert(`成功导入 ${features.length} 个要素`);
};

// 克隆建筑
const cloneBuildings = () => {
  if (!currentGroup.value || !currentBuilding.value) return;
  
  // 询问克隆数量和偏移
  const count = parseInt(prompt('请输入克隆数量:', '1')) || 1;
  const offsetX = parseFloat(prompt('请输入X方向偏移(米):', '20')) || 20;
  const offsetY = parseFloat(prompt('请输入Y方向偏移(米):', '0')) || 0;
  
  const origBuilding = currentBuilding.value;
  const origCenter = calculateCenter(origBuilding.geometry.vertices);
  
  // 转换米到经纬度的粗略近似
  const metersToLonFactor = 1 / (111320 * Math.cos(origCenter.latitude * Math.PI / 180));
  const metersToLatFactor = 1 / 110540;
  
  // 克隆指定数量的建筑
  for (let i = 0; i < count; i++) {
    // 计算该克隆的偏移量
    const currOffsetX = offsetX * (i + 1);
    const currOffsetY = offsetY * (i + 1);
    
    const lonOffset = currOffsetX * metersToLonFactor;
    const latOffset = currOffsetY * metersToLatFactor;
    
    // 克隆建筑属性和几何形状
    const clone = JSON.parse(JSON.stringify(origBuilding));
    clone.properties.name = `${origBuilding.properties.name} 克隆 ${i + 1}`;
    clone.entity = null;
    
    // 调整克隆建筑的位置
    clone.geometry.vertices.forEach(vertex => {
      vertex.longitude += lonOffset;
      vertex.latitude += latOffset;
      vertex.cartesian = latLonToCartesian(vertex.longitude, vertex.latitude, vertex.height);
    });
    
    // 调整孔洞位置
    if (clone.geometry.holes && clone.geometry.holes.length > 0) {
      clone.geometry.holes.forEach(hole => {
        hole.forEach(vertex => {
          vertex.longitude += lonOffset;
          vertex.latitude += latOffset;
          vertex.cartesian = latLonToCartesian(vertex.longitude, vertex.latitude, vertex.height);
        });
      });
    }
    
    // 添加克隆到建筑群
    currentGroup.value.buildings.push(clone);
  }
  
  // 更新选择的建筑
  currentBuildingIndex.value = currentGroup.value.buildings.length - 1;
  
  // 生成所有建筑
  regenerateAllBuildings();
};

// 辅助方法：获取相机中心点
const getCameraCenter = () => {
  if (!props.viewer) return null;
  
  // 获取当前相机中心点
  const windowPosition = new Cesium.Cartesian2(
    props.viewer.container.clientWidth / 2,
    props.viewer.container.clientHeight / 2
  );
  
  const ray = props.viewer.camera.getPickRay(windowPosition);
  const centerCartesian = props.viewer.scene.globe.pick(ray, props.viewer.scene);
  
  if (!centerCartesian) return null;
  
  return cartesianToLatLon(centerCartesian);
};

// 清理所有建筑
const clearGroupBuildings = () => {
  if (!currentGroup.value) return;
  
  // 移除所有实体
  currentGroup.value.buildings.forEach(building => {
    if (building.entity) {
      props.viewer.entities.remove(building.entity);
    }
  });
  
  // 清空建筑列表
  currentGroup.value.buildings = [];
  currentBuildingIndex.value = -1;
};

// 飞行到建筑群
const flyToBuildingGroup = () => {
  if (!currentGroup.value || currentGroup.value.buildings.length === 0) return;
  
  // 获取所有建筑的中心点
  const centers = currentGroup.value.buildings
    .filter(b => b.entity && b.geometry.vertices.length > 0)
    .map(b => calculateCenter(b.geometry.vertices));
  
  if (centers.length === 0) return;
  
  // 计算整个建筑群的中心点
  let sumLon = 0, sumLat = 0;
  centers.forEach(c => {
    sumLon += c.longitude;
    sumLat += c.latitude;
  });
  
  const groupCenter = {
    longitude: sumLon / centers.length,
    latitude: sumLat / centers.length
  };
  
  // 计算所有建筑到中心的最大距离，用于确定视图范围
  let maxDist = 0;
  centers.forEach(c => {
    const dist = Math.sqrt(
      Math.pow(c.longitude - groupCenter.longitude, 2) +
      Math.pow(c.latitude - groupCenter.latitude, 2)
    );
    maxDist = Math.max(maxDist, dist);
  });
  
  // 查找最高的建筑
  let maxHeight = 0;
  currentGroup.value.buildings.forEach(b => {
    maxHeight = Math.max(maxHeight, b.properties.height);
  });
  
  // 计算适当的相机高度
  // 转换经纬度距离到米的粗略近似
  const degToMeters = 111320;
  const distanceInMeters = maxDist * degToMeters;
  
  // 飞行到建筑群
  props.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      groupCenter.longitude,
      groupCenter.latitude,
      maxHeight * 2 + distanceInMeters
    ),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-45),
      roll: 0
    },
    duration: 2.0
  });
};

// 生成楼层数据
const generateFloors = () => {
  if (!currentBuilding.value) return;
  
  // 检查楼层数和层高是否已设置
  if (!currentBuilding.value.properties.floors || currentBuilding.value.properties.floors < 1) {
    alert('请先设置有效的楼层数');
    return;
  }
  
  if (!currentBuilding.value.properties.floorHeight || currentBuilding.value.properties.floorHeight <= 0) {
    alert('请先设置有效的层高');
    return;
  }
  
  showProcessing('正在生成楼层数据...');
  
  const totalFloors = currentBuilding.value.properties.floors;
  const floorHeight = currentBuilding.value.properties.floorHeight;
  
  // 初始化楼层数据
  if (!currentBuilding.value.properties.floorData) {
    currentBuilding.value.properties.floorData = [];
  } else {
    // 清除已有的楼层数据
    currentBuilding.value.properties.floorData = [];
  }
  
  // 创建楼层数据
  for (let i = 0; i < totalFloors; i++) {
    const floorNumber = i + 1; // 从底层开始编号
    
    // 计算当前楼层的基础高度（从底部开始）
    const baseHeight = i * floorHeight;
    
    // 选择颜色
    const colorIndex = i % defaultFloorColors.length;
    
    currentBuilding.value.properties.floorData.push({
      name: `${floorNumber}层`,
      number: floorNumber,
      height: floorHeight,
      baseHeight: baseHeight,
      color: defaultFloorColors[colorIndex],
      alpha: 0.8,
      function: i === 0 ? 'parking' : (i === totalFloors - 1 ? 'public' : 'residential'), // 保持底层为停车场，顶层为公共空间，其他为住宅
      notes: '',
      entity: null
    });
  }
  
  // 如果建筑已存在，更新楼层可视化
  if (currentBuilding.value.entity) {
    renderFloors();
  }
  
  // 默认选择第一个楼层
  currentFloorIndex.value = 0;
  
  hideProcessing();
  saveBuildingData();
};

// 渲染楼层
const renderFloors = () => {
  if (!currentBuilding.value || !currentBuilding.value.properties.floorData) return;
  
  // 清理已有的楼层实体
  cleanupFloorEntities();
  
  // 如果没有选中特定楼层，渲染所有楼层
  if (currentFloorIndex.value === -1) {
    currentBuilding.value.properties.floorData.forEach((floor, index) => {
      createFloorEntity(index);
    });
  } else {
    // 否则只渲染当前选中的楼层
    createFloorEntity(currentFloorIndex.value);
  }
};

// 创建楼层实体
const createFloorEntity = (floorIndex) => {
  if (!currentBuilding.value || 
      !currentBuilding.value.properties.floorData || 
      floorIndex >= currentBuilding.value.properties.floorData.length) return;
  
  const floor = currentBuilding.value.properties.floorData[floorIndex];
  
  // 获取建筑底面顶点
  const vertices = currentBuilding.value.geometry.vertices;
  
  // 提取顶点坐标
  const positions = vertices.map(vertex => 
    Cesium.Cartesian3.fromDegrees(vertex.longitude, vertex.latitude, 0)
  );
  
  // 计算楼层的底部和顶部高度
  const bottomHeight = floor.baseHeight;
  const topHeight = bottomHeight + floor.height;
  
  // 创建楼层材质
  const floorMaterial = Cesium.Color.fromCssColorString(floor.color).withAlpha(floor.alpha);
  
  // 创建多边形层次结构（包括孔洞）
  let hierarchy = { positions };
  
  // 添加孔洞
  if (currentBuilding.value.geometry.holes && currentBuilding.value.geometry.holes.length > 0) {
    hierarchy.holes = currentBuilding.value.geometry.holes.map(hole => {
      return {
        positions: hole.map(vertex => 
          Cesium.Cartesian3.fromDegrees(vertex.longitude, vertex.latitude, 0)
        )
      };
    });
  }
  
  // 计算轮廓的中心点
  const centerPoint = calculateCenter(vertices);
  
  // 创建楼层实体
  const floorEntity = props.viewer.entities.add({
    name: `${currentBuilding.value.properties.name} - ${floor.name}`,
    position: Cesium.Cartesian3.fromDegrees(centerPoint.longitude, centerPoint.latitude, 0),
    polygon: {
      hierarchy: hierarchy,
      height: bottomHeight,
      extrudedHeight: topHeight,
      material: floorMaterial,
      outline: true,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 1,
      closeTop: true,
      closeBottom: true
    },
    // 添加标识，表示这是一个楼层实体
    isFloor: true,
    floorIndex: floorIndex,
    buildingRef: currentBuilding.value
  });
  
  // 保存实体引用
  floor.entity = floorEntity;
  floorEntities.value.push(floorEntity);
  
  // 添加楼层标签
  addFloorLabel(floor, centerPoint, topHeight);
  
  return floorEntity;
};

// 添加楼层标签
const addFloorLabel = (floor, centerPoint, height) => {
  const labelEntity = props.viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      centerPoint.longitude, 
      centerPoint.latitude, 
      height + 0.5 // 稍微高于楼层顶部
    ),
    label: {
      text: floor.name,
      font: '12pt sans-serif',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      outlineColor: Cesium.Color.BLACK,
      fillColor: Cesium.Color.WHITE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -5),
      heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY // 确保标签始终可见
    }
  });
  
  // 将标签添加到楼层实体列表中，以便清理
  floorEntities.value.push(labelEntity);
};

// 清理楼层实体
const cleanupFloorEntities = () => {
  // 移除所有楼层实体
  floorEntities.value.forEach(entity => {
    if (entity && props.viewer.entities.contains(entity)) {
      props.viewer.entities.remove(entity);
    }
  });
  
  // 清空实体数组
  floorEntities.value = [];
  
  // 清除楼层实体引用
  if (currentBuilding.value && currentBuilding.value.properties.floorData) {
    currentBuilding.value.properties.floorData.forEach(floor => {
      floor.entity = null;
    });
  }
};

// 切换楼层展开/收起状态
const toggleFloorExplode = () => {
  if (!currentBuilding.value || !hasFloorData.value) return;
  
  // 切换展开状态
  isFloorExploded.value = !isFloorExploded.value;
  
  if (isFloorExploded.value) {
    console.log("展开楼层");
    // 展开楼层 - 使用平滑动画
    applyFloorExplode();
  } else {
    console.log("收起楼层");
    // 如果有当前抽出的楼层，恢复其样式
    if (selectedExplodedFloorIndex.value !== -1) {
      const floor = currentBuilding.value.properties.floorData[selectedExplodedFloorIndex.value];
      if (floor.entity && floor.entity._originalColor) {
        // 恢复原始颜色
        floor.entity.polygon.material = floor.entity._originalColor;
        
        // 恢复轮廓设置
        if (floor.entity._originalOutlineWidth !== undefined) {
          floor.entity.polygon.outlineWidth = floor.entity._originalOutlineWidth;
        } else {
          floor.entity.polygon.outlineWidth = 1;
        }
        
        if (floor.entity._originalOutlineColor) {
          floor.entity.polygon.outlineColor = floor.entity._originalOutlineColor;
        } else {
          floor.entity.polygon.outlineColor = Cesium.Color.BLACK;
        }
        
        // 重置水平偏移
        floor._horizontalOffset = {
          longitude: 0,
          latitude: 0
        };
      }
    }
    
    // 收起楼层 - 使用平滑动画
    selectedExplodedFloorIndex.value = -1;
    animateFloorsCollapse();
  }
};

// 添加楼层平滑收起动画
const animateFloorsCollapse = () => {
  if (!currentBuilding.value || !hasFloorData.value) return;
  
  const floorData = currentBuilding.value.properties.floorData;
  const totalFloors = floorData.length;
  
  // 动画持续时间（毫秒）
  const animationDuration = 1000;
  // 每个楼层的动画延迟，创建阶梯效应 - 自上而下收起
  const delayPerFloor = 80;
  // 动画开始时间
  const startTime = Date.now();
  
  // 存储每个楼层的原始位置和目标位置
  const floorAnimationData = floorData.map((floor, index) => {
    // 从当前位置开始，确保已有状态正确初始化
    const currentOffset = floor._currentOffset !== undefined ? floor._currentOffset : (index * floorExplodeDistance.value);
    
    return {
      floor,
      index,
      // 目标垂直偏移 - 所有楼层都回到0
      targetOffset: 0,
      // 初始垂直偏移 - 当前位置
      startOffset: currentOffset,
      // 延迟开始时间 - 反转顺序，让高楼层先收起
      startDelay: (totalFloors - index - 1) * delayPerFloor,
      // 动画已完成
      completed: false
    };
  });
  
  // 创建缓动函数，使动画更加自然
  const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  
  // 创建动画函数
  const animate = () => {
    const currentTime = Date.now();
    let allCompleted = true;
    
    // 更新每个楼层的位置
    floorAnimationData.forEach(data => {
      if (data.completed) return;
      
      // 计算该楼层的动画进度
      const elapsed = currentTime - startTime - data.startDelay;
      
      // 如果还没到开始时间，跳过
      if (elapsed < 0) {
        allCompleted = false;
        return;
      }
      
      // 计算动画进度 (0-1)
      let progress = Math.min(elapsed / animationDuration, 1);
      
      // 应用缓动函数
      const easedProgress = easeInOutQuad(progress);
      
      // 计算当前偏移
      const currentOffset = data.startOffset - (data.startOffset - data.targetOffset) * easedProgress;
      
      // 直接更新楼层的_currentOffset属性，回调函数会使用这个值
      data.floor._currentOffset = currentOffset;
      
      // 更新标签位置
      if (data.floor.labelEntity) {
        const centerPoint = calculateCenter(currentBuilding.value.geometry.vertices);
        const labelHeight = data.floor.baseHeight + currentOffset + data.floor.height + 0.5;
        
        data.floor.labelEntity.position = Cesium.Cartesian3.fromDegrees(
          centerPoint.longitude, 
          centerPoint.latitude, 
          labelHeight
        );
      }
      
      // 检查是否完成
      if (progress >= 1) {
        data.completed = true;
      } else {
        allCompleted = false;
      }
    });
    
    // 通知Cesium进行视觉更新
    props.viewer.scene.requestRender();
    
    // 如果所有楼层都完成了动画，停止并重新渲染
    if (!allCompleted) {
      requestAnimationFrame(animate);
    } else {
      // 当动画完成后，回到正常渲染模式
      setTimeout(() => {
        // 清除所有现有楼层实体
        cleanupFloorEntities();
        // 重新渲染所有楼层
        renderFloors(); 
      }, 100);
    }
  };
  
  // 开始动画
  requestAnimationFrame(animate);
};

// 应用楼层展开效果
const applyFloorExplode = () => {
  if (!currentBuilding.value || !hasFloorData.value) return;
  
  // 清理已有的楼层实体
  cleanupFloorEntities();
  
  const floorData = currentBuilding.value.properties.floorData;
  const totalFloors = floorData.length;
  
  // 创建所有楼层实体，但初始时不展开（都在同一高度）
  floorData.forEach((floor, index) => {
    // 初始时所有楼层都在底部，没有垂直偏移
    createExplodedFloorEntity(index, 0);
    
    // 如果是当前选中的抽出楼层，应用抽屉效果
    if (selectedExplodedFloorIndex.value === index) {
      applyDrawerEffectToFloor(index);
    }
  });
  
  // 如果建筑实体存在，隐藏它
  if (currentBuilding.value.entity) {
    currentBuilding.value.entity.show = false;
  }
  
  // 添加平滑的楼层展开动画
  animateFloorsExplode();
};

// 选择楼层
const selectFloor = (index) => {
  if (!currentBuilding.value || !currentBuilding.value.properties.floorData) return;
  
  // 如果楼层处于展开状态，先切换到该楼层的抽屉效果
  if (isFloorExploded.value) {
    toggleFloorDrawer(index);
    return;
  }
  
  // 原有的selectFloor逻辑
  currentFloorIndex.value = index;
  
  // 更新楼层可视化
  renderFloors();
  
  // 如果建筑实体存在，隐藏它
  if (currentBuilding.value.entity) {
    currentBuilding.value.entity.show = false;
  }
  
  // 不再飞行到选中的楼层
  // flyToFloor(index);
};

// 查看所有楼层
const viewAllFloors = () => {
  if (!currentBuilding.value) return;
  
  // 如果楼层处于展开状态，保持展开显示所有楼层
  if (isFloorExploded.value) {
    selectedExplodedFloorIndex.value = -1;
    applyFloorExplode();
    return;
  }
  
  // 原有的viewAllFloors逻辑
  currentFloorIndex.value = -1;
  
  // 渲染所有楼层
  renderFloors();
  
  // 如果建筑实体存在，隐藏它
  if (currentBuilding.value.entity) {
    currentBuilding.value.entity.show = false;
  }
  
  // 不再飞行到建筑
  // flyToBuilding();
};

// 飞行到楼层
const flyToFloor = (floorIndex) => {
  if (!currentBuilding.value || 
      !currentBuilding.value.properties.floorData || 
      floorIndex >= currentBuilding.value.properties.floorData.length) return;
  
  const floor = currentBuilding.value.properties.floorData[floorIndex];
  
  // 计算楼层的中心点和高度
  const centerPoint = calculateCenter(currentBuilding.value.geometry.vertices);
  const floorHeight = floor.baseHeight + floor.height / 2;
  
  // 飞行到楼层位置
  props.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      centerPoint.longitude,
      centerPoint.latitude,
      floorHeight + 50 // 稍微高于楼层
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-30),
      roll: 0
    },
    duration: 1.5
  });
};

// 更新楼层高度
const updateFloorHeights = () => {
  if (!currentBuilding.value || !currentFloor.value) return;
  
  // 获取当前楼层
  const floor = currentFloor.value;
  const floorIndex = currentFloorIndex.value;
  
  // 更新总建筑高度
  let totalHeight = 0;
  currentBuilding.value.properties.floorData.forEach(f => {
    totalHeight += f.height;
  });
  
  currentBuilding.value.properties.height = totalHeight;
  currentBuilding.value.properties.floorHeight = totalHeight / currentBuilding.value.properties.floors;
  
  // 更新所有楼层的基础高度
  let baseHeight = 0;
  for (let i = 0; i < currentBuilding.value.properties.floorData.length; i++) {
    const currentFloor = currentBuilding.value.properties.floorData[i];
    currentFloor.baseHeight = baseHeight;
    baseHeight += currentFloor.height;
  }
  
  // 更新楼层可视化
  renderFloors();
  
  // 如果建筑实体存在，更新它
  if (currentBuilding.value.entity) {
    updateBuildingEntity();
  }
  
  saveBuildingData();
};

// 应用楼层样式
const applyFloorStyle = () => {
  if (!currentBuilding.value || !currentFloor.value) return;
  
  // 更新当前楼层的实体样式
  if (currentFloor.value.entity) {
    const floorMaterial = Cesium.Color.fromCssColorString(currentFloor.value.color)
      .withAlpha(currentFloor.value.alpha);
    
    currentFloor.value.entity.polygon.material = floorMaterial;
  } else {
    // 如果实体不存在，重新渲染
    renderFloors();
  }
  
  saveBuildingData();
};

// 应用楼层更改
const applyFloorChanges = () => {
  if (!currentBuilding.value || !currentFloor.value) return;
  
  // 更新楼层实体
  renderFloors();
  
  // 保存数据
  saveBuildingData();
  
  // 提示用户
  alert('楼层更改已应用');
};

// 批量应用楼层操作
const applyBatchFloorOperation = () => {
  if (!currentBuilding.value || !currentBuilding.value.properties.floorData) return;
  
  switch (floorBatchOperation.value) {
    case 'color':
      applyBatchFloorColor();
      break;
    case 'function':
      applyBatchFloorFunction();
      break;
    case 'equalHeight':
      applyEqualFloorHeights();
      break;
  }
  
  saveBuildingData();
};

// 批量应用楼层颜色
const applyBatchFloorColor = () => {
  if (!currentBuilding.value || !currentBuilding.value.properties.floorData) return;
  
  const colorPrompt = prompt('请选择批量应用的颜色代码 (例如: #FFFFFF):', '#ADD8E6');
  if (!colorPrompt) return;
  
  const alphaPrompt = prompt('请设置透明度 (0-1之间):', '0.8');
  const alpha = parseFloat(alphaPrompt) || 0.8;
  
  // 应用到所有楼层
  currentBuilding.value.properties.floorData.forEach(floor => {
    floor.color = colorPrompt;
    floor.alpha = alpha;
  });
  
  // 更新可视化
  renderFloors();
};

// 批量应用楼层功能
const applyBatchFloorFunction = () => {
  if (!currentBuilding.value || !currentBuilding.value.properties.floorData) return;
  
  const options = {
    'residential': '住宅',
    'commercial': '商业',
    'office': '办公',
    'parking': '停车场',
    'public': '公共空间',
    'other': '其他'
  };
  
  // 创建选项字符串
  let promptStr = '请选择批量应用的楼层功能:\n';
  Object.entries(options).forEach(([key, value]) => {
    promptStr += `${key}: ${value}\n`;
  });
  
  const functionPrompt = prompt(promptStr, 'residential');
  if (!functionPrompt || !options[functionPrompt]) return;
  
  // 应用到所有楼层
  currentBuilding.value.properties.floorData.forEach(floor => {
    floor.function = functionPrompt;
  });
};

// 均分楼层高度
const applyEqualFloorHeights = () => {
  if (!currentBuilding.value || !currentBuilding.value.properties.floorData) return;
  
  const totalHeight = currentBuilding.value.properties.height;
  const floorCount = currentBuilding.value.properties.floorData.length;
  const equalHeight = totalHeight / floorCount;
  
  // 应用均等高度
  let baseHeight = 0;
  currentBuilding.value.properties.floorData.forEach(floor => {
    floor.height = equalHeight;
    floor.baseHeight = baseHeight;
    baseHeight += equalHeight;
  });
  
  // 更新层高属性
  currentBuilding.value.properties.floorHeight = equalHeight;
  
  // 更新可视化
  renderFloors();
};

// 打开登录对话框
const openLoginDialog = () => {
  alert('登录功能需要与后端系统集成，此处为演示');
  isLoggedIn.value = true;
};



// 添加显示处理中状态的方法
function showProcessing(message = '处理中...') {
  processingMessage.value = message;
  isProcessing.value = true;
}

function hideProcessing() {
  isProcessing.value = false;
}

// 创建新建筑时添加默认属性函数
const createDefaultBuildingProperties = () => {
  return {
    name: `建筑 ${new Date().toLocaleDateString()}`,
    description: '新建筑',
    height: 30,
    floors: 10,
    floorHeight: 3.0,
    color: '#FFFFFF',
    alpha: 0.8,
    roofStyle: 'flat',
    materialType: 'solid',
    heightReference: 'relative'
  };
};

// 开始绘制建筑底面
const startDrawing = () => {
  if (!currentBuilding.value) return;
  
  // 清理之前的绘制
  cleanupDrawingEntities();
  
  // 如果是孔洞绘制模式，需要先绘制底面作为参考
  if (holeDrawingMode.value) {
    if (currentBuilding.value.geometry.vertices.length > 0) {
      // 绘制底面顶点和线条，包括闭合线
      redrawVerticesAndLines();
    }
  } else {
    // 如果是底面绘制模式，清空当前的顶点
    currentBuilding.value.geometry.vertices = [];
  }
  
  isDrawing.value = true;
  
  // 禁用属性查询窗口功能
  emit('disable-info-box');
  
  // 创建绘制处理器
  setupDrawHandler();
  
  // 提示用户
  alert(holeDrawingMode.value ? 
        '请在地图上点击添加孔洞顶点，右键点击结束绘制' : 
        '请在地图上点击添加建筑底面顶点，右键点击结束绘制');
};

// 设置绘制处理器
const setupDrawHandler = () => {
  if (!props.viewer) return;
  
  // 清理之前的处理器
  if (drawHandler) {
    drawHandler.destroy();
  }
  
  // 创建新的处理器
  drawHandler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  // 左键点击添加顶点
  drawHandler.setInputAction((click) => {
    const cartesian = getCartesianFromClick(click.position);
    if (cartesian) {
      addVertex(cartesian);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // 右键点击结束绘制
  drawHandler.setInputAction(() => {
    finishDrawing();
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  
  // 鼠标移动显示预览线
  drawHandler.setInputAction((movement) => {
    if (currentBuilding.value && 
        (holeDrawingMode.value || 
         currentBuilding.value.geometry.vertices.length > 0) && 
        isDrawing.value) {
      showPreviewLine(movement.endPosition);
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
};

// 添加顶点
const addVertex = (cartesian) => {
  if (!cartesian || !currentBuilding.value) return;
  
  // 转换为经纬度
  const vertexData = cartesianToLatLon(cartesian);
  
  // 添加到顶点列表
  if (holeDrawingMode.value) {
    // 如果是孔洞模式，但还没有任何底面顶点显示，先绘制底面
    if (vertexEntities.value.length === 0 && currentBuilding.value.geometry.vertices.length > 0) {
      // 绘制底面顶点和线条，包括闭合线
      redrawVerticesAndLines();
    }
    
    // 添加到孔洞
    if (!currentBuilding.value.geometry.holes) {
      currentBuilding.value.geometry.holes = [];
    }
    
    if (editingHoleIndex.value === -1) {
      currentBuilding.value.geometry.holes.push([]);
      editingHoleIndex.value = currentBuilding.value.geometry.holes.length - 1;
    }
    
    currentBuilding.value.geometry.holes[editingHoleIndex.value].push(vertexData);
  } else {
    // 添加到建筑外轮廓
    currentBuilding.value.geometry.vertices.push(vertexData);
  }
  
  // 添加点实体
  const pointEntity = props.viewer.entities.add({
    position: cartesian,
    point: {
      pixelSize: 15, // 增加点的大小，让其更容易被选中
      color: holeDrawingMode.value ? Cesium.Color.AQUA : Cesium.Color.YELLOW,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
    }
  });
  
  // 存储实体，分开管理顶点和线
  drawingEntities.value.push(pointEntity);
  vertexEntities.value.push(pointEntity);
  
  // 如果有多个点，绘制线段
  const vertices = holeDrawingMode.value ? 
                   currentBuilding.value.geometry.holes[editingHoleIndex.value] : 
                   currentBuilding.value.geometry.vertices;
  
  if (vertices.length > 1) {
    const index = vertices.length - 1;
    const prevIndex = index - 1;
    
    const lineEntity = props.viewer.entities.add({
      polyline: {
        positions: [
          vertices[prevIndex].cartesian,
          vertices[index].cartesian
        ],
        width: 3,
        material: holeDrawingMode.value ? Cesium.Color.AQUA : Cesium.Color.YELLOW,
        clampToGround: true
      }
    });
    
    drawingEntities.value.push(lineEntity);
    lineEntities.value.push(lineEntity);
  }
};

// 显示预览线
let previewLineEntity = null;
const showPreviewLine = (mousePosition) => {
  const vertices = holeDrawingMode.value && editingHoleIndex.value !== -1 ? 
                  currentBuilding.value.geometry.holes[editingHoleIndex.value] : 
                  currentBuilding.value.geometry.vertices;
  
  if (!vertices || vertices.length === 0) return;
  
  // 移除之前的预览线
  if (previewLineEntity) {
    props.viewer.entities.remove(previewLineEntity);
    previewLineEntity = null;
  }
  
  // 获取鼠标位置的笛卡尔坐标
  const cartesian = getCartesianFromClick(mousePosition);
  if (!cartesian) return;
  
  // 添加新的预览线
  const lastVertex = vertices[vertices.length - 1];
  previewLineEntity = props.viewer.entities.add({
    polyline: {
      positions: [lastVertex.cartesian, cartesian],
      width: 3,
      material: new Cesium.PolylineDashMaterialProperty({
        color: holeDrawingMode.value ? 
              Cesium.Color.AQUA.withAlpha(0.7) : 
              Cesium.Color.YELLOW.withAlpha(0.7),
        dashLength: 8.0
      }),
      clampToGround: true
    }
  });
  
  drawingEntities.value.push(previewLineEntity);
};

// 完成绘制
const finishDrawing = () => {
  const vertices = holeDrawingMode.value && editingHoleIndex.value !== -1 ? 
                  currentBuilding.value.geometry.holes[editingHoleIndex.value] : 
                  currentBuilding.value.geometry.vertices;
  
  if (vertices.length < 3) {
    alert('请至少添加3个顶点以形成有效的多边形');
    return;
  }
  
  // 清除预览线
  if (previewLineEntity) {
    props.viewer.entities.remove(previewLineEntity);
    previewLineEntity = null;
  }
  
  // 添加闭合线
  const closeLineEntity = props.viewer.entities.add({
    polyline: {
      positions: [
        vertices[vertices.length - 1].cartesian,
        vertices[0].cartesian
      ],
      width: 3,
      material: holeDrawingMode.value ? Cesium.Color.AQUA : Cesium.Color.YELLOW,
      clampToGround: true
    }
  });
  
  drawingEntities.value.push(closeLineEntity);
  
  // 结束绘制模式
  isDrawing.value = false;
  
  // 重置孔洞绘制模式
  if (holeDrawingMode.value) {
    holeDrawingMode.value = false;
    editingHoleIndex.value = -1;
  }
  
  // 清理事件处理器
  if (drawHandler) {
    drawHandler.destroy();
    drawHandler = null;
  }
  
  // 设置顶点可选择和拖动
  setupVertexInteraction();
  
  // 恢复属性查询窗口功能
  emit('enable-info-box');
  
  // 保存当前数据
  saveBuildingData();
};

// 清除绘制
const clearDrawing = () => {
  if (!currentBuilding.value) return;
  
  if (holeDrawingMode.value) {
    // 清除当前正在编辑的孔洞
    if (editingHoleIndex.value !== -1 && 
        currentBuilding.value.geometry.holes && 
        editingHoleIndex.value < currentBuilding.value.geometry.holes.length) {
      currentBuilding.value.geometry.holes.splice(editingHoleIndex.value, 1);
    }
    
    holeDrawingMode.value = false;
    editingHoleIndex.value = -1;
  } else {
    // 清除主要几何形状
    currentBuilding.value.geometry.vertices = [];
    
    // 也清除所有孔洞
    currentBuilding.value.geometry.holes = [];
  }
  
  // 清理所有绘制实体
  cleanupDrawingEntities();
  
  // 如果存在建筑实体，也移除它
  if (currentBuilding.value.entity) {
    props.viewer.entities.remove(currentBuilding.value.entity);
    currentBuilding.value.entity = null;
  }
  
  // 保存当前数据
  saveBuildingData();
};

// 清理绘制实体
const cleanupDrawingEntities = () => {
  drawingEntities.value.forEach(entity => {
    if (entity && props.viewer.entities.contains(entity)) {
      props.viewer.entities.remove(entity);
    }
  });
  
  drawingEntities.value = [];
  vertexEntities.value = [];
  lineEntities.value = [];
  
  if (previewLineEntity) {
    props.viewer.entities.remove(previewLineEntity);
    previewLineEntity = null;
  }
};

// 生成建筑
const generateBuilding = () => {
  if (!canGenerateBuilding.value) return;
  
  showProcessing('正在生成建筑...');
  
  // 使用setTimeout模拟异步操作
  setTimeout(() => {
    if (!currentBuilding.value || !canGenerateBuilding.value) {
      alert('请确保至少有3个顶点且填写了有效的建筑属性');
      return;
    }
    
    // 如果已存在建筑实体，则移除它
    if (currentBuilding.value.entity) {
      props.viewer.entities.remove(currentBuilding.value.entity);
      currentBuilding.value.entity = null;
    }
    
    // 创建建筑实体
    createBuildingEntity();
    
    // 飞行到建筑位置
    flyToBuilding();
    
    hideProcessing();
    
    // 保存当前数据
    saveBuildingData();
  }, 300);
};

// 更新建筑高度
const onHeightChange = () => {
  if (!currentBuilding.value) return;
  
  const height = currentBuilding.value.properties.height;
  
  // 如果楼层数存在，计算层高
  if (currentBuilding.value.properties.floors && currentBuilding.value.properties.floors > 0) {
    currentBuilding.value.properties.floorHeight = parseFloat((height / currentBuilding.value.properties.floors).toFixed(1));
  }
};

// 更新楼层数
const onFloorsChange = () => {
  if (!currentBuilding.value) return;
  
  const floors = currentBuilding.value.properties.floors;
  
  // 如果建筑高度存在，计算层高
  if (currentBuilding.value.properties.height && currentBuilding.value.properties.height > 0 && floors > 0) {
    currentBuilding.value.properties.floorHeight = parseFloat((currentBuilding.value.properties.height / floors).toFixed(1));
  } else if (currentBuilding.value.properties.floorHeight && currentBuilding.value.properties.floorHeight > 0 && floors > 0) {
    // 如果层高存在，计算建筑高度
    currentBuilding.value.properties.height = Math.round(currentBuilding.value.properties.floorHeight * floors);
  }
};

// 更新层高
const onFloorHeightChange = () => {
  if (!currentBuilding.value) return;
  
  const floorHeight = currentBuilding.value.properties.floorHeight;
  
  // 如果楼层数存在，计算建筑高度
  if (currentBuilding.value.properties.floors && currentBuilding.value.properties.floors > 0 && floorHeight > 0) {
    currentBuilding.value.properties.height = Math.round(floorHeight * currentBuilding.value.properties.floors);
  } else if (currentBuilding.value.properties.height && currentBuilding.value.properties.height > 0 && floorHeight > 0) {
    // 如果建筑高度存在，计算楼层数
    currentBuilding.value.properties.floors = Math.round(currentBuilding.value.properties.height / floorHeight);
  }
};

// 复制建筑相关状态
const isCopyingBuilding = ref(false);
const copySourceBuildingIndex = ref(-1);
const previewBuildingEntity = ref(null);
const previewBuildingEntities = ref([]);

// 开始复制建筑流程
const startBuildingCopy = (index) => {
  if (currentGroupIndex.value === -1) return;
  if (index < 0 || index >= currentGroup.value.buildings.length) return;
  
  // 设置复制状态
  isCopyingBuilding.value = true;
  copySourceBuildingIndex.value = index;
  
  // 显示提示信息
  alert("请在地图上点击选择新的位置来放置复制的建筑");
  
  // 禁用属性查询窗口，避免干扰
  emit('disable-info-box');
  
  // 设置一次性点击事件处理器
  const handler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  // 添加鼠标移动处理，用于预览
  handler.setInputAction((movement) => {
    showCopyPreview(movement.endPosition);
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  
  // 添加点击处理器，用于确认位置
  handler.setInputAction((movement) => {
    const cartesian = getCartesianFromMousePosition(movement.position);
    if (cartesian) {
      completeBuildingCopy(cartesian);
      handler.destroy();
      
      // 恢复属性查询窗口功能
      emit('enable-info-box');
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // 添加右键点击处理器，用于取消操作
  handler.setInputAction(() => {
    // 取消复制
    cleanupCopyPreview();
    isCopyingBuilding.value = false;
    copySourceBuildingIndex.value = -1;
    handler.destroy();
    
    // 恢复属性查询窗口功能
    emit('enable-info-box');
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
};

// 显示复制预览
const showCopyPreview = (mousePosition) => {
  if (!isCopyingBuilding.value || copySourceBuildingIndex.value === -1) return;
  
  // 清除已有的预览
  cleanupCopyPreview();
  
  const cartesian = getCartesianFromMousePosition(mousePosition);
  if (!cartesian) return;
  
  // 获取源建筑
  const sourceBuilding = currentGroup.value.buildings[copySourceBuildingIndex.value];
  if (!sourceBuilding || !sourceBuilding.geometry || !sourceBuilding.geometry.vertices || sourceBuilding.geometry.vertices.length < 3) return;
  
  // 获取鼠标点击位置的经纬度
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const longitude = Cesium.Math.toDegrees(cartographic.longitude);
  const latitude = Cesium.Math.toDegrees(cartographic.latitude);
  
  // 计算源建筑中心点
  const center = calculateCenter(sourceBuilding.geometry.vertices);
  
  // 计算偏移量
  const offsetLon = longitude - center.longitude;
  const offsetLat = latitude - center.latitude;
  
  // 创建预览建筑的顶点
  const previewVertices = sourceBuilding.geometry.vertices.map(vertex => ({
    longitude: vertex.longitude + offsetLon,
    latitude: vertex.latitude + offsetLat
  }));
  
  // 创建多边形位置数组
  const positions = previewVertices.map(vertex => 
    Cesium.Cartesian3.fromDegrees(vertex.longitude, vertex.latitude, 0)
  );
  
  // 构建多边形层次结构
  let hierarchy = new Cesium.PolygonHierarchy(positions);
  
  // 如果有孔洞，也需要添加
  if (sourceBuilding.geometry.holes && sourceBuilding.geometry.holes.length > 0) {
    sourceBuilding.geometry.holes.forEach(hole => {
      if (hole && hole.length >= 3) {
        const holePositions = hole.map(vertex => 
          Cesium.Cartesian3.fromDegrees(
            vertex.longitude + offsetLon, 
            vertex.latitude + offsetLat, 
            0
          )
        );
        hierarchy.holes.push(new Cesium.PolygonHierarchy(holePositions));
      }
    });
  }
  
  // 创建半透明的预览材质
  const previewMaterial = Cesium.Color.fromCssColorString(sourceBuilding.properties.color)
    .withAlpha(0.5); // 使用半透明效果表示预览状态
  
  // 创建预览实体
  previewBuildingEntity.value = props.viewer.entities.add({
    name: `${sourceBuilding.properties.name} (预览)`,
    polygon: {
      hierarchy: hierarchy,
      extrudedHeight: sourceBuilding.properties.height,
      material: previewMaterial,
      outline: true,
      outlineColor: Cesium.Color.YELLOW,
      outlineWidth: 2,
      closeTop: true,
      closeBottom: true
    }
  });
};

// 清理复制预览
const cleanupCopyPreview = () => {
  if (previewBuildingEntity.value) {
    props.viewer.entities.remove(previewBuildingEntity.value);
    previewBuildingEntity.value = null;
  }
  
  // 清理批量预览实体
  previewBuildingEntities.value.forEach(entity => {
    if (entity && props.viewer.entities.contains(entity)) {
      props.viewer.entities.remove(entity);
    }
  });
  previewBuildingEntities.value = [];
};

// 完成建筑复制
const completeBuildingCopy = (cartesian) => {
  console.log('开始完成建筑复制操作');
  if (!isCopyingBuilding.value || copySourceBuildingIndex.value === -1) {
    console.warn('复制状态异常，无法完成复制');
    return;
  }
  
  // 获取源建筑
  const sourceBuilding = currentGroup.value.buildings[copySourceBuildingIndex.value];
  if (!sourceBuilding) {
    console.warn('源建筑不存在，无法复制');
    return;
  }
  
  // 获取点击位置的经纬度
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const longitude = Cesium.Math.toDegrees(cartographic.longitude);
  const latitude = Cesium.Math.toDegrees(cartographic.latitude);
  
  // 计算源建筑中心点
  const center = calculateCenter(sourceBuilding.geometry.vertices);
  
  // 计算偏移量
  const offsetLon = longitude - center.longitude;
  const offsetLat = latitude - center.latitude;
  
  // 手动创建复制的建筑对象，避免循环引用问题
  const copiedBuilding = {
    id: Date.now().toString(), // 确保ID唯一
    properties: {
      name: `${sourceBuilding.properties.name} (复制)`,
      description: sourceBuilding.properties.description,
      height: sourceBuilding.properties.height,
      color: sourceBuilding.properties.color,
      alpha: sourceBuilding.properties.alpha,
      heightReference: sourceBuilding.properties.heightReference
    },
    geometry: {
      vertices: [],
      holes: []
    },
    visible: true,
    entity: null
  };
  
  console.log('复制源建筑:', sourceBuilding.properties.name);
  
  // 复制并调整顶点位置
  copiedBuilding.geometry.vertices = sourceBuilding.geometry.vertices.map(vertex => {
    const newLon = vertex.longitude + offsetLon;
    const newLat = vertex.latitude + offsetLat;
    return {
      longitude: newLon,
      latitude: newLat,
      cartesian: Cesium.Cartesian3.fromDegrees(newLon, newLat, 0)
    };
  });
  
  // 如果有孔洞，也需要复制并调整
  if (sourceBuilding.geometry.holes && sourceBuilding.geometry.holes.length > 0) {
    copiedBuilding.geometry.holes = sourceBuilding.geometry.holes.map(hole => {
      if (!hole) return [];
      return hole.map(vertex => {
        if (!vertex) return null;
        const newLon = vertex.longitude + offsetLon;
        const newLat = vertex.latitude + offsetLat;
        return {
          longitude: newLon,
          latitude: newLat,
          cartesian: Cesium.Cartesian3.fromDegrees(newLon, newLat, 0)
        };
      }).filter(v => v !== null);
    }).filter(h => h.length >= 3);
  }
  
  // 清理预览
  cleanupCopyPreview();
  
  // 确保建筑组存在
  if (!currentGroup.value) {
    console.error('当前建筑组不存在，无法添加复制的建筑');
    return;
  }
  
  // 添加到建筑组
  currentGroup.value.buildings.push(copiedBuilding);
  
  console.log('添加复制建筑到组，当前建筑数量:', currentGroup.value.buildings.length);
  
  // 为新建筑创建实体
  try {
    // 创建独立的建筑实体
    createBuildingEntityDirectly(copiedBuilding);
    console.log('成功创建复制建筑实体');
  } catch (error) {
    console.error('创建复制建筑实体时出错:', error);
  }
  
  // 选择新建筑
  currentBuildingIndex.value = currentGroup.value.buildings.length - 1;
  
  // 重置复制状态
  isCopyingBuilding.value = false;
  copySourceBuildingIndex.value = -1;
  
  // 保存当前数据
  saveBuildingData();
  
  console.log(`成功复制建筑: ${copiedBuilding.properties.name}`);
};

// 添加一个专门用于直接创建建筑实体的辅助函数
const createBuildingEntityDirectly = (building) => {
  if (!props.viewer || !building || !building.geometry || !building.geometry.vertices) {
    console.error('创建建筑实体所需参数不完整');
    return;
  }
  
  // 确保有足够的顶点
  if (building.geometry.vertices.length < 3) {
    console.error('建筑几何形状顶点数量不足，至少需要3个顶点');
    return;
  }
  
  // 构建建筑多边形
  const positions = building.geometry.vertices.map(vertex => 
    Cesium.Cartesian3.fromDegrees(vertex.longitude, vertex.latitude, 0)
  );
  
  // 创建多边形层次结构
  let hierarchy = new Cesium.PolygonHierarchy(positions);
  
  // 添加孔洞
  if (building.geometry.holes && building.geometry.holes.length > 0) {
    building.geometry.holes.forEach(hole => {
      if (hole && hole.length >= 3) {
        const holePositions = hole.map(vertex => 
          Cesium.Cartesian3.fromDegrees(vertex.longitude, vertex.latitude, 0)
        );
        hierarchy.holes.push(new Cesium.PolygonHierarchy(holePositions));
      }
    });
  }
  
  // 创建实体
  const buildingColor = Cesium.Color.fromCssColorString(building.properties.color || '#FFFFFF');
  
  building.entity = props.viewer.entities.add({
    name: building.properties.name || '未命名建筑',
    polygon: {
      hierarchy: hierarchy,
      extrudedHeight: building.properties.height || 10,
      material: buildingColor,
      outline: true,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      closeTop: true,
      closeBottom: true
    },
    properties: {
      buildingId: building.id,
      groupId: currentGroup.value.id,
      isBuilding: true
    }
  });
  
  console.log(`直接创建建筑实体成功，ID: ${building.id}`);
};

// 批量复制建筑功能
const batchCopyBuildings = () => {
  if (currentGroupIndex.value === -1 || selectedBuildingIndices.value.length === 0) {
    alert('请先选择一个或多个建筑');
    return;
  }
  
  // 设置复制状态
  isCopyingBuilding.value = true;
  
  // 显示提示信息
  alert("请在地图上点击选择新的位置来放置复制的建筑群");
  
  // 禁用属性查询窗口，避免干扰
  emit('disable-info-box');
  
  // 设置一次性点击事件处理器
  const handler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  // 添加鼠标移动处理，用于预览
  handler.setInputAction((movement) => {
    showBatchCopyPreview(movement.endPosition);
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  
  // 添加点击处理器，用于确认位置
  handler.setInputAction((movement) => {
    const cartesian = getCartesianFromMousePosition(movement.position);
    if (cartesian) {
      completeBatchCopy(cartesian);
      handler.destroy();
      
      // 恢复属性查询窗口功能
      emit('enable-info-box');
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // 添加右键点击处理器，用于取消操作
  handler.setInputAction(() => {
    // 取消复制
    cleanupCopyPreview();
    isCopyingBuilding.value = false;
    handler.destroy();
    
    // 恢复属性查询窗口功能
    emit('enable-info-box');
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
};

// 显示批量复制预览
const showBatchCopyPreview = (mousePosition) => {
  if (!isCopyingBuilding.value || selectedBuildingIndices.value.length === 0) return;
  
  // 清除已有的预览
  cleanupCopyPreview();
  
  const cartesian = getCartesianFromMousePosition(mousePosition);
  if (!cartesian) return;
  
  // 获取鼠标点击位置的经纬度
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const targetLon = Cesium.Math.toDegrees(cartographic.longitude);
  const targetLat = Cesium.Math.toDegrees(cartographic.latitude);
  
  // 如果只选择了一个建筑，使用单建筑复制预览
  if (selectedBuildingIndices.value.length === 1) {
    copySourceBuildingIndex.value = selectedBuildingIndices.value[0];
    showCopyPreview(mousePosition);
    return;
  }
  
  // 计算所选建筑的中心点
  const selectedBuildings = selectedBuildingIndices.value.map(idx => currentGroup.value.buildings[idx]);
  const centerPoints = selectedBuildings.map(building => calculateCenter(building.geometry.vertices));
  
  let sumLon = 0, sumLat = 0;
  centerPoints.forEach(point => {
    sumLon += point.longitude;
    sumLat += point.latitude;
  });
  
  const groupCenter = {
    longitude: sumLon / centerPoints.length,
    latitude: sumLat / centerPoints.length
  };
  
  // 计算从当前组中心到目标位置的偏移量
  const offsetLon = targetLon - groupCenter.longitude;
  const offsetLat = targetLat - groupCenter.latitude;
  
  // 为每个建筑创建预览
  selectedBuildings.forEach((sourceBuilding) => {
    // 创建预览建筑的顶点
    const previewVertices = sourceBuilding.geometry.vertices.map(vertex => ({
      longitude: vertex.longitude + offsetLon,
      latitude: vertex.latitude + offsetLat
    }));
    
    // 创建多边形位置数组
    const positions = previewVertices.map(vertex => 
      Cesium.Cartesian3.fromDegrees(vertex.longitude, vertex.latitude, 0)
    );
    
    // 构建多边形层次结构
    let hierarchy = new Cesium.PolygonHierarchy(positions);
    
    // 如果有孔洞，也需要添加
    if (sourceBuilding.geometry.holes && sourceBuilding.geometry.holes.length > 0) {
      sourceBuilding.geometry.holes.forEach(hole => {
        if (hole && hole.length >= 3) {
          const holePositions = hole.map(vertex => 
            Cesium.Cartesian3.fromDegrees(
              vertex.longitude + offsetLon, 
              vertex.latitude + offsetLat, 
              0
            )
          );
          hierarchy.holes.push(new Cesium.PolygonHierarchy(holePositions));
        }
      });
    }
    
    // 创建半透明的预览材质
    const previewMaterial = Cesium.Color.fromCssColorString(sourceBuilding.properties.color)
      .withAlpha(0.5); // 使用半透明效果表示预览状态
    
    // 创建预览实体
    const previewEntity = props.viewer.entities.add({
      name: `${sourceBuilding.properties.name} (预览)`,
      polygon: {
        hierarchy: hierarchy,
        extrudedHeight: sourceBuilding.properties.height,
        material: previewMaterial,
        outline: true,
        outlineColor: Cesium.Color.YELLOW,
        outlineWidth: 2,
        closeTop: true,
        closeBottom: true
      }
    });
    
    previewBuildingEntities.value.push(previewEntity);
  });
};

// 完成批量建筑复制
const completeBatchCopy = (cartesian) => {
  if (!isCopyingBuilding.value || selectedBuildingIndices.value.length === 0) {
    return;
  }
  
  // 如果只选择了一个建筑，使用单建筑复制
  if (selectedBuildingIndices.value.length === 1) {
    copySourceBuildingIndex.value = selectedBuildingIndices.value[0];
    completeBuildingCopy(cartesian);
    return;
  }
  
  // 获取点击位置的经纬度
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const targetLon = Cesium.Math.toDegrees(cartographic.longitude);
  const targetLat = Cesium.Math.toDegrees(cartographic.latitude);
  
  // 计算所选建筑的中心点
  const selectedBuildings = selectedBuildingIndices.value.map(idx => currentGroup.value.buildings[idx]);
  const centerPoints = selectedBuildings.map(building => calculateCenter(building.geometry.vertices));
  
  let sumLon = 0, sumLat = 0;
  centerPoints.forEach(point => {
    sumLon += point.longitude;
    sumLat += point.latitude;
  });
  
  const groupCenter = {
    longitude: sumLon / centerPoints.length,
    latitude: sumLat / centerPoints.length
  };
  
  // 计算从当前组中心到目标位置的偏移量
  const offsetLon = targetLon - groupCenter.longitude;
  const offsetLat = targetLat - groupCenter.latitude;
  
  // 清理预览
  cleanupCopyPreview();
  
  // 批量复制每个选中的建筑
  const newBuildingIndices = [];
  
  selectedBuildings.forEach((sourceBuilding) => {
    // 创建新的建筑对象
    const newBuilding = {
      properties: JSON.parse(JSON.stringify(sourceBuilding.properties)),
      geometry: {
        vertices: sourceBuilding.geometry.vertices.map(vertex => ({
          longitude: vertex.longitude + offsetLon,
          latitude: vertex.latitude + offsetLat,
          cartesian: Cesium.Cartesian3.fromDegrees(
            vertex.longitude + offsetLon, 
            vertex.latitude + offsetLat, 
            0
          )
        })),
        holes: []
      },
      visible: true,
      entity: null
    };
    
    // 复制孔洞
    if (sourceBuilding.geometry.holes && sourceBuilding.geometry.holes.length > 0) {
      newBuilding.geometry.holes = sourceBuilding.geometry.holes.map(hole => {
        return hole.map(vertex => ({
          longitude: vertex.longitude + offsetLon,
          latitude: vertex.latitude + offsetLat,
          cartesian: Cesium.Cartesian3.fromDegrees(
            vertex.longitude + offsetLon, 
            vertex.latitude + offsetLat, 
            0
          )
        }));
      });
    }
    
    // 更新建筑名称，添加"(复制)"后缀
    if (!newBuilding.properties.name.includes('(复制)')) {
      newBuilding.properties.name += ' (复制)';
    }
    
    // 添加到当前建筑群
    currentGroup.value.buildings.push(newBuilding);
    newBuildingIndices.push(currentGroup.value.buildings.length - 1);
    
    // 创建建筑实体
    createBuildingEntity(newBuilding);
  });
  
  // 选择新建筑
  if (newBuildingIndices.length > 0) {
    currentBuildingIndex.value = newBuildingIndices[0];
    selectedBuildingIndices.value = newBuildingIndices;
  }
  
  // 重置复制状态
  isCopyingBuilding.value = false;
  
  // 保存当前数据
  saveBuildingData();
  
  console.log(`成功批量复制 ${newBuildingIndices.length} 个建筑`);
};

// 开启/关闭多选模式
const toggleMultiSelectMode = () => {
  isMultiSelectMode.value = !isMultiSelectMode.value;
  
  // 如果关闭多选模式，保留当前选中的建筑
  if (!isMultiSelectMode.value && selectedBuildingIndices.value.length > 0) {
    if (!selectedBuildingIndices.value.includes(currentBuildingIndex.value)) {
      currentBuildingIndex.value = selectedBuildingIndices.value[0];
    }
    selectedBuildingIndices.value = [currentBuildingIndex.value];
  }
};

// 从鼠标位置获取Cartesian3坐标
const getCartesianFromMousePosition = (mousePosition) => {
  if (!props.viewer) return null;
  
  try {
    // 先尝试从地形获取精确的点
    const ray = props.viewer.camera.getPickRay(mousePosition);
    if (!ray) return null;
    
    let cartesian = props.viewer.scene.globe.pick(ray, props.viewer.scene);
    
    // 如果地形拾取失败，则使用椭球体拾取
    if (!cartesian) {
      cartesian = props.viewer.camera.pickEllipsoid(
        mousePosition,
        props.viewer.scene.globe.ellipsoid
      );
    }
    
    // 如果两种方法都失败，使用固定高度平面拾取
    if (!cartesian) {
      // 尝试用零高度平面拾取
      const camera = props.viewer.camera;
      const direction = camera.getPickRay(mousePosition).direction;
      const distance = -camera.position.z / direction.z; // 假设z轴向上
      
      if (distance > 0) {
        cartesian = Cesium.Cartesian3.add(
          camera.position,
          Cesium.Cartesian3.multiplyByScalar(direction, distance, new Cesium.Cartesian3()),
          new Cesium.Cartesian3()
        );
      }
    }
    
    return cartesian;
  } catch (error) {
    console.error('获取鼠标位置坐标时出错:', error);
    return null;
  }
};

// 复制建筑到鼠标指针位置
const copyBuildingToPointer = (sourceBuilding) => {
  if (!sourceBuilding) return;
  
  // 设置复制状态
  isCopyingBuilding.value = true;
  
  // 显示提示信息
  alert("请在地图上点击选择新的位置来放置复制的建筑");
  
  // 禁用属性查询窗口，避免干扰
  emit('disable-info-box');
  
  // 存储源建筑引用
  const sourceBuildingClone = JSON.parse(JSON.stringify({
    properties: sourceBuilding.properties,
    geometry: sourceBuilding.geometry
  }));
  
  // 设置一次性点击事件处理器
  const handler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  
  // 添加鼠标移动处理，用于预览
  handler.setInputAction((movement) => {
    const cartesian = getCartesianFromMousePosition(movement.endPosition);
    if (cartesian) {
      // 显示预览
      showCopyPreviewAt(cartesian, sourceBuildingClone);
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  
  // 添加点击处理器，用于确认位置
  handler.setInputAction((movement) => {
    const cartesian = getCartesianFromMousePosition(movement.position);
    if (cartesian) {
      // 完成复制
      completeCopyAt(cartesian, sourceBuildingClone);
      handler.destroy();
      
      // 恢复属性查询窗口功能
      emit('enable-info-box');
      
      // 重置复制状态
      isCopyingBuilding.value = false;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
  // 添加右键点击处理器，用于取消操作
  handler.setInputAction(() => {
    // 取消复制
    cleanupCopyPreview();
    isCopyingBuilding.value = false;
    handler.destroy();
    
    // 恢复属性查询窗口功能
    emit('enable-info-box');
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
};

// 显示复制预览
const showCopyPreviewAt = (cartesian, sourceBuildingClone) => {
  // 清除已有的预览
  cleanupCopyPreview();
  
  if (!cartesian || !sourceBuildingClone) return;
  
  // 获取鼠标点击位置的经纬度
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const longitude = Cesium.Math.toDegrees(cartographic.longitude);
  const latitude = Cesium.Math.toDegrees(cartographic.latitude);
  
  // 计算源建筑中心点
  const center = calculateCenter(sourceBuildingClone.geometry.vertices);
  
  // 计算偏移量
  const offsetLon = longitude - center.longitude;
  const offsetLat = latitude - center.latitude;
  
  // 创建预览建筑的顶点
  const previewVertices = sourceBuildingClone.geometry.vertices.map(vertex => ({
    longitude: vertex.longitude + offsetLon,
    latitude: vertex.latitude + offsetLat,
    cartesian: Cesium.Cartesian3.fromDegrees(
      vertex.longitude + offsetLon, 
      vertex.latitude + offsetLat, 
      0
    )
  }));
  
  // 创建多边形位置数组
  const positions = previewVertices.map(vertex => vertex.cartesian);
  
  // 构建多边形层次结构
  let hierarchy = new Cesium.PolygonHierarchy(positions);
  
  // 如果有孔洞，也需要添加
  if (sourceBuildingClone.geometry.holes && sourceBuildingClone.geometry.holes.length > 0) {
    hierarchy.holes = [];
    sourceBuildingClone.geometry.holes.forEach(hole => {
      if (hole && hole.length >= 3) {
        const holePositions = hole.map(vertex => 
          Cesium.Cartesian3.fromDegrees(
            vertex.longitude + offsetLon, 
            vertex.latitude + offsetLat, 
            0
          )
        );
        hierarchy.holes.push(new Cesium.PolygonHierarchy(holePositions));
      }
    });
  }
  
  // 创建半透明的预览材质
  const previewMaterial = Cesium.Color.fromCssColorString(sourceBuildingClone.properties.color)
    .withAlpha(0.5); // 使用半透明效果表示预览状态
  
  // 创建预览实体
  previewBuildingEntity.value = props.viewer.entities.add({
    name: `${sourceBuildingClone.properties.name} (预览)`,
    polygon: {
      hierarchy: hierarchy,
      extrudedHeight: sourceBuildingClone.properties.height,
      material: previewMaterial,
      outline: true,
      outlineColor: Cesium.Color.YELLOW,
      outlineWidth: 2
    }
  });
};

// 完成复制
const completeCopyAt = (cartesian, sourceBuildingClone) => {
  // 清除预览
  cleanupCopyPreview();
  
  if (!cartesian || !sourceBuildingClone || !currentGroup.value) return;
  
  // 获取鼠标点击位置的经纬度
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const longitude = Cesium.Math.toDegrees(cartographic.longitude);
  const latitude = Cesium.Math.toDegrees(cartographic.latitude);
  
  // 计算源建筑中心点
  const center = calculateCenter(sourceBuildingClone.geometry.vertices);
  
  // 计算偏移量
  const offsetLon = longitude - center.longitude;
  const offsetLat = latitude - center.latitude;
  
  // 创建新的建筑对象
  const newBuilding = {
    properties: JSON.parse(JSON.stringify(sourceBuildingClone.properties)),
    geometry: {
      vertices: sourceBuildingClone.geometry.vertices.map(vertex => ({
        longitude: vertex.longitude + offsetLon,
        latitude: vertex.latitude + offsetLat,
        cartesian: Cesium.Cartesian3.fromDegrees(
          vertex.longitude + offsetLon, 
          vertex.latitude + offsetLat, 
          0
        )
      })),
      holes: []
    },
    visible: true,
    entity: null
  };
  
  // 复制孔洞
  if (sourceBuildingClone.geometry.holes && sourceBuildingClone.geometry.holes.length > 0) {
    newBuilding.geometry.holes = sourceBuildingClone.geometry.holes.map(hole => {
      return hole.map(vertex => ({
        longitude: vertex.longitude + offsetLon,
        latitude: vertex.latitude + offsetLat,
        cartesian: Cesium.Cartesian3.fromDegrees(
          vertex.longitude + offsetLon, 
          vertex.latitude + offsetLat, 
          0
        )
      }));
    });
  }
  
  // 更新建筑名称，添加"(复制)"后缀
  if (!newBuilding.properties.name.includes('(复制)')) {
    newBuilding.properties.name += ' (复制)';
  }
  
  // 添加到当前建筑群
  currentGroup.value.buildings.push(newBuilding);
  
  // 创建建筑实体
  createBuildingEntity(newBuilding);
  
  // 保存当前数据
  saveBuildingData();
  
  console.log('建筑复制完成');
};
</script>

<style scoped>
/* 容器样式优化 */
.building-planning-container {
  position: absolute;
  bottom: 10px; /* 修改为底部定位，留10px空隙 */
  left: 230px; /* 增加与左边栏之间的空隙 */
  width: 360px;
  background-color: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 80px);
  z-index: 1000;
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal) ease;
  font-family: var(--font-sans);
  animation: slideIn var(--transition-normal) ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); } /* 修改动画方向从底部滑入 */
  to { opacity: 1; transform: translateY(0); }
}

/* 添加处理中遮罩层样式 */
.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  border-radius: var(--border-radius-lg);
  animation: fadeIn 0.2s ease;
  backdrop-filter: blur(4px);
}

.processing-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: var(--space-2);
}

.processing-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 头部样式优化 */
.building-planning-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border-top-left-radius: var(--border-radius-lg);
  border-top-right-radius: var(--border-radius-lg);
}

.building-planning-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.building-planning-header h3::before {
  content: "🏢";
  margin-right: 8px;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color var(--transition-fast);
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

/* 标签页样式优化 */
.building-planning-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-primary);
}

.tab {
  flex: 1;
  text-align: center;
  padding: var(--space-2) var(--space-1);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  position: relative;
}

.tab:hover {
  background-color: var(--bg-secondary);
  color: var(--primary-color);
}

.tab.active {
  color: var(--primary-color);
  font-weight: 500;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
  border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
}

/* 内容区域优化 */
.building-planning-content {
  padding: var(--space-3);
  overflow-y: auto;
  flex: 1;
  color: var(--text-primary);
}

/* 分层抽屉动画相关样式 */
.floor-explode-controls {
  margin: 8px 0;
  padding: 8px;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.floor-explode-controls .primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.floor-explode-controls .primary-btn.active {
  background-color: #ff7043;
}

.explode-slider-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
}

.explode-slider-container input[type="range"] {
  flex: 1;
  height: 6px;
  accent-color: var(--primary-color);
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* 按钮样式优化 */
.primary-btn, .accent-btn, .success-btn, .cancel-btn {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
}

.primary-btn.small, .accent-btn.small, .success-btn.small, .cancel-btn.small {
  padding: var(--space-1) var(--space-2);
  height: 24px;
  font-size: 12px;
}

.primary-btn {
  background-color: var(--primary-color);
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.primary-btn:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.accent-btn {
  background-color: var(--accent-color);
  color: white;
}

.accent-btn:hover {
  background-color: var(--accent-dark);
  transform: translateY(-1px);
}

.success-btn {
  background-color: var(--success-color);
  color: white;
}

.success-btn:hover {
  background-color: var(--success-dark);
  transform: translateY(-1px);
}

.cancel-btn {
  background-color: var(--danger-color);
  color: white;
}

.cancel-btn:hover {
  background-color: var(--danger-dark);
  transform: translateY(-1px);
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  color: var(--text-secondary);
}

.icon-btn:hover {
  background-color: var(--bg-secondary);
  color: var(--primary-color);
}

.icon-btn.delete:hover {
  background-color: var(--danger-light);
  color: var(--danger-color);
}

/* 建筑群列表项样式优化 */
.building-group-item, .building-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--space-2);
  cursor: pointer;
  transition: all var(--transition-fast);
  background-color: var(--bg-primary);
}

.building-group-item:hover, .building-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.building-group-item.active {
  background-color: rgba(59, 130, 246, 0.08);
  border-color: var(--primary-color);
}

.building-item.active {
  background-color: rgba(139, 92, 246, 0.08);
  border-color: var(--accent-color);
}

.building-item.selected {
  background-color: rgba(59, 130, 246, 0.15);
  border-color: var(--primary-color);
}

.building-item.active.selected {
  background-color: rgba(139, 92, 246, 0.15);
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.building-group-info, .building-info {
  flex: 1;
  min-width: 0;
}

.building-group-name, .building-name {
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.building-group-stats, .building-height {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.building-group-actions, .building-actions {
  display: flex;
  gap: 4px;
  margin-left: var(--space-2);
}

/* 表单元素样式优化 */
.form-group {
  margin-bottom: var(--space-2);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-1);
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 批量选择框样式 */
.batch-select {
  flex: 1;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  height: 32px;
}

.batch-select:hover {
  border-color: var(--neutral-400);
}

.batch-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.batch-input {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.batch-btn {
  padding: var(--space-1) var(--space-2);
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  height: 32px;
  white-space: nowrap;
}

.batch-btn:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
}

input[type="text"],
input[type="number"],
textarea,
select {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 13px;
  transition: all var(--transition-fast);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

input[type="text"]:hover,
input[type="number"]:hover,
textarea:hover,
select:hover {
  border-color: var(--neutral-400);
}

input[type="text"]:focus,
input[type="number"]:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.empty-message {
  padding: var(--space-4);
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  margin: var(--space-3) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.empty-message::before {
  content: "📋";
  font-size: 24px;
  margin-bottom: var(--space-1);
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .building-planning-container {
    width: calc(100% - 20px);
    left: 15px; /* 在小屏幕上也留出适当空隙 */
    max-width: 400px;
    bottom: 10px; /* 确保底部位置在响应式布局中也保持一致 */
  }
}

/* 左侧栏折叠时调整位置 */
:global(.left-sidebar.collapsed) ~ .building-planning-container {
  left: 50px; /* 左侧栏折叠时也增加间距 */
  transition: left var(--transition-normal) ease;
}

/* 编辑几何面板样式 */
.drawing-status {
  background-color: rgba(var(--primary-color-rgb, 59, 130, 246), 0.1);
  border-left: 3px solid var(--primary-color);
  padding: var(--space-2);
  margin-bottom: var(--space-3);
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
}

.status-icon {
  font-size: 24px;
  margin-right: var(--space-2);
}

.status-text-container {
  display: flex;
  flex-direction: column;
}

.status-text {
  font-weight: 500;
  color: var(--primary-color);
}

.hint-text {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.interaction-tips {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--space-2);
  margin-bottom: var(--space-3);
}

.tip-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-1);
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-icon {
  margin-right: var(--space-2);
  font-size: 16px;
}

.tip-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.delete-selected-btn {
  display: flex;
  align-items: center;
  background-color: var(--danger-light);
  color: var(--danger-color);
  border: none;
  border-radius: var(--border-radius-md);
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.delete-selected-btn:hover {
  background-color: var(--danger-color);
  color: white;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--space-1);
}

.section-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.vertex-count, .hole-count, .history-count {
  font-size: 12px;
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 12px;
}

.vertices-table {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  margin-bottom: var(--space-3);
}

.table-header {
  display: flex;
  background-color: var(--bg-secondary);
  font-weight: 500;
  font-size: 12px;
  color: var(--text-secondary);
}

.table-row {
  display: flex;
  border-top: 1px solid var(--border-color);
  transition: background-color var(--transition-fast);
}

.table-row:hover {
  background-color: rgba(var(--primary-color-rgb, 59, 130, 246), 0.05);
}

.selected-row {
  background-color: rgba(var(--primary-color-rgb, 59, 130, 246), 0.1);
}

.column {
  padding: var(--space-1);
  flex: 1;
}

.column.index {
  flex: 0 0 40px;
  text-align: center;
}

.column.actions {
  flex: 0 0 80px;
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.small-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.small-btn.delete-btn:hover {
  background-color: var(--danger-light);
  color: var(--danger-color);
}

.small-btn.select-btn:hover {
  background-color: rgba(var(--primary-color-rgb, 59, 130, 246), 0.1);
  color: var(--primary-color);
}

.small-btn.view-btn:hover {
  background-color: rgba(var(--primary-color-rgb, 59, 130, 246), 0.1);
  color: var(--primary-color);
}

.small-btn.republish-btn:hover {
  background-color: rgba(var(--accent-color-rgb, 245, 158, 11), 0.1);
  color: var(--accent-color);
}

.ground-height-setting {
  margin-bottom: var(--space-3);
}

.btn-icon {
  margin-right: 6px;
  font-size: 14px;
}

.buttons-group {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--space-1) var(--space-2);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  height: 32px;
}

.action-btn:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.holes-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.hole-item {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.hole-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  background-color: var(--bg-secondary);
}

.hole-title {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
}

.hole-icon {
  margin-right: var(--space-1);
}

.hole-actions {
  display: flex;
  gap: 4px;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
}

.empty-icon {
  font-size: 24px;
  margin-bottom: var(--space-2);
}

.sub-message {
  font-size: 12px;
  margin-top: var(--space-1);
  color: var(--text-secondary);
  opacity: 0.8;
}

/* 导出发布面板样式 */
.export-options {
  margin-bottom: var(--space-4);
}

.option-card {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  margin-bottom: var(--space-3);
  transition: all var(--transition-fast);
  background-color: var(--bg-primary);
}

.option-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-color: var(--primary-color);
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2);
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.option-title {
  display: flex;
  align-items: center;
}

.option-icon {
  font-size: 18px;
  margin-right: var(--space-1);
}

.option-header h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.badge {
  background-color: var(--primary-light);
  color: var(--primary-dark);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.advanced-badge {
  background-color: var(--accent-light);
  color: var(--accent-dark);
}

.option-description {
  padding: var(--space-2);
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.export-format-selector {
  padding: var(--space-2);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.export-format-selector label {
  margin-right: var(--space-2);
  font-size: 12px;
  color: var(--text-secondary);
}

.format-select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.option-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-2);
}

.publish-section {
  margin-top: var(--space-4);
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--space-3);
}

.login-icon {
  font-size: 32px;
  margin-bottom: var(--space-2);
}

.login-prompt p {
  margin: var(--space-2) 0;
  color: var(--text-secondary);
}

.publish-form {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--space-2);
  margin-bottom: var(--space-3);
}

.form-row {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.form-row .form-group {
  flex: 1;
}

.publish-progress {
  margin-bottom: var(--space-3);
}

.progress-bar-container {
  height: 8px;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
  margin-bottom: var(--space-1);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-dark));
  border-radius: var(--border-radius-full);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background-color: var(--bg-primary);
  transition: all var(--transition-fast);
}

.history-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.history-details {
  flex: 1;
  min-width: 0;
}

.history-name {
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: 2px;
}

.type-badge {
  background-color: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  color: var(--text-secondary);
}

.date {
  font-size: 11px;
  color: var(--text-secondary);
}

.history-actions {
  display: flex;
  gap: var(--space-1);
}

/* 响应式调整 */
@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
  }
  
  .option-buttons {
    flex-direction: column;
  }
  
  .buttons-group {
    flex-direction: column;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 编辑模式提示信息样式 */
.edit-mode-info-banner {
  background-color: rgba(0, 128, 0, 0.1);
  color: var(--success-color);
  padding: 8px 12px;
  border-radius: 4px;
  margin: 0 10px 10px 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  border-left: 3px solid var(--success-color);
}

.info-icon {
  margin-right: 8px;
  font-size: 16px;
}

.info-text {
  font-size: 13px;
}

/* 编辑模式滑动开关样式 */
.header-controls, .header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-mode-switch-container {
  display: flex;
  align-items: center;
  margin-right: var(--space-3);
}

.switch-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-right: var(--space-2);
}

.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

/* 楼层管理样式 */
.floor-management {
  margin-top: var(--space-4);
  border-top: 1px solid var(--border-color);
  padding-top: var(--space-3);
}

.floor-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--space-2);
  padding: var(--space-1);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.floor-nav-btn {
  padding: 4px 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: #333;
  font-weight: 500;
}

.floor-nav-btn:hover {
  border-color: var(--primary-color);
}

.floor-nav-btn.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.floor-edit-panel {
  background-color: var(--bg-secondary);
  padding: var(--space-3);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--space-3);
}

.floor-batch-options {
  margin-top: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
  border-left: 3px solid var(--accent-color);
}

.floors-list {
  margin-bottom: var(--space-3);
}

/* 楼层管理标签页样式 */
.floors-panel {
  display: flex;
  flex-direction: column;
}

.floors-management {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.floor-info-panel {
  background-color: var(--bg-secondary);
  padding: var(--space-2);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--space-1);
}

.floors-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.floor-edit-panel {
  background-color: var(--bg-secondary);
  padding: var(--space-2);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--space-2);
  border-left: 3px solid var(--primary-color);
}

.section-header.compact {
  margin-bottom: var(--space-1);
  padding: var(--space-1) 0;
}

.section-header.compact h4 {
  font-size: 14px;
}

.form-row.compact {
  gap: var(--space-1);
  margin-bottom: var(--space-1);
}

.form-group.compact {
  margin-bottom: var(--space-1);
}

.form-group.compact label {
  font-size: 12px;
  margin-bottom: 2px;
}

.form-group.compact input,
.form-group.compact select {
  height: 26px;
  font-size: 12px;
  padding: 2px 6px;
}

/* 表单描述样式 */
.form-description {
  background-color: #f8f8f8;
  border-left: 3px solid #4a90e2;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 3px;
}

.form-description p {
  margin: 0;
  font-size: 13px;
  color: #555;
  line-height: 1.4;
}

/* 材质预览容器 */
.texture-preview-container {
  margin-top: 8px;
  text-align: center;
}

.texture-preview {
  width: 100px;
  height: 60px;
  object-fit: cover;
  border: 2px solid #ddd;
  border-radius: 4px;
}

.texture-info {
  font-size: 12px;
  margin-top: 5px;
  color: #666;
  font-style: italic;
}
</style> 