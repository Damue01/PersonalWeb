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

// 初始化Three.js场景
class Experience {
    // 添加防抖函数
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
    
    // 设置场景灯光
    setupLights() {
        // 添加环境光（柔和的全局照明）
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        // 添加定向光（模拟太阳光）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1); // 设置光源位置
        this.scene.add(directionalLight);
    }
    
    // 设置渐变背景
    setupBackground() {
        // 创建彩色渐变背景
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
    
    setupLines() {
        // Create decorative lines
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
    
    setupEventListeners() {
        window.addEventListener('resize', this.onResize.bind(this));
        
        // 修改鼠标移动逻辑，移除透明度变化，仅保留旋转效果
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
    
    // 新增方法：控制每条线的生命周期逻辑
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

    // 修改 setupAnimations 方法，确保初始化时部分线条可见
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
    setupScrollAnimations() {
        // 设置项目卡片基础样式
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
window.addEventListener('DOMContentLoaded', () => {
    try {
        new Experience();
    } catch (error) {
        console.error('Failed to initialize the experience:', error);
    }
});
