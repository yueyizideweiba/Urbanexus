<template>
  <div v-if="isLoggedIn" class="geo-ai-container" :class="{ 'expanded': isExpanded, 'dark-theme': isDarkMode, 'collapsed': !leftSidebarVisible }">
    <div class="geo-ai-header" @click="toggleExpanded">
      <div class="header-content">
        <span class="ai-icon">🤖</span>
        <span class="title" v-if="isExpanded || leftSidebarVisible">GeoAI 助手</span>
      </div>
      <div class="header-actions">
        <button class="clear-btn" @click.stop="clearChat" title="清除对话" v-if="isExpanded">🗑️</button>
        <span class="expand-icon">{{ isExpanded ? '▼' : '▶' }}</span>
      </div>
    </div>
    
    <div v-if="isExpanded" class="geo-ai-content">
      <div class="chat-messages" ref="chatMessages">
        <div v-for="(message, index) in messages" :key="index" 
             :class="['message', message.role]">
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(message.content)"></div>
            <div v-if="message.role === 'assistant' && message.commands" class="command-suggestions">
              <div v-for="(cmd, cmdIndex) in message.commands" :key="cmdIndex" 
                   class="command-suggestion" @click="executeCommand(cmd)">
                {{ cmd.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="input-area">
        <textarea 
          v-model="userInput" 
          @keydown.enter.prevent="handleEnter"
          placeholder="输入您的问题或指令..."
          :disabled="isLoading"
        ></textarea>
        <button 
          class="send-btn" 
          @click="sendMessage" 
          :disabled="isLoading || !userInput.trim()"
        >
          {{ isLoading ? '处理中...' : '发送' }}
        </button>
      </div>
    </div>
  </div>
  <div v-else class="geo-ai-login-prompt">
    <div class="login-prompt-content">
      <span class="lock-icon">🔒</span>
      <span class="prompt-text">请登录后使用 GeoAI 助手</span>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';
import { nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  },
  isDarkMode: {
    type: Boolean,
    default: false
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  leftSidebarVisible: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([
  'execute-command',
  'show-tools',
  'measure-distance',
  'measure-area',
  'analysis',
  'buffer-analysis',
  'geojson-styler',
  'extruder',
  'visual-effect',
  'camera-set-view',
  'camera-set-fov',
  'camera-reset',
  'imagery-switch',
  'terrain-switch',
  'data-loader-trigger',
  'data-loader-load-http-tiles',
  'layer-manager-open',
  'fly-to-location',
  'skybox-change'
]);

// 状态变量
const isExpanded = ref(false);
const messages = ref([]);
const userInput = ref('');
const isLoading = ref(false);
const chatMessages = ref(null);

// DeepSeek API配置
const API_KEY = 'sk-aa352781ce9147baaf0aa77d93bd729f';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 系统提示词
const SYSTEM_PROMPT = `你是一个专业的GIS助手，可以帮助用户操作3D地图系统。
你可以执行以下操作：
1. 几何工具：基本要素、测距离、测面积
2. 场景分析：路径规划、通视分析、可视域分析、缓冲区分析、分色、模型拉伸
3. 视觉效果：下雨效果、下雪效果、雾天效果、夜视效果、清除特效
4. 数据加载：加载glTF、加载3D Tiles、加载GeoJSON、加载SHP、加载HTTP Tiles
5. 相机控制：默认视角、侧视角、俯视视角、斜视视角、常规视域、广角视域、复位相机
6. 地形影像：Cesium默认、OpenStreetMap、ArcGIS、Cesium全球地形、无地形
7. 地形分析：坡度分析、坡向分析、等高线分析、地形显示
8. 人物漫游：开始人物漫游、在指定位置漫游
9. 城市加载：加载城市(如武汉、北京、上海等)

请根据用户的自然语言描述，理解其意图并执行相应的操作。
如果用户的要求超出系统能力范围，请礼貌地说明系统限制。
请用中文回复用户。

特别说明：
1. 当用户要求规划路线时，例如"帮我规划从A到B的路线"，请提取出起点A和终点B，并使用"规划路线:A到B"这样的命令格式。
2. 当用户要求坡度分析、坡向分析或等高线分析，你可以直接执行相应命令。
3. 当用户要求等高线分析时，可以询问用户期望的等高距和线宽，或使用默认值(20米高度间隔，1.5像素宽度)。
4. 当用户提到在某地进行人物漫游时，例如"我想在武汉漫游"，请提取位置信息并启动人物漫游功能。
5. 当用户要求加载某个城市(如武汉、北京等)时，请直接执行加载城市命令。

注意：当用户要求执行某个功能时，请确保使用上述列表中的确切命令名称，以确保功能能够正确执行。`;

// 命令映射表
const commandMap = {
  // 视觉效果命令（互斥）
  '下雨效果': {
    handler: () => emit('visual-effect', 'rain'),
    category: 'visual',
    priority: 2
  },
  '下雪效果': {
    handler: () => emit('visual-effect', 'snow'),
    category: 'visual',
    priority: 2
  },
  '雾天效果': {
    handler: () => emit('visual-effect', 'fog'),
    category: 'visual',
    priority: 2
  },
  '夜视效果': {
    handler: () => emit('visual-effect', 'nightVision'),
    category: 'visual',
    priority: 2
  },
  '清除特效': {
    handler: () => emit('visual-effect', 'clear'),
    category: 'visual',
    priority: 1
  },

  // 相机控制命令（互斥）
  '默认视角': {
    handler: () => emit('camera-set-view', 'default'),
    category: 'camera',
    priority: 1
  },
  '侧视角': {
    handler: () => emit('camera-set-view', 'side'),
    category: 'camera',
    priority: 1
  },
  '俯视视角': {
    handler: () => emit('camera-set-view', 'top'),
    category: 'camera',
    priority: 1
  },
  '斜视视角': {
    handler: () => emit('camera-set-view', 'oblique'),
    category: 'camera',
    priority: 1
  },
  '常规视域': {
    handler: () => emit('camera-set-fov', 'normal'),
    category: 'camera',
    priority: 1
  },
  '广角视域': {
    handler: () => emit('camera-set-fov', 'wide'),
    category: 'camera',
    priority: 1
  },
  '复位相机': {
    handler: () => emit('camera-reset'),
    category: 'camera',
    priority: 2
  },

  // 地形影像命令（互斥）
  'Cesium默认': {
    handler: () => emit('imagery-switch', 'cesiumDefault'),
    category: 'imagery',
    priority: 1
  },
  'OpenStreetMap': {
    handler: () => emit('imagery-switch', 'openStreetMap'),
    category: 'imagery',
    priority: 1
  },
  'ArcGIS': {
    handler: () => emit('imagery-switch', 'arcgis'),
    category: 'imagery',
    priority: 1
  },
  'Cesium全球地形': {
    handler: () => emit('terrain-switch', 'worldTerrain'),
    category: 'terrain',
    priority: 1
  },
  '无地形': {
    handler: () => emit('terrain-switch', 'none'),
    category: 'terrain',
    priority: 1
  },

  // 几何工具命令（独立）
  '基本要素': {
    handler: () => emit('show-tools'),
    category: 'geometry',
    priority: 1
  },
  '测距离': {
    handler: () => emit('measure-distance'),
    category: 'geometry',
    priority: 1
  },
  '测面积': {
    handler: () => emit('measure-area'),
    category: 'geometry',
    priority: 1
  },

  // 分析工具命令（独立）
  '路径规划': {
    handler: () => emit('analysis', 'pathPlanning'),
    category: 'analysis',
    priority: 1
  },
  '规划路线': {
    handler: (params) => planRoute(params),
    category: 'analysis',
    priority: 1,
    requiresParams: true
  },
  '通视分析': {
    handler: () => emit('analysis', 'viewshed'),
    category: 'analysis',
    priority: 1
  },
  '可视域分析': {
    handler: () => emit('analysis', 'visualDomain'),
    category: 'analysis',
    priority: 1
  },
  '缓冲区分析': {
    handler: () => emit('buffer-analysis'),
    category: 'analysis',
    priority: 1
  },
  '分色': {
    handler: () => emit('geojson-styler'),
    category: 'analysis',
    priority: 1
  },
  '模型拉伸': {
    handler: () => emit('extruder'),
    category: 'analysis',
    priority: 1
  },

  // 数据加载命令（独立）
  '加载glTF': {
    handler: () => emit('data-loader-trigger', 'gltf'),
    category: 'data',
    priority: 1
  },
  '加载3D Tiles': {
    handler: () => emit('data-loader-trigger', '3dtiles'),
    category: 'data',
    priority: 1
  },
  '加载GeoJSON': {
    handler: () => emit('data-loader-trigger', 'geojson'),
    category: 'data',
    priority: 1
  },
  '加载SHP': {
    handler: () => emit('data-loader-trigger', 'shp'),
    category: 'data',
    priority: 1
  },
  '加载HTTP Tiles': {
    handler: () => emit('data-loader-load-http-tiles'),
    category: 'data',
    priority: 1
  },
  
  // 地形分析命令（新增）
  '坡度分析': {
    handler: () => emit('analysis', 'slope'),
    category: 'terrain-analysis',
    priority: 1
  },
  '坡向分析': {
    handler: () => emit('analysis', 'aspect'),
    category: 'terrain-analysis',
    priority: 1
  },
  '等高线分析': {
    handler: (params) => {
      if (params) {
        // 如果有参数，通过命令执行带参数的等高线分析
        emit('execute-command', {
          type: 'contourAnalysis',
          params: params
        });
      } else {
        // 没有参数使用默认值
        emit('analysis', 'contour');
      }
    },
    category: 'terrain-analysis',
    priority: 1,
    requiresParams: true
  },
  '地形显示': {
    handler: () => emit('analysis', 'terrainDisplay'),
    category: 'terrain-analysis',
    priority: 1
  },
  
  // 人物漫游命令（新增）
  '开始人物漫游': {
    handler: () => emit('execute-command', { type: 'startCharacterExplorer' }),
    category: 'character',
    priority: 1
  },
  '在指定位置漫游': {
    handler: (params) => {
      if (params) {
        emit('execute-command', {
          type: 'characterExplorerAt',
          params: { location: params }
        });
      } else {
        // 没有指定位置就用默认的
        emit('execute-command', { type: 'startCharacterExplorer' });
      }
    },
    category: 'character',
    priority: 1,
    requiresParams: true
  },
  
  // 城市加载命令（新增）
  '加载城市': {
    handler: (params) => {
      if (params) {
        emit('execute-command', {
          type: 'loadCity',
          params: { city: params }
        });
      } else {
        // 没有指定城市，打开城市选择器
        emit('execute-command', { type: 'openCitySelector' });
      }
    },
    category: 'city',
    priority: 1,
    requiresParams: true
  }
};

// 命令分类的互斥关系
const exclusiveCategories = {
  'visual': true,    // 视觉效果互斥
  'camera': true,    // 相机控制互斥
  'imagery': true,   // 影像切换互斥
  'terrain': true    // 地形切换互斥
};

// 添加错误处理函数
function handleApiError(error) {
  console.error('API错误:', error);
  let errorMessage = '抱歉，我遇到了一些问题。';
  
  if (error.response) {
    switch (error.response.status) {
      case 401:
        errorMessage = 'API密钥无效，请检查配置。';
        break;
      case 402:
        errorMessage = 'API调用额度已用完，请联系管理员。';
        break;
      case 429:
        errorMessage = '请求过于频繁，请稍后再试。';
        break;
      default:
        errorMessage = `服务器返回错误 (${error.response.status})，请稍后重试。`;
    }
  } else if (error.request) {
    errorMessage = '无法连接到服务器，请检查网络连接。';
  }
  
  return errorMessage;
}

// 方法
function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}

function clearChat() {
  messages.value = [];
}

function parseCommands(text) {
  const commands = [];
  const categoryCommands = new Map(); // 用于存储每个分类中优先级最高的命令

  // 将文本分割成句子，以便更精确地匹配命令
  const sentences = text.split(/[.。!！?？]/).filter(s => s.trim());
  
  // 检查是否包含路径规划请求
  const routePlanningRegex = /规划.*?从(.+?)到(.+?)的路线/;
  for (const sentence of sentences) {
    const routeMatch = sentence.match(routePlanningRegex);
    if (routeMatch) {
      const start = routeMatch[1].trim();
      const end = routeMatch[2].trim();
      commands.push({
        command: '规划路线',
        description: `规划从${start}到${end}的路线`,
        params: `${start}到${end}`,
        category: 'analysis',
        priority: 2
      });
      continue;
    }
    
    // 检查是否有明确的"规划路线:A到B"格式的命令
    const explicitRouteCommand = /规划路线:(.+?)到(.+)/i;
    const explicitMatch = sentence.match(explicitRouteCommand);
    if (explicitMatch) {
      const start = explicitMatch[1].trim();
      const end = explicitMatch[2].trim();
      commands.push({
        command: '规划路线',
        description: `规划从${start}到${end}的路线`,
        params: `${start}到${end}`,
        category: 'analysis',
        priority: 2
      });
      continue;
    }
    
    // 新增：检查等高线命令及参数
    const contourRegex = /等高线.*?间隔.*?(\d+).*?宽度.*?(\d+(\.\d+)?)/i;
    const contourMatch = sentence.match(contourRegex);
    if (contourMatch) {
      const spacing = parseInt(contourMatch[1]);
      const width = parseFloat(contourMatch[2]);
      if (!isNaN(spacing) && !isNaN(width)) {
        commands.push({
          command: '等高线分析',
          description: `等高线分析（间隔${spacing}米，宽度${width}像素）`,
          params: { spacing, width },
          category: 'terrain-analysis',
          priority: 2
        });
        continue;
      }
    }
    
    // 新增：人物漫游在特定位置
    const characterAtRegex = /(在|于)(.+?)漫游/i;
    const characterAtMatch = sentence.match(characterAtRegex);
    if (characterAtMatch) {
      const location = characterAtMatch[2].trim();
      commands.push({
        command: '在指定位置漫游',
        description: `在${location}开始人物漫游`,
        params: location,
        category: 'character',
        priority: 2
      });
      continue;
    }
    
    // 新增：加载城市
    const loadCityRegex = /加载(.+?)(?:城市|模型)/i;
    const loadCityMatch = sentence.match(loadCityRegex);
    if (loadCityMatch) {
      const city = loadCityMatch[1].trim();
      commands.push({
        command: '加载城市',
        description: `加载${city}城市模型`,
        params: city,
        category: 'city',
        priority: 2
      });
      continue;
    }
  }

  // 遍历所有可能的命令
  for (const [key, config] of Object.entries(commandMap)) {
    // 如果命令需要参数但我们已经处理过带参数的情况，则跳过
    if (config.requiresParams && 
        (key === '规划路线' || key === '等高线分析' || key === '在指定位置漫游' || key === '加载城市')) {
      continue;
    }
    
    // 检查每个句子是否包含命令
    for (const sentence of sentences) {
      // 使用更灵活的匹配方式
      if (sentence.includes(key)) {
        const command = {
          command: key,
          description: key,
          category: config.category,
          priority: config.priority
        };

        // 如果是互斥分类，只保留优先级最高的命令
        if (exclusiveCategories[config.category]) {
          const existingCommand = categoryCommands.get(config.category);
          if (!existingCommand || command.priority > existingCommand.priority) {
            categoryCommands.set(config.category, command);
          }
        } else {
          // 非互斥分类的命令直接添加
          commands.push(command);
        }
        // 找到一个匹配就跳出当前句子的循环
        break;
      }
    }
  }

  // 将互斥分类中的命令添加到结果中
  categoryCommands.forEach(command => {
    commands.push(command);
  });

  return commands;
}

async function sendMessage() {
  if (!userInput.value.trim() || isLoading.value) return;
  
  // 调用handleUserMessage处理用户消息
  await handleUserMessage();
}

function executeCommand(command) {
  console.log('执行命令:', command.command, command.params);
  const config = commandMap[command.command];
  if (config && config.handler) {
    try {
      if (config.requiresParams && command.params) {
        config.handler(command.params);
      } else {
        config.handler();
      }
      console.log('命令执行成功');
    } catch (error) {
      console.error('命令执行失败:', error);
      messages.value.push({
        role: 'assistant',
        content: `抱歉，执行"${command.command}"命令失败，请稍后重试。`
      });
    }
  } else {
    console.warn('未找到命令处理器:', command.command);
    messages.value.push({
      role: 'assistant',
      content: '抱歉，我无法执行这个命令。'
    });
  }
}

function handleEnter(e) {
  if (e.shiftKey) {
    // Shift + Enter 换行
    return;
  }
  sendMessage();
}

function formatMessage(text) {
  // 将换行符转换为<br>
  return text.replace(/\n/g, '<br>');
}

function scrollToBottom() {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  });
}

