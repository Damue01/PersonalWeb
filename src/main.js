// 导入必要的库
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

// 注册 ScrollTrigger 插件
gsap.registerPlugin(ScrollTrigger);

// 初始化平滑滚动
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

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
        this.lineCount = 10;
        this.container = document.getElementById('webgl');
        if (!this.container) {
            console.error('Canvas element with id "webgl" not found.');
            return;
        }
        this.scene = new THREE.Scene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupBackground();
        this.setupLines();
        this.setupEventListeners();
        this.setupAnimations();
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
    

    setupLights() {
        // 添加环境光（基础全局照明）
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        // 添加主定向光源（模拟太阳光）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1); // 设置光源空间坐标
        this.scene.add(directionalLight);
    }
    
    setupBackground() {
        // 初始化渐变背景
        document.body.style.background = 'linear-gradient(45deg, #CDB4DB, #FFC8DD, #FFAFCC, #BDE0FE, #A2D2FF)';
        document.body.style.backgroundSize = '400% 400%'; // 设置背景尺寸为原始尺寸的4倍，便于动画
        
        // 使用GSAP动画库制作渐变动画
        gsap.to(document.body, {
            backgroundPosition: '100% 100%', // 动画终点位置
            duration: 30, // 动画持续时间（秒）
            repeat: -1, // 无限重复
            yoyo: true, // 来回播放
            ease: 'sine.inOut' // 缓动函数
        });
    }
    
    setupLines() {
        this.lines = new THREE.Group();
        this.scene.add(this.lines);
        
        // 初始化 lineCount
        this.lineCount = 10; // 控制线条数量 (原值: 10) - Controls number of lines (original: 10)
        
        const colors = [
            0xFBF8CC, 0xFDE4CF, 0xFFCFD2, 0xF1C0E8, 0xCFBAF0, 0xA3C4F3, 0x90DBF4, 0x8EECF5, 0x98F5E1, 0xB9FBC0
        ];
        
        for (let i = 0; i < this.lineCount; i++) {
            const points = [];
            const segmentCount = 100;
            const radius = 120 + Math.random() * 500;
            
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
                linewidth: 20
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

    setupAnimations() {
        const title = document.querySelector('.title');
        const subtitle = document.querySelector('.subtitle');
        
        gsap.set([title, subtitle], { opacity: 0, y: 30 });
        gsap.to(title, { opacity: 1, y: 0, duration: 2, delay: 0.5, ease: 'expo.out' });
        gsap.to(subtitle, { opacity: 1, y: 0, duration: 2, delay: 1, ease: 'expo.out' });
        
        if (this.lines) {
            this.lines.children.forEach((line, index) => {
                if (index < this.lineCount) {
                    line.material.opacity = 0.7;
                } else {
                    line.material.opacity = 0;
                }
                this.animateLineLifecycle(line, index);
            });
        }
    }

    // 生成动态纹理

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

// 项目卡片动画设置
function setupProjectAnimations() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card) => {
        gsap.set(card, { opacity: 0, y: 50 });
        gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 2,
            ease: 'expo.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 80%',
                once: true
            }
        });
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    try {
        new Experience();
    } catch (error) {
        console.error('Failed to initialize the experience:', error);
    }
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: false,
        mirror: true
    });
});

window.addEventListener('load', setupProjectAnimations);