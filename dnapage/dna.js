// Get DOM elements
const viewerEl = document.getElementById('viewer');
const infoBox = document.getElementById('info-content');
const btnReset = document.getElementById('btn-reset');
const orientationCanvas = document.getElementById('orientation-canvas');
const orientationCtx = orientationCanvas ? orientationCanvas.getContext('2d') : null;

// Control elements
const representationSelect = document.getElementById('representation');
const colorschemeSelect = document.getElementById('colorscheme');
const backgroundSelect = document.getElementById('background');
const hydrogenCheckbox = document.getElementById('show-hydrogens');
const waterCheckbox = document.getElementById('show-water');

// Initialize 3Dmol viewer
let viewer, model, selectedResidue = null, selectedLabel = null;
let currentRepresentation = 'sticks';
let currentColorscheme = 'default';
let showHydrogens = false;
let showWaterMolecules = false;
let originalMatrix = null; // Store the original view matrix
let rotationX = 0; // Track rotation for orientation guide
let rotationY = 0;

function initializeViewer() {
    // Create 3Dmol viewer with black background and high resolution
    let config = { 
        backgroundColor: 'black',
        antialias: true,
        quality: 'high',
        disableWebGL: false
    };
    viewer = $3Dmol.createViewer(viewerEl, config);

    // Load DNA structure from PDB (1BNA - B-form DNA dodecamer)
    // This is the exact same model as RCSB uses
    fetch('https://files.rcsb.org/download/1BNA.pdb')
        .then(response => response.text())
        .then(pdbData => {
            viewer.addModel(pdbData, 'pdb');
            model = viewer.getModel();

            // Set default style
            applyRepresentation();

            // Set up click interactions
            viewer.setClickable({}, true, (atom) => {
                if (!atom || atom.resi == null) return;
                selectedResidue = atom.resi;
                showResidueInfo(atom);
                highlightResidue(atom.resi);
            });

            // Fit viewer to model and store original view
            viewer.zoomTo();
            originalMatrix = viewer.getView();
            viewer.render();

            // Start rendering the orientation guide immediately
            renderOrientationGuide();
        })
        .catch(err => {
            console.error('Failed to load DNA model:', err);
            infoBox.innerHTML = '<p>Error loading DNA model. Please check the console.</p>';
        });
}

function applyRepresentation() {
    if (!viewer || !model) return;

    // Clear all styles
    viewer.setStyle({}, {});

    const representation = representationSelect.value || 'sticks';
    const colorscheme = colorschemeSelect.value || 'default';

    // Build style object based on representation
    let styleObj = {};

    switch (representation) {
        case 'ball-stick':
            // Ball and stick - both sticks and spheres
            styleObj = { stick: { colorscheme }, sphere: { scale: 0.3, colorscheme } };
            break;
        case 'sticks':
            // Just sticks with bonds
            styleObj = { stick: { colorscheme } };
            break;
        case 'lines':
            // Simple wireframe lines
            styleObj = { line: { colorscheme } };
            break;
        case 'spacefill':
            // Space-filling spheres (van der Waals radii)
            styleObj = { sphere: { colorscheme } };
            break;
    }

    // Apply to all atoms in the DNA molecule
    viewer.setStyle({}, styleObj);

    // Apply hydrogens if enabled (separate rendering for visibility)
    // Note: Hydrogens in 1BNA are sparse but will show as small white spheres when enabled
    if (showHydrogens) {
        viewer.setStyle({ element: 'H' }, { sphere: { scale: 0.3, color: 'white' }, stick: { colorscheme: 'default' } });
    }

    // Apply water if enabled (typically shown as ball & stick)
    if (showWaterMolecules) {
        viewer.setStyle({ resn: 'HOH' }, { stick: { colorscheme: 'default' }, sphere: { scale: 0.25, color: 'red' } });
    }

    viewer.render();
}

function highlightResidue(resi) {
    if (!viewer || !model) return;

    // Reapply current style first
    applyRepresentation();

    // Highlight selected residue with both stick and sphere for visibility
    viewer.setStyle({ resi }, {
        stick: { radius: 0.22, color: '#ffd166' },
        sphere: { scale: 0.4, color: '#ffd166' }
    });

    if (selectedLabel) viewer.removeLabel(selectedLabel);
    selectedLabel = viewer.addLabel('Residue ' + resi,
        { position: { x: 0, y: 0, z: 0 }, backgroundColor: 'black', backgroundOpacity: 0.7, fontColor: 'white', fontSize: 12 });

    viewer.render();
}

function showResidueInfo(atom) {
    const resn = atom.resn || 'UNK';
    const resi = atom.resi ?? '?';
    const chain = atom.chain || 'A';
    const atomName = atom.atom || '';
    const element = atom.elem || '';
    const x = atom.x?.toFixed(2) || '?';
    const y = atom.y?.toFixed(2) || '?';
    const z = atom.z?.toFixed(2) || '?';

    infoBox.innerHTML = `
        <div><strong>Residue:</strong> ${resn} ${resi}</div>
        <div><strong>Chain:</strong> ${chain}</div>
        <div><strong>Atom:</strong> ${atomName}</div>
        <div><strong>Element:</strong> ${element}</div>
        <div><strong>Position (Ų):</strong></div>
        <div style="margin-left: 1rem; font-family: monospace; font-size: 0.85rem;">
            x: ${x}<br>y: ${y}<br>z: ${z}
        </div>
    `;
}

function changeBackground(color) {
    if (!viewer) return;

    let bgColor;
    switch (color) {
        case 'white':
            bgColor = 'white';
            break;
        case 'dark-gray':
            bgColor = '#2a2a2a';
            break;
        default:
            bgColor = 'black';
    }

    viewer.setBackgroundColor(bgColor);
    viewer.render();
}