// 监听消息变化，自动滚动到底部
watch(messages, () => {
  scrollToBottom();
});

// 组件挂载时添加欢迎消息
onMounted(() => {
  messages.value.push({
    role: 'assistant',
    content: '你好！我是GeoAI助手，我可以帮你操作3D地图系统。请告诉我你需要什么帮助？'
  });
});

// 添加路径规划函数
async function planRoute(params) {
  if (!params) return;
  
  // 分割起点和终点
  const [start, end] = params.split('到').map(p => p.trim());
  if (!start || !end) {
    messages.value.push({
      role: 'assistant',
      content: '无法识别起点或终点，请重新输入。'
    });
    return;
  }
  
  // 添加处理中提示
  const processingMsgIndex = messages.value.push({
    role: 'assistant',
    content: `正在规划从"${start}"到"${end}"的路线...`
  }) - 1;
  
  try {
    // 先触发路径规划功能
    emit('analysis', 'pathPlanning');
    
    // 等待一小段时间确保路径规划界面已加载
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 发送起点终点信息给父组件
    emit('execute-command', {
      type: 'planRoute',
      params: {
        start: start,
        end: end
      }
    });
    
    // 更新消息
    messages.value[processingMsgIndex].content = `已开始规划从"${start}"到"${end}"的路线。请在路径规划面板中查看结果。`;
  } catch (error) {
    console.error('路径规划失败:', error);
    messages.value[processingMsgIndex].content = '路径规划失败，请稍后重试。';
  }
}

