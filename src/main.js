// 导入必要的库
import * as THREE from 'three'; // 3D渲染库
import { gsap } from 'gsap'; // 动画库
import Lenis from '@studio-freight/lenis'; // 平滑滚动库

// 初始化平滑滚动
const lenis = new Lenis({
    duration: 1.2, // 滚动持续时间
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // 缓动函数
    orientation: 'vertical', // 滚动方向
    smoothWheel: true // 启用平滑滚动
});

// 动画循环函数，确保平滑滚动效果
function raf(time) {
    lenis.raf(time); // 更新Lenis滚动状态
    requestAnimationFrame(raf); // 递归调用，创建动画循环
}

// 启动动画循环
requestAnimationFrame(raf);

/**
 * 主场景类 - 管理整个3D场景的生命周期
 * @class Experience
 * @property {THREE.Scene} scene - Three.js场景对象
 * @property {THREE.PerspectiveCamera} camera - 透视相机
 * @property {THREE.WebGLRenderer} renderer - WebGL渲染器
 * @property {THREE.Group} lines - 装饰线条的组对象
 * @property {number} lineCount - 当前场景中装饰线条的数量
 * 
 * 主要功能模块：
 * 1. 场景初始化（相机、渲染器、灯光、背景、装饰线条）
 * 2. 事件监听（窗口调整、鼠标移动）
 * 3. 动画系统（GSAP动画、生命周期管理）
 * 4. 滚动动画控制
 * 5. 渲染循环管理
 * 
 * 相关模块：
 * - Lenis 平滑滚动库
 * - GSAP 动画库
 */
class Experience {
    /**
     * 防抖函数 - 用于优化高频事件处理
     * @param {Function} func - 需要防抖的函数
     * @param {number} wait - 等待时间(毫秒)
     * @returns {Function} 防抖处理后的函数
     * 
     * 使用场景：
     * - 窗口resize事件处理
     * - 鼠标移动事件优化
     */
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    constructor() {
        // 添加 lineCount 成员变量
        this.lineCount = 0;
        // 获取canvas元素
        this.container = document.getElementById('webgl');
        if (!this.container) {
            console.error('Canvas element with id "webgl" not found.');
            return;
        }
        // 创建3D场景
        this.scene = new THREE.Scene();
        
        // 移除纯色背景以允许渐变效果显示
        // this.scene.background = new THREE.Color('#000000');
        
        // 初始化各个组件
        this.setupCamera(); // 设置相机
        this.setupRenderer(); // 设置渲染器
        this.setupLights(); // 设置灯光
        this.setupBackground(); // 设置背景
        this.setupLines(); // 设置装饰线条
        this.setupEventListeners(); // 设置事件监听器
        this.setupAnimations(); // 设置动画
        this.setupScrollAnimations(); // 设置滚动动画
        
        // 开始渲染循环
        this.render();
    }
    