function renderOrientationGuide() {
    if (!orientationCanvas || !orientationCtx) return;

    const ctx = orientationCtx;
    const w = 80;
    const h = 80;
    const cx = w / 2;
    const cy = h / 2;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(20, 20, 20, 1)';
    ctx.fillRect(0, 0, w, h);

    // Simple 3D projection without relying on viewer.getView()
    // Create rotation matrices based on tracked rotation
    const rx = rotationX; // rotation around X axis
    const ry = rotationY; // rotation around Y axis

    // Define axes as 3D vectors
    const axes = [
        { name: 'X', color: '#ff4444', v: [1, 0, 0] },
        { name: 'Y', color: '#44ff44', v: [0, 1, 0] },
        { name: 'Z', color: '#4444ff', v: [0, 0, 1] }
    ];

    // Apply rotation and project to 2D
    const projectedAxes = axes.map(axis => {
        let x = axis.v[0];
        let y = axis.v[1];
        let z = axis.v[2];

        // Rotate around Y axis
        let x1 = x * Math.cos(ry) + z * Math.sin(ry);
        let z1 = -x * Math.sin(ry) + z * Math.cos(ry);

        // Rotate around X axis
        let y1 = y * Math.cos(rx) - z1 * Math.sin(rx);
        let z2 = y * Math.sin(rx) + z1 * Math.cos(rx);

        return {
            name: axis.name,
            color: axis.color,
            px: x1,
            py: y1,
            pz: z2
        };
    });

    const axisLength = 18;

    // Draw axes
    projectedAxes.forEach(axis => {
        const x = axis.px * axisLength;
        const y = axis.py * axisLength;

        // Draw line
        ctx.strokeStyle = axis.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + x, cy - y);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(-y, x);
        const arrowSize = 4;
        ctx.fillStyle = axis.color;
        ctx.beginPath();
        ctx.moveTo(cx + x, cy - y);
        ctx.lineTo(cx + x - arrowSize * Math.cos(angle - Math.PI / 6), cy - y + arrowSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(cx + x - arrowSize * Math.cos(angle + Math.PI / 6), cy - y + arrowSize * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // Draw label (only if axis is facing somewhat forward)
        if (axis.pz > -0.5) {
            ctx.fillStyle = axis.color;
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelDist = axisLength + 12;
            ctx.fillText(axis.name, cx + axis.px * labelDist, cy - axis.py * labelDist);
        }
    });

    // Draw center dot
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    // Continue animation
    requestAnimationFrame(renderOrientationGuide);
}// UI Event listeners
if (btnReset) {
    btnReset.addEventListener('click', () => {
        selectedResidue = null;
        if (selectedLabel && viewer) viewer.removeLabel(selectedLabel);
        selectedLabel = null;
        // Reset to default: sticks style and default coloring
        representationSelect.value = 'sticks';
        colorschemeSelect.value = 'default';
        if (hydrogenCheckbox) hydrogenCheckbox.checked = false;
        if (waterCheckbox) waterCheckbox.checked = false;
        showHydrogens = false;
        showWaterMolecules = false;
        currentRepresentation = 'sticks';
        currentColorscheme = 'default';
        applyRepresentation();
        // Reset orientation guide angles
        rotationX = 0;
        rotationY = 0;
        // Reset viewer: recreate the initial clean view state
        if (viewer) {
            // Get initial orientation by zooming to fit all atoms
            viewer.zoomTo();
            // Clear any accumulated rotation by using identity matrix reset
            viewer.setView([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
            viewer.zoomTo();
            viewer.render();
        }
    });
}

// Mouse tracking for orientation guide
let lastMouseX = 0;
let lastMouseY = 0;
let isDragging = false;

viewerEl.addEventListener('mousedown', () => {
    isDragging = true;
});

viewerEl.addEventListener('mouseup', () => {
    isDragging = false;
});

viewerEl.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.movementX || 0;
    const deltaY = e.movementY || 0;
    
    // Update rotation angles for orientation guide visualization only
    rotationY += deltaX * 0.01; // Rotate around Y axis with X mouse movement
    rotationX += deltaY * 0.01; // Rotate around X axis with Y mouse movement
});

// Representation selector
if (representationSelect) {
    representationSelect.addEventListener('change', (e) => {
        currentRepresentation = e.target.value;
        selectedResidue = null;
        if (selectedLabel && viewer) viewer.removeLabel(selectedLabel);
        selectedLabel = null;
        applyRepresentation();
    });
}

// Colorscheme selector
if (colorschemeSelect) {
    colorschemeSelect.addEventListener('change', (e) => {
        currentColorscheme = e.target.value;
        selectedResidue = null;
        if (selectedLabel && viewer) viewer.removeLabel(selectedLabel);
        selectedLabel = null;
        applyRepresentation();
    });
}

// Background selector
if (backgroundSelect) {
    backgroundSelect.addEventListener('change', (e) => {
        changeBackground(e.target.value);
    });
}

// Hydrogen checkbox
if (hydrogenCheckbox) {
    hydrogenCheckbox.addEventListener('change', (e) => {
        showHydrogens = e.target.checked;
        selectedResidue = null;
        if (selectedLabel && viewer) viewer.removeLabel(selectedLabel);
        selectedLabel = null;
        applyRepresentation();
    });
}

// Water checkbox
if (waterCheckbox) {
    waterCheckbox.addEventListener('change', (e) => {
        showWaterMolecules = e.target.checked;
        selectedResidue = null;
        if (selectedLabel && viewer) viewer.removeLabel(selectedLabel);
        selectedLabel = null;
        applyRepresentation();
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeViewer();
});

// Also initialize immediately in case DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeViewer);
} else {
    initializeViewer();
}
