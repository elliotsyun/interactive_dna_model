// home.js
// Uses Three.js deps injected in homepage/index.html via window.threeDeps
const { THREE, GLTFLoader, OrbitControls } = window.threeDeps;

/* =========================
   Hamburger / Side Menu
   ========================= */
const hamburger = document.getElementById('hamburger');
const sideMenu = document.getElementById('side-menu');
const closeBtn = document.getElementById('close-menu');

function openMenu() {
    sideMenu.classList.add('open');
    sideMenu.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
}
function closeMenu() {
    sideMenu.classList.remove('open');
    sideMenu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
}
hamburger.addEventListener('click', openMenu);
closeBtn.addEventListener('click', closeMenu);
sideMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') closeMenu();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
});

/* =========================
   Three.js Scene Setup
   ========================= */
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
const key = new THREE.DirectionalLight(0xffffff, 0.8);
key.position.set(1, 1, 2);
scene.add(key);
const rim = new THREE.DirectionalLight(0x99bbff, 0.4);
rim.position.set(-2, 0.5, -1.5);
scene.add(rim);

/* =========================
   Load Brain Model (remote)
   ========================= */
// Prefer a local, checked-in brain model so the app uses a reproducible, accurate asset.
// If you want to try a different model, replace this path with another .glb in assets/models/.
const BRAIN_URL = '../assets/models/brain.glb';

const loader = new GLTFLoader();
loader.load(
    BRAIN_URL,
    (gltf) => {
        const root = gltf.scene;

        // Tweak materials just in case (make it look nicer under PBR lights)
        root.traverse((obj) => {
            if (obj.isMesh && obj.material) {
                // Normalize some material props if missing
                if (typeof obj.material.metalness !== 'number') obj.material.metalness = 0.1;
                if (typeof obj.material.roughness !== 'number') obj.material.roughness = 0.7;
            }
        });

        // Center and scale to fit
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        root.position.sub(center);

    const targetSize = 1.6; // Controls overall model size in view (tweak if model appears too small/large)
        const scale = targetSize / Math.max(size.x, size.y, size.z || 1);
        root.scale.setScalar(scale);

        scene.add(root);
        // Fit camera and controls to the loaded model so it fills the view.
        (function fitCameraToObject(object, camera, controls, offset = 1.25) {
            // Compute bounding box / sphere in world space
            const box = new THREE.Box3().setFromObject(object);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const sphere = new THREE.Sphere();
            box.getBoundingSphere(sphere);

            // Compute a distance that fits the whole object in the camera's fov
            const radius = sphere.radius;
            const fov = camera.fov * (Math.PI / 180);
            const distance = Math.abs(radius / Math.sin(fov / 2)) * offset;

            // Move camera along its current forward vector so the object is centered
            const dir = new THREE.Vector3().subVectors(camera.position, center).normalize();
            if (dir.lengthSq() === 0) dir.set(0, 0, 1);
            camera.position.copy(dir.multiplyScalar(distance).add(center));
            camera.near = Math.max(0.1, distance - radius * 2);
            camera.far = Math.max(1000, distance + radius * 2);
            camera.updateProjectionMatrix();

            // Point controls at the model center
            controls.target.copy(center);
            controls.update();
        })(root, camera, controls, 1.25);
    },
    undefined,
    (err) => {
        console.error('Error loading remote brain model:', err);
        // Simple placeholder so the page still shows something
        const geo = new THREE.IcosahedronGeometry(0.8, 2);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x65728a,
            roughness: 0.85,
            metalness: 0.15,
        });
        scene.add(new THREE.Mesh(geo, mat));
    }
);

/* =========================
   Resize Handling
   ========================= */
function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

/* =========================
   Reduced Motion + Animate
   ========================= */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let autoRotate = !prefersReduced;

function animate() {
    requestAnimationFrame(animate);
    if (autoRotate) scene.rotation.y += 0.002;
    controls.update();
    renderer.render(scene, camera);
}
animate();