// 处理用户消息并添加到聊天记录
async function handleUserMessage() {
  if (!userInput.value.trim()) return;
  
  // 添加用户消息到聊天记录
  const userMessage = userInput.value.trim();
  messages.value.push({
    role: 'user',
    content: userMessage
  });
  
  // 清空输入框
  userInput.value = '';
  
  // 检查是否是路径规划请求
  const routePlanningPattern = /帮我规划从(.+)到(.+)的路线|从(.+)到(.+)怎么走|(.+)到(.+)的路线/i;
  const routeMatch = userMessage.match(routePlanningPattern);
  
  if (routeMatch) {
    // 提取起点和终点
    const start = routeMatch[1] || routeMatch[3] || routeMatch[5];
    const end = routeMatch[2] || routeMatch[4] || routeMatch[6];
    
    if (start && end) {
      // 直接执行路径规划命令
      emit('execute-command', {
        type: 'planRoute',
        params: { start, end }
      });
      
      // 添加助手回复
      messages.value.push({
        role: 'assistant',
        content: `正在为您规划从${start}到${end}的路线...`
      });
      
      return;
    }
  }
  
  // 检查是否是等高线分析请求
  const contourPattern = /(?:生成|绘制|显示)等高线.*?(?:间隔|等高距)?.*?(\d+)?.*?(?:宽度|线宽)?.*?(\d+(\.\d+)?)?/i;
  const contourMatch = userMessage.match(contourPattern);
  
  if (contourMatch || /(?:等高线分析|等高线)/i.test(userMessage)) {
    // 获取参数（如果有的话）
    const spacing = contourMatch && contourMatch[1] ? parseInt(contourMatch[1]) : 20; // 默认值
    const width = contourMatch && contourMatch[2] ? parseFloat(contourMatch[2]) : 1.5; // 默认值
    
    // 直接执行等高线分析命令
    emit('execute-command', {
      type: 'contourAnalysis',
      params: { spacing, width }
    });
    
    // 添加助手回复
    messages.value.push({
      role: 'assistant',
      content: `正在生成等高距为${spacing}米，线宽为${width}像素的等高线...`
    });
    
    return;
  }
  
  // 检查是否是地形分析请求
  const terrainAnalysisPattern = /(坡度分析|坡向分析|地形显示)/i;
  const terrainMatch = userMessage.match(terrainAnalysisPattern);
  
  if (terrainMatch) {
    const analysisType = terrainMatch[1];
    let command;
    
    if (analysisType === '坡度分析') {
      command = 'slope';
    } else if (analysisType === '坡向分析') {
      command = 'aspect';
    } else if (analysisType === '地形显示') {
      command = 'terrainDisplay';
    }
    
    if (command) {
      // 直接执行地形分析命令
      emit('analysis', command);
      
      // 添加助手回复
      messages.value.push({
        role: 'assistant',
        content: `正在执行${analysisType}...`
      });
      
      return;
    }
  }
  
  // 检查是否是人物漫游请求
  const characterPattern = /(?:开始|启动|我想|请|in).*?(?:人物漫游|漫游)(?:在|于)?(.+)?/i;
  const characterMatch = userMessage.match(characterPattern);
  
  if (characterMatch) {
    const location = characterMatch[1] ? characterMatch[1].trim() : null;
    
    if (location) {
      // 在指定位置漫游
      emit('execute-command', {
        type: 'characterExplorerAt',
        params: { location }
      });
      
      // 添加助手回复
      messages.value.push({
        role: 'assistant',
        content: `正在${location}启动人物漫游...`
      });
    } else {
      // 直接启动漫游
      emit('execute-command', { 
        type: 'startCharacterExplorer' 
      });
      
      // 添加助手回复
      messages.value.push({
        role: 'assistant',
        content: `正在启动人物漫游功能...`
      });
    }
    
    return;
  }
  
  // 检查是否是加载城市请求
  const cityPattern = /(?:加载|载入|显示)(.+?)(?:城市|city|模型)/i;
  const cityMatch = userMessage.match(cityPattern);
  
  if (cityMatch) {
    const city = cityMatch[1].trim();
    
    if (city) {
      // 加载指定城市
      emit('execute-command', {
        type: 'loadCity',
        params: { city }
      });
      
      // 添加助手回复
      messages.value.push({
        role: 'assistant',
        content: `正在加载${city}城市模型...`
      });
      
      return;
    }
  }
  
  // 处理特定的指令
  const response = await handleCommand(userMessage);
  
  // 添加助手回复到聊天记录
  messages.value.push({
    role: 'assistant',
    content: response
  });
}

