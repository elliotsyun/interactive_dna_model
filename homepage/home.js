// home.js
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

/* ========== Menu ========== */
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('side-menu');
const closeBtn = document.getElementById('close-menu');
hamburger.addEventListener('click', () => {
    sideMenu.classList.add('open');
    sideMenu.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
});
closeBtn.addEventListener('click', () => {
    sideMenu.classList.remove('open');
    sideMenu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
});
sideMenu.addEventListener('click', (e) => { if (e.target.tagName === 'A') closeBtn.click(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBtn.click(); });

/* ========== Three.js ========== */
const canvas = document.getElementById('brain-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1115);

// Remove axes and grid helpers
// const axesHelper = new THREE.AxesHelper(2);
// scene.add(axesHelper);
// const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
// grid.position.y = -2;
// scene.add(grid);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0.6, 2.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.2;
controls.maxDistance = 6;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(1, 1, 2); scene.add(key);
const rim = new THREE.DirectionalLight(0x99bbff, 0.4); rim.position.set(-2, 0.5, -1.5); scene.add(rim);

/* ========== Load Brain Models ========== */
// Model path for GitHub Pages (and local development)
const LOCAL_URL = '/interactive_dna_model/assets/models/brain.glb?v=4';

// Load your model
const loader = new GLTFLoader();

async function loadWithFallback() {
    try {
        console.log('Loading brain model...');
        await loadOne(LOCAL_URL, scene, 'Your Model');
    } catch (error) {
        console.error('Failed to load brain model:', error);
        addPlaceholder('Brain model failed to load', scene);
    }
}

function loadOne(url, targetScene, label = 'Model') {
    console.log('Attempting to load model from:', url);
    return new Promise((resolve, reject) => {
        loader.load(url, (gltf) => {
            const root = gltf.scene;
            // Material polish
            root.traverse((o) => {
                if (o.isMesh && o.material) {
                    if (typeof o.material.metalness !== 'number') o.material.metalness = 0.1;
                    if (typeof o.material.roughness !== 'number') o.material.roughness = 0.7;
                }
            });
            // Center the model (preserve original scale/units for anatomical accuracy).
            const box = new THREE.Box3().setFromObject(root);
            const size = new THREE.Vector3(); box.getSize(size);
            const center = new THREE.Vector3(); box.getCenter(center);
            root.position.sub(center);

            targetScene.add(root);

            // Add visual debug helper to show model bounds
            const boxHelper = new THREE.Box3Helper(
                new THREE.Box3().setFromObject(root),
                new THREE.Color(0x00ff00)
            );
            scene.add(boxHelper);
            console.log('Added box helper to visualize model bounds');

            // Diagnostic + safety: collect stats and ensure the model is visible.
            (function modelDiagnostics(object) {
                const boxD = new THREE.Box3().setFromObject(object);
                const sizeD = new THREE.Vector3(); boxD.getSize(sizeD);
                const centerD = new THREE.Vector3(); boxD.getCenter(centerD);
                const sphereD = new THREE.Sphere(); boxD.getBoundingSphere(sphereD);

                // Count meshes, vertices, triangles
                let meshCount = 0, vertexCount = 0, triCount = 0;
                const materials = new Map();
                object.traverse((n) => {
                    if (n.isMesh && n.geometry) {
                        meshCount++;
                        const pos = n.geometry.attributes.position;
                        if (pos) vertexCount += pos.count;
                        if (n.geometry.index) triCount += n.geometry.index.count / 3;
                        else if (pos) triCount += pos.count / 3;
                        if (n.material) {
                            const key = (n.material.name || n.material.type || 'material');
                            materials.set(key, (materials.get(key) || 0) + 1);
                        }
                    }
                });

                const diag = {
                    box: { min: boxD.min.toArray(), max: boxD.max.toArray(), size: sizeD.toArray(), center: centerD.toArray() },
                    boundingSphereRadius: sphereD.radius,
                    meshCount, vertexCount, triCount,
                    materials: Array.from(materials.entries()),
                    camera: { position: camera.position.toArray(), near: camera.near, far: camera.far },
                };
                console.group('Model diagnostics');
                console.log('Model dimensions:', {
                    width: sizeD.x.toFixed(2),
                    height: sizeD.y.toFixed(2),
                    depth: sizeD.z.toFixed(2),
                    radius: sphereD.radius.toFixed(2)
                });
                console.log('Mesh stats:', {
                    meshes: meshCount,
                    vertices: vertexCount,
                    triangles: triCount
                });
                console.log('Position in space:', {
                    center: centerD.toArray().map(v => v.toFixed(2)),
                    scale: object.scale.toArray().map(v => v.toFixed(2))
                });
                console.log('Full diagnostics:', diag);
                console.groupEnd();

                // If bounding sphere radius is zero (or extremely small), auto-scale as a fallback
                if (!sphereD.radius || sphereD.radius < 1e-6) {
                    console.warn('Model bounding radius is zero; applying AUTO_SCALE fallback to make it visible.');
                    const fallbackTarget = 1.6;
                    const scale = fallbackTarget / Math.max(sizeD.x, sizeD.y, sizeD.z || 1);
                    object.scale.setScalar(scale);
                }

                // Add a small floating button to re-print diagnostics on demand
                if (!document.getElementById('model-info-btn')) {
                    const b = document.createElement('button');
                    b.id = 'model-info-btn';
                    b.textContent = 'Model Info';
                    b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9999;padding:.4rem .6rem;border-radius:.35rem;background:#121214;color:#fff;border:none;cursor:pointer;opacity:0.85';
                    b.title = 'Print model diagnostics to console';
                    b.addEventListener('click', () => console.log('Model diagnostics (on demand):', diag));
                    document.body.appendChild(b);
                }
            })(root);

            // Fit camera to the loaded model without changing model scale.
            (function fitCameraToObject(object, camera, controls, offset = 1.25) {
                const box2 = new THREE.Box3().setFromObject(object);
                const center2 = new THREE.Vector3(); box2.getCenter(center2);
                const sphere = new THREE.Sphere(); box2.getBoundingSphere(sphere);
                const radius = sphere.radius;
                const fov = camera.fov * (Math.PI / 180);
                const distance = Math.abs(radius / Math.sin(fov / 2)) * offset;
                const dir = new THREE.Vector3().subVectors(camera.position, center2).normalize();
                if (dir.lengthSq() === 0) dir.set(0, 0, 1);
                camera.position.copy(dir.multiplyScalar(distance).add(center2));
                camera.near = Math.max(0.1, distance - radius * 2);
                camera.far = Math.max(1000, distance + radius * 2);
                camera.updateProjectionMatrix();
                controls.target.copy(center2);
                controls.update();
            })(root, camera, controls, 1.25);

            renderOnce();
            resolve();
        }, undefined, reject);
    });
}

function addPlaceholder(message) {
    const geo = new THREE.IcosahedronGeometry(0.8, 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x65728a, roughness: 0.85, metalness: 0.15 });
    scene.add(new THREE.Mesh(geo, mat));
    if (message) banner(message);
    renderOnce();
}

function banner(text) {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;left:50%;top:70px;transform:translateX(-50%);background:#b00020;color:#fff;padding:.5rem .75rem;border-radius:.4rem;z-index:9999';
    div.textContent = text;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

await loadWithFallback();

/* ========== Resize & Animate ========== */
function resize() {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || (window.innerHeight - 56);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let autoRotate = !prefersReduced;

function animate() {
    requestAnimationFrame(animate);
    if (autoRotate) {
        // Rotate around model's center instead of scene origin
        const modelCenter = new THREE.Vector3();
        const box = new THREE.Box3().setFromObject(scene);
        box.getCenter(modelCenter);

        // Move to center, rotate, move back
        scene.position.sub(modelCenter);
        scene.rotation.y += 0.002;
        scene.position.add(modelCenter);
    }
    controls.update();
    renderer.render(scene, camera);
}
function renderOnce() { controls.update(); renderer.render(scene, camera); }
animate();
