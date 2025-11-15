<template>
  <div class="storage-manager">
    <div class="storage-header">
      <h3>数据发布</h3>
      <button @click="showUploadModal = true" class="upload-btn">
        <i class="icon">📤</i>上传文件
      </button>
    </div>
    
    <div class="storage-filters">
      <select v-model="filterType" class="filter-select">
        <option value="">所有类型</option>
        <option v-for="type in fileTypes" :key="type.value" :value="type.value">
          {{ type.label }}
        </option>
      </select>
      <select v-model="filterVisibility" class="filter-select">
        <option value="">所有可见性</option>
        <option value="true">公开</option>
        <option value="false">私有</option>
      </select>
    </div>
    
    <div class="storage-list">
      <div v-if="isLoading" class="loading-indicator">
        加载中...
      </div>
      <div v-else-if="files.length === 0" class="empty-message">
        暂无文件
      </div>
      <div v-else class="file-list">
        <div v-for="file in filteredFiles" :key="file.id" class="file-item">
          <div class="file-header">
            <div class="file-name">{{ file.name }}</div>
          </div>
          <div class="file-meta">
            <span class="file-type">{{ getFileTypeLabel(file.type) }}</span>
            <span class="file-size">{{ formatFileSize(file.file_size) }}</span>
            <span class="file-date">{{ formatDate(file.created_at) }}</span>
            <span class="file-visibility" :class="{ 'public': file.is_public, 'private': !file.is_public }">
              {{ file.is_public ? '公开' : '私有' }}
            </span>
            <span class="file-owner" v-if="file.username">
              上传者: {{ file.username }}
            </span>
          </div>
          <div class="file-actions">
            <button @click="loadToLayer(file)" class="action-btn load-btn" title="加载到图层">
              <i class="icon">🗺️</i>
            </button>
            <button @click="downloadFile(file)" class="action-btn download-btn" v-if="canDownloadFile(file)" title="下载数据">
              <i class="icon">⬇️</i>
            </button>
            <button @click="editFile(file)" class="action-btn edit-btn" v-if="canEditFile(file)" title="编辑">
              <i class="icon">✏️</i>
            </button>
            <button @click="deleteFile(file.id)" class="action-btn delete-btn" v-if="canDeleteFile(file)" title="删除">
              <i class="icon">🗑️</i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 上传文件模态框 -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="closeUploadModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>上传文件</h3>
          <button class="close-btn" @click="closeUploadModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="fileName">文件名称</label>
            <input type="text" id="fileName" v-model="uploadForm.name" placeholder="请输入文件名称" />
          </div>
          <div class="form-group">
            <label for="fileType">文件类型</label>
            <select id="fileType" v-model="uploadForm.type">
              <option value="model">3D模型</option>
              <option value="terrain">地形数据</option>
              <option value="imagery">影像数据</option>
              <option value="tileset">3D Tiles</option>
              <option value="vector">矢量数据</option>
              <option value="raster">栅格数据</option>
              <option value="geojson">GeoJSON</option>
              <option value="kml">KML</option>
              <option value="shp">Shapefile</option>
              <option value="gltf">glTF</option>
              <option value="czml">CZML</option>
            </select>
            <div v-if="uploadForm.type === 'shp'" class="form-help-text">
              <div class="warning-message">
                <strong>重要提示：</strong> Shapefile需要包含多个文件（.shp、.dbf、.shx等）才能正确加载。
                请将这些文件打包成<strong>ZIP压缩文件</strong>后上传，而不是仅上传单个.shp文件。
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="fileVisibility">可见性</label>
            <select id="fileVisibility" v-model="uploadForm.isPublic">
              <option :value="true">公开</option>
              <option :value="false">私有</option>
            </select>
          </div>
          <div class="form-group">
            <label for="fileInput">选择文件</label>
            <div 
              class="file-drop-zone" 
              @dragover.prevent="dragover = true" 
              @dragleave.prevent="dragover = false"
              @drop.prevent="handleFileDrop($event)"
              :class="{ 'drag-over': dragover }"
            >
              <input type="file" id="fileInput" @change="handleFileSelect" class="file-input" />
              <div class="file-drop-content">
                <i class="icon">📁</i>
                <p>拖拽文件至此处或 <span class="browse-link">点击选择文件</span></p>
                <p class="supported-formats">支持格式: GeoJSON, KML, Shapefile(ZIP压缩), 栅格数据(TIF, GeoTIFF), glTF, OBJ, 3D Tiles等</p>
                <p v-if="uploadForm.file" class="selected-file">
                  已选择: <strong>{{ uploadForm.file.name }}</strong> ({{ formatFileSize(uploadForm.file.size) }})
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeUploadModal">取消</button>
          <button class="upload-btn" @click="uploadFile" :disabled="!canUpload">
            上传
          </button>
        </div>
      </div>
    </div>
    
    <!-- 编辑文件模态框 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>编辑文件</h3>
          <button class="close-btn" @click="closeEditModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="editFileName">文件名称</label>
            <input type="text" id="editFileName" v-model="editForm.name" />
          </div>
          <div class="form-group">
            <label for="editFileVisibility">可见性</label>
            <select id="editFileVisibility" v-model="editForm.isPublic">
              <option :value="true">公开</option>
              <option :value="false">私有</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeEditModal">取消</button>
          <button class="save-btn" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, onMounted, ref } from 'vue';
