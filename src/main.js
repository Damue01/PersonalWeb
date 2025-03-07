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

/**
 * 工具类：防抖函数，用于优化高频事件
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * 相机管理类
 */
class CameraManager {
    constructor(perspective, width, height) {
        this.perspective = perspective;
        this.camera = this.setupCamera(width, height);
    }

    setupCamera(width, height) {
        const fov = (180 * (2 * Math.atan(height / 2 / this.perspective))) / Math.PI;
        const camera = new THREE.PerspectiveCamera(fov, width / height, 1, 15000);
        camera.position.set(0, 0, this.perspective);
        return camera;
    }

    resize(width, height) {
        const fov = (180 * (2 * Math.atan(height / 2 / this.perspective))) / Math.PI;
        this.camera.fov = fov;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
}

/**
 * 线条管理类
 */
class LineManager {
    constructor(scene, count) {
        this.lineCount = count;
        this.lines = new THREE.Group();
        this.colors = [
            0xFBF8CC, 0xFDE4CF, 0xFFCFD2, 0xF1C0E8, 0xCFBAF0,
            0xA3C4F3, 0x90DBF4, 0x8EECF5, 0x98F5E1, 0xB9FBC0
        ];
        this.sharedMaterial = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: 0.8,
            linewidth: 1
        });
        scene.add(this.lines);
        this.setupLines();
    }

    generateLinePoints(index) {
        const points = [];
        const segmentCount = 100;
        const radius = 1500 + Math.random() * 2000;

        for (let j = 0; j <= segmentCount; j++) {
            const theta = (j / segmentCount) * Math.PI * 2;
            const phi = Math.acos(-1 + (2 * index) / this.lineCount);
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            points.push(new THREE.Vector3(x, y, z));
        }
        return points;
    }

    setupLines() {
        for (let i = 0; i < this.lineCount; i++) {
            const points = this.generateLinePoints(i);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = this.sharedMaterial.clone();
            material.color.setHex(this.colors[i % this.colors.length]);
            const line = new THREE.LineLoop(geometry, material);
            line.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            this.lines.add(line);

            gsap.to(line.rotation, {
                x: Math.PI * 2,
                y: Math.PI * 2,
                duration: 55 + i * 3,
                repeat: -1,
                ease: 'none'
            });
        }
    }

    animateLineLifecycle(line) {
        const lifecycleDuration = 5 + Math.random() * 1;
        gsap.to(line.material, {
            opacity: 1,
            duration: 2.5,
            ease: 'power2.out',
            onComplete: () => {
                gsap.to(line.material, {
                    opacity: 0,
                    duration: 2.5,
                    delay: lifecycleDuration,
                    ease: 'power2.out',
                    onComplete: () => this.animateLineLifecycle(line)
                });
            }
        });
    }
}

/**
 * 主体验类
 */
class Experience {
    constructor() {
        this.container = document.getElementById('webgl');
        if (!this.container) {
            this.showError('Canvas element with id "webgl" not found.');
            return;
        }

        this.scene = new THREE.Scene();
        this.cameraManager = new CameraManager(1000, window.innerWidth, window.innerHeight);
        this.setupRenderer();
        this.setupLights();
        this.setupBackground();
        this.lineManager = new LineManager(this.scene, 3);
        this.setupEventListeners();
        this.setupAnimations();
        this.render();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: this.container
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
    }

    setupLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
        pointLight.position.set(0, 0, 500);
        this.scene.add(pointLight);
    }
    // #ff9a9e, #fad0c4, #fad0c4, #a18cd1, #fbc2eb
    // #cdb4db, #ffc8dd, #ffafcc, #bde0fe, #a2d2ff
    setupBackground() {
        document.body.style.background = 'linear-gradient(45deg, #f2f7ff, #c9dcff, #b2c9ff, #be99ff)';
        document.body.style.backgroundSize = '400% 400%';
        gsap.to(document.body, {
            backgroundPosition: '100% 100%',
            duration: 15,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', debounce(this.onResize.bind(this), 300));
    }

    setupAnimations() {
        const tl = gsap.timeline();
        tl.fromTo('.title', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 2, ease: 'expo.out' })
          .fromTo('.subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 2, ease: 'expo.out' }, '-=1.5');

        if (this.lineManager) {
            gsap.to(this.lineManager.lines.children, {
                stagger: 0.5,
                onStart: function () { this.targets()[0].material.opacity = 0; },
                onComplete: (line) => this.lineManager.animateLineLifecycle(line),
            });
        }
    }

    onResize() {
        this.cameraManager.resize(window.innerWidth, window.innerHeight);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    render() {
        if (this.lineManager) {
            this.lineManager.lines.rotation.x += 0.001;
            this.lineManager.lines.rotation.y += 0.001;
        }
        this.renderer.render(this.scene, this.cameraManager.camera);
        requestAnimationFrame(this.render.bind(this));
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        console.error(message);
    }

    destroy() {
        this.scene.children.forEach(child => this.scene.remove(child));
        this.renderer.dispose();
        window.removeEventListener('resize', this.onResize);
    }
}

/**
 * 项目卡片动画设置
 */
function setupProjectAnimations() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card) => {
        gsap.fromTo(card, { opacity: 0, y: 0 }, {
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
    // 仅在首页初始化AOS
    if (window.location.pathname.endsWith('index.html')) {
        AOS.init({
            duration: 800,
            easing: 'fade-up',
            once: false,
            mirror: true
        });
    }
});

window.addEventListener('load', setupProjectAnimations);