    // 设置相机
    setupCamera() {
        this.perspective = 1000; // 透视距离
        // 计算视场角(FOV)
        const fov = (180 * (2 * Math.atan(window.innerHeight / 2 / this.perspective))) / Math.PI;
        // 创建透视相机
        this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000);
        // 设置相机位置
        this.camera.position.set(0, 0, this.perspective);
    }
    
    // 设置渲染器
    setupRenderer() {
        // 创建WebGL渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: true, // 启用抗锯齿
            alpha: true, // 启用透明背景
            canvas: this.container // 使用指定的canvas元素
        });
        // 设置渲染尺寸为窗口大小
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // 设置像素比例（限制最大为2以提高性能）
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // 设置清除颜色为透明，使渐变背景可见
        this.renderer.setClearColor(0x000000, 0);
    }
    
    /**
     * 初始化场景灯光系统
     * 灯光配置：
     * 1. 环境光 (AmbientLight) - 提供基础全局照明
     *    - 颜色: 白色
     *    - 强度: 0.8
     * 2. 定向光 (DirectionalLight) - 模拟主要光源（如太阳）
     *    - 颜色: 白色  
     *    - 强度: 1
     *    - 位置: (1,1,1)
     * 
     * 光照效果关联：
     * - 影响所有场景中的材质表现
     * - 与装饰线条的透明材质产生交互效果
     */
    setupLights() {
        // 添加环境光（基础全局照明）
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        // 添加主定向光源（模拟太阳光）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1); // 设置光源空间坐标
        this.scene.add(directionalLight);
    }
    
    /**
     * 创建动态渐变背景
     * 技术实现：
     * 1. 使用CSS线性渐变创建多色背景
     * 2. 通过GSAP动画实现背景位置变化
     * 3. 设置无限循环的渐变动画
     * 
     * 渐变颜色：
     * #ff9a9e（粉红）→ #fad0c4（浅粉）→ #a18cd1（淡紫）→ #fbc2eb（浅紫）
     * 
     * 动画配置：
     * - 持续时间：20秒
     * - 缓动函数：sine.inOut
     * - 循环模式：yoyo（来回播放）
     * 
     * 视觉关联：
     * - 与装饰线条的颜色形成对比
     * - 通过透明渲染器背景显示
     */
    setupBackground() {
        // 初始化渐变背景
        document.body.style.background = 'linear-gradient(45deg, #ff9a9e, #fad0c4, #fad0c4, #a18cd1, #fbc2eb)';
        document.body.style.backgroundSize = '400% 400%'; // 设置背景尺寸为原始尺寸的4倍，便于动画
        
        // 使用GSAP动画库制作渐变动画
        gsap.to(document.body, {
            backgroundPosition: '100% 100%', // 动画终点位置
            duration: 20, // 动画持续时间（秒）
            repeat: -1, // 无限重复
            yoyo: true, // 来回播放
            ease: 'sine.inOut' // 缓动函数
        });
    }
    
    /**
     * 创建三维装饰线条系统
     * 功能特性：
     * 1. 随机生成三维空间曲线
     * 2. 多色系配置（5种预设颜色循环使用）
     * 3. 自动旋转动画
     * 
     * 技术参数：
     * - lineCount: 控制生成的线条数量
     * - segmentCount: 每条线的分段数（决定曲线平滑度）
     * - radius: 线条分布半径（120-220随机值）
     * 
     * 空间计算：
     * 使用球坐标系生成点位置 (theta, phi)
     * 公式：
     * x = radius * sin(phi) * cos(theta)
     * y = radius * sin(phi) * sin(theta)
     * z = radius * cos(phi)
     * 
     * 动画配置：
     * - 每条线独立旋转动画
     * - 动画持续时间递增（15-42秒）
     * - 无限循环旋转
     */
    setupLines() {
        this.lines = new THREE.Group();
        this.scene.add(this.lines);
        
        // 初始化 lineCount
        this.lineCount = 10; // 控制线条数量 (原值: 10) - Controls number of lines (original: 10)
        
        const colors = [
            0xff5e62, 0x00b8ff, 0xffd166, 0xa18cd1, 0x00f260
        ];
        
        for (let i = 0; i < this.lineCount; i++) {
            const points = [];
            const segmentCount = 30;
            const radius = 120 + Math.random() * 100;
            
            for (let j = 0; j <= segmentCount; j++) {
                const theta = (j / segmentCount) * Math.PI * 2;
                const phi = Math.acos(-1 + (2 * i) / this.lineCount);
                
                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.sin(phi) * Math.sin(theta);
                const z = radius * Math.cos(phi);
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: colors[i % colors.length],
                transparent: true,
                opacity: 0.7,
                linewidth: 2
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            line.rotation.x = Math.random() * Math.PI * 2;
            line.rotation.y = Math.random() * Math.PI * 2;
            line.rotation.z = Math.random() * Math.PI * 2;
            this.lines.add(line);
            
            gsap.to(line.rotation, {
                x: Math.PI * 2,
                y: Math.PI * 2,
                duration: 15 + i * 3,
                repeat: -1,
                ease: 'none'
            });
        }
    }
    
    /**
     * 初始化事件监听系统
     * 包含事件：
     * 1. 窗口调整事件 - 调用onResize方法
     * 2. 鼠标移动事件 - 控制线条旋转
     * 
     * 鼠标事件处理：
     * - 将鼠标坐标转换为归一化设备坐标（-1到1）
     * - 应用缓动动画实现平滑旋转过渡
     * - 仅影响线条组的整体旋转
     * 
     * 性能优化：
     * 使用防抖函数处理resize事件（通过debounce方法）
     */
    setupEventListeners() {
        window.addEventListener('resize', this.debounce(this.onResize.bind(this), 300));
        
        // 鼠标移动交互逻辑
        window.addEventListener('mousemove', (e) => {
            const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            const mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            
            if (this.lines) {
                gsap.to(this.lines.rotation, {
                    x: mouseY * 0.1,
                    y: mouseX * 0.1,
                    duration: 1
                });
            }
        });
    }
    
    /**
     * 线条生命周期管理
     * @param {THREE.Line} line - 要设置动画的线条对象
     * @param {number} index - 线条索引号（用于延迟计算）
     * 
     * 动画流程：
     * 1. 渐入动画（0 → 0.7透明度，持续2.5秒）
     * 2. 保持可见状态（随机5-10秒）
     * 3. 渐出动画（0.7 → 0透明度，持续2.5秒）
     * 4. 递归调用实现循环
     * 
     * 技术细节：
     * - 使用GSAP的链式动画实现阶段过渡
     * - 通过延迟(index * 0.5s)实现交错动画效果
     * - 缓动函数使用power2.out实现自然过渡
     */
    animateLineLifecycle(line, index) {
        const lifecycleDuration = 5 + Math.random() * 5; // 随机生成5到10秒的生命周期

        // 出现动画：透明度从0到0.7
        gsap.to(line.material, {
            opacity: 0.7,
            duration: 2.5,
            delay: index * 0.5, // 增加延迟时间，使线条交替出现
            ease: 'power2.out',
            onComplete: () => {
                // 消失动画：透明度从0.7到0
                gsap.to(line.material, {
                    opacity: 0,
                    duration: 2.5,
                    delay: lifecycleDuration, // 生命周期持续时间
                    ease: 'power2.out',
                    onComplete: () => {
                        // 递归调用以实现循环生命周期
                        this.animateLineLifecycle(line, index);
                    }
                });
            }
        });
    }

    /**
     * 初始化核心动画系统
     * @method setupAnimations
     * 
     * 包含动画：
     * 1. 标题文字入场动画
     * 2. 副标题文字入场动画
    3. 线条生命周期管理
     * 
     * 动画配置：
     * - 使用expo.out缓动实现流畅的入场效果
     * - 标题和副标题动画错开0.5秒
     * - 与线条生命周期动画同步启动
     * 
     * 关联元素：
     * - .title 标题元素
     * - .subtitle 副标题元素
     * - lines 装饰线条组
     */
    setupAnimations() {
        const title = document.querySelector('.title');
        const subtitle = document.querySelector('.subtitle');
        
        // 设置初始状态
        gsap.set([title, subtitle], {
            opacity: 0,
            y: 30
        });
        
        // 添加标题动画
        gsap.to(title, {
            opacity: 1,
            y: 0,
            duration: 2,
            delay: 0.5,
            ease: 'expo.out'
        });
        
        gsap.to(subtitle, {
            opacity: 1,
            y: 0,
            duration: 2,
            delay: 1,
            ease: 'expo.out'
        });
        
        // 确保线条动画与标题动画同步
        if (this.lines) {
            this.lines.children.forEach((line, index) => {
                if (index < this.lineCount) { // 使用 this.lineCount
                    line.material.opacity = 0.7;
                } else {
                    line.material.opacity = 0;
                }
                this.animateLineLifecycle(line, index);
            });
        }
    }
    /**
     * 初始化滚动动画系统
     * @method setupScrollAnimations
     * 
     * 功能特性：
     * 1. 创建响应式项目卡片布局
     * 2. 动态生成项目图片
     * 3. 应用错位旋转效果
     * 4. 生成渐变色背景
     * 
     * 布局逻辑：
     * - 奇数索引卡片右对齐并顺时针旋转
     * - 偶数索引卡片左对齐并逆时针旋转
     * - 卡片颜色基于索引生成HSL色相值
     * 
     * 动态元素：
     * - 自动插入项目图片
     * - 卡片背景色动态计算
     * - 卡片旋转角度动态设置
     */
    setupScrollAnimations() {
        const projectCards = document.querySelectorAll('.project-card');
        const projectsGrid = document.querySelector('.projects-grid');
        
        // 设置容器样式
        if (projectsGrid) {
            projectsGrid.style.display = 'flex';
            projectsGrid.style.flexDirection = 'column';
            projectsGrid.style.flexWrap = 'wrap';
            // projectsGrid.style.justifyContent = 'space-between';
            projectsGrid.style.gap = '6rem';
            projectsGrid.style.padding = '4rem 2rem';
            // projectsGrid.style.maxWidth = '1200px';
            projectsGrid.style.margin = '0 auto';
        }
        
        // 初始化卡片样式
        projectCards.forEach((card, index) => {
            // 添加项目图片
            const img = document.createElement('img');
            img.src = `/assets/project-${index + 1}.jpg`;
            img.alt = card.querySelector('.project-title').textContent;
            img.classList.add('project-image');
            
            // 插入图片到内容区域前
            const content = card.querySelector('.project-content');
            card.insertBefore(img, content);
            
            // 设置卡片基础样式
            card.style.width = '95%';
            card.style.margin = '2rem 0';
            card.style.transformOrigin = 'bottom center';
            // 设置左右交替排列
            if (index % 2 === 0) {
                card.style.transform = 'rotate(-2deg)';
                card.style.alignSelf = 'flex-start';
            } else {
                card.style.transform = 'rotate(2deg)'; 
                card.style.alignSelf = 'flex-end';
            }
            
            // 设置动态颜色
            const hue = index * 30 % 360;
            card.style.backgroundColor = `hsl(${hue}, 80%, 90%)`;
        });
    }
    onResize() {
        // Update camera
        const fov = (180 * (2 * Math.atan(window.innerHeight / 2 / this.perspective))) / Math.PI;
        this.camera.fov = fov;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }; // 添加分号
    
    render() {
        if (this.lines) {
            this.lines.rotation.x += 0.001;
            this.lines.rotation.y += 0.001;
        }
        
        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(this.render.bind(this));
    }; // 添加分号
}

// Initialize the experience when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main scene
    try {
        new Experience();
    } catch (error) {
        console.error('Failed to initialize the experience:', error);
    }
    
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: false,
        mirror: true
    });
});