import { layersAPI } from '../services/api';
import { authAPI } from '../services/auth';
import { storageAPI } from '../services/storage';

// 定义emit事件
const emit = defineEmits(['load-layer']);

const files = ref([]);
const isLoading = ref(false);
const showUploadModal = ref(false);
const showEditModal = ref(false);
const filterType = ref('');
const filterVisibility = ref('');
const selectedFile = ref(null);
const dragover = ref(false);

const uploadForm = ref({
  name: '',
  type: 'model',
  isPublic: false,
  file: null
});

const editForm = ref({
  name: '',
  isPublic: false
});

const canUpload = computed(() => {
  return uploadForm.value.name && uploadForm.value.file;
});

const filteredFiles = computed(() => {
  return files.value.filter(file => {
    const typeMatch = !filterType.value || file.type === filterType.value;
    const visibilityMatch = filterVisibility.value === '' || 
      file.is_public.toString() === filterVisibility.value;
    return typeMatch && visibilityMatch;
  });
});

const currentUser = ref(null);

const fileTypes = [
  { value: 'model', label: '3D模型' },
  { value: 'terrain', label: '地形数据' },
  { value: 'imagery', label: '影像数据' },
  { value: 'tileset', label: '3D Tiles' },
  { value: 'vector', label: '矢量数据' },
  { value: 'raster', label: '栅格数据' },
  { value: 'geojson', label: 'GeoJSON' },
  { value: 'kml', label: 'KML' },
  { value: 'shp', label: 'Shapefile' },
  { value: 'gltf', label: 'glTF' },
  { value: 'czml', label: 'CZML' }
];

onMounted(async () => {
  try {
    const user = await authAPI.getCurrentUser();
    currentUser.value = user;
    loadFiles();
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
});

async function loadFiles() {
  try {
    isLoading.value = true;
    const response = await storageAPI.getUserFiles();
    if (response.success) {
      files.value = response.data;
    }
  } catch (error) {
    console.error('加载文件列表失败:', error);
  } finally {
    isLoading.value = false;
  }
}

function handleFileDrop(event) {
  dragover.value = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    uploadForm.value.file = file;
    
    // 自动填充文件名（如果尚未填写）
    if (!uploadForm.value.name) {
      // 获取不带扩展名的文件名
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      uploadForm.value.name = fileName;
    }
    
    // 调用相同的自动识别逻辑
    detectFileType(file);
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    uploadForm.value.file = file;
    
    // 自动填充文件名（如果尚未填写）
    if (!uploadForm.value.name) {
      // 获取不带扩展名的文件名
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      uploadForm.value.name = fileName;
    }
    
    // 调用自动识别逻辑
    detectFileType(file);
  }
}

