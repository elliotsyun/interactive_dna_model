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

/* ========== Load Brain Model ========== */
// 1) Try local file (put at: assets/models/brain.glb)
const LOCAL_URL = '../assets/models/brain.glb?v=1';
// 2) Fallback: reliable remote sample model (BrainStem GLB, MIT-licensed)
const REMOTE_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Binary/BrainStem.glb';

const loader = new GLTFLoader();

async function loadWithFallback() {
    try {
        await loadOne(LOCAL_URL);
        console.log('Loaded brain from local file.');
    } catch (e1) {
        console.warn('Local brain.glb not found, using remote fallback.', e1);
        try {
            await loadOne(REMOTE_URL);
            console.log('Loaded brain from remote fallback.');
        } catch (e2) {
            console.error('Failed to load remote model:', e2);
            addPlaceholder('Could not load brain model. Showing placeholder.');
        }
    }
}

function loadOne(url) {
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
            // Center & scale
            const box = new THREE.Box3().setFromObject(root);
            const size = new THREE.Vector3(); box.getSize(size);
            const center = new THREE.Vector3(); box.getCenter(center);
            root.position.sub(center);
            const target = 1.6;
            const scale = target / Math.max(size.x, size.y, size.z || 1);
            root.scale.setScalar(scale);
            scene.add(root);
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
    if (autoRotate) scene.rotation.y += 0.002;
    controls.update();
    renderer.render(scene, camera);
}
function renderOnce() { controls.update(); renderer.render(scene, camera); }
animate();
