<template>
  <div class="character-explorer-container" v-if="isActive">
    <!-- 漫游控制面板 -->
    <div class="game-controls">
      <button @click="toggleActive" class="control-btn">
        {{ isActive ? '退出漫游' : '开始漫游' }}
      </button>
      <div class="view-controls">
        <button @click="changeView('firstPerson')" class="view-btn" :class="{ active: currentView === 'firstPerson' }">
          第一人称
        </button>
        <button @click="changeView('thirdPerson')" class="view-btn" :class="{ active: currentView === 'thirdPerson' }">
          第三人称
        </button>
        <button @click="changeView('topDown')" class="view-btn" :class="{ active: currentView === 'topDown' }">
          俯视图
        </button>
      </div>
      <!-- 新样式的飞行模式开关 -->
      <div class="flight-mode-toggle">
        <span class="toggle-label-text">飞行模式</span>
        <label class="switch">
          <input type="checkbox" v-model="isFlightModeActive" @change="toggleFlightMode">
          <span class="slider round"></span>
        </label>
      </div>
      <div class="controls-info">
        <p>WASD: 移动</p>
        <p v-if="isFlightModeActive">C: 上升</p>
        <p>空格: {{ isFlightModeActive ? '下降' : '跳跃' }}</p>
        <p>F: 开启/关闭飞行</p>
        <p>Shift: 加速</p>
        <p>鼠标: 视角</p>
        <p>滚轮: 缩放</p>
        <p>中键: 切换视角</p>
        <p>右键: 调整仰角</p>
        <p>ESC: 重置视角</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as Cesium from 'cesium';
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  }
});

// 状态变量
const isActive = ref(false);
const currentView = ref('thirdPerson');
const characterEntity = ref(null);
const isPositionPickingMode = ref(false); // 新增：位置选择模式
const positionPickHandler = ref(null); // 新增：位置选择事件处理器
const isFlightModeActive = ref(false); // 飞行模式状态
const isFKeyPressed = ref(false); // 新增：记录F键是否已经按下
const keyStates = ref({
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  flyUp: false, // 新增：上升按键状态 (C键)
  descend: false, // 下降按键状态 (空格键)
  sprint: false
});

// 角色参数
const characterParams = {
  walkSpeed: 10.0,
  sprintSpeed: 25.0,
  jumpHeight: 0.5,
  turnSpeed: 0.3, // 增加旋转速度，从0.05增加到0.3，使模型旋转更快速
  cameraHeight: 1.2, // 设置为人物高度
  thirdPersonDistance: 5.0, // 第三人称视角距离
  minCameraDistance: 2.0, // 最小相机距离
  maxCameraDistance: 5.0, // 最大相机距离
  cameraZoomSpeed: 2.0, // 相机缩放速度
  cameraPitch: -0.2, // 相机俯仰角（负值为俯视）
  minCameraPitch: -1.0, // 最大俯视角度（约-57度）
  maxCameraPitch: 0.5, // 最大仰视角度（约29度）
  cameraPitchSensitivity: 0.005, // 相机俯仰角灵敏度
  gravity: 9.8,
  flightSpeed: 20.0, // 飞行速度
  flightSprintSpeed: 40.0, // 飞行加速速度
  verticalFlightSpeed: 15.0, // 垂直飞行速度
  groundLevel: 0,
  modelUri: window.location.origin + '/amiya_arknights/scene.gltf', // 首选绝对路径
  modelFallbackUris: [
    '/amiya_arknights/scene.gltf', // 备选相对路径
    'https://sandcastle.cesium.com/SampleData/models/CesiumAir/Cesium_Air.glb' // 备选在线模型
  ],
  modelScale: 0.01, // 大幅减小模型缩放比例，适合1.55米高的人物
  modelMinimumPixelSize: 32, // 最小像素大小
  modelMaximumScale: 20, // 最大缩放
  modelRotation: Math.PI * 1.5 // 旋转270度（Math.PI*1.5）
};

// 动画状态
const animationState = ref('idle');
let characterPosition = null;
let characterOrientation = 0;
let isGrounded = true;
let verticalSpeed = 0;
let lastUpdateTime = null;

// 事件处理器
let keyboardHandler = null;
let mouseHandler = null;
let gameLoop = null;
let isGameLoopRunning = false;

// 初始化
onMounted(() => {
  // 初始化事件监听
  setupEventHandlers();
});

// 清理
onUnmounted(() => {
  // 关闭游戏并清理资源
  if (isActive.value) {
    toggleActive();
  } else {
    // 为了安全，仍然调用清理函数
    removeEventHandlers();
    stopGameLoop();
    removeCharacter();
  }
});

// 监听激活状态变化
watch(isActive, (newValue) => {
  try {
    if (newValue) {
      // 当游戏激活时，不再直接创建角色
      // 角色已经在位置选择后被创建
      if (!characterEntity.value) {
        console.warn('游戏激活但角色未创建，这不应该发生');
        isActive.value = false;
        return;
      }
    } else {
      // 游戏停止时，清理资源
      stopGameLoop();
      removeCharacter();
      // 不再调用resetCamera()，这样相机就会留在当前位置
      // 如果正在位置选择模式，也要清理
      if (isPositionPickingMode.value) {
        cleanupPositionPicking();
      }
    }
  } catch (error) {
    console.error('处理游戏状态变化失败:', error);
    // 出错时尝试清理资源
    stopGameLoop();
    removeCharacter();
    cleanupPositionPicking();
  }
});

// 切换飞行模式
function toggleFlightMode() {
  console.log(`飞行模式 ${isFlightModeActive.value ? '开启' : '关闭'}`);
  
  // 如果从飞行模式切换到普通模式，无条件应用重力
  if (!isFlightModeActive.value) {
    // 获取当前位置
    const currentPosition = characterEntity.value.position.getValue(Cesium.JulianDate.now());
    if (currentPosition) {
      const cartographic = Cesium.Cartographic.fromCartesian(currentPosition);
      const terrainHeight = getTerrainHeight(cartographic.longitude, cartographic.latitude);
      
      // 无论当前高度如何，设置为未接触地面状态，强制应用重力
      isGrounded = false;
      // 设置一个更大的初始下落速度，确保立即开始明显下落
      verticalSpeed = -2.0;
      
      // 更新动画状态
      animationState.value = 'jump';
      
      // 立即触发一次位置更新，不等待下一帧
      const now = Date.now();
      const deltaTime = 0.016; // 模拟16ms的帧时间
      lastUpdateTime = now - (deltaTime * 1000);
      
      // 强制执行一次位置更新
      updateCharacterPosition(deltaTime, true);
      
      console.log('已切换到普通模式，角色将立即受重力影响');
    }
  } else {
    console.log('已切换到飞行模式，角色将不受重力影响');
  }
}