function detectFileType(file) {
  // 根据文件扩展名自动识别文件类型
  const extension = file.name.split('.').pop().toLowerCase();
  
  // 矢量数据类型
  if (['geojson', 'json', 'topojson'].includes(extension)) {
    uploadForm.value.type = 'geojson';
  } else if (['kml', 'kmz'].includes(extension)) {
    uploadForm.value.type = 'kml';
  } else if (['shp', 'dbf', 'shx', 'prj'].includes(extension)) {
    uploadForm.value.type = 'shp';
  } 
  // 栅格数据类型
  else if (['tif', 'tiff', 'geotiff', 'jpg', 'jpeg', 'png'].includes(extension)) {
    uploadForm.value.type = 'raster';
  } 
  // 3D模型数据类型
  else if (['gltf', 'glb'].includes(extension)) {
    uploadForm.value.type = 'gltf';
  } else if (['obj', 'mtl'].includes(extension)) {
    uploadForm.value.type = 'model';
  } else if (['3ds', 'dae', 'fbx'].includes(extension)) {
    uploadForm.value.type = 'model';
  } 
  // 地形数据类型
  else if (['terrain', 'heightmap'].includes(extension)) {
    uploadForm.value.type = 'terrain';
  } 
  // 影像数据类型
  else if (['mbtiles', 'pmtiles'].includes(extension)) {
    uploadForm.value.type = 'imagery';
  } 
  // CZML数据类型
  else if (extension === 'czml') {
    uploadForm.value.type = 'czml';
  } 
  // 3D Tiles
  else if (['json', 'b3dm', 'i3dm', 'pnts', 'cmpt'].includes(extension)) {
    uploadForm.value.type = 'tileset';
  }
}

async function uploadFile() {
  try {
    const formData = new FormData();
    formData.append('name', uploadForm.value.name);
    formData.append('type', uploadForm.value.type);
    formData.append('isPublic', uploadForm.value.isPublic);
    formData.append('file', uploadForm.value.file);
    
    const response = await storageAPI.uploadFile(formData);
    if (response.success) {
      files.value.unshift(response.data);
      closeUploadModal();
    }
  } catch (error) {
    console.error('上传文件失败:', error);
  }
}

function editFile(file) {
  selectedFile.value = file;
  editForm.value = {
    name: file.name,
    isPublic: file.is_public
  };
  showEditModal.value = true;
}

async function saveEdit() {
  try {
    const response = await storageAPI.updateFile(selectedFile.value.id, editForm.value);
    if (response.success) {
      const index = files.value.findIndex(f => f.id === selectedFile.value.id);
      if (index !== -1) {
        files.value[index] = response.data;
      }
      closeEditModal();
    }
  } catch (error) {
    console.error('更新文件失败:', error);
  }
}

async function deleteFile(fileId) {
  if (!confirm('确定要删除这个文件吗？')) {
    return;
  }
  
  try {
    const response = await storageAPI.deleteFile(fileId);
    if (response.success) {
      files.value = files.value.filter(f => f.id !== fileId);
    }
  } catch (error) {
    console.error('删除文件失败:', error);
  }
}

function closeUploadModal() {
  showUploadModal.value = false;
  uploadForm.value = {
    name: '',
    type: 'model',
    isPublic: false,
    file: null
  };
}

function closeEditModal() {
  showEditModal.value = false;
  selectedFile.value = null;
  editForm.value = {
    name: '',
    isPublic: false
  };
}

