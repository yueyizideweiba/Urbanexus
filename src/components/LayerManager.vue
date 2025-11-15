<template>
  <!-- 图层管理侧边栏 -->
  <div class="layer-manager-sidebar" :class="{ 'collapsed': !showLayerManagerModal }">
    <div class="sidebar-header">
      <h3>图层管理</h3>
      <button class="collapse-btn" @click="toggleLayerManager">
        {{ showLayerManagerModal ? '收起' : '展开' }}
      </button>
    </div>
    <div v-if="showLayerManagerModal" class="sidebar-content">
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
        </div>
      </div>
      
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
        </div>
      </div>
      
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
        </div>
      </div>
      
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
        </div>
      </div>
      
      <div class="layer-group">
        <div class="layer-group-header" @click="toggleLayerGroup('viewshed')">
          <span class="expand-icon">{{ layerGroupExpanded.viewshed ? '▼' : '▶' }}</span>
          <span>可视域图层</span>
        </div>
        <div class="layer-group-content" v-if="layerGroupExpanded.viewshed">
          <div v-for="(item, index) in viewshedLayersList" :key="'viewshed-' + index" class="layer-item">
            <input type="checkbox" :checked="item.show" @change="toggleViewshedLayerVisibility(item, $event)" />
            <span class="layer-name">{{ item.name }}</span>
            <button class="layer-delete-btn" @click="deleteViewshedLayer(index)">删除</button>
          </div>
        </div>
      </div>
      
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  },
  geojsonDataSources: {
    type: Array,
    default: () => []
  },
  modelEntities: {
    type: Array,
    default: () => []
  },
  tilesetLayers: {
    type: Array,
    default: () => []
  },
  viewshedLayers: {
    type: Array,
    default: () => []
  },
  navigationRoutes: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  'update:geojsonDataSources', 
  'update:modelEntities', 
  'update:tilesetLayers',
  'update:viewshedLayers',
  'update:navigationRoutes'
]);

// 图层管理器状态
const showLayerManagerModal = ref(false);
const imageryLayersVersion = ref(0);

