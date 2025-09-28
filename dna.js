// dna.js
let viewer, model, selectedResidue = null, selectedLabel = null;

const infoBox = document.getElementById('info-content');
const btnReset = document.getElementById('btn-reset');
const cbSticks = document.getElementById('cb-sticks');
const cbCartoon = document.getElementById('cb-cartoon');
const cbBases = document.getElementById('cb-bases');

function initViewer() {
    viewer = $3Dmol.createViewer('viewer', {
        backgroundColor: 0x0f1115, antialias: true
    });

    // Load an accurate, canonical B-DNA (Dickerson–Drew dodecamer)
    // Uses RCSB resolver built into 3Dmol: 'pdb:1BNA'
    $3Dmol.download('pdb:1BNA', viewer, {}, () => {
        model = viewer.getModel();

        // Base-aware coloring (A/T/G/C) if desired
        applyStyles();

        viewer.zoomTo(); // frame the structure
        viewer.render();

        // Make whole model hoverable/clickable
        addInteractivity();
    });
}

function applyStyles() {
    // Clear styles and labels
    viewer.setStyle({}, {});
    if (selectedLabel) { viewer.removeLabel(selectedLabel); selectedLabel = null; }

    // Cartoon backbone
    if (cbCartoon.checked) {
        viewer.setStyle({}, { cartoon: { color: '#65728a', opacity: 0.9, thickness: 0.6 } });
    }

    // Sticks for bases
    if (cbSticks.checked) {
        if (cbBases.checked) {
            viewer.setStyle({ resn: 'DA' }, { stick: { color: '#4cc9f0', radius: 0.12 } }); // Adenine (deoxy)
            viewer.setStyle({ resn: 'DT' }, { stick: { color: '#f72585', radius: 0.12 } }); // Thymine
            viewer.setStyle({ resn: 'DG' }, { stick: { color: '#b5179e', radius: 0.12 } }); // Guanine
            viewer.setStyle({ resn: 'DC' }, { stick: { color: '#4895ef', radius: 0.12 } }); // Cytosine
        } else {
            viewer.setStyle({}, { stick: { radius: 0.12, colorscheme: 'element' } });
        }
    }

    // If something is selected, keep it highlighted
    if (selectedResidue != null) {
        highlightResidue(selectedResidue);
    }

    viewer.render();
}

function addInteractivity() {
    // Subtle hover outline on any atom (turns on/off with callbacks)
    model.setHoverable({}, true,
        function onHover(atom) {
            viewer.setStyle({ serial: atom.serial }, { sphere: { radius: 0.4, color: 'yellow', opacity: 0.6 } });
            viewer.render();
        },
        function offHover(atom) {
            // remove hover sphere without disturbing main styles/selection
            viewer.setStyle({ serial: atom.serial }, {});
            // reapply base/backbone styles so the atom returns to normal
            applyStyles();
        }
    );

    // Click to select the whole residue (nucleotide)
    model.setClickable({}, function onClick(atom) {
        if (!atom || atom.resi == null) return;
        selectedResidue = atom.resi;
        showResidueInfo(atom);
        applyStyles(); // reapplies and calls highlightResidue
    });
}

function highlightResidue(resi) {
    // Thicker sticks + brighter color on selected residue
    viewer.setStyle({ resi }, { stick: { radius: 0.22, color: '#ffd166' } });

    // Add/update label near residue centroid
    const atoms = model.selectedAtoms({ resi });
    const center = centroid(atoms);
    if (selectedLabel) viewer.removeLabel(selectedLabel);
    selectedLabel = viewer.addLabel(`Residue ${resi}`, {
        position: center, backgroundColor: 'black', backgroundOpacity: 0.5,
        fontColor: 'white', fontSize: 14, padding: 4, borderThickness: 0
    });

    viewer.render();
}

function centroid(atoms) {
    if (!atoms || !atoms.length) return { x: 0, y: 0, z: 0 };
    let x = 0, y = 0, z = 0;
    for (const a of atoms) { x += a.x; y += a.y; z += a.z; }
    const n = atoms.length;
    return { x: x / n, y: y / n, z: z / n };
}

function showResidueInfo(atom) {
    // Collect basic fields (residue name/code, chain, index)
    const resn = atom.resn || 'UNK';
    const resi = atom.resi ?? '?';
    const chain = atom.chain || 'A';
    const atomName = atom.atom || '';

    infoBox.innerHTML = `
    <div><strong>Residue:</strong> ${resn} ${resi} (Chain ${chain})</div>
    <div><strong>Clicked atom:</strong> ${atomName}</div>
    <div><strong>Tip:</strong> Shift+drag to pan. Use the toggles above to change styles.</div>
  `;
}

// UI events
btnReset.addEventListener('click', () => {
    selectedResidue = null;
    if (selectedLabel) { viewer.removeLabel(selectedLabel); selectedLabel = null; }
    viewer.zoomTo({}, 1000); // animate
    applyStyles();
});

[cbSticks, cbCartoon, cbBases].forEach(cb => {
    cb.addEventListener('change', applyStyles);
});

// Kick off
initViewer();