// 切换游戏状态
function toggleActive() {
  if (!isActive.value) {
    // 如果当前未激活，先进入位置选择模式
    startPositionPicking();
  } else {
    // 如果已激活，直接关闭游戏
    isActive.value = false;
  }
}

// 开始位置选择模式
function startPositionPicking() {
  if (!props.viewer) return;
  
  isPositionPickingMode.value = true;
  
  // 向用户显示提示
  props.viewer.entities.add({
    id: 'positionPickHint',
    position: Cesium.Cartesian3.fromDegrees(0, 0, 0), // 初始不可见位置
    label: {
      text: '点击地图选择角色生成位置',
      font: '20px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(0, -30),
      backgroundColor: Cesium.Color.fromCssColorString('rgba(0,0,0,0.5)'),
      backgroundPadding: new Cesium.Cartesian2(10, 10),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scale: 1.0
    }
  });
  
  // 添加临时箭头标记跟随鼠标
  const tempEntity = props.viewer.entities.add({
    id: 'positionPickMarker',
    position: new Cesium.CallbackProperty((time) => {
      // 通过屏幕中心位置拾取地球表面点
      const center = new Cesium.Cartesian2(
        props.viewer.canvas.clientWidth / 2,
        props.viewer.canvas.clientHeight / 2
      );
      
      const ray = props.viewer.camera.getPickRay(center);
      const position = props.viewer.scene.globe.pick(ray, props.viewer.scene);
      
      if (position) {
        // 更新标签位置到鼠标处
        const hint = props.viewer.entities.getById('positionPickHint');
        if (hint) {
          hint.position = position;
        }
        return position;
      }
      return null;
    }, false),
    billboard: {
      image: createPositionMarkerCanvas(),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      scale: 0.8,
      disableDepthTestDistance: Number.POSITIVE_INFINITY
    }
  });
  
  // 设置点击事件处理
  if (positionPickHandler.value) {
    positionPickHandler.value.destroy();
  }
  
  positionPickHandler.value = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
  positionPickHandler.value.setInputAction((click) => {
    // 从点击位置获取坐标
    const ray = props.viewer.camera.getPickRay(click.position);
    const pickedPosition = props.viewer.scene.globe.pick(ray, props.viewer.scene);
    
    if (pickedPosition) {
      // 检查该位置是否有有效的地形高度
      const cartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
      const terrainHeight = getTerrainHeight(cartographic.longitude, cartographic.latitude);
      
      // 如果无法获取地形高度，显示提示
      if (terrainHeight === 0 && props.viewer.terrainProvider.constructor.name !== 'EllipsoidTerrainProvider') {
        // 在点击位置附近创建一个警告标签
        const warningEntity = props.viewer.entities.add({
          position: pickedPosition,
          label: {
            text: '该位置无法获取地形高度，请选择其他位置',
            font: '16px sans-serif',
            fillColor: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, 10),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
        
        // 3秒后移除警告
        setTimeout(() => {
          props.viewer.entities.remove(warningEntity);
        }, 3000);
        
        return; // 不创建角色，等待用户再次点击
      }

      // 清理临时实体和事件
      cleanupPositionPicking();
      
      // 创建角色在选定位置
      createCharacterAtPosition(pickedPosition);
      
      // 激活游戏
      isActive.value = true;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 清理位置选择模式的临时资源
function cleanupPositionPicking() {
  if (!props.viewer) return;
  
  isPositionPickingMode.value = false;
  
  // 移除提示标签和标记
  const hint = props.viewer.entities.getById('positionPickHint');
  const marker = props.viewer.entities.getById('positionPickMarker');
  
  if (hint) props.viewer.entities.remove(hint);
  if (marker) props.viewer.entities.remove(marker);
  
  // 移除事件处理器
  if (positionPickHandler.value) {
    positionPickHandler.value.destroy();
    positionPickHandler.value = null;
  }
}

// 从地形获取高度
function getTerrainHeight(longitude, latitude) {
  if (!props.viewer || !props.viewer.scene) return 0;
  
  try {
    // 创建笛卡尔3坐标
    const position = Cesium.Cartographic.fromRadians(longitude, latitude);
    
    // 通过地形查询采样获取实际高度（同步方式）
    const height = props.viewer.scene.globe.getHeight(position);
    
    // 如果地形高度存在，返回地形高度，否则返回0
    return height !== undefined && height !== null ? height : 0;
  } catch (error) {
    console.warn('获取地形高度失败:', error);
    return 0;
  }
}

// 修改createCharacterAtPosition函数的部分代码
function createCharacterAtPosition(position) {
  try {
    if (!props.viewer || !position) {
      console.error('无法在选定位置创建角色');
      return;
    }
    
    // 获取选定位置的经纬度高度
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const longitude = cartographic.longitude;
    const latitude = cartographic.latitude;
    
    // 使用相机朝向作为初始朝向
    const headingRadians = props.viewer.camera.heading;

    // 获取地形高度
    const terrainHeight = getTerrainHeight(longitude, latitude);
    
    // 创建角色实体的位置，使用地形高度加上偏移，避免埋入地面
    const initialHeight = terrainHeight + 1.0; // 在地形表面上方1米处创建角色
    const characterPos = Cesium.Cartesian3.fromRadians(longitude, latitude, initialHeight);
    
    // 初始朝向设置，包含模型自身需要的旋转修正
    characterOrientation = headingRadians;
    const modelHpr = new Cesium.HeadingPitchRoll(characterOrientation + characterParams.modelRotation, 0, 0);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(characterPos, modelHpr);
    
    // 创建基本箱体作为备用模型（如果指定模型无法加载时显示）
    const fallbackEntity = props.viewer.entities.add({
      name: '探索者（基本模型）',
      position: characterPos,
      box: {
        dimensions: new Cesium.Cartesian3(1.0, 1.0, 2.0),
        material: Cesium.Color.BLUE.withAlpha(0.8),
      },
      orientation: orientation
    });
    
    // 尝试创建带模型的实体
    console.log('尝试加载模型:', characterParams.modelUri);
    
    // 创建角色实体
    characterEntity.value = props.viewer.entities.add({
      name: '探索者',
      position: characterPos,
      model: {
        uri: characterParams.modelUri, // 使用配置的模型URI
        minimumPixelSize: characterParams.modelMinimumPixelSize,
        maximumScale: characterParams.modelMaximumScale,
        runAnimations: true,
        scale: characterParams.modelScale,
        shadows: Cesium.ShadowMode.ENABLED,
        heightReference: Cesium.HeightReference.NONE // 不使用地形高度约束，使用代码自行控制高度
      },
      orientation: orientation
    });
    
    // 如果模型加载成功，移除备用实体
    if (characterEntity.value && characterEntity.value.model) {
      // 移除备用实体
      props.viewer.entities.remove(fallbackEntity);
      
      // 根据当前视角模式设置模型是否显示
      characterEntity.value.model.show = (currentView.value !== 'firstPerson');
    } else {
      // 如果模型加载失败，使用备用实体
      characterEntity.value = fallbackEntity;
      console.warn('模型加载失败，使用备用模型');
    }
    
    // 保存初始参数 - 克隆位置对象以避免引用问题
    characterPosition = Cesium.Cartesian3.clone(characterPos);
    
    // 重置其他状态
    isGrounded = true;
    verticalSpeed = 0;
    animationState.value = 'idle';
    
    // 相机跟随角色
    updateCameraPosition();
    
    console.log('角色在选定位置创建成功');
    
    // 开始事件监听和游戏循环
    setupEventHandlers();
    startGameLoop();
  } catch (error) {
    console.error('在选定位置创建角色失败:', error);
    isActive.value = false;
  }
}

// 创建位置标记的canvas
function createPositionMarkerCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // 绘制箭头
  ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  
  // 箭头底部圆圈
  ctx.beginPath();
  ctx.arc(32, 48, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // 指向下方的箭头
  ctx.beginPath();
  ctx.moveTo(32, 0);  // 顶点
  ctx.lineTo(20, 30); // 左侧点
  ctx.lineTo(44, 30); // 右侧点
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  return canvas;
}

// 更改视角
function changeView(view) {
  currentView.value = view;
  updateCameraPosition();
  
  // 根据视角模式显示或隐藏模型
  if (characterEntity.value && characterEntity.value.model) {
    // 在第一人称模式下隐藏模型，其他模式下显示
    characterEntity.value.model.show = (view !== 'firstPerson');
  }
}

// 创建角色 - 保留此函数，但不再直接使用
// 现在用于从其他地方直接创建角色（如API调用）
function createCharacter() {
  console.warn('此函数已弃用，请使用startPositionPicking来让用户选择位置');
  startPositionPicking();
}

// 移除角色
function removeCharacter() {
  if (characterEntity.value) {
    props.viewer.entities.remove(characterEntity.value);
    characterEntity.value = null;
  }
}

// 重置相机
function resetCamera() {
  // 使用flyHome方法重置相机，避免直接修改相机属性
  props.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3162, 30.5810, 150000),
    orientation: {
      heading: 0.0,
      pitch: -Cesium.Math.PI_OVER_TWO,
      roll: 0.0
    },
    duration: 1.0
  });
}

// 设置事件处理器
function setupEventHandlers() {
  if (!props.viewer || !props.viewer.canvas) {
    console.error('Viewer或Canvas不可用，无法设置事件处理器');
    return;
  }
  
  // 键盘事件处理
  keyboardHandler = (event) => {
    const isKeyDown = event.type === 'keydown';
    
    // 只在游戏激活时处理按键
    if (!isActive.value) return;
    
    // 控制键位
    switch (event.code) {
      case 'KeyW':
        keyStates.value.forward = isKeyDown;
        event.preventDefault();
        break;
      case 'KeyS':
        keyStates.value.backward = isKeyDown;
        event.preventDefault();
        break;
      case 'KeyA':
        keyStates.value.left = isKeyDown;
        event.preventDefault();
        break;
      case 'KeyD':
        keyStates.value.right = isKeyDown;
        event.preventDefault();
        break;
      case 'KeyC': // C键用于飞行模式上升
        keyStates.value.flyUp = isKeyDown;
        event.preventDefault();
        break;
      case 'KeyF': // F键作为飞行模式的快捷键
        if (event.type === 'keydown') {
          if (!isFKeyPressed.value && characterEntity.value) {
            isFKeyPressed.value = true;
            isFlightModeActive.value = !isFlightModeActive.value;
            toggleFlightMode();
            console.log("F键按下，飞行模式切换为：", isFlightModeActive.value ? "开启" : "关闭");
          }
        } else if (event.type === 'keyup') {
          isFKeyPressed.value = false;
        }
        event.preventDefault();
        break;
      case 'Space': // 空格用于飞行模式下降或普通模式跳跃
        keyStates.value.jump = isKeyDown; // 保持这个状态命名不变，但逻辑会根据模式变化
        if (isKeyDown && isGrounded && !isFlightModeActive.value) {
          jump(); // 非飞行模式下跳跃
        }
        event.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keyStates.value.sprint = isKeyDown;
        event.preventDefault();
        break;
      case 'Escape':
        // ESC键按下时，重置视角到角色正后方
        if (isKeyDown) {
          resetViewToCharacterBehind();
        }
        event.preventDefault();
        break;
    }
  };
  
  // 添加键盘事件监听
  document.addEventListener('keydown', keyboardHandler);
  document.addEventListener('keyup', keyboardHandler);
  
  // 设置相机控制
  setupCameraControl();
}

// 设置相机控制
function setupCameraControl() {
  // 移除之前的处理器（如果有）
  if (mouseHandler) {
    mouseHandler.destroy();
    mouseHandler = null;
  }
  
  try {
    // 创建新的鼠标处理器
    mouseHandler = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);
    
    // 右键拖动状态
    let isRightDragging = false;
    let lastRightDragY = null;
    
    // 鼠标左键移动事件处理 - 控制水平旋转
    let lastScreenX = null;
    let mouseSensitivity = 0.004; // 增加鼠标灵敏度，使视角旋转更平滑
    
    // 防抖动计时器和标志
    let isUpdatingCamera = false;
    
    mouseHandler.setInputAction((movement) => {
      if (!isActive.value || !movement.endPosition) return;
      
      // 当前鼠标位置
      const currentX = movement.endPosition.x;
      const currentY = movement.endPosition.y;
      
      // 左键旋转处理 - 控制相机朝向而不是角色朝向
      if (lastScreenX !== null && !isRightDragging) {
        // 计算水平移动距离
        const deltaX = currentX - lastScreenX;
        
        // 仅在第一/第三人称模式下处理相机旋转
        if ((currentView.value === 'firstPerson' || currentView.value === 'thirdPerson') && deltaX !== 0) {
          // 获取当前相机朝向
          const currentHeading = props.viewer.camera.heading;
          
          // 计算新的相机朝向 - 修正方向：鼠标向右移动时，相机应向右旋转（正方向）
          const newHeading = currentHeading + deltaX * mouseSensitivity;
          
          // 直接设置相机朝向
          props.viewer.scene.camera.setView({
            orientation: {
              heading: newHeading,
              pitch: props.viewer.camera.pitch,
              roll: 0
            }
          });
        }
      }
      
      // 右键拖动处理 - 调整相机俯仰角
      if (isRightDragging && lastRightDragY !== null) {
        const deltaY = currentY - lastRightDragY;
        
        // 移动鼠标向下(deltaY > 0)降低相机(增加俯角)
        // 移动鼠标向上(deltaY < 0)抬高相机(减少俯角)
        const pitchDelta = deltaY * characterParams.cameraPitchSensitivity;
        characterParams.cameraPitch += pitchDelta;
        
        // 限制俯仰角范围
        characterParams.cameraPitch = Math.max(
          characterParams.minCameraPitch,
          Math.min(characterParams.maxCameraPitch, characterParams.cameraPitch)
        );
        
        // 仅更新相机俯仰角，不移动位置
        props.viewer.scene.camera.setView({
          orientation: {
            heading: props.viewer.camera.heading,
            pitch: characterParams.cameraPitch,
            roll: 0
          }
        });
      }
      
      // 更新鼠标位置
      lastScreenX = currentX;
      if (isRightDragging) {
        lastRightDragY = currentY;
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    // 右键按下事件 - 开始调整俯仰角
    mouseHandler.setInputAction((click) => {
      if (!isActive.value) return;
      
      isRightDragging = true;
      lastRightDragY = click.position.y;
      
      // 阻止浏览器右键菜单
      props.viewer.canvas.oncontextmenu = () => false;
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
    
    // 右键释放事件 - 结束调整俯仰角
    mouseHandler.setInputAction(() => {
      isRightDragging = false;
      lastRightDragY = null;
    }, Cesium.ScreenSpaceEventType.RIGHT_UP);
    
    // 添加鼠标滚轮事件 - 调整相机距离
    mouseHandler.setInputAction((movement) => {
      if (!isActive.value) return;
      
      // 只在第三人称模式下调整相机距离
      if (currentView.value === 'thirdPerson') {
        // 修正滚轮方向：
        // 滚轮向上滚动 (movement < 0) = 拉近相机（减小距离）
        // 滚轮向下滚动 (movement > 0) = 推远相机（增加距离）
        const zoomDirection = movement > 0 ? -1 : 1;
        
        // 调整相机距离
        const currentDistance = characterParams.thirdPersonDistance;
        const newDistance = currentDistance + (zoomDirection * characterParams.cameraZoomSpeed);
        
        // 限制在最小和最大距离之间
        characterParams.thirdPersonDistance = Math.max(
          characterParams.minCameraDistance,
          Math.min(characterParams.maxCameraDistance, newDistance)
        );
        
        // 直接更新相机位置，不触发完整的updateCameraPosition
        updateOnlyCameraDistance();
      }
    }, Cesium.ScreenSpaceEventType.WHEEL);
    
    // 添加鼠标中键点击事件 - 切换视角模式
    mouseHandler.setInputAction(() => {
      if (!isActive.value) return;
      
      try {
        // 在第一人称和第三人称之间切换
        if (currentView.value === 'firstPerson') {
          currentView.value = 'thirdPerson';
          // 切换到第三人称时显示模型
          if (characterEntity.value && characterEntity.value.model) {
            characterEntity.value.model.show = true;
          }
        } else if (currentView.value === 'thirdPerson') {
          currentView.value = 'firstPerson';
          // 切换到第一人称时隐藏模型
          if (characterEntity.value && characterEntity.value.model) {
            characterEntity.value.model.show = false;
          }
        }
        
        // 立即更新相机位置，不要引起位移
        if (characterEntity.value && characterPosition) {
          const currentPosition = characterEntity.value.position.getValue(Cesium.JulianDate.now());
          if (currentPosition) {
            const cartographic = Cesium.Cartographic.fromCartesian(currentPosition);
            const cameraHeading = props.viewer.camera.heading;
            
            if (currentView.value === 'firstPerson') {
              // 计算第一人称视角位置
              const cameraPosition = Cesium.Cartesian3.fromRadians(
                cartographic.longitude, 
                cartographic.latitude, 
                cartographic.height + characterParams.cameraHeight * 0.9
              );
              
              // 直接设置相机位置
              props.viewer.scene.camera.position = cameraPosition;
            } else if (currentView.value === 'thirdPerson') {
              // 计算第三人称视角相机位置
              const cameraPosition = Cesium.Cartesian3.fromRadians(
                cartographic.longitude - Math.sin(cameraHeading) * (characterParams.thirdPersonDistance / 111000 / Math.cos(cartographic.latitude)) * Cesium.Math.RADIANS_PER_DEGREE,
                cartographic.latitude - Math.cos(cameraHeading) * (characterParams.thirdPersonDistance / 111000) * Cesium.Math.RADIANS_PER_DEGREE,
                cartographic.height + characterParams.cameraHeight * 1.5
              );
              
              // 直接设置相机位置
              props.viewer.scene.camera.position = cameraPosition;
            }
          }
        }
      } catch (error) {
        console.error('切换视角失败:', error);
      }
    }, Cesium.ScreenSpaceEventType.MIDDLE_CLICK);
    
  } catch (error) {
    console.error('设置鼠标控制失败:', error);
  }
}

// 只更新相机距离，不移动人物
function updateOnlyCameraDistance() {
  if (!characterEntity.value || !characterPosition) return;
  
  try {
    const currentPosition = characterEntity.value.position.getValue(Cesium.JulianDate.now());
    if (currentPosition) {
      const cartographic = Cesium.Cartographic.fromCartesian(currentPosition);
      const cameraHeading = props.viewer.camera.heading;
      
      // 计算新的相机位置
      const cameraPosition = Cesium.Cartesian3.fromRadians(
        cartographic.longitude - Math.sin(cameraHeading) * (characterParams.thirdPersonDistance / 111000 / Math.cos(cartographic.latitude)) * Cesium.Math.RADIANS_PER_DEGREE,
        cartographic.latitude - Math.cos(cameraHeading) * (characterParams.thirdPersonDistance / 111000) * Cesium.Math.RADIANS_PER_DEGREE,
        cartographic.height + characterParams.cameraHeight * 1.5
      );
      
      // 只更新相机位置，保持当前朝向
      props.viewer.scene.camera.position = cameraPosition;
    }
  } catch (error) {
    console.error('调整相机距离失败:', error);
  }
}

// 移除事件处理器
function removeEventHandlers() {
  // 移除键盘事件监听
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
    document.removeEventListener('keyup', keyboardHandler);
    keyboardHandler = null;
  }
  
  // 移除鼠标处理器
  if (mouseHandler) {
    try {
      mouseHandler.destroy();
    } catch (e) {
      console.warn('清理鼠标处理器时出错:', e);
    }
    mouseHandler = null;
  }
  
  // 恢复默认右键菜单
  if (props.viewer && props.viewer.canvas) {
    props.viewer.canvas.oncontextmenu = null;
  }
}

// 启动游戏循环
function startGameLoop() {
  try {
    if (gameLoop) {
      // 如果已有游戏循环，先停止它
      stopGameLoop();
    }
    
    console.log('启动游戏循环');
    lastUpdateTime = Date.now();
    isGameLoopRunning = true;
    
    // 使用requestAnimationFrame代替setInterval
    function animationFrame() {
      if (!isGameLoopRunning) return;
      
      try {
        updateGame();
      } catch (error) {
        console.error('游戏循环更新错误:', error);
        // 出现错误时停止游戏循环
        stopGameLoop();
        return;
      }
      
      // 持续请求下一帧
      gameLoop = requestAnimationFrame(animationFrame);
    }
    
    // 开始循环
    gameLoop = requestAnimationFrame(animationFrame);
  } catch (error) {
    console.error('启动游戏循环失败:', error);
  }
}

// 停止游戏循环
function stopGameLoop() {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop);
    gameLoop = null;
  }
  isGameLoopRunning = false;
}

// 更新游戏状态
function updateGame() {
  if (!props.viewer || !characterEntity.value || !isActive.value) return;
  
  try {
    const now = Date.now();
    const deltaTime = Math.min((now - lastUpdateTime) / 1000, 0.1); // 转换为秒，限制最大步长
    lastUpdateTime = now;
    
    if (deltaTime <= 0) return; // 避免时间步长为0或负数
    
    // 使角色在非飞行模式下，即使不移动也会受到重力影响
    updateCharacterPosition(deltaTime, false);
    updateCameraPosition();
    updateAnimationState();
  } catch (error) {
    console.error('更新游戏状态失败:', error);
  }
}

// 更新角色位置
function updateCharacterPosition(deltaTime, forceGravity = false) {
  if (!characterEntity.value || !characterPosition) return;
  
  try {
    // 从当前位置获取经纬度和高度信息
    const cartographic = Cesium.Cartographic.fromCartesian(characterPosition);
    
    // 计算移动方向和速度
    let moveX = 0;
    let moveY = 0;
    
    // 基于用户输入计算移动 - 注意方向修正
    if (keyStates.value.forward) moveY += 1;  // 前进是正Y
    if (keyStates.value.backward) moveY -= 1; // 后退是负Y
    if (keyStates.value.left) moveX -= 1;     // 左移是负X
    if (keyStates.value.right) moveX += 1;    // 右移是正X
    
    // 检查是否有移动输入
    const hasMovementInput = (moveX !== 0 || moveY !== 0 || keyStates.value.flyUp || keyStates.value.jump);
    
    // 检查是否需要应用重力（即使没有移动）
    const shouldApplyGravity = (!isGrounded && !isFlightModeActive.value) || forceGravity;
    
    // 如果没有移动输入且已着地（非飞行模式），并且不需要强制应用重力，直接返回
    if (!hasMovementInput && !shouldApplyGravity) {
      return;
    }
    
    // 标准化移动向量
    const length = Math.sqrt(moveX * moveX + moveY * moveY);
    if (length > 0) {
      moveX /= length;
      moveY /= length;
    }
    
    // 计算移动速度 - 根据当前模式选择不同速度
    let speed;
    if (isFlightModeActive.value) {
      speed = keyStates.value.sprint ? characterParams.flightSprintSpeed : characterParams.flightSpeed;
    } else {
      speed = keyStates.value.sprint ? characterParams.sprintSpeed : characterParams.walkSpeed;
    }
    
    // 使用相机朝向作为移动方向的基准，而不是角色朝向
    // 获取当前相机朝向（如果未设置，则使用当前角色朝向作为初始值）
    const heading = props.viewer.camera.heading || characterOrientation || 0;
    
    // 计算新位置的经纬度
    let newLongitude = cartographic.longitude;
    let newLatitude = cartographic.latitude;
    
    // 提前计算旋转向量，用于后续方向判断
    let rotatedMoveX = 0;
    let rotatedMoveY = 0;
    
    // 计算旋转向量 - 即使不移动也需要计算，用于角色朝向
    if (moveX !== 0 || moveY !== 0) {
      // 修正方向：将局部坐标系移动向量转换到全局坐标系
      rotatedMoveX = moveX * Math.cos(heading) + moveY * Math.sin(heading);
      rotatedMoveY = -moveX * Math.sin(heading) + moveY * Math.cos(heading);
    }
    
    // 只有当有移动输入时才更新水平位置
    if (hasMovementInput && (moveX !== 0 || moveY !== 0)) {
      // 计算水平移动距离（米）
      const moveDistance = speed * deltaTime;
      
      // 在全局坐标系中的移动向量
      const localX = rotatedMoveX * moveDistance;
      const localY = rotatedMoveY * moveDistance;
      
      // 计算新位置（经纬度变化）- 使用更精确的计算避免位置抖动
      const metersPerDegree = 111000 * Math.cos(cartographic.latitude); // 在当前纬度下，1度经度对应的米数
      const longitudeChange = localX / metersPerDegree;
      const latitudeChange = localY / 111000; // 1度纬度约等于111公里
      
      // 使用高精度计算
      newLongitude = cartographic.longitude + (longitudeChange * Cesium.Math.RADIANS_PER_DEGREE);
      newLatitude = cartographic.latitude + (latitudeChange * Cesium.Math.RADIANS_PER_DEGREE);
    }
    
    // 处理垂直运动（跳跃、飞行和重力）
    let newHeight = cartographic.height;
    
    // 获取当前位置下的地形高度
    const terrainHeight = getTerrainHeight(newLongitude, newLatitude);
    
    // 飞行模式处理
    if (isFlightModeActive.value) {
      // 在飞行模式下，C键控制上升，空格键控制下降
      if (keyStates.value.flyUp) { // C键上升
        newHeight += characterParams.verticalFlightSpeed * deltaTime;
      }
      if (keyStates.value.jump) { // 空格下降
        newHeight -= characterParams.verticalFlightSpeed * deltaTime;
      }
      
      // 确保不会飞到地下
      if (newHeight < terrainHeight + 0.5) {
        newHeight = terrainHeight + 0.5;
        isGrounded = true;
      } else {
        isGrounded = false;
      }
    } 
    // 非飞行模式处理
    else {
      // 如果不在地面上，应用重力
      if (!isGrounded || forceGravity) {
        // 应用重力
        verticalSpeed -= characterParams.gravity * deltaTime;
        newHeight += verticalSpeed * deltaTime;
        
        // 检查是否撞到地形
        if (newHeight <= terrainHeight) {
          newHeight = terrainHeight; // 设置为地形高度
          isGrounded = true;
          verticalSpeed = 0;
        }
      } else {
        // 角色在地面上时，始终保持在地形表面
        // 如果地形高于当前高度，上升到地形高度
        if (terrainHeight > newHeight) {
          newHeight = terrainHeight;
        } 
        // 如果地形低于当前高度，检查是否是悬崖
        else if (terrainHeight < newHeight - 0.5) {
          // 当超过一定高度差时，应用重力
          isGrounded = false;
          verticalSpeed = 0; // 初始垂直速度为0
        } else {
          // 平缓的地形变化，直接设置高度
          newHeight = terrainHeight;
        }
      }
    }
    
    // 创建新位置，应用地形高度
    const newPosition = Cesium.Cartesian3.fromRadians(
      newLongitude,
      newLatitude,
      newHeight
    );
    
    // 更新实体位置
    characterEntity.value.position = newPosition;
    
    // 安全地保存当前位置引用
    characterPosition = Cesium.Cartesian3.clone(newPosition);
    
    // 如果有移动，则根据实际移动方向调整角色朝向
    if (moveX !== 0 || moveY !== 0) {
      // 计算移动方向的角度（弧度）
      // 这里使用 atan2 函数计算向量的方向角度
      let movementHeading = Math.atan2(rotatedMoveX, rotatedMoveY);
      
      // 确保角度在 0 到 2π 之间
      if (movementHeading < 0) {
        movementHeading += 2 * Math.PI;
      }
      
      // 平滑过渡当前朝向到目标朝向
      // 计算最短角度差
      let angleDiff = movementHeading - characterOrientation;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // 使用turnSpeed参数控制旋转速度，增加旋转响应速度
      let rotationAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), characterParams.turnSpeed * (1 + deltaTime * 10));
      
      // 如果角度差非常小，直接设置为目标朝向，避免微小抖动
      if (Math.abs(angleDiff) < 0.01) {
        characterOrientation = movementHeading;
      } else {
        characterOrientation = (characterOrientation + rotationAmount) % (2 * Math.PI);
        if (characterOrientation < 0) characterOrientation += 2 * Math.PI;
      }
      
      // 创建新的朝向四元数，包含模型旋转修正
      const modelHpr = new Cesium.HeadingPitchRoll(characterOrientation + characterParams.modelRotation, 0, 0);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(
        characterPosition,
        modelHpr
      );
      
      // 直接更新实体朝向
      characterEntity.value.orientation = orientation;
    }
  } catch (error) {
    console.error('更新角色位置失败:', error);
  }
}

// 更新角色朝向 - 只有在角色不移动时才会调用这个方法
function updateCharacterOrientation(heading) {
  if (!characterEntity.value || !characterPosition) return;
  
  try {
    // 应用基础朝向和模型需要的旋转修正
    const modelHpr = new Cesium.HeadingPitchRoll(heading + characterParams.modelRotation, 0, 0);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      characterPosition,
      modelHpr
    );
    
    // 更新实体朝向
    characterEntity.value.orientation = orientation;
  } catch (error) {
    console.error('更新角色朝向失败:', error);
  }
}

// 旋转角色
function rotateCharacter(deltaAngle) {
  if (!characterEntity.value) return;
  
  // 更新角色朝向角度
  characterOrientation = (characterOrientation + deltaAngle) % (2 * Math.PI);
  if (characterOrientation < 0) {
    characterOrientation += 2 * Math.PI;
  }
  
  try {
    // 创建新的朝向四元数，包含模型旋转修正
    const position = characterEntity.value.position.getValue(Cesium.JulianDate.now());
    const modelHpr = new Cesium.HeadingPitchRoll(characterOrientation + characterParams.modelRotation, 0, 0);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, modelHpr);
    
    // 更新实体朝向
    characterEntity.value.orientation = orientation;
    
    // 调试输出
    console.log(`角色旋转: ${(characterOrientation * 180 / Math.PI).toFixed(1)}度，模型朝向: ${((characterOrientation + characterParams.modelRotation) * 180 / Math.PI).toFixed(1)}度`);
  } catch (error) {
    console.error('旋转角色失败:', error);
  }
}

