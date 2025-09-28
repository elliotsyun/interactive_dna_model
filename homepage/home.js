import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';


/* ========== Menu (shared) ========== */
const hamburger = document.getElementById('hamburger');
oneventSafe(hamburger, 'click', () => toggleMenu(true));
const sideMenu = document.getElementById('side-menu');
const closeBtn = document.getElementById('close-menu');
oneventSafe(closeBtn, 'click', () => toggleMenu(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });
sideMenu?.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof HTMLElement && target.tagName === 'A') toggleMenu(false);
});
function toggleMenu(open) { if (!sideMenu || !hamburger) return; sideMenu.setAttribute('aria-hidden', String(!open)); hamburger.setAttribute('aria-expanded', String(open)); }
function oneventSafe(el, type, handler) { if (el) el.addEventListener(type, handler); }


/* ========== Three.js ========== */
const canvas = document.getElementById('brain-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1115);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 0.6, 2.2);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 1.2; controls.maxDistance = 6;
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(1, 1, 2); scene.add(key);
const rim = new THREE.DirectionalLight(0x99bbff, 0.4); rim.position.set(-2, .5, -1.5); scene.add(rim);


/* ========== Load Brain Model (robust path) ========== */
const MODEL_URL = new URL('../assets/models/brain.glb?v=4', import.meta.url).href; // resolves correctly on GH Pages
const loader = new GLTFLoader();


try {
    const gltf = await loader.loadAsync(MODEL_URL);
    const root = gltf.scene;
    root.traverse((o) => { if (o.isMesh && o.material) { o.material.metalness ??= 0.1; o.material.roughness ??= 0.7; } });
    // Center model without altering scale
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.sub(center);
    scene.add(root);
    fitTo(root, camera, controls, 1.25);
} catch (err) {
    console.error('Brain model failed to load:', err);
    addPlaceholder('Brain model failed to load');
}


function fitTo(object, camera, controls, offset = 1.25) {
    const box = new THREE.Box3().setFromObject(object);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = sphere.radius;
    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.abs(radius / Math.sin(fov / 2)) * offset;
    const dir = camera.position.clone().sub(sphere.center).normalize();
    if (dir.lengthSq() === 0) dir.set(0, 0, 1);
    camera.position.copy(dir.multiplyScalar(distance).add(sphere.center));
    camera.near = Math.max(0.1, distance - radius * 2);
    camera.far = Math.max(200, distance + radius * 2);
    camera.updateProjectionMatrix();
}