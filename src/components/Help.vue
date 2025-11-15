<template>
  <div class="help-modal">
    <div class="help-header">
      <h2>帮助中心</h2>
      <button class="close-btn" @click="$emit('close')">&times;</button>
    </div>
    <div class="help-content">
      <div class="help-sidebar">
        <div 
          v-for="(section, index) in sections" 
          :key="index" 
          class="sidebar-item" 
          :class="{ active: activeSection === section.id }"
          @click="activeSection = section.id"
        >
          <span class="item-icon">{{ section.icon }}</span>
          <span class="item-text">{{ section.title }}</span>
        </div>
      </div>
      
      <div class="help-body">
        <!-- 快速入门 -->
        <div v-if="activeSection === 'quickstart'" class="help-section">
          <h3>快速入门</h3>
          <div class="section-content">
            
            <div class="help-card">
              <h4>1. 基本操作</h4>
              <ul>
                <li><b>缩放视图</b>：使用鼠标滚轮或触控板进行放大和缩小</li>
                <li><b>旋转视图</b>：按住鼠标左键并拖动</li>
                <li><b>平移视图</b>：按住鼠标右键并拖动</li>
                <li><b>重置视图</b>：点击右上角相机控制中的"复位相机"</li>
              </ul>
            </div>
            
            <div class="help-card">
              <h4>2. 图层管理</h4>
              <p>使用右侧边栏的图层面板管理您的数据：</p>
              <ul>
                <li>切换图层可见性</li>
                <li>添加或删除图层</li>
                <li>调整图层顺序</li>
              </ul>
            </div>
            
            <div class="help-card">
              <h4>3. 数据加载</h4>
              <p>您可以通过以下方式加载数据：</p>
              <ul>
                <li>左侧工具栏中的"数据加载"部分</li>
                <li>支持多种格式：GeoJSON、3D Tiles、glTF等</li>
                <li>可以从本地或URL加载数据</li>
              </ul>
            </div>
            
            <div class="help-card">
              <h4>4. 分析工具</h4>
              <p>平台提供多种空间分析工具：</p>
              <ul>
                <li>测量距离和面积</li>
                <li>可视域分析</li>
                <li>路径规划</li>
                <li>等更多...</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- 基本功能 -->
        <div v-if="activeSection === 'basics'" class="help-section">
          <h3>基本功能</h3>
          <div class="section-content">
            <div class="help-card">
              <h4>导航控制</h4>
              <p>平台提供多种导航控制方式：</p>
              <ul>
                <li><b>鼠标操作</b>：
                  <ul>
                    <li>左键拖动：旋转视图</li>
                    <li>右键拖动：平移视图</li>
                    <li>滚轮：缩放视图</li>
                    <li>中键双击：重置视图</li>
                  </ul>
                </li>
                <li><b>键盘导航</b>：
                  <ul>
                    <li>方向键：平移视图</li>
                    <li>+/-键：缩放视图</li>
                    <li>Home键：重置视图</li>
                  </ul>
                </li>
              </ul>
            </div>
            
            <div class="help-card">
              <h4>坐标拾取</h4>
              <p>使用坐标拾取工具可以获取地图上任意点的精确坐标：</p>
              <ol>
                <li>点击右侧相机控制面板中的"坐标拾取"按钮</li>
                <li>点击地图上任意位置</li>
                <li>系统将显示该点的经纬度坐标以及高度信息</li>
                <li>再次点击"坐标拾取"按钮可关闭该功能</li>
              </ol>
            </div>
            
            <div class="help-card">
              <h4>视角控制</h4>
              <p>在右侧边栏的"相机"标签页中，您可以使用以下视角控制：</p>
              <ul>
                <li>俯视视角：垂直向下俯视地形</li>
                <li>侧视视角：从侧面观察地形</li>
                <li>斜视视角：以一定角度俯视</li>
                <li>45度视角：常用的城市规划视角</li>
                <li>还可以调整相机的视场角，提供不同的观察体验</li>
              </ul>
            </div>
            
            <div class="help-card">
              <h4>搜索位置</h4>
              <p>使用顶部导航栏的搜索框可以快速定位到任意地点：</p>
              <ol>
                <li>在搜索框中输入地点名称</li>
                <li>从下拉结果中选择目标地点</li>
                <li>地图将自动飞行到该位置</li>
              </ol>
            </div>
          </div>
        </div>
        
        <!-- 数据管理 -->
        <div v-if="activeSection === 'data'" class="help-section">
          <h3>数据管理</h3>
          <div class="section-content">
            <div class="help-card">
              <h4>支持的数据格式</h4>
              <p>平台支持多种数据格式：</p>
              <ul>
                <li><b>矢量数据</b>：GeoJSON、Shapefile</li>
                <li><b>三维模型</b>：glTF、3D Tiles</li>
                <li><b>影像数据</b>：各类OGC服务、瓦片服务</li>
                <li><b>地形数据</b>：Cesium地形服务</li>
              </ul>
            </div>
            
            <div class="help-card">
              <h4>加载本地数据</h4>
              <p>您可以通过以下步骤加载本地数据文件：</p>
              <ol>
                <li>点击左侧工具栏中的相应数据加载按钮</li>
                <li>在弹出的文件选择器中选择目标文件</li>
                <li>文件加载后将自动添加到地图中</li>
                <li>加载的数据会出现在右侧的图层管理面板中</li>
              </ol>
            </div>
            
            <div class="help-card">
              <h4>加载远程数据</h4>
              <p>加载在线数据服务：</p>
              <ol>
                <li>点击左侧工具栏中的"加载HTTP Tiles"按钮</li>
                <li>在弹出的对话框中输入数据服务URL</li>
                <li>选择适当的数据类型</li>
                <li>点击确认加载数据</li>
              </ol>
            </div>
            
            <div class="help-card">
              <h4>图层管理</h4>
              <p>在右侧边栏的"图层"标签页中，您可以：</p>
              <ul>
                <li>查看所有已加载的图层</li>
                <li>通过复选框控制图层的显示/隐藏</li>
                <li>使用删除按钮移除图层</li>
                <li>不同类型的图层（影像、矢量、模型等）分组显示，便于管理</li>
              </ul>
            </div>
            
            <div class="help-card">
              <h4>数据发布</h4>
              <p>通过"数据发布"功能，您可以：</p>
              <ul>
                <li>将本地数据保存到云端服务器</li>
                <li>管理已发布的数据服务</li>
                <li>与他人共享您的数据</li>
                <li>注意：此功能需要登录后才能使用</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- 分析工具 -->
        <div v-if="activeSection === 'analysis'" class="help-section">
          <h3>分析工具</h3>
          <div class="section-content">
            <div class="help-card">
              <h4>几何测量</h4>
              <p>平台提供基本的几何测量工具：</p>
              <ul>
                <li><b>测距离</b>：点击"测距离"按钮，然后在地图上依次点击测量点，双击结束测量</li>
                <li><b>测面积</b>：点击"测面积"按钮，在地图上依次点击多边形的顶点，双击结束测量</li>
                <li>测量结果将直接显示在地图上</li>
              </ul>
            </div>
            
            <div class="help-card">
              <h4>可视域分析</h4>
              <p>进行可视域分析的步骤：</p>
              <ol>
                <li>点击左侧工具栏中的"场景分析"-"可视域分析"</li>
                <li>在地图上选择观察点位置</li>
                <li>调整视距、视角等参数</li>
                <li>系统将计算并显示从该点可见的区域</li>
              </ol>
            </div>
            
            <div class="help-card">
              <h4>路径规划</h4>
              <p>使用路径规划功能的步骤：</p>
              <ol>
                <li>点击左侧工具栏中的"场景分析"-"路径规划"</li>
                <li>在地图上依次点击起点和终点</li>
                <li>系统将自动计算最短路径</li>
                <li>规划结果会显示在地图上，并可在图层面板中管理</li>
              </ol>
            </div>
            
            <div class="help-card">
              <h4>缓冲区分析</h4>
              <p>创建缓冲区分析：</p>
              <ol>
                <li>点击左侧工具栏中的"缓冲区分析"</li>
                <li>选择要分析的几何要素</li>
                <li>设置缓冲区距离</li>
                <li>点击"生成缓冲区"按钮</li>
                <li>系统将计算并显示缓冲区范围</li>
              </ol>
            </div>
            
            <div class="help-card">
              <h4>地形分析</h4>
              <p>平台提供多种地形分析工具：</p>
              <ul>
                <li><b>坡度分析</b>：显示地形的坡度分布</li>
                <li><b>坡向分析</b>：显示地形的坡向分布</li>
                <li><b>等高线生成</b>：生成地形的等高线</li>
                <li>点击左侧工具栏中的"场景分析"-"地形分析"，选择相应的分析类型</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- 效果设置 -->
        <div v-if="activeSection === 'effects'" class="help-section">
          <h3>效果设置</h3>
          <div class="section-content">
            <div class="help-card">
              <h4>地形与影像</h4>
              <p>在右侧边栏的"地形影像"标签页中，您可以：</p>
              <ul>
                <li>切换不同的底图影像（Cesium默认、OpenStreetMap、ArcGIS等）</li>
                <li>添加自定义影像图层</li>
                <li>开启或关闭地形效果</li>
                <li>调整地形显示效果</li>
              </ul>
            </div>
            
            <div class="help-card">
              <h4>天空盒设置</h4>
              <p>通过天空盒设置，您可以：</p>
              <ul>
                <li>更改场景的天空背景</li>
                <li>选择不同的星空、云层等效果</li>
                <li>在下拉菜单中选择预设的天空盒样式</li>
              </ul>
            </div>
            
            <div class="help-card">
              <h4>视觉特效</h4>
              <p>平台提供多种视觉特效，可通过左侧工具栏的"视觉效果"部分使用：</p>
              <ul>
                <li><b>下雨效果</b>：模拟下雨场景</li>
                <li><b>下雪效果</b>：模拟下雪场景</li>
                <li><b>雾天效果</b>：添加雾气效果</li>
                <li><b>夜视效果</b>：模拟夜视镜效果</li>
                <li><b>体积云效果</b>：添加真实的云层效果</li>
                <li>点击"清除特效"可以移除当前的所有视觉效果</li>
              </ul>
            </div>
            
          </div>
        </div>
        
        <!-- 特色功能 -->
        <div v-if="activeSection === 'advanced'" class="help-section">
          <h3>特色功能</h3>
          <div class="section-content">
            <div class="help-card">
              <h4>人物漫游</h4>
              <p>使用人物漫游功能探索三维场景：</p>
              <ol>
                <li>点击左侧工具栏中的"人物漫游"按钮</li>
                <li>系统将在场景中生成一个人物角色</li>
                <li>使用键盘WASD控制人物移动</li>
                <li>使用鼠标控制视角</li>
                <li>按ESC键或再次点击"人物漫游"按钮退出漫游模式</li>
              </ol>
            </div>
            
            <div class="help-card">
              <h4>建筑规划</h4>
              <p>使用建筑规划工具进行城市规划设计：</p>
              <ol>
                <li>点击左侧工具栏中的"建筑规划"按钮</li>
                <li>在地图上选择要放置建筑的位置</li>
                <li>从建筑类型列表中选择合适的建筑模型</li>
                <li>调整建筑的尺寸、方向等参数</li>
                <li>点击"确认"完成建筑放置</li>
              </ol>
              <p>注意：此功能需要登录后才能使用</p>
            </div>
            
            <div class="help-card">
              <h4>模型拉伸</h4>
              <p>使用模型拉伸功能将2D数据转化为3D效果：</p>
              <ol>
                <li>先加载GeoJSON等2D矢量数据</li>
                <li>点击左侧工具栏中的"模型拉伸"按钮</li>
                <li>选择要拉伸的图层</li>
                <li>设置拉伸高度（可以使用固定值或根据属性值动态设置）</li>
                <li>选择颜色样式</li>
                <li>点击"应用"完成拉伸</li>
              </ol>
            </div>
            
            <div class="help-card">
              <h4>实景城市</h4>
              <p>加载和浏览实景三维城市模型：</p>
              <ol>
                <li>点击左侧工具栏中的"加载实景城市"按钮</li>
                <li>在弹出的城市选择器中选择要加载的城市</li>
                <li>系统将自动加载该城市的实景三维模型</li>
                <li>加载完成后，您可以自由浏览真实的城市场景</li>
              </ol>
            </div>
            
            <div class="help-card">
              <h4>GeoAI助手</h4>
              <p>使用GeoAI助手智能操作平台：</p>
              <ul>
                <li>点击左侧浮动按钮打开GeoAI对话窗口</li>
                <li>使用自然语言描述您想要完成的任务</li>
                <li>例如"帮我加载武汉市的城市模型"或"帮我规划从中国地质大学（武汉）南望山校区到中国地质大学（武汉）未来城校区的路线"</li>
                <li>AI助手将理解您的意图并执行相应操作</li>
              </ul>
              <p>注意：此功能需要登录后才能使用</p>
            </div>
          </div>
        </div>
        
        <!-- 常见问题 -->
        <div v-if="activeSection === 'faq'" class="help-section">
          <h3>常见问题</h3>
          <div class="section-content">
            <div class="help-card faq-card">
              <h4>数据无法加载怎么办？</h4>
              <div class="faq-answer">
                <p>如果您的数据无法正常加载，请检查以下几点：</p>
                <ol>
                  <li>确认数据格式是否受支持</li>
                  <li>检查数据文件是否完整、有效</li>
                  <li>对于远程数据，确认URL是否正确，以及服务是否可访问</li>
                  <li>检查是否存在跨域（CORS）问题</li>
                  <li>查看浏览器控制台是否有错误信息</li>
                </ol>
                <p>如果问题仍然存在，请尝试使用其他格式的数据或联系我们的技术支持。</p>
              </div>
            </div>
            
            <div class="help-card faq-card">
              <h4>系统运行缓慢怎么办？</h4>
              <div class="faq-answer">
                <p>如果系统运行缓慢，您可以尝试以下优化措施：</p>
                <ol>
                  <li>关闭不需要的图层，特别是大型3D模型</li>
                  <li>调低地形细节（在"地形影像"标签页中）</li>
                  <li>关闭视觉特效</li>
                  <li>使用更简化的底图</li>
                  <li>关闭浏览器的其他标签页释放内存</li>
                  <li>使用更新的浏览器和显卡驱动</li>
                </ol>
              </div>
            </div>
            
            <div class="help-card faq-card">
              <h4>如何使用键盘和鼠标更高效地操作？</h4>
              <div class="faq-answer">
                <p>以下是一些实用的快捷操作：</p>
                <ul>
                  <li><b>空格键</b>：重置视图到默认位置</li>
                  <li><b>Ctrl + 鼠标左键拖动</b>：快速旋转视图</li>
                  <li><b>Shift + 鼠标滚轮</b>：放大/缩小的速度会变慢，便于精细调整</li>
                  <li><b>鼠标中键按下拖动</b>：进行视图平移</li>
                  <li><b>数字键1-6</b>：切换预设视角</li>
                  <li><b>Tab键</b>：切换侧边栏的可见性</li>
                </ul>
              </div>
            </div>
            
            <div class="help-card faq-card">
              <h4>为什么我无法使用某些高级功能？</h4>
              <div class="faq-answer">
                <p>带有锁图标的功能需要用户登录才能使用</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 联系我们 -->
        <div v-if="activeSection === 'contact'" class="help-section">
          <h3>联系我们</h3>
          <div class="section-content">
            <div class="help-card contact-card">
              <h4>技术支持</h4>
              <p>如果您在使用过程中遇到任何问题或需要帮助，请通过以下方式联系我们：</p>
              <ul>
                <li><b>电子邮件</b>：xieyuhan@cug.edu.cn</li>
                <li><b>qq</b>：872447672</li>
              </ul>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 定义帮助章节
