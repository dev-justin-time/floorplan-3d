import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';
import { MeshBasicNodeMaterial, MeshStandardNodeMaterial } from 'three/nodes';

class SharedViewer {
    constructor() {
        this.currentView = 'panorama';
        this.panoramaCamera = null;
        this.panoramaScene = null;
        this.panoramaRenderer = null;
        this.floorplanCamera = null;
        this.floorplanScene = null;
        this.floorplanRenderer = null;
        this.floorplanControls = null;
        this.isUserInteracting = false;
        this.lon = 0;
        this.lat = 0;
        this.onPointerDownLon = 0;
        this.onPointerDownLat = 0;
        this.onPointerDownMouseX = 0;
        this.onPointerDownMouseY = 0;
    }

    async init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Panorama setup with WebGPU
        const panoramaCanvas = container.querySelector('#viewer-panorama-canvas');
        if (!panoramaCanvas) {
            console.error('Panorama canvas not found');
            return;
        }

        this.panoramaCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.panoramaCamera.position.set(0.001, 0, 0);

        this.panoramaScene = new THREE.Scene();

        // Initialize WebGPU renderer for panorama
        if (await WebGPURenderer.isAvailable()) {
            this.panoramaRenderer = new WebGPURenderer({ canvas: panoramaCanvas, antialias: true });
        } else {
            console.warn('WebGPU not available for panorama, falling back to WebGL');
            this.panoramaRenderer = new THREE.WebGLRenderer({ canvas: panoramaCanvas, antialias: true });
        }
        
        this.panoramaRenderer.setPixelRatio(window.devicePixelRatio);
        this.panoramaRenderer.setSize(width, height);

        await this.loadPanorama();

        // 3D setup with WebGPU
        const view3DContainer = container.querySelector('#viewer-3d-view');
        if (!view3DContainer) {
            console.error('3D view container not found');
            return;
        }

        this.floorplanScene = new THREE.Scene();
        this.floorplanScene.background = new THREE.Color(0xf0f0f0);

        this.floorplanCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.floorplanCamera.position.set(8, 6, 8);

        // Initialize WebGPU renderer for 3D view
        if (await WebGPURenderer.isAvailable()) {
            this.floorplanRenderer = new WebGPURenderer({ antialias: true });
        } else {
            console.warn('WebGPU not available for 3D, falling back to WebGL');
            this.floorplanRenderer = new THREE.WebGLRenderer({ antialias: true });
        }
        
        this.floorplanRenderer.setSize(width, height);
        this.floorplanRenderer.shadowMap.enabled = true;
        view3DContainer.appendChild(this.floorplanRenderer.domElement);

        this.floorplanControls = new OrbitControls(this.floorplanCamera, this.floorplanRenderer.domElement);
        this.floorplanControls.enableDamping = true;
        this.floorplanControls.dampingFactor = 0.05;
        this.floorplanControls.maxPolarAngle = Math.PI / 2;

        this.setupLights();
        this.setupEventListeners(container);
        this.animate();