// 图层组展开状态
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
  if (props.viewer && props.viewer.imageryLayers) {
    for (let i = 0; i < props.viewer.imageryLayers.length; i++) {
      const layer = props.viewer.imageryLayers.get(i);
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
  props.geojsonDataSources.map((ds, index) => ({
    name: ds.name || `GeoJSON 图层 ${index + 1}`,
    show: ds.show !== undefined ? ds.show : true,
    instance: ds
  }))
);

const modelEntitiesList = computed(() =>
  props.modelEntities.map((entity, index) => ({
    name: entity.name || `glTF 模型 ${index + 1}`,
    show: entity.show !== undefined ? entity.show : true,
    instance: entity
  }))
);

const tilesetLayersList = computed(() =>
  props.tilesetLayers.map((tileset, index) => ({
    name: tileset.name || `3D Tiles ${index + 1}`,
    show: tileset.show !== undefined ? tileset.show : true,
    instance: tileset
  }))
);

const viewshedLayersList = computed(() =>
  props.viewshedLayers.map((layer, index) => ({
    name: layer.sketch ? (layer.sketch.name || `可视域图层 ${index + 1}`) : `可视域图层 ${index + 1}`,
    show: layer._visible !== undefined ? layer._visible : true,
    instance: layer
  }))
);

const navigationRoutesList = computed(() =>
  props.navigationRoutes.map((route, index) => ({
    name: route.name || `导航路线 ${index + 1}`,
    show: route.show !== undefined ? route.show : true,
    instance: route
  }))
);

// 切换图层组展开状态
function toggleLayerGroup(groupName) {
  layerGroupExpanded[groupName] = !layerGroupExpanded[groupName];
}

// 打开或关闭图层管理器
function openLayerManager() {
  showLayerManagerModal.value = true;
}

function closeLayerManager() {
  showLayerManagerModal.value = false;
}

function toggleLayerManager() {
  showLayerManagerModal.value = !showLayerManagerModal.value;
}

// 图层可见性切换和删除功能
function toggleImageryLayerVisibility(item, event) {
  item.instance.show = event.target.checked;
  console.log(`${item.name} 显示状态：${item.instance.show}`);
}

function deleteImageryLayer(index) {
  const layer = props.viewer.imageryLayers.get(index);
  props.viewer.imageryLayers.remove(layer, true);
  imageryLayersVersion.value++; // 触发重新计算
  console.log(`删除影像图层：${layer.name || index}`);
}

function toggleVectorLayerVisibility(item, event) {
  item.instance.show = event.target.checked;
  console.log(`${item.name} 显示状态：${item.instance.show}`);
}

function deleteVectorLayer(index) {
  const dataSource = props.geojsonDataSources[index];
  dataSource.show = false;
  if (props.viewer.dataSources.contains(dataSource)) {
    props.viewer.dataSources.remove(dataSource, true);
  }
  if (dataSource.destroy) {
    dataSource.destroy();
  }
  
  const updatedSources = [...props.geojsonDataSources];
  updatedSources.splice(index, 1);
  emit('update:geojsonDataSources', updatedSources);
  
  console.log(`删除矢量图层：${dataSource.name || index}`);
}

function toggleModelEntityVisibility(item, event) {
  item.instance.show = event.target.checked;
  console.log(`${item.name} 显示状态：${item.instance.show}`);
}

function deleteModelEntity(index) {
  const entity = props.modelEntities[index];
  props.viewer.entities.remove(entity);
  
  const updatedEntities = [...props.modelEntities];
  updatedEntities.splice(index, 1);
  emit('update:modelEntities', updatedEntities);
  
  console.log(`删除 glTF 模型：${entity.name || index}`);
}

function toggleTilesetVisibility(item, event) {
  item.instance.show = event.target.checked;
  console.log(`${item.name} 显示状态：${item.instance.show}`);
}

function deleteTileset(index) {
  const tileset = props.tilesetLayers[index];
  props.viewer.scene.primitives.remove(tileset, true);
  
  const updatedTilesets = [...props.tilesetLayers];
  updatedTilesets.splice(index, 1);
  emit('update:tilesetLayers', updatedTilesets);
  
  console.log(`删除 3D Tiles 图层：${tileset.name || index}`);
}

function toggleViewshedLayerVisibility(item, event) {
  const visible = event.target.checked;
  if (item.instance.sketch) {
    item.instance.sketch.show = visible;
  }
  item.instance._visible = visible;
  console.log(`${item.name} 显示状态：${visible}`);
}

function deleteViewshedLayer(index) {
  const vs = props.viewshedLayers[index];
  vs.clear && vs.clear();
  
  const updatedLayers = [...props.viewshedLayers];
  updatedLayers.splice(index, 1);
  emit('update:viewshedLayers', updatedLayers);
  
  console.log(`删除可视域图层：${index}`);
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
  
  console.log(`${item.name} 显示状态：${visible}`);
}

function deleteNavigationLayer(index) {
  const route = props.navigationRoutes[index];
  
  if (route.polyline) {
    props.viewer.entities.remove(route.polyline);
  }
  
  if (route.startLabel) {
    props.viewer.entities.remove(route.startLabel);
  }
  
  if (route.endLabel) {
    props.viewer.entities.remove(route.endLabel);
  }
  
  const updatedRoutes = [...props.navigationRoutes];
  updatedRoutes.splice(index, 1);
  emit('update:navigationRoutes', updatedRoutes);
  
  console.log(`删除导航图层：${route.name || index}`);
}

// 刷新图层列表（用于组件外部调用）
function refreshLayerLists() {
  imageryLayersVersion.value++;
}

// 暴露方法给父组件
defineExpose({
  openLayerManager,
  closeLayerManager,
  toggleLayerManager,
  refreshLayerLists,
  showLayerManagerModal
});
</script>

<style scoped>
.layer-manager-sidebar {
  position: fixed;
  top: 60px;
  right: 0;
  bottom: 0;
  width: 300px;
  background-color: #ffffff;
  box-shadow: -2px 0 8px rgba(0,0,0,0.15);
  z-index: 10;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e0e0e0;
}

.layer-manager-sidebar.collapsed {
  transform: translateX(300px);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: #2e7d32;
}

.collapse-btn {
  background-color: #81c784;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 5px;
}

.layer-group {
  margin-bottom: 5px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.layer-group-header {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background-color: #f5f5f5;
  cursor: pointer;
  font-weight: bold;
  border-bottom: 1px solid transparent;
}

.layer-group-header:hover {
  background-color: #e8f5e9;
}

.expand-icon {
  margin-right: 8px;
  font-size: 12px;
}

.layer-group-content {
  padding: 5px 10px;
  background-color: #fafafa;
}

.layer-item {
  display: flex;
  align-items: center;
  padding: 6px 5px;
  border-bottom: 1px solid #f0f0f0;
}

.layer-item:last-child {
  border-bottom: none;
}

.layer-name {
  flex: 1;
  margin: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.layer-delete-btn {
  background-color: #e57373;
  color: white;
  border: none;
  padding: 3px 6px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.layer-delete-btn:hover {
  background-color: #ef5350;
}
</style> 