// 跳跃
function jump() {
  if (!characterEntity.value || !isGrounded) return;
  
  // 设置垂直速度
  verticalSpeed = Math.sqrt(2 * characterParams.gravity * characterParams.jumpHeight);
  isGrounded = false;
  
  // 更新动画状态
  animationState.value = 'jump';
}

// 更新相机位置
function updateCameraPosition(skipFlyTo = false) {
  if (!characterEntity.value || !characterPosition) return;
  
  try {
    // 从角色实体获取当前位置
    const currentPosition = characterEntity.value.position.getValue(Cesium.JulianDate.now());
    if (!currentPosition) {
      console.error('无法获取角色当前位置');
      return;
    }
    
    // 将位置转换为经纬度高度
    const cartographic = Cesium.Cartographic.fromCartesian(currentPosition);
    if (!cartographic) {
      console.error('无法将位置转换为经纬度');
      return;
    }
    
    // 使用相机当前朝向，而不是角色朝向
    const cameraHeading = props.viewer.camera.heading || characterOrientation || 0;
    
    // 根据视角模式设置相机
    switch (currentView.value) {
      case 'firstPerson': {
        // 计算第一人称视角位置
        const cameraPosition = Cesium.Cartesian3.fromRadians(
          cartographic.longitude, 
          cartographic.latitude, 
          cartographic.height + characterParams.cameraHeight * 0.9 // 将相机放在眼睛位置
        );
        
        // 直接设置相机位置和方向，避免使用setView（减少计算量）
        props.viewer.scene.camera.position = cameraPosition;
        props.viewer.scene.camera.setView({
          orientation: {
            heading: cameraHeading,
            pitch: characterParams.cameraPitch, 
            roll: 0
          }
        });
        break;
      }
      
      case 'thirdPerson': {
        // 计算相机位置 - 角色后方一定距离
        const cameraDistance = characterParams.thirdPersonDistance;
        
        // 计算第三人称视角相机位置
        const cameraPosition = Cesium.Cartesian3.fromRadians(
          // 角色后方的位置计算，使用相机朝向
          cartographic.longitude - Math.sin(cameraHeading) * (cameraDistance / 111000 / Math.cos(cartographic.latitude)) * Cesium.Math.RADIANS_PER_DEGREE,
          cartographic.latitude - Math.cos(cameraHeading) * (cameraDistance / 111000) * Cesium.Math.RADIANS_PER_DEGREE,
          cartographic.height + characterParams.cameraHeight * 1.5 // 调整相机高度与人物比例相符
        );
        
        // 直接设置相机位置，然后单独设置方向，避免一次性setView
        props.viewer.scene.camera.position = cameraPosition;
        props.viewer.scene.camera.setView({
          orientation: {
            heading: cameraHeading,
            pitch: characterParams.cameraPitch,
            roll: 0
          }
        });
        break;
      }
      
      case 'topDown': {
        // 俯视图 - 直接在角色上方
        const cameraPosition = Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          cartographic.height + 30 // 高度30米，原来是100米
        );
        
        // 直接设置相机位置和方向
        props.viewer.scene.camera.position = cameraPosition;
        props.viewer.scene.camera.setView({
          orientation: {
            heading: cameraHeading,
            pitch: -Cesium.Math.PI_OVER_TWO, // 垂直向下
            roll: 0
          }
        });
        break;
      }
    }
  } catch (error) {
    console.error('更新相机位置失败:', error);
  }
}