function getFileTypeLabel(type) {
  const typeMap = {
    'model': '3D模型',
    'terrain': '地形数据',
    'imagery': '影像数据',
    'tileset': '3D Tiles',
    'vector': '矢量数据',
    'raster': '栅格数据',
    'geojson': 'GeoJSON',
    'kml': 'KML',
    'shp': 'Shapefile',
    'gltf': 'glTF',
    'czml': 'CZML'
  };
  return typeMap[type] || type;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function canEditFile(file) {
  return currentUser.value && file.user_id === currentUser.value.id;
}

function canDeleteFile(file) {
  return currentUser.value && file.user_id === currentUser.value.id;
}

function canDownloadFile(file) {
  // 公开文件任何人都可下载，私有文件只有所有者可下载
  return file.is_public || (currentUser.value && file.user_id === currentUser.value.id);
}

async function downloadFile(file) {
  try {
    // 显示下载中提示
    console.log(`开始下载文件: ${file.name}`);
    
    // 获取文件信息，与loadToLayer使用相同的API
    const response = await storageAPI.getFileForLayer(file.id);
    if (!response.success) {
      throw new Error(response.error || '获取文件信息失败');
    }
    
    const fileData = response.data;
    const serverBaseUrl = 'http://localhost:3000'; // 根据实际情况调整
    const fileUrl = `${serverBaseUrl}${fileData.url}`;
    
    // 创建一个隐藏的a标签，然后模拟点击
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    console.log(`文件下载已开始: ${file.name}`);
  } catch (error) {
    console.error('下载文件失败:', error);
    alert(`下载失败: ${error.message}`);
  }
}

async function loadToLayer(file) {
  try {
    // 显示加载中提示
    const loadingId = Date.now();
    console.log(`开始加载文件到图层: ${file.name}`);
    
    // 获取文件详细信息
    const response = await storageAPI.getFileForLayer(file.id);
    if (!response.success) {
      throw new Error(response.error || '获取文件信息失败');
    }
    
    const fileData = response.data;
    const serverBaseUrl = 'http://localhost:3000'; // 根据实际情况调整
    const fileUrl = `${serverBaseUrl}${fileData.url}`;
    
    // 获取文件扩展名
    const extension = fileData.file_path.split('.').pop().toLowerCase();
    
    // 根据文件类型确定图层类型
    let layerType;
    let userTips = '';
    
    switch (file.type) {
      case 'geojson':
        layerType = 'geojson';
        break;
      case 'tileset':
      case '3dtiles':
        layerType = '3dtiles';
        break;
      case 'imagery':
        layerType = 'imagery';
        break;
      case 'terrain':
        layerType = 'terrain';
        break;
      case 'vector':
      case 'shp':
        // 检查Shapefile相关逻辑
        if (extension === 'shp') {
          // 显示明确的错误信息
          alert('Shapefile需要完整的文件集(.shp, .dbf, .shx等)才能正常加载。请将这些文件打包成ZIP文件后再尝试上传和加载。');
          throw new Error('Shapefile加载失败：需要ZIP格式的完整文件集');
        } else if (extension === 'zip') {
          layerType = 'vector';
          userTips = '已识别为Shapefile ZIP压缩包，将作为矢量数据加载';
        } else {
          layerType = 'vector';
        }
        break;
      default:
        // 根据文件扩展名判断
        if (extension === 'json') {
          // 对于JSON文件，检查内容来确定类型
          try {
            const fileResponse = await fetch(fileUrl);
            const jsonData = await fileResponse.json();
            
            // 检查是否是3D Tiles
            if (jsonData.asset && jsonData.geometricError && (jsonData.root || jsonData.children)) {
              layerType = '3dtiles';
              userTips = '识别为3D Tiles格式，将作为3D Tiles加载';
            } 
            // 检查是否是GeoJSON
            else if (jsonData.type && (jsonData.features || jsonData.geometry || jsonData.coordinates)) {
              layerType = 'geojson';
              userTips = '识别为GeoJSON格式，将作为矢量数据加载';
            } else {
              layerType = 'geojson'; // 默认尝试作为GeoJSON
              userTips = '无法确定JSON格式类型，将尝试作为GeoJSON加载';
            }
          } catch (error) {
            console.warn('检查JSON文件类型失败:', error);
            layerType = 'geojson'; // 默认尝试作为GeoJSON
          }
        }
        else if (extension === 'glb' || extension === 'gltf') layerType = 'model';
        else if (extension === 'zip' && (file.type === 'shp' || file.type === 'vector')) {
          layerType = 'vector';
          userTips = 'ZIP文件将被作为Shapefile处理，将作为矢量数据加载';
        }
        else if (extension === 'shp') {
          // 明确提示用户需要ZIP格式
          alert('Shapefile需要完整的文件集(.shp, .dbf, .shx等)才能正常加载。请将这些文件打包成ZIP文件后再尝试上传和加载。');
          throw new Error('Shapefile加载失败：需要ZIP格式的完整文件集');
        }
        else if (['jpg', 'jpeg', 'png', 'tif', 'tiff'].includes(extension)) layerType = 'imagery';
        else layerType = 'unknown';
        break;
    }
    
    if (layerType === 'unknown') {
      throw new Error(`不支持的文件类型: ${file.type} (${extension})`);
    }
    
    // 如果有用户提示，显示给用户
    if (userTips) {
      console.info(userTips);
      // 可以添加UI提示
    }
    
    // 创建图层数据
    const layerData = {
      name: file.name,
      type: layerType,
      url: fileUrl,
      properties: {
        source: 'storage',
        fileId: file.id,
        originalType: file.type
      }
    };
    
    // 通过API保存图层
    const createResponse = await layersAPI.create(layerData);
    
    if (createResponse.success) {
      // 通知父组件加载图层
      emit('load-layer', createResponse.data);
      console.log(`文件已成功加载到图层: ${file.name}`);
    } else {
      throw new Error(createResponse.error || '创建图层失败');
    }
  } catch (error) {
    console.error('加载文件到图层失败:', error);
    alert(`加载失败: ${error.message}`);
  }
}
</script>

<style scoped>
.storage-manager {
  padding: var(--space-3);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.storage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  flex-shrink: 0;
}

.upload-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.storage-filters {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  flex-shrink: 0;
}

.filter-select {
  padding: var(--space-2);
  border: 1px solid var(--neutral-300);
  border-radius: var(--border-radius-md);
  background-color: white;
  flex: 1;
  min-width: 0;
}

.storage-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.file-item {
  display: flex;
  flex-direction: column;
  padding: var(--space-2);
  background-color: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
}

.file-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-header {
  width: 100%;
  margin-bottom: var(--space-2);
}

.file-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.file-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: 0.875rem;
  color: var(--neutral-600);
  width: 100%;
  margin-bottom: var(--space-2);
}

