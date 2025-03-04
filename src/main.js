import * as THREE from 'three';
import { gsap } from 'gsap';
import Lenis from '@studio-freight/lenis';

// Initialize smooth scrolling
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

// Initialize Three.js scene
class Experience {
    constructor() {
        this.container = document.getElementById('webgl');
        this.scene = new THREE.Scene();
        
        // Remove solid background color to allow for gradient
        // this.scene.background = new THREE.Color('#000000');
        
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupBackground();
        this.setupLines();
        this.setupEventListeners();
        this.setupAnimations();
        this.setupScrollAnimations();
        
        this.render();
    }
    
    setupCamera() {
        this.perspective = 1000;
        const fov = (180 * (2 * Math.atan(window.innerHeight / 2 / this.perspective))) / Math.PI;
        this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.set(0, 0, this.perspective);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: this.container
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Set clear color with alpha for gradient background to show through
        this.renderer.setClearColor(0x000000, 0);
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }
    
    setupBackground() {
        // Create a colorful gradient background
        document.body.style.background = 'linear-gradient(45deg, #ff9a9e, #fad0c4, #fad0c4, #a18cd1, #fbc2eb)';
        document.body.style.backgroundSize = '400% 400%';
        
        // Animate the gradient
        gsap.to(document.body, {
            backgroundPosition: '100% 100%',
            duration: 15,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }
    
    setupLines() {
        // Create decorative lines
        this.lines = new THREE.Group();
        this.scene.add(this.lines);
        
        const lineCount = 10;
        const colors = [0xfad0c4, 0xa18cd1, 0xfbc2eb, 0xff9a9e];
        
        for (let i = 0; i < lineCount; i++) {
            const points = [];
            const segmentCount = 10;
            const radius = 100 + Math.random() * 100;
            
            for (let j = 0; j <= segmentCount; j++) {
                const theta = (j / segmentCount) * Math.PI * 2;
                const phi = Math.acos(-1 + (2 * i) / lineCount);
                
                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.sin(phi) * Math.sin(theta);
                const z = radius * Math.cos(phi);
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: colors[i % colors.length],
                transparent: true,
                opacity: 0.5,
                linewidth: 1
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.lines.add(line);
            
            // Animate each line
            gsap.to(line.rotation, {
                x: Math.PI * 2,
                y: Math.PI * 2,
                duration: 20 + i * 5,
                repeat: -1,
                ease: 'none'
            });
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', this.onResize.bind(this));
        
        // Mouse move effect
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
    
    setupAnimations() {
        // Animate title and subtitle
        const title = document.querySelector('.title');
        const subtitle = document.querySelector('.subtitle');
        
        gsap.to(title, {
            opacity: 1,
            y: 0,
            duration: 1.5,
            delay: 0.5,
            ease: 'power4.out'
        });
        
        gsap.to(subtitle, {
            opacity: 1,
            y: 0,
            duration: 1.5,
            delay: 0.8,
            ease: 'power4.out'
        });
        
        // Animate lines
        if (this.lines) {
            gsap.from(this.lines.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 2,
                ease: 'elastic.out(1, 0.3)',
                delay: 1
            });
        }
    }
    
    setupScrollAnimations() {
        // Set up scroll trigger for project cards
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach((card, index) => {
            // Initially hide the cards
            gsap.set(card, { y: 50, opacity: 0 });
            
            // Create scroll trigger
            lenis.on('scroll', (e) => {
                const projectsSection = document.getElementById('projects');
                const rect = projectsSection.getBoundingClientRect();
                
                if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
                    gsap.to(card, {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        delay: index * 0.2,
                        ease: 'power3.out'
                    });
                }
            });
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
    }
    
    render() {
        if (this.lines) {
            this.lines.rotation.x += 0.001;
            this.lines.rotation.y += 0.001;
        }
        
        this.renderer.render(this.scene, this.camera);
        window.requestAnimationFrame(this.render.bind(this));
    }
}

// Initialize the experience when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new Experience();
});