// 处理AI请求
async function processWithAI(userMessage) {
  try {
    const response = await axios.post(API_URL, {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.value
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    const aiResponse = response.data.choices[0].message.content;
    
    // 解析AI响应中的命令
    const commands = parseCommands(aiResponse);
    
    return {
      reply: aiResponse,
      commands: commands
    };
  } catch (error) {
    const errorMessage = handleApiError(error);
    return {
      reply: errorMessage,
      commands: []
    };
  }
}

// 处理命令列表
function handleCommands(commands) {
  commands.forEach(cmd => {
    // 提取命令类型和参数
    const { type, params } = cmd;
    
    // 根据命令类型触发不同的事件
    switch (type) {
      case 'showTools':
        emit('show-tools');
        break;
      case 'measureDistance':
        emit('measure-distance');
        break;
      case 'measureArea':
        emit('measure-area');
        break;
      case 'analysis':
        if (params && params.type) {
          emit('analysis', params.type);
        }
        break;
      case 'bufferAnalysis':
        emit('buffer-analysis');
        break;
      case 'visualEffect':
        if (params && params.effectType) {
          emit('visual-effect', params.effectType);
        }
        break;
      case 'changeSkybox': // 添加天空盒切换命令处理
        if (params && params.skyboxType) {
          emit('skybox-change', params.skyboxType);
        }
        break;
      case 'cameraSetView':
        if (params && params.viewType) {
          emit('camera-set-view', params.viewType);
        }
        break;
      case 'cameraSetFov':
        if (params && params.fovType) {
          emit('camera-set-fov', params.fovType);
        }
        break;
      case 'cameraReset':
        emit('camera-reset');
        break;
      case 'terrainSwitch':
        if (params && params.terrainType) {
          emit('terrain-switch', params.terrainType);
        }
        break;
      case 'dataLoaderTrigger':
        if (params && params.fileType) {
          emit('data-loader-trigger', params.fileType);
        }
        break;
      case 'executeCommand':
        emit('execute-command', cmd);
        break;
      default:
        console.log('未处理的命令类型:', type);
    }
  });
}

// 处理特定的指令
function handleCommand(command) {
  const lowerCommand = command.toLowerCase();
  
  // 处理几何工具相关命令
  if (lowerCommand.includes('测量距离') || lowerCommand.includes('距离测量') || lowerCommand.includes('measure distance')) {
    emit('measure-distance');
    return `正在启动距离测量工具`;
  }
  
  if (lowerCommand.includes('测量面积') || lowerCommand.includes('面积测量') || lowerCommand.includes('measure area')) {
    emit('measure-area');
    return `正在启动面积测量工具`;
  }
  
  // 处理地形分析命令
  const contourMatch = lowerCommand.match(/等高线分析|生成等高线|显示等高线|contour analysis/i);
  if (contourMatch) {
    // 提取参数
    const spacingMatch = lowerCommand.match(/间距\s*(\d+)/);
    const widthMatch = lowerCommand.match(/宽度\s*(\d+(\.\d+)?)/);
    
    const params = {};
    if (spacingMatch && spacingMatch[1]) {
      params.spacing = parseFloat(spacingMatch[1]);
    }
    
    if (widthMatch && widthMatch[1]) {
      params.width = parseFloat(widthMatch[1]);
    }
    
    emit('execute-command', {
      type: 'contourAnalysis',
      params
    });
    
    return `正在生成等高线分析${params.spacing ? '，间距设置为' + params.spacing : ''}`;
  }
  
  // 处理天空盒切换命令
  if (lowerCommand.includes('默认天空') || lowerCommand.includes('切换默认天空') || lowerCommand.includes('default skybox')) {
    emit('skybox-change', 'default');
    return `已切换到默认天空盒`;
  }
  
  if (lowerCommand.includes('蓝天天空') || lowerCommand.includes('切换蓝天') || lowerCommand.includes('blue sky')) {
    emit('skybox-change', 'bluesky');
    return `已切换到蓝天天空盒`;
  }

  if (lowerCommand.includes('日落天空') || lowerCommand.includes('切换日落') || lowerCommand.includes('sunset')) {
    emit('skybox-change', 'sunset');
    return `已切换到日落天空盒`;
  }
  
  if (lowerCommand.match(/切换天空盒|改变天空盒|change skybox/i)) {
    // 提取天空盒类型
    let skyboxType = 'default';
    
    if (lowerCommand.includes('蓝天') || lowerCommand.includes('blue')) {
      skyboxType = 'bluesky';
    } else if (lowerCommand.includes('日落') || lowerCommand.includes('sunset')) {
      skyboxType = 'sunset';
    }
    
    emit('execute-command', {
      type: 'changeSkybox',
      params: { skyboxType }
    });
    
    return `正在切换到${skyboxType === 'bluesky' ? '蓝天' : skyboxType === 'sunset' ? '日落' : '默认'}天空盒`;
  }
  
  // ... existing code ...
}

// 添加特定指令处理的函数

async function handleMessageSubmit() {
  const userMessage = messageInput.value.trim();
  
  if (!userMessage) return;
  
  // 添加用户消息到聊天记录
  messages.value.push({
    role: 'user',
    content: userMessage
  });
  
  // 清空输入框
  messageInput.value = '';
  
  // 检查是否为特定指令
  const commandResponse = checkSpecificCommand(userMessage);
  if (commandResponse) {
    // 添加助手回复到聊天记录
    messages.value.push({
      role: 'assistant',
      content: commandResponse
    });
    return;
  }
  
  // 正常的AI助手处理流程
  isLoading.value = true;
  
  try {
    const response = await processWithAI(userMessage);
    
    // 添加助手回复到聊天记录
    messages.value.push({
      role: 'assistant',
      content: response.reply
    });
    
    // 处理命令
    if (response.commands && response.commands.length > 0) {
      handleCommands(response.commands);
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
    messages.value.push({
      role: 'assistant',
      content: '抱歉，处理您的请求时遇到了问题。请稍后再试。'
    });
  } finally {
    isLoading.value = false;
  }
}

// 检查特定命令
function checkSpecificCommand(command) {
  const lowerCommand = command.toLowerCase();
  
  // 处理天空盒切换命令
  if (lowerCommand.includes('默认天空盒') || lowerCommand.includes('切换默认天空盒') || lowerCommand.includes('default skybox')) {
    emit('skybox-change', 'default');
    return `已切换到默认天空盒`;
  }
  
  if (lowerCommand.includes('蓝天天空盒') || lowerCommand.includes('切换蓝天天空盒') || lowerCommand.includes('blue sky')) {
    emit('skybox-change', 'bluesky');
    return `已切换到蓝天天空盒`;
  }
  
  if (lowerCommand.includes('日落天空盒') || lowerCommand.includes('切换日落天空盒') || lowerCommand.includes('sunset')) {
    emit('skybox-change', 'sunset');
    return `已切换到日落天空盒`;
  }
  
  if (lowerCommand.match(/切换天空盒|改变天空盒|change skybox/i)) {
    // 提取天空盒类型
    let skyboxType = 'default';
    
    if (lowerCommand.includes('蓝天') || lowerCommand.includes('blue')) {
      skyboxType = 'bluesky';
    } else if (lowerCommand.includes('日落') || lowerCommand.includes('sunset')) {
      skyboxType = 'sunset';
    }
    
    emit('skybox-change', skyboxType);
    return `已切换到${skyboxType === 'bluesky' ? '蓝天' : skyboxType === 'sunset' ? '日落' : '默认'}天空盒`;
  }
  
  // 其他特定命令检查可以在这里添加
  
  // 没有匹配到特定命令，返回null继续正常处理
  return null;
}
</script>

<style scoped>
.geo-ai-container {
  position: fixed;
  left: 230px; /* 左侧边栏宽度 + 10px间距 */
  top: 70px; /* 导航栏高度 + 间距 */
  width: 350px;
  background: var(--bg-primary, white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transform-origin: top left;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color, #eee);
}

.geo-ai-container.collapsed {
  left: 40px; /* 左侧边栏收起宽度 + 10px间距 */
}

.geo-ai-container:not(.expanded).collapsed {
  width: auto;
}

.geo-ai-container:not(.expanded) {
  width: auto;
  min-width: 120px;
}

.geo-ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--primary-color, #4a90e2);
  color: var(--text-on-primary, white);
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  user-select: none;
}

.geo-ai-container:not(.expanded) .geo-ai-header {
  border-radius: 12px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-icon {
  font-size: 18px;
}

.title {
  font-weight: 600;
  font-size: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--text-on-primary, white);
  cursor: pointer;
  font-size: 16px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.clear-btn:hover {
  opacity: 1;
}

.expand-icon {
  font-size: 14px;
}

.geo-ai-content {
  height: 400px;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, white);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg-primary, white);
}

.message {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.5;
}

.message.user {
  align-self: flex-end;
  background: var(--primary-color, #4a90e2);
  color: var(--text-on-primary, white);
}

.message.assistant {
  align-self: flex-start;
  background: var(--bg-secondary, #f0f2f5);
  color: var(--text-primary, #333);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.command-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.command-suggestion {
  background: var(--primary-light, rgba(74, 144, 226, 0.1));
  color: var(--primary-color, #4a90e2);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.command-suggestion:hover {
  background: var(--primary-hover, rgba(74, 144, 226, 0.2));
}

.input-area {
  padding: 12px;
  border-top: 1px solid var(--border-color, #eee);
  display: flex;
  gap: 8px;
  background: var(--bg-primary, white);
}

textarea {
  flex: 1;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  background: var(--bg-secondary, #f8f9fa);
  color: var(--text-primary, #333);
}

textarea:focus {
  outline: none;
  border-color: var(--primary-color, #4a90e2);
}

.send-btn {
  background: var(--primary-color, #4a90e2);
  color: var(--text-on-primary, white);
  border: none;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-dark, #357abd);
}

.send-btn:disabled {
  background: var(--disabled-color, #ccc);
  cursor: not-allowed;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: var(--bg-secondary, transparent);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--scrollbar-color, #ccc);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-hover-color, #999);
}

/* 移除媒体查询，改用类名控制主题 */
.geo-ai-container {
  --bg-primary: #ffffff;
  --bg-secondary: #f0f2f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-on-primary: #ffffff;
  --border-color: #e0e0e0;
  --primary-color: #4a90e2;
  --primary-dark: #357abd;
  --primary-light: rgba(74, 144, 226, 0.1);
  --primary-hover: rgba(74, 144, 226, 0.2);
  --disabled-color: #cccccc;
  --scrollbar-color: #cccccc;
  --scrollbar-hover-color: #999999;
}

.geo-ai-container.dark-theme {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --text-on-primary: #ffffff;
  --border-color: #404040;
  --primary-color: #4a90e2;
  --primary-dark: #357abd;
  --primary-light: rgba(74, 144, 226, 0.2);
  --primary-hover: rgba(74, 144, 226, 0.3);
  --disabled-color: #666666;
  --scrollbar-color: #404040;
  --scrollbar-hover-color: #505050;
}

.geo-ai-login-prompt {
  position: fixed;
  left: 230px; /* 左侧边栏宽度 + 10px间距 */
  top: 70px;
  width: 350px;
  background: var(--bg-primary, white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color, #eee);
  transition: left 0.3s ease;
}

.geo-ai-login-prompt.collapsed {
  left: 40px; /* 左侧边栏收起宽度 + 10px间距 */
}

.login-prompt-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary, #666);
}

.lock-icon {
  font-size: 20px;
}

.prompt-text {
  font-size: 14px;
  font-weight: 500;
}

.geo-ai-login-prompt.dark-theme {
  background: var(--bg-primary, #1a1a1a);
  border-color: var(--border-color, #404040);
  color: var(--text-secondary, #a0a0a0);
}
</style> 