        console.log('SharedViewer initialized successfully with WebGPU support');
    }

    async loadPanorama() {
        const loader = new THREE.TextureLoader();
        return new Promise((resolve) => {
            loader.load(
                '/sc-bp-bath.png',
                (texture) => {
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    const geometry = new THREE.SphereGeometry(500, 60, 40);
                    geometry.scale(-1, 1, 1);
                    
                    // Use node material for WebGPU compatibility
                    const material = new MeshBasicNodeMaterial({ map: texture });
                    const mesh = new THREE.Mesh(geometry, material);
                    this.panoramaScene.add(mesh);
                    console.log('Panorama texture loaded');
                    resolve();
                },
                undefined,
                (error) => {
                    console.warn('Failed to load panorama, using fallback');
                    const geometry = new THREE.SphereGeometry(500, 60, 40);
                    geometry.scale(-1, 1, 1);
                    const material = new MeshBasicNodeMaterial({ color: 0x87ceeb });
                    const mesh = new THREE.Mesh(geometry, material);
                    this.panoramaScene.add(mesh);
                    resolve();
                }
            );
        });
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.floorplanScene.add(ambientLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemisphereLight.position.set(0, 20, 0);
        this.floorplanScene.add(hemisphereLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.floorplanScene.add(directionalLight);

        const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
        this.floorplanScene.add(gridHelper);

        // Add sample bathroom fixtures with node materials
        this.addSampleBathroom();
    }

    addSampleBathroom() {
        // Floor with node material
        const floorGeo = new THREE.PlaneGeometry(10, 10);
        const floorMat = new MeshStandardNodeMaterial({ 
            color: 0xf5f5f5,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.floorplanScene.add(floor);

        // Walls with node materials
        const wallMat = new MeshStandardNodeMaterial({ 
            color: 0xe0e0e0,
            roughness: 0.7,
            metalness: 0.1
        });

        const wall1 = new THREE.Mesh(new THREE.BoxGeometry(10, 2.7, 0.15), wallMat);
        wall1.position.set(0, 1.35, -5);
        wall1.castShadow = true;
        wall1.receiveShadow = true;
        this.floorplanScene.add(wall1);

        const wall2 = new THREE.Mesh(new THREE.BoxGeometry(10, 2.7, 0.15), wallMat);
        wall2.position.set(0, 1.35, 5);
        wall2.castShadow = true;
        wall2.receiveShadow = true;
        this.floorplanScene.add(wall2);

        const wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.7, 10), wallMat);
        wall3.position.set(-5, 1.35, 0);
        wall3.castShadow = true;
        wall3.receiveShadow = true;
        this.floorplanScene.add(wall3);

        const wall4 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.7, 10), wallMat);
        wall4.position.set(5, 1.35, 0);
        wall4.castShadow = true;
        wall4.receiveShadow = true;
        this.floorplanScene.add(wall4);

        // Bathtub with node material
        const bathtubMat = new MeshStandardNodeMaterial({ 
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.1
        });
        const bathtub = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.8), bathtubMat);
        bathtub.position.set(-3, 0.25, -4);
        bathtub.castShadow = true;
        bathtub.receiveShadow = true;
        this.floorplanScene.add(bathtub);

        // Toilet
        const toilet = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), bathtubMat);
        toilet.position.set(3, 0.3, -4);
        toilet.castShadow = true;
        toilet.receiveShadow = true;
        this.floorplanScene.add(toilet);

        // Sink
        const sink = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.5), bathtubMat);
        sink.position.set(-3, 0.9, 4);
        sink.castShadow = true;
        sink.receiveShadow = true;
        this.floorplanScene.add(sink);

        // Shower enclosure with node material
        const showerMat = new MeshStandardNodeMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1,
            metalness: 0.5
        });
        const shower = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), showerMat);
        shower.position.set(3, 1, 4);
        this.floorplanScene.add(shower);
    }

    setupEventListeners(container) {
        const panoramaCanvas = container.querySelector('#viewer-panorama-canvas');

        panoramaCanvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.isUserInteracting = true;
            this.onPointerDownMouseX = e.clientX;
            this.onPointerDownMouseY = e.clientY;
            this.onPointerDownLon = this.lon;
            this.onPointerDownLat = this.lat;
            panoramaCanvas.style.cursor = 'grabbing';
        });

        panoramaCanvas.addEventListener('pointermove', (e) => {
            if (this.isUserInteracting) {
                this.lon = (e.clientX - this.onPointerDownMouseX) * 0.15 + this.onPointerDownLon;
                this.lat = (e.clientY - this.onPointerDownMouseY) * 0.15 + this.onPointerDownLat;
            }
        });

        const pointerUpHandler = () => {
            this.isUserInteracting = false;
            panoramaCanvas.style.cursor = 'grab';
        };

        panoramaCanvas.addEventListener('pointerup', pointerUpHandler);
        panoramaCanvas.addEventListener('pointerleave', pointerUpHandler);

        panoramaCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const fov = this.panoramaCamera.fov + e.deltaY * 0.05;
            this.panoramaCamera.fov = THREE.MathUtils.clamp(fov, 25, 100);
            this.panoramaCamera.updateProjectionMatrix();
        }, { passive: false });

        const toggleBtn = container.querySelector('#viewer-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('change', () => this.toggleView());
        }

        window.addEventListener('resize', () => this.handleResize(container));
    }

    handleResize(container) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (this.panoramaCamera && this.panoramaRenderer) {
            this.panoramaCamera.aspect = width / height;
            this.panoramaCamera.updateProjectionMatrix();
            this.panoramaRenderer.setSize(width, height);
        }

        if (this.floorplanCamera && this.floorplanRenderer) {
            this.floorplanCamera.aspect = width / height;
            this.floorplanCamera.updateProjectionMatrix();
            this.floorplanRenderer.setSize(width, height);
        }
    }

    toggleView() {
        const panoramaCanvas = document.getElementById('viewer-panorama-canvas');
        const view3D = document.getElementById('viewer-3d-view');

        if (this.currentView === 'panorama') {
            this.currentView = '3d';
            panoramaCanvas.style.display = 'none';
            view3D.style.display = 'block';
        } else {
            this.currentView = 'panorama';
            panoramaCanvas.style.display = 'block';
            view3D.style.display = 'none';
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.currentView === 'panorama' && this.panoramaRenderer) {
            this.lat = Math.max(-89, Math.min(89, this.lat));
            const phi = THREE.MathUtils.degToRad(90 - this.lat);
            const theta = THREE.MathUtils.degToRad(this.lon);

            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.cos(phi);
            const z = Math.sin(phi) * Math.sin(theta);

            this.panoramaCamera.lookAt(x, y, z);
            
            // Use renderAsync for WebGPU compatibility
            if (this.panoramaRenderer.renderAsync) {
                this.panoramaRenderer.renderAsync(this.panoramaScene, this.panoramaCamera);
            } else {
                this.panoramaRenderer.render(this.panoramaScene, this.panoramaCamera);
            }
        } else if (this.currentView === '3d' && this.floorplanRenderer) {
            this.floorplanControls.update();
            
            // Use renderAsync for WebGPU compatibility
            if (this.floorplanRenderer.renderAsync) {
                this.floorplanRenderer.renderAsync(this.floorplanScene, this.floorplanCamera);
            } else {
                this.floorplanRenderer.render(this.floorplanScene, this.floorplanCamera);
            }
        }
    }
}

export { SharedViewer };