// 更新动画状态
function updateAnimationState() {
  let newState = 'idle';
  
  // 根据移动状态决定动画
  if (keyStates.value.forward || keyStates.value.backward || keyStates.value.left || keyStates.value.right) {
    newState = keyStates.value.sprint ? 'run' : 'walk';
  }
  
  // 修改动画状态逻辑，考虑飞行模式
  if (isFlightModeActive.value) {
    if (!isGrounded) {
      newState = 'fly'; // 添加飞行状态
    }
  } else if (!isGrounded) {
    newState = 'jump';
  }
  
  // 如果状态变化，更新动画
  if (newState !== animationState.value) {
    animationState.value = newState;
    
    // 播放对应状态的动画
    playModelAnimation(newState);
  }
}

// 播放模型动画
function playModelAnimation(state) {
  if (!characterEntity.value || !characterEntity.value.model) return;
  
  try {
    const model = characterEntity.value.model;
    
    // 首先获取模型所有可用的动画
    if (model.activeAnimations) {
      // 停止当前所有动画
      model.activeAnimations.removeAll();
      
      // 根据状态选择播放的动画
      let animationName = null;
      let speedMultiplier = 1.0;
      
      // 从GLTF模型中尝试获取动画名称
      if (model._resource && model._resource._model && model._resource._model.gltf) {
        const gltf = model._resource._model.gltf;
        
        if (gltf.animations && gltf.animations.length > 0) {
          console.log('模型包含以下动画:', gltf.animations.map(a => a.name || 'unnamed'));
          
          // 查找合适的动画名称
          if (state === 'run') {
            // 查找包含run或running的动画，或使用Mixamo的Layer0动画
            animationName = gltf.animations.find(a => 
              (a.name && (a.name.toLowerCase().includes('run') || 
                         a.name.toLowerCase().includes('sprint') ||
                         a.name.toLowerCase().includes('armature|mixamo.com|layer0')))
            );
            speedMultiplier = 1.5; // 跑步动画播放速度加快
          } else if (state === 'walk') {
            // 查找包含walk或walking的动画
            animationName = gltf.animations.find(a => 
              (a.name && a.name.toLowerCase().includes('walk'))
            );
            // 如果没有walk动画，尝试使用run动画但减慢速度
            if (!animationName) {
              animationName = gltf.animations.find(a => 
                (a.name && (a.name.toLowerCase().includes('run') || 
                           a.name.toLowerCase().includes('armature|mixamo.com|layer0')))
              );
              speedMultiplier = 0.5; // 减慢速度来模拟走路
            }
          } else if (state === 'jump') {
            // 查找包含jump或jumping的动画
            animationName = gltf.animations.find(a => 
              (a.name && (a.name.toLowerCase().includes('jump') || 
                         a.name.toLowerCase().includes('leap')))
            );
          } else if (state === 'idle') {
            // 查找包含idle、static或pose的动画
            animationName = gltf.animations.find(a => 
              (a.name && (a.name.toLowerCase().includes('idle') || 
                         a.name.toLowerCase().includes('static') || 
                         a.name.toLowerCase().includes('pose')))
            );
          } else if (state === 'fly') {
            // 飞行动画可以使用跳跃或特殊的飞行动画
            animationName = gltf.animations.find(a => 
              (a.name && (a.name.toLowerCase().includes('fly') || 
                         a.name.toLowerCase().includes('jump')))
            );
          }
          
          // 如果找不到合适的动画，默认使用第一个动画
          if (!animationName && gltf.animations.length > 0) {
            animationName = gltf.animations[0];
          }
          
          // 播放找到的动画
          if (animationName) {
            console.log(`播放${state}状态的动画:`, animationName.name || 'unnamed');
            
            // 播放动画
            model.activeAnimations.add({
              name: animationName.name,
              loop: Cesium.ModelAnimationLoop.REPEAT,
              speedup: speedMultiplier,
              reverse: false
            });
          } else {
            // 如果没有可用动画，尝试播放所有动画
            console.log('没有找到匹配的动画，尝试播放所有动画');
            model.activeAnimations.addAll({
              loop: Cesium.ModelAnimationLoop.REPEAT,
              speedup: state === 'run' ? 1.5 : 1.0,
              reverse: false
            });
          }
        } else {
          console.log('模型没有包含动画');
        }
      } else {
        console.log('无法访问模型的gltf数据，尝试播放所有动画');
        model.activeAnimations.addAll();
      }
    }
  } catch (error) {
    console.error('播放模型动画失败:', error);
  }
}