const sections = [
  { id: 'quickstart', title: '快速入门', icon: '🚀' },
  { id: 'basics', title: '基本功能', icon: '🧭' },
  { id: 'data', title: '数据管理', icon: '📊' },
  { id: 'analysis', title: '分析工具', icon: '🔍' },
  { id: 'effects', title: '效果设置', icon: '✨' },
  { id: 'advanced', title: '高级功能', icon: '🛠️' },
  { id: 'faq', title: '常见问题', icon: '❓' },
  { id: 'contact', title: '联系我们', icon: '📞' }
];

// 当前活动章节
const activeSection = ref('quickstart');

// 定义emit事件
defineEmits(['close']);
</script>

<style scoped>
.help-modal {
  display: flex;
  flex-direction: column;
  width: 90vw;
  max-width: 1200px;
  height: 80vh;
  background-color: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  color: var(--text-primary);
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-primary);
}

.help-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-primary);
}

.help-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.help-sidebar {
  width: 220px;
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  padding: 16px 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--text-secondary);
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background-color: var(--bg-hover);
}

.sidebar-item.active {
  background-color: var(--bg-active);
  color: var(--primary-color);
  border-left: 3px solid var(--primary-color);
}

.item-icon {
  margin-right: 12px;
  font-size: 1.2rem;
}

