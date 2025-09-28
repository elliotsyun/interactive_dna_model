let viewer, model, selectedResidue = null, selectedLabel = null;

// Example initialization function (replace with your actual setup logic)
function initializeDNAViewer() {
    viewer.render();

    // Example: set up clickable atoms (replace with your actual event wiring)
    model.setClickable({}, (atom) => {
        if (!atom || atom.resi == null) return;
        selectedResidue = atom.resi;
        showResidueInfo(atom);
        applyStyles();
    });

    // Example: set up another event (replace with your actual event wiring)
    // If you have another event to set, do it here
    // For example:
    // model.setSomethingElseClickable({}, (atom) => {
    //     viewer.setStyle({ serial: atom.serial }, {});
    //     applyStyles();
    // });
}

// Call the initialization function (or do this after DOM/model is ready)
initializeDNAViewer();


function highlightResidue(resi) {
    viewer.setStyle({ resi }, { stick: { radius: 0.22, color: '#ffd166' } });
    const atoms = model.selectedAtoms({ resi });
    const center = centroid(atoms);
    if (selectedLabel) viewer.removeLabel(selectedLabel);
    selectedLabel = viewer.addLabel(`Residue ${resi}`,
        { position: center, backgroundColor: 'black', backgroundOpacity: 0.5, fontColor: 'white', fontSize: 14, padding: 4, borderThickness: 0 });
    viewer.render();
}


function centroid(atoms) {
    if (!atoms?.length) return { x: 0, y: 0, z: 0 };
    let x = 0, y = 0, z = 0; for (const a of atoms) { x += a.x; y += a.y; z += a.z; }
    const n = atoms.length; return { x: x / n, y: y / n, z: z / n };
}


function showResidueInfo(atom) {
    const resn = atom.resn || 'UNK';
    const resi = atom.resi ?? '?';
    const chain = atom.chain || 'A';
    const atomName = atom.atom || '';
    infoBox.innerHTML = `
<div><strong>Residue:</strong> ${resn} ${resi} (Chain ${chain})</div>
<div><strong>Clicked atom:</strong> ${atomName}</div>
<div><strong>Tip:</strong> Shift+drag to pan. Use the toggles above to change styles.</div>`;
}


// UI
btnReset.addEventListener('click', () => {
    selectedResidue = null;
    if (selectedLabel) { viewer.removeLabel(selectedLabel); selectedLabel = null; }
    viewer.zoomTo({}, 1000);
    applyStyles();
});
[cbSticks, cbCartoon, cbBases].forEach(cb => cb.addEventListener('change', applyStyles));


// Shared menu wiring, safe on this page as well
function wireMenu() {
    const hamburger = document.getElementById('hamburger');
    const sideMenu = document.getElementById('side-menu');
    const closeBtn = document.getElementById('close-menu');
    if (!hamburger || !sideMenu || !closeBtn) return; // don’t crash if elements absent
    hamburger.addEventListener('click', () => { sideMenu.setAttribute('aria-hidden', 'false'); hamburger.setAttribute('aria-expanded', 'true'); });
    closeBtn.addEventListener('click', () => { sideMenu.setAttribute('aria-hidden', 'true'); hamburger.setAttribute('aria-expanded', 'false'); });
    sideMenu.addEventListener('click', (e) => { if ((e.target).tagName === 'A') closeBtn.click(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBtn.click(); });
}