// 更改角色模型
function changeCharacterModel(modelUri, scale = 1.0, rotation = 0) {
  // 保存新的模型配置
  characterParams.modelUri = modelUri;
  characterParams.modelScale = scale;
  characterParams.modelRotation = rotation;
  
  // 如果角色已存在，更新模型
  if (characterEntity.value) {
    try {
      // 更新现有实体的模型
      characterEntity.value.model.uri = modelUri;
      characterEntity.value.model.scale = scale;
      
      // 获取当前位置和朝向，应用新的模型旋转角度
      const position = characterEntity.value.position.getValue(Cesium.JulianDate.now());
      const modelHpr = new Cesium.HeadingPitchRoll(characterOrientation + rotation, 0, 0);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, modelHpr);
      
      // 更新实体朝向
      characterEntity.value.orientation = orientation;
      
      console.log('角色模型已更新为:', modelUri, '缩放:', scale, '旋转:', (rotation * 180 / Math.PI).toFixed(1) + '度');
    } catch (error) {
      console.error('更新角色模型失败:', error);
    }
  } else {
    console.log('角色模型配置已保存，将在角色创建时使用');
  }
}

// 重置视角到角色正后方
function resetViewToCharacterBehind() {
  if (!characterEntity.value || !characterPosition) return;
  
  try {
    // 获取角色当前位置
    const currentPosition = characterEntity.value.position.getValue(Cesium.JulianDate.now());
    if (!currentPosition) return;
    
    // 将位置转换为经纬度高度
    const cartographic = Cesium.Cartographic.fromCartesian(currentPosition);
    
    // 确保使用第三人称视角
    if (currentView.value !== 'thirdPerson') {
      currentView.value = 'thirdPerson';
      
      // 切换到第三人称时显示模型
      if (characterEntity.value && characterEntity.value.model) {
        characterEntity.value.model.show = true;
      }
    }
    
    // 重置视角朝向为角色朝向
    // 确保相机在角色正后方
    const cameraDistance = characterParams.thirdPersonDistance;
    const cameraHeading = characterOrientation;
    
    // 计算正后方的相机位置
    const cameraPosition = Cesium.Cartesian3.fromRadians(
      cartographic.longitude - Math.sin(cameraHeading) * (cameraDistance / 111000 / Math.cos(cartographic.latitude)) * Cesium.Math.RADIANS_PER_DEGREE,
      cartographic.latitude - Math.cos(cameraHeading) * (cameraDistance / 111000) * Cesium.Math.RADIANS_PER_DEGREE,
      cartographic.height + characterParams.cameraHeight * 1.5
    );
    
    // 设置相机位置和朝向
    props.viewer.scene.camera.position = cameraPosition;
    props.viewer.scene.camera.setView({
      orientation: {
        heading: cameraHeading,
        pitch: characterParams.cameraPitch,
        roll: 0
      }
    });
    
    console.log('已重置视角到角色正后方');
  } catch (error) {
    console.error('重置视角失败:', error);
  }
}