.item-text {
  font-size: 1rem;
  font-weight: 500;
}

.help-body {
  flex: 1;
  padding: 0;
  overflow-y: auto;
  background-color: var(--bg-secondary);
}

.help-section {
  padding: 24px;
}

.help-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.section-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.help-card {
  background-color: var(--bg-primary);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.help-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.help-card h4 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.1rem;
  color: var(--text-primary);
  font-weight: 600;
}

.help-card p {
  margin: 0 0 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.help-card ul, .help-card ol {
  padding-left: 20px;
  margin: 12px 0;
  color: var(--text-secondary);
}

.help-card li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.faq-card h4 {
  position: relative;
  padding-left: 24px;
}

.faq-card h4::before {
  content: "Q:";
  position: absolute;
  left: 0;
  color: var(--primary-color);
  font-weight: bold;
}

.faq-answer {
  position: relative;
  padding-left: 24px;
}

.faq-answer::before {
  content: "A:";
  position: absolute;
  left: 0;
  top: 0;
  color: var(--success-color);
  font-weight: bold;
}

.contact-card {
  display: flex;
  flex-direction: column;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 8px;
}

.social-icon {
  font-size: 1.2rem;
}

/* 媒体查询适配小屏幕 */
@media (max-width: 768px) {
  .help-content {
    flex-direction: column;
  }
  
  .help-sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    padding: 8px 0;
  }
  
  .sidebar-item {
    padding: 8px 16px;
  }
  
  .section-content {
    grid-template-columns: 1fr;
  }
}
</style> 