.file-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  width: 100%;
  margin-top: auto;
  padding-top: var(--space-2);
  border-top: 1px solid var(--neutral-100);
}

.action-btn {
  border: none;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
}

.load-btn {
  background-color: var(--secondary-color);
  color: white;
}

.download-btn {
  background-color: var(--success-color, #28a745);
  color: white;
}

.edit-btn {
  background-color: var(--secondary-color);
  color: white;
}

.delete-btn {
  background-color: var(--danger-color);
  color: white;
}

.loading-indicator {
  text-align: center;
  padding: var(--space-4);
  color: var(--neutral-600);
}

.empty-message {
  text-align: center;
  padding: var(--space-4);
  color: var(--neutral-500);
  font-style: italic;
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
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3);
  border-bottom: 1px solid var(--neutral-200);
  flex-shrink: 0;
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
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--neutral-700);
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--neutral-300);
  border-radius: var(--border-radius-md);
  font-family: inherit;
  font-size: 0.9rem;
}

.modal-footer {
  padding: var(--space-3);
  border-top: 1px solid var(--neutral-200);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  flex-shrink: 0;
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

.file-visibility {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.file-visibility.public {
  background-color: #e6f4ea;
  color: #1e7e34;
}

.file-visibility.private {
  background-color: #fce8e6;
  color: #d32f2f;
}

.file-owner {
  font-size: 0.75rem;
  color: var(--neutral-600);
  background-color: var(--neutral-100);
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

/* 文件拖放区域样式 */
.file-drop-zone {
  width: 100%;
  border: 2px dashed var(--neutral-300);
  border-radius: var(--border-radius-md);
  padding: var(--space-4);
  text-align: center;
  transition: all var(--transition-fast);
  cursor: pointer;
  position: relative;
}

.file-drop-zone.drag-over {
  border-color: var(--primary-color);
  background-color: var(--primary-50);
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.file-drop-content .icon {
  font-size: 2rem;
  margin-bottom: var(--space-2);
}

.browse-link {
  color: var(--primary-color);
  text-decoration: underline;
  font-weight: 500;
}

.supported-formats {
  font-size: 0.75rem;
  color: var(--neutral-500);
  margin-top: var(--space-1);
}

.selected-file {
  margin-top: var(--space-2);
  background-color: var(--neutral-100);
  padding: var(--space-2);
  border-radius: var(--border-radius-sm);
  width: 100%;
}

.form-help-text {
  margin-top: 5px;
  font-size: 0.9em;
}

.warning-message {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 10px;
  border-radius: 4px;
  margin-top: 5px;
  font-size: 0.9em;
}

.file-type {
  background-color: var(--primary-light);
  color: var(--primary-dark);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.file-size, .file-date, .file-visibility, .file-owner {
  white-space: nowrap;
}
</style> 