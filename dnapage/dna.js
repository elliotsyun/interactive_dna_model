// Get DOM elements
const viewerEl = document.getElementById('viewer');
const infoBox = document.getElementById('info-content');
const btnReset = document.getElementById('btn-reset');
const cbSticks = document.getElementById('cb-sticks');
const cbCartoon = document.getElementById('cb-cartoon');
const cbBases = document.getElementById('cb-bases');

// Initialize 3Dmol viewer
let viewer, model, selectedResidue = null, selectedLabel = null;

function initializeViewer() {
    // Create 3Dmol viewer
    let config = { backgroundColor: 'white' };
    viewer = $3Dmol.createViewer(viewerEl, config);
    
    // Load DNA structure from PDB (using a sample DNA structure)
    // You can replace this with your own PDB file
    fetch('https://files.rcsb.org/download/1BNA.pdb')
        .then(response => response.text())
        .then(pdbData => {
            viewer.addModel(pdbData, 'pdb');
            model = viewer.getModel();
            
            // Set default style
            applyStyles();
            
            // Set up click interactions
            viewer.setClickable({}, true, (atom) => {
                if (!atom || atom.resi == null) return;
                selectedResidue = atom.resi;
                showResidueInfo(atom);
                highlightResidue(atom.resi);
            });
            
            // Fit viewer to model
            viewer.zoomTo();
            viewer.render();
        })
        .catch(err => {
            console.error('Failed to load DNA model:', err);
            infoBox.innerHTML = '<p>Error loading DNA model. Please check the console.</p>';
        });
}

function applyStyles() {
    if (!viewer || !model) return;
    
    const showSticks = cbSticks?.checked ?? true;
    const showCartoon = cbCartoon?.checked ?? true;
    const colorBases = cbBases?.checked ?? true;
    
    viewer.setStyle({}, { cartoon: { showSticks: false } });
    
    if (showCartoon) {
        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
    }
    
    if (showSticks) {
        viewer.setStyle({}, { stick: { colorscheme: colorBases ? 'whiteCarbon' : 'default' } });
    }
    
    viewer.render();
}

function highlightResidue(resi) {
    if (!viewer || !model) return;
    
    // Clear previous highlighting
    viewer.setStyle({}, { stick: {} });
    
    // Highlight selected residue
    viewer.setStyle({ resi }, { stick: { radius: 0.22, color: '#ffd166' } });
    
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
    infoBox.innerHTML = '<div><strong>Residue:</strong> ' + resn + ' ' + resi + ' (Chain ' + chain + ')</div><div><strong>Atom:</strong> ' + atomName + '</div><div><strong>Tips:</strong> Drag to rotate • Scroll to zoom • Shift+drag to pan</div>';
}

// UI Event listeners
if (btnReset) {
    btnReset.addEventListener('click', () => {
        selectedResidue = null;
        if (selectedLabel && viewer) viewer.removeLabel(selectedLabel);
        selectedLabel = null;
        applyStyles();
        if (viewer) viewer.zoomTo();
        if (viewer) viewer.render();
    });
}

[cbSticks, cbCartoon, cbBases].forEach(cb => {
    if (cb) cb.addEventListener('change', applyStyles);
});

// Menu functionality
function wireMenu() {
    const hamburger = document.getElementById('hamburger');
    const sideMenu = document.getElementById('side-menu');
    const closeBtn = document.getElementById('close-menu');
    if (!hamburger || !sideMenu || !closeBtn) return;
    hamburger.addEventListener('click', () => { 
        sideMenu.setAttribute('aria-hidden', 'false'); 
        hamburger.setAttribute('aria-expanded', 'true'); 
    });
    closeBtn.addEventListener('click', () => { 
        sideMenu.setAttribute('aria-hidden', 'true'); 
        hamburger.setAttribute('aria-expanded', 'false'); 
    });
    sideMenu.addEventListener('click', (e) => { 
        if (e.target.tagName === 'A') closeBtn.click(); 
    });
    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape') closeBtn.click(); 
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeViewer();
    wireMenu();
});

// Also initialize immediately in case DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeViewer);
} else {
    initializeViewer();
    wireMenu();
}