defineExpose({
  isActive,
  isPositionPickingMode,
  isFlightModeActive,
  toggleActive,
  toggleFlightMode,
  changeView,
  changeCharacterModel
});
</script>

<style scoped>
.character-explorer-container {
  position: absolute;
  top: 60px; /* 调整到贴近顶部导航栏 */
  left: 230px; /* 调整到左边栏右侧 */
  z-index: 1000;
}

.game-controls {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 8px;
  padding: 10px;
  max-width: 180px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.control-btn, .view-btn {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  margin: 3px 0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-btn {
  width: 100%;
  font-weight: bold;
}

.control-btn:hover, .view-btn:hover {
  background-color: #2980b9;
}

.view-controls {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
}

.view-btn {
  flex: 1;
  margin: 0 2px;
  font-size: 0.8em;
  padding: 4px;
}

.view-btn.active {
  background-color: #27ae60;
}

/* 飞行模式开关样式 - 滑动式样式 */
.flight-mode-toggle {
  margin: 12px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px 10px;
}

.toggle-label-text {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8em;
  letter-spacing: 0.5px;
}

/* 滑动开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
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
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #27ae60;
}

input:focus + .slider {
  box-shadow: 0 0 1px #27ae60;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* 圆形滑块 */
.slider.round {
  border-radius: 20px;
}

.slider.round:before {
  border-radius: 50%;
}

.controls-info {
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  padding-top: 8px;
  font-size: 0.75em;
}

.controls-info p {
  margin: 3px 0;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .character-explorer-container {
    left: 10px; /* 在小屏幕上调整位置 */
    top: 70px;
  }
}
</style> 