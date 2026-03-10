// ═══════════════════════════════════════════════════════════
//  DNA VIEWER — NeuroArt Research Lab, Virginia Tech
// ═══════════════════════════════════════════════════════════

// ── DOM references ──────────────────────────────────────────
const viewerEl          = document.getElementById('viewer');
const infoBox           = document.getElementById('info-content');
const infoBadge         = document.getElementById('info-badge');
const btnReset          = document.getElementById('btn-reset');
const loadingOverlay    = document.getElementById('loading-overlay');
const orientationCanvas = document.getElementById('orientation-canvas');
const orientationCtx    = orientationCanvas?.getContext('2d') ?? null;
const measureSection    = document.getElementById('measure-section');
const btnMeasure        = document.getElementById('btn-measure');
const measureResult     = document.getElementById('measure-result');
const legendEl          = document.getElementById('legend');
const legendItems       = document.getElementById('legend-items');
const zoomInBtn         = document.getElementById('zoom-in');
const zoomOutBtn        = document.getElementById('zoom-out');
const hbondCheckbox     = document.getElementById('show-hbonds');
const grooveCheckbox    = document.getElementById('show-grooves');

const representationSelect = document.getElementById('representation');
const colorschemeSelect    = document.getElementById('colorscheme');
const backgroundSelect     = document.getElementById('background');
const waterCheckbox        = document.getElementById('show-water');

// ── State ────────────────────────────────────────────────────
let viewer, model;
let selectedAtom   = null;
let selectedLabel  = null;
let showWater      = false;
let showHBonds     = false;
let showGrooves    = false;
let hbondShapes    = [];
let rotationX      = 0;
let rotationY      = 0;
let isDragging     = false;
let helixCenter    = { x: 0, y: 0, z: 0 };
let savedView      = null;

// ── Residue knowledge base ───────────────────────────────────
const RESIDUE_INFO = {
  DA: {
    fullName: 'Deoxyadenosine',
    shortCode: 'A',
    type: 'Purine',
    pairs: 'T',
    hbonds: 2,
    color: '#ff6b6b',
    description: 'A purine nucleoside consisting of adenine attached to a 2′-deoxyribose sugar via a β-N9-glycosidic bond. Adenine forms two Watson-Crick hydrogen bonds with thymine, stabilizing the B-form double helix. Its bicyclic ring system contributes to π-stacking interactions between adjacent base pairs (Saenger, 1984).',
  },
  DT: {
    fullName: 'Thymidine',
    shortCode: 'T',
    type: 'Pyrimidine',
    pairs: 'A',
    hbonds: 2,
    color: '#5b8aff',
    description: 'A pyrimidine 2′-deoxynucleoside unique to DNA (replaced by uridine in RNA). Thymine forms two hydrogen bonds with adenine via N3–H···N1 and O4···H–N6 interactions. The 5-methyl group projects into the major groove, providing a hydrophobic handle for protein recognition (Watson & Crick, 1953).',
  },
  DG: {
    fullName: 'Deoxyguanosine',
    shortCode: 'G',
    type: 'Purine',
    pairs: 'C',
    hbonds: 3,
    color: '#3dffa0',
    description: 'A purine nucleoside bearing guanine, which forms three Watson-Crick hydrogen bonds with cytosine: O6···H–N4, N1–H···N3, and N2–H···O2. The G-C pair is the most thermodynamically stable canonical base pair, conferring significant duplex rigidity (Bloomfield et al., 2000).',
  },
  DC: {
    fullName: 'Deoxycytidine',
    shortCode: 'C',
    type: 'Pyrimidine',
    pairs: 'G',
    hbonds: 3,
    color: '#ffd166',
    description: 'A pyrimidine 2′-deoxynucleoside whose base, cytosine, accepts and donates three hydrogen bonds in its canonical pairing with guanine. Cytosine methylation at C5 by DNMT enzymes is a critical epigenetic mark regulating gene expression in eukaryotes (Bird, 2002).',
  },
  HOH: {
    fullName: 'Water (Structural)',
    shortCode: 'W',
    type: 'Solvent',
    pairs: '—',
    hbonds: null,
    color: '#4ab8ff',
    description: 'Ordered water molecules in the minor groove form a "spine of hydration" that is a structural hallmark of B-DNA. This network, first described by Drew & Dickerson (1981) in the 1BNA crystal, contributes substantially to groove geometry and protein-DNA recognition.',
  },
};

// ── SVG base diagrams ────────────────────────────────────────
// Chemically accurate 2D skeletal structures.
// Purines: fused pyrimidine (6-membered) + imidazole (5-membered) rings.
// Pyrimidines: single 6-membered ring with correct substituent positions.
// Ring atoms at correct vertices; N atoms marked with dots; functional groups labeled.
const BASE_SVG = {

  // Adenine: 6-aminopurine
  // Pyrimidine ring: N1(bottom-left)–C2–N3(top-left)–C4–C5–C6, fused to
  // Imidazole ring:  C4–C5–N7–C8–N9 sharing the C4–C5 bond
  A: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Pyrimidine ring (left hexagon) -->
    <polygon points="22,68 14,50 22,32 42,26 54,40 46,62"
             stroke="#ff6b6b" stroke-width="1.8" stroke-linejoin="round"/>
    <!-- Imidazole ring (right pentagon), sharing C4(42,26)–C5(54,40) -->
    <polygon points="42,26 54,40 68,36 70,20 55,13"
             stroke="#ff6b6b" stroke-width="1.8" stroke-linejoin="round"/>
    <!-- N atom markers -->
    <circle cx="14"  cy="50" r="2.4" fill="#3050f8"/><!-- N1 (WC H-bond acceptor) -->
    <circle cx="22"  cy="32" r="2.4" fill="#3050f8"/><!-- N3 (minor groove) -->
    <circle cx="68"  cy="36" r="2.4" fill="#3050f8"/><!-- N7 (major groove) -->
    <circle cx="55"  cy="13" r="2.4" fill="#3050f8"/><!-- N9 (glycosidic) -->
    <!-- NH2 at C6 (top of pyrimidine ring, H-bond donor, WC) -->
    <line x1="42" y1="26" x2="38" y2="14" stroke="#a8d8ff" stroke-width="1.3"/>
    <text x="30" y="12" font-size="8" fill="#a8d8ff" font-family="monospace">NH₂</text>
    <!-- Center label -->
    <text x="37" y="52" font-size="11" fill="#ff6b6b" font-family="monospace" font-weight="bold">A</text>
    <!-- Bond type hint -->
    <text x="54" y="90" font-size="6.5" fill="#7a8499" font-family="monospace" text-anchor="middle">purine</text>
  </svg>`,

  // Thymine: 5-methyl-2,4-dioxopyrimidine
  // Flat-top hexagon. N1 bottom-left (glycosidic), N3 bottom-right (WC H-bond donor).
  // O2 at top-left vertex, O4 at top-right vertex. CH3 at C5 (right side).
  T: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Pyrimidine ring, flat-top hexagon -->
    <polygon points="50,20 74,34 74,62 50,76 26,62 26,34"
             stroke="#5b8aff" stroke-width="1.8" stroke-linejoin="round"/>
    <!-- N atom markers: N1 bottom-left, N3 bottom-right -->
    <circle cx="26" cy="62" r="2.4" fill="#3050f8"/><!-- N1 -->
    <circle cx="74" cy="62" r="2.4" fill="#3050f8"/><!-- N3 (WC H-bond donor, N3-H) -->
    <!-- O2 at C2 (top-left bond): carbonyl, H-bond acceptor -->
    <line x1="26" y1="34" x2="14" y2="26" stroke="#ff4444" stroke-width="1.4"/>
    <text x="4"  y="25" font-size="9" fill="#ff4444" font-family="monospace" font-weight="bold">O</text>
    <!-- O4 at C4 (top-right bond): carbonyl, WC H-bond acceptor -->
    <line x1="74" y1="34" x2="86" y2="26" stroke="#ff4444" stroke-width="1.4"/>
    <text x="87" y="25" font-size="9" fill="#ff4444" font-family="monospace" font-weight="bold">O</text>
    <!-- CH3 at C5 (right vertex, projects into major groove) -->
    <line x1="74" y1="48" x2="90" y2="48" stroke="#aaaaaa" stroke-width="1.3"/>
    <text x="91" y="52" font-size="7.5" fill="#aaaaaa" font-family="monospace">CH₃</text>
    <!-- Center label -->
    <text x="50" y="54" font-size="11" fill="#5b8aff" font-family="monospace" font-weight="bold" text-anchor="middle">T</text>
    <text x="50" y="90" font-size="6.5" fill="#7a8499" font-family="monospace" text-anchor="middle">pyrimidine</text>
  </svg>`,

  // Guanine: 2-amino-6-oxopurine
  // Same fused ring topology as adenine.
  // O6 at C6 (top, major groove, WC H-bond acceptor).
  // N1-H donor (WC). N2-H2 amino at C2 (minor groove, WC H-bond donor).
  G: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Pyrimidine ring -->
    <polygon points="22,68 14,50 22,32 42,26 54,40 46,62"
             stroke="#3dffa0" stroke-width="1.8" stroke-linejoin="round"/>
    <!-- Imidazole ring -->
    <polygon points="42,26 54,40 68,36 70,20 55,13"
             stroke="#3dffa0" stroke-width="1.8" stroke-linejoin="round"/>
    <!-- N atom markers -->
    <circle cx="14"  cy="50" r="2.4" fill="#3050f8"/><!-- N1 (WC H-bond donor, N1-H) -->
    <circle cx="22"  cy="32" r="2.4" fill="#3050f8"/><!-- N3 -->
    <circle cx="68"  cy="36" r="2.4" fill="#3050f8"/><!-- N7 (major groove) -->
    <circle cx="55"  cy="13" r="2.4" fill="#3050f8"/><!-- N9 (glycosidic) -->
    <!-- O6 at C6: carbonyl, WC H-bond acceptor (major groove) -->
    <line x1="42" y1="26" x2="38" y2="14" stroke="#ff4444" stroke-width="1.4"/>
    <text x="31" y="12" font-size="9" fill="#ff4444" font-family="monospace" font-weight="bold">O</text>
    <!-- N2-H2 amino at C2: H-bond donor (minor groove + WC) -->
    <line x1="22" y1="68" x2="14" y2="80" stroke="#a8d8ff" stroke-width="1.3"/>
    <text x="3"  y="89" font-size="8" fill="#a8d8ff" font-family="monospace">NH₂</text>
    <!-- Center label -->
    <text x="37" y="52" font-size="11" fill="#3dffa0" font-family="monospace" font-weight="bold">G</text>
    <text x="54" y="90" font-size="6.5" fill="#7a8499" font-family="monospace" text-anchor="middle">purine</text>
  </svg>`,

  // Cytosine: 4-amino-2-oxopyrimidine
  // Flat-top hexagon. N1 bottom-left (glycosidic), N3 right vertex (WC H-bond acceptor).
  // O2 at top-left. N4-H2 amino at top-right (WC H-bond donor).
  C: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Pyrimidine ring -->
    <polygon points="50,20 74,34 74,62 50,76 26,62 26,34"
             stroke="#ffd166" stroke-width="1.8" stroke-linejoin="round"/>
    <!-- N atom markers: N1 bottom-left, N3 right vertex -->
    <circle cx="26" cy="62" r="2.4" fill="#3050f8"/><!-- N1 (glycosidic) -->
    <circle cx="74" cy="48" r="2.4" fill="#3050f8"/><!-- N3 (WC H-bond acceptor) -->
    <!-- O2 at C2 (top-left bond): carbonyl, WC H-bond acceptor -->
    <line x1="26" y1="34" x2="14" y2="26" stroke="#ff4444" stroke-width="1.4"/>
    <text x="4"  y="25" font-size="9" fill="#ff4444" font-family="monospace" font-weight="bold">O</text>
    <!-- N4-H2 amino at C4 (top-right bond): WC H-bond donor -->
    <line x1="74" y1="34" x2="86" y2="26" stroke="#a8d8ff" stroke-width="1.3"/>
    <text x="87" y="25" font-size="8" fill="#a8d8ff" font-family="monospace">NH₂</text>
    <!-- Center label -->
    <text x="50" y="54" font-size="11" fill="#ffd166" font-family="monospace" font-weight="bold" text-anchor="middle">C</text>
    <text x="50" y="90" font-size="6.5" fill="#7a8499" font-family="monospace" text-anchor="middle">pyrimidine</text>
  </svg>`,

  // Water: H2O with accurate bent geometry (104.5° H–O–H bond angle)
  W: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- O atom at center -->
    <circle cx="50" cy="55" r="9" fill="rgba(74,184,255,0.18)" stroke="#4ab8ff" stroke-width="1.8"/>
    <text x="50" y="59" font-size="9.5" fill="#4ab8ff" font-family="monospace" font-weight="bold" text-anchor="middle">O</text>
    <!-- O–H bonds at 104.5° angle (52.25° each side from vertical) -->
    <!-- Left H: angle ~-142° from positive x -->
    <line x1="43" y1="48" x2="24" y2="30" stroke="#cccccc" stroke-width="1.6"/>
    <circle cx="20" cy="26" r="6" fill="rgba(200,200,200,0.12)" stroke="#bbbbbb" stroke-width="1.5"/>
    <text x="20" y="29.5" font-size="8.5" fill="#cccccc" font-family="monospace" font-weight="bold" text-anchor="middle">H</text>
    <!-- Right H -->
    <line x1="57" y1="48" x2="76" y2="30" stroke="#cccccc" stroke-width="1.6"/>
    <circle cx="80" cy="26" r="6" fill="rgba(200,200,200,0.12)" stroke="#bbbbbb" stroke-width="1.5"/>
    <text x="80" y="29.5" font-size="8.5" fill="#cccccc" font-family="monospace" font-weight="bold" text-anchor="middle">H</text>
    <!-- Lone pair dots (two pairs below O) -->
    <circle cx="44" cy="64" r="2"  fill="#4ab8ff" opacity="0.65"/>
    <circle cx="56" cy="64" r="2"  fill="#4ab8ff" opacity="0.65"/>
    <!-- Bond angle arc -->
    <path d="M 30 36 Q 50 60 70 36" stroke="#4ab8ff" stroke-width="0.9" fill="none"
          opacity="0.35" stroke-dasharray="2.5 2"/>
    <!-- 104.5° label -->
    <text x="50" y="78" font-size="7.5" fill="#5b8aff" font-family="monospace" text-anchor="middle">104.5°</text>
    <text x="50" y="91" font-size="6.5" fill="#7a8499" font-family="monospace" text-anchor="middle">structural H₂O</text>
  </svg>`,
};

// ── H-bond atom pairs for 1BNA (Watson-Crick) ───────────────
// Each entry: donor residue name, donor atom, acceptor atom, complement resn
// These are the canonical WC H-bond contacts for B-DNA
const HBOND_PAIRS = {
  // A–T: N6(A)···O4(T), N1(A)···N3(T)
  DA: [ ['N6','N6'], ['N1','N3'] ],
  DT: [ ['O4','N6'], ['N3','N1'] ],
  // G–C: O6(G)···N4(C), N1(G)···N3(C), N2(G)···O2(C)
  DG: [ ['O6','N4'], ['N1','N3'], ['N2','O2'] ],
  DC: [ ['N4','O6'], ['N3','N1'], ['O2','N2'] ],
};

// Watson-Crick complement residue names in 1BNA
// Chain A residues 1-12, Chain B residues 13-24 (complement antiparallel)
function getComplementResi(resi, chain) {
  // 1BNA: strand A is residues 1-12, strand B is 13-24 (antiparallel)
  if (chain === 'A') return 25 - resi; // resi 1 pairs with 24, 2 with 23, etc
  return 25 - resi;
}

// Legend definitions per colorscheme
const LEGENDS = {
  chainHetatm: [
    { color: '#909090', label: 'C – Carbon' },
    { color: '#3050f8', label: 'N – Nitrogen' },
    { color: '#ff0d0d', label: 'O – Oxygen' },
    { color: '#ff8000', label: 'P – Phosphorus' },
    { color: '#ffff30', label: 'S – Sulfur' },
    { color: '#ffffff', label: 'H – Hydrogen' },
  ],
  chain: [
    { color: '#ff7f7f', label: 'Chain A' },
    { color: '#7fbfff', label: 'Chain B' },
  ],
  spectrum: [
    { color: '#ff0000', label: "5′ end" },
    { color: '#00ff00', label: 'Middle' },
    { color: '#0000ff', label: "3′ end" },
  ],
  amino: [
    { color: '#3dffa0', label: 'Purine  — A, G' },
    { color: '#ffd166', label: 'Pyrimidine — T, C' },
    { color: '#ff8000', label: 'Phosphorus (P)' },
  ],
  shapely: [
    { color: '#ff6b6b', label: 'Adenine  (DA)' },
    { color: '#5b8aff', label: 'Thymine  (DT)' },
    { color: '#3dffa0', label: 'Guanine  (DG)' },
    { color: '#ffd166', label: 'Cytosine (DC)' },
  ],
};

// Style note shown in legend for cartoon representation
const STYLE_NOTES = {
  cartoon: 'Backbone ribbon — color applies to tube',
};

// ── Viewer init ──────────────────────────────────────────────
function initViewer() {
  viewer = $3Dmol.createViewer(viewerEl, {
    backgroundColor: 'black',
    antialias: true,
    quality: 'high',
  });

  fetch('https://files.rcsb.org/download/1BNA.pdb')
    .then(r => r.text())
    .then(pdb => {
      viewer.addModel(pdb, 'pdb');
      model = viewer.getModel();

      // Compute helix center
      const atoms = model.selectedAtoms({});
      if (atoms.length) {
        let sx=0, sy=0, sz=0;
        atoms.forEach(a => { sx+=a.x; sy+=a.y; sz+=a.z; });
        helixCenter = { x: sx/atoms.length, y: sy/atoms.length, z: sz/atoms.length };
      }

      applyRepresentation();

      viewer.setClickable({}, true, atom => {
        if (!atom || atom.resi == null) return;
        selectedAtom = atom;
        showAtomInfo(atom);
        highlightResidue(atom.resi);
        measureSection.classList.remove('hidden');
        measureResult.classList.add('hidden');
      });

      viewer.zoomTo();
      viewer.rotate(70, 'x');
      viewer.rotate(20, 'y');
      viewer.zoom(0.85);
      viewer.render();

      savedView = viewer.getView();
      rotationX = 70 * Math.PI / 180;
      rotationY = 20 * Math.PI / 180;

      setTimeout(() => loadingOverlay.classList.add('done'), 600);
      renderOrientationGuide();
    })
    .catch(err => {
      console.error('PDB load failed:', err);
      loadingOverlay.innerHTML = '<div style="color:#ff6b6b;font-family:monospace;text-align:center;padding:2rem">Failed to load PDB.<br>Check network or CORS settings.</div>';
    });
}

// ── Color scheme helpers ─────────────────────────────────────
const ELEMENT_COLORS = {
  C: '#909090', N: '#3050f8', O: '#ff0d0d',
  P: '#ff8000', S: '#ffff30', H: '#ffffff',
};
const SHAPELY_COLORS = {
  DA: '#ff6b6b', DT: '#5b8aff', DG: '#3dffa0', DC: '#ffd166',
  A: '#ff6b6b',  T: '#5b8aff',  G: '#3dffa0',  C: '#ffd166',
};
const CHAIN_COLORS = { A: '#ff7f7f', B: '#7fbfff' };

function buildStyle(rep, colorProp) {
  // cartoon is handled separately in applyRepresentation
  switch (rep) {
    case 'ball-stick': return { stick: colorProp, sphere: { ...colorProp, scale: 0.3 } };
    case 'lines':      return { line: colorProp };
    case 'spacefill':  return { sphere: colorProp };
    default:           return { stick: colorProp }; // sticks
  }
}

// ── Representation ───────────────────────────────────────────
function applyRepresentation() {
  if (!viewer || !model) return;

  viewer.setStyle({}, {});

  const rep    = representationSelect.value || 'sticks';
  const scheme = colorschemeSelect.value    || 'default';

  // ── CARTOON ──────────────────────────────────────────────
  if (rep === 'cartoon') {
    // Build cartoon colorscheme object based on current color selection
    if (scheme === 'default') {
      // Default: chain A salmon, chain B blue
      viewer.setStyle({ chain: 'A' }, { cartoon: { color: '#ff7f7f', thickness: 0.4 } });
      viewer.setStyle({ chain: 'B' }, { cartoon: { color: '#7fbfff', thickness: 0.4 } });
    } else if (scheme === 'spectrum') {
      viewer.setStyle({}, { cartoon: { colorscheme: 'spectrum', thickness: 0.4 } });
    } else if (scheme === 'chain') {
      viewer.setStyle({ chain: 'A' }, { cartoon: { color: CHAIN_COLORS.A, thickness: 0.4 } });
      viewer.setStyle({ chain: 'B' }, { cartoon: { color: CHAIN_COLORS.B, thickness: 0.4 } });
    } else if (scheme === 'chainHetatm') {
      // Element coloring doesn't map naturally to cartoon — use chain colors
      viewer.setStyle({ chain: 'A' }, { cartoon: { color: CHAIN_COLORS.A, thickness: 0.4 } });
      viewer.setStyle({ chain: 'B' }, { cartoon: { color: CHAIN_COLORS.B, thickness: 0.4 } });
    } else if (scheme === 'amino') {
      viewer.setStyle({ resn: ['DA','DG'] }, { cartoon: { color: '#3dffa0', thickness: 0.4 } });
      viewer.setStyle({ resn: ['DT','DC'] }, { cartoon: { color: '#ffd166', thickness: 0.4 } });
    } else if (scheme === 'shapely') {
      Object.entries(SHAPELY_COLORS).forEach(([resn, color]) => {
        viewer.setStyle({ resn }, { cartoon: { color, thickness: 0.4 } });
      });
    }

    // Also show sticks for the bases so they're visible alongside the ribbon
    viewer.setStyle({ atom: ['N1','N3','N6','N7','N9','O2','O4','O6','C2','C4','C5','C6','C8'] },
      { stick: { radius: 0.1, colorscheme: 'default', opacity: 0.7 } });

  // ── STANDARD ATOM STYLES ─────────────────────────────────
  } else {
    if (scheme === 'default') {
      viewer.setStyle({}, buildStyle(rep, { colorscheme: 'default' }));
    } else if (scheme === 'spectrum') {
      viewer.setStyle({}, buildStyle(rep, { colorscheme: 'spectrum' }));
    } else if (scheme === 'chain') {
      viewer.setStyle({ chain: 'A' }, buildStyle(rep, { color: CHAIN_COLORS.A }));
      viewer.setStyle({ chain: 'B' }, buildStyle(rep, { color: CHAIN_COLORS.B }));
    } else if (scheme === 'chainHetatm') {
      Object.entries(ELEMENT_COLORS).forEach(([elem, color]) => {
        viewer.setStyle({ elem }, buildStyle(rep, { color }));
      });
      Object.entries(ELEMENT_COLORS).forEach(([elem, color]) => {
        viewer.setStyle({ elem }, buildStyle(rep, { color }));
      });
    } else if (scheme === 'amino') {
      viewer.setStyle({ resn: 'DA' }, buildStyle(rep, { color: '#3dffa0' }));
      viewer.setStyle({ resn: 'DG' }, buildStyle(rep, { color: '#3dffa0' }));
      viewer.setStyle({ resn: 'DT' }, buildStyle(rep, { color: '#ffd166' }));
      viewer.setStyle({ resn: 'DC' }, buildStyle(rep, { color: '#ffd166' }));
      viewer.setStyle({ elem: 'P' },  buildStyle(rep, { color: '#ff8000' }));
    } else if (scheme === 'shapely') {
      Object.entries(SHAPELY_COLORS).forEach(([resn, color]) => {
        viewer.setStyle({ resn }, buildStyle(rep, { color }));
      });
    }
  }

  if (showWater) {
    viewer.setStyle({ resn: 'HOH' }, {
      stick:  { color: '#4ab8ff' },
      sphere: { scale: 0.25, color: '#4ab8ff' },
    });
  } else {
    viewer.setStyle({ resn: 'HOH' }, {});
  }

  if (showHBonds)  renderHBonds();
  if (showGrooves) renderGrooves();

  viewer.render();
  updateLegend(scheme, rep);
}

// ── Highlight ────────────────────────────────────────────────
function highlightResidue(resi) {
  if (!viewer) return;
  const rep = representationSelect.value || 'sticks';
  applyRepresentation();
  // For cartoon, highlight with a small sphere + stick on top
  if (rep === 'cartoon') {
    viewer.setStyle({ resi }, {
      stick:  { radius: 0.22, color: '#ffd166' },
      sphere: { scale: 0.45, color: '#ffd166' },
    });
  } else {
    viewer.setStyle({ resi }, {
      stick:  { radius: 0.22, color: '#ffd166' },
      sphere: { scale: 0.45, color: '#ffd166' },
    });
  }
  if (selectedLabel) viewer.removeLabel(selectedLabel);
  selectedLabel = null;
  viewer.render();
}

// ── H-Bond rendering ─────────────────────────────────────────
// Draws dashed cyan cylinders between paired base donor/acceptor atoms
function renderHBonds() {
  if (!viewer || !model) return;

  // Clear previous shapes
  hbondShapes.forEach(s => { try { viewer.removeShape(s); } catch(e){} });
  hbondShapes = [];

  const atoms = model.selectedAtoms({});

  // Build a lookup: chain+resi+atomName → atom
  const atomMap = {};
  atoms.forEach(a => {
    const key = `${a.chain}:${a.resi}:${a.atom}`;
    atomMap[key] = a;
  });

  // For each residue in chain A, find its complement in chain B and draw bonds
  const pairingMap = {
    DA: { comp: 'DT', bonds: [['N6','O4'],['N1','N3']] },
    DG: { comp: 'DC', bonds: [['O6','N4'],['N1','N3'],['N2','O2']] },
  };

  // Get all chain-A residues
  const chainAResidues = {};
  atoms.forEach(a => {
    if (a.chain === 'A' && a.resn !== 'HOH') {
      chainAResidues[a.resi] = a.resn;
    }
  });

  Object.entries(chainAResidues).forEach(([resiStr, resn]) => {
    const resi = parseInt(resiStr);
    const pairing = pairingMap[resn];
    if (!pairing) return;

    // 1BNA: chain A resi 1-12 pairs with chain B resi 24 down to 13
    const compResi = 25 - resi;

    pairing.bonds.forEach(([donorAtom, acceptorAtom]) => {
      const donorKey    = `A:${resi}:${donorAtom}`;
      const acceptorKey = `B:${compResi}:${acceptorAtom}`;
      const donor       = atomMap[donorKey];
      const acceptor    = atomMap[acceptorKey];
      if (!donor || !acceptor) return;

      // Draw dashed cylinder between donor and acceptor
      const shape = viewer.addCylinder({
        start:  { x: donor.x,    y: donor.y,    z: donor.z    },
        end:    { x: acceptor.x, y: acceptor.y, z: acceptor.z },
        radius: 0.08,
        dashed: true,
        dashLength: 0.3,
        gapLength:  0.2,
        color: '#a8d8ff',
        opacity: 0.85,
      });
      if (shape) hbondShapes.push(shape);
    });
  });
}

function clearHBonds() {
  hbondShapes.forEach(s => { try { viewer.removeShape(s); } catch(e){} });
  hbondShapes = [];
}

// ── Groove rendering ─────────────────────────────────────────
// Highlights the phosphate backbone atoms with color to reveal groove geometry.
// Major groove: atoms facing outward (N7, O6 on purines)
// Minor groove: atoms on the inside (N3, O2)
function renderGrooves() {
  if (!viewer || !model) return;
  clearGrooves();

  // Major groove atoms (purines: N7, O6; pyrimidines: O4) — orange/amber
  viewer.setStyle({ resn: ['DA','DG'], atom: 'N7' }, {
    sphere: { color: '#ffaa44', scale: 0.55, opacity: 0.9 }
  });
  viewer.setStyle({ resn: 'DG', atom: 'O6' }, {
    sphere: { color: '#ffaa44', scale: 0.55, opacity: 0.9 }
  });
  viewer.setStyle({ resn: 'DT', atom: 'O4' }, {
    sphere: { color: '#ffaa44', scale: 0.55, opacity: 0.9 }
  });

  // Minor groove atoms (N3 of purines, O2 of pyrimidines) — teal
  viewer.setStyle({ resn: ['DA','DG'], atom: 'N3' }, {
    sphere: { color: '#44ffcc', scale: 0.55, opacity: 0.9 }
  });
  viewer.setStyle({ resn: ['DT','DC'], atom: 'O2' }, {
    sphere: { color: '#44ffcc', scale: 0.55, opacity: 0.9 }
  });
}

function clearGrooves() {
  // Re-apply base representation to clear groove highlights
  // (groove highlighting adds spheres on top — just re-render base style to remove them)
}

// ── Info panel ───────────────────────────────────────────────
function showAtomInfo(atom) {
  const resn      = atom.resn?.trim().toUpperCase() || 'UNK';
  const resi      = atom.resi ?? '?';
  const chain     = atom.chain || '?';
  const atomName  = atom.atom  || '';
  const elem      = atom.elem  || '';
  const info      = RESIDUE_INFO[resn] || null;
  const shortCode = info?.shortCode || resn;

  infoBadge.textContent = `${shortCode}${resi} · ${chain}`;

  const pairBase = info?.pairs || '—';
  let pairHTML = '';
  if (pairBase !== '—') {
    pairHTML = `
      <div class="pair-indicator">
        <span class="pair-base base-${info?.shortCode}">${info?.shortCode || '?'}</span>
        <span class="pair-arrow">⇌</span>
        <span class="pair-base base-${pairBase}">${pairBase}</span>
        <span style="color:var(--muted);font-size:.75rem;margin-left:.2rem">
          Watson-Crick · ${info?.hbonds ?? '?'} H-bonds
        </span>
      </div>`;
  } else {
    pairHTML = `<div style="color:var(--muted)">—</div>`;
  }

  // Feature pills showing active overlays
  const activePills = [
    showHBonds  ? '<span class="feature-pill hbond">H-Bonds ON</span>' : '',
    showGrooves ? '<span class="feature-pill groove">Grooves ON</span>' : '',
  ].filter(Boolean).join('');

  const svgDiagram = BASE_SVG[shortCode] || '';

  infoBox.innerHTML = `
    ${activePills ? `<div class="feature-pills">${activePills}</div>` : ''}

    <div class="base-diagram-wrap">
      <div class="base-diagram-svg">${svgDiagram}</div>
      <div class="base-diagram-meta">
        <div class="base-diagram-name">${info?.fullName || resn}</div>
        <div class="base-diagram-type">${info?.type || ''}</div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-label">Residue</div>
      <div class="info-value mono accent">${resn} ${resi} · Chain ${chain}</div>
    </div>

    <div class="info-section">
      <div class="info-label">Atom / Element</div>
      <div class="info-value mono">${atomName} <span style="color:var(--muted)">(${elem})</span></div>
    </div>

    <div class="info-section">
      <div class="info-label">Base Pair Interaction</div>
      ${pairHTML}
    </div>

    <div class="desc-block">
      <div class="desc-label">Scholarly Description</div>
      <div class="desc-text">${info?.description || 'No description available for this residue.'}</div>
    </div>
  `;
}

// ── Measure to center ────────────────────────────────────────
function measureToCenter(atom) {
  if (!atom) return;
  const dx = atom.x - helixCenter.x;
  const dy = atom.y - helixCenter.y;
  const dz = atom.z - helixCenter.z;
  const dist = Math.sqrt(dx*dx + dy*dy + dz*dz).toFixed(2);
  measureResult.classList.remove('hidden');
  measureResult.textContent = `Δ = ${dist} Å from helix centroid`;
}

// ── Legend ───────────────────────────────────────────────────
function updateLegend(scheme, rep) {
  rep = rep || representationSelect.value || 'sticks';
  const entries = LEGENDS[scheme];

  // For cartoon with element scheme, substitute chain colors since cartoon doesn't support per-element
  let displayEntries = entries;
  if (rep === 'cartoon' && (scheme === 'chainHetatm' || scheme === 'default')) {
    displayEntries = LEGENDS['chain'];
  }

  if (!displayEntries) { legendEl.classList.add('hidden'); return; }

  const styleNote = STYLE_NOTES[rep] ? `<div style="font-size:.62rem;color:#5b8aff;margin-bottom:.4rem;font-style:italic">${STYLE_NOTES[rep]}</div>` : '';

  legendItems.innerHTML = styleNote + displayEntries.map(e => `
    <div class="legend-item">
      <span class="legend-chip" style="background:${e.color}"></span>
      <span>${e.label}</span>
    </div>`).join('');

  const chemLegend = document.getElementById('chem-legend');
  if (chemLegend) {
    const chemBottom = chemLegend.offsetTop + chemLegend.offsetHeight;
    legendEl.style.top = (chemBottom + 8) + 'px';
  } else {
    legendEl.style.top = '14px';
  }

  legendEl.classList.remove('hidden');
}

// ── Smooth reset ─────────────────────────────────────────────
function smoothReset() {
  if (!viewer) return;

  representationSelect.value = 'sticks';
  colorschemeSelect.value    = 'default';
  if (waterCheckbox)   waterCheckbox.checked   = false;
  if (hbondCheckbox)   hbondCheckbox.checked   = false;
  if (grooveCheckbox)  grooveCheckbox.checked  = false;
  showWater   = false;
  showHBonds  = false;
  showGrooves = false;

  clearHBonds();

  selectedAtom = null;
  if (selectedLabel) { viewer.removeLabel(selectedLabel); selectedLabel = null; }
  infoBox.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          <path d="M11 8v3M11 14h.01"/>
        </svg>
      </div>
      <p>Click any atom in the model to inspect it.</p>
    </div>`;
  infoBadge.textContent = '—';
  measureSection.classList.add('hidden');
  measureResult.classList.add('hidden');
  legendEl.classList.add('hidden');

  applyRepresentation();

  if (savedView) {
    const startView = viewer.getView();
    const duration  = 700;
    const start     = performance.now();
    function animView(now) {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      viewer.setView(startView.map((v, i) => v + (savedView[i] - v) * ease));
      viewer.render();
      if (t < 1) requestAnimationFrame(animView);
    }
    requestAnimationFrame(animView);
  } else {
    viewer.zoomTo();
    viewer.render();
  }

  const targetX = 70 * Math.PI / 180;
  const targetY = 20 * Math.PI / 180;
  const startX  = rotationX, startY = rotationY;
  const dur2    = 700;
  const start2  = performance.now();
  function animReset(now) {
    const t    = Math.min((now - start2) / dur2, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    rotationX  = startX + (targetX - startX) * ease;
    rotationY  = startY + (targetY - startY) * ease;
    if (t < 1) requestAnimationFrame(animReset);
  }
  requestAnimationFrame(animReset);
}

// ── XYZ Navigator ────────────────────────────────────────────
function renderOrientationGuide() {
  if (!orientationCtx) return;
  const ctx = orientationCtx;
  const S = 72, cx = S/2, cy = S/2;
  ctx.clearRect(0, 0, S, S);

  const axes = [
    { name:'X', color:'rgba(255,90,90,0.9)',  v:[1,0,0] },
    { name:'Y', color:'rgba(80,220,130,0.9)', v:[0,1,0] },
    { name:'Z', color:'rgba(80,150,255,0.9)', v:[0,0,1] },
  ];

  const projected = axes.map(({ name, color, v:[x,y,z] }) => {
    const x1 =  x * Math.cos(rotationY) + z * Math.sin(rotationY);
    const z1 = -x * Math.sin(rotationY) + z * Math.cos(rotationY);
    const y1 =  y * Math.cos(rotationX) - z1 * Math.sin(rotationX);
    const z2 =  y * Math.sin(rotationX) + z1 * Math.cos(rotationX);
    return { name, color, px: x1, py: y1, pz: z2 };
  }).sort((a,b) => a.pz - b.pz);

  const L = 22;
  projected.forEach(ax => {
    const ex = ax.px * L, ey = ax.py * L;
    const dim = ax.pz < -0.2;
    ctx.save();
    ctx.globalAlpha = dim ? 0.3 : 1;
    ctx.strokeStyle = ax.color;
    ctx.lineWidth   = dim ? 1 : 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx+ex, cy-ey); ctx.stroke();
    ctx.fillStyle = ax.color;
    ctx.beginPath(); ctx.arc(cx+ex, cy-ey, dim ? 2 : 3, 0, Math.PI*2); ctx.fill();
    if (!dim) {
      ctx.fillStyle      = ax.color;
      ctx.font           = '600 9px "Space Mono", monospace';
      ctx.textAlign      = 'center';
      ctx.textBaseline   = 'middle';
      ctx.fillText(ax.name, cx + ax.px*(L+10), cy - ax.py*(L+10));
    }
    ctx.restore();
  });

  ctx.fillStyle = 'rgba(180,195,220,0.5)';
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI*2); ctx.fill();

  requestAnimationFrame(renderOrientationGuide);
}

// ── Zoom buttons ─────────────────────────────────────────────
const ZOOM_IN_FACTOR  = 1.015;
const ZOOM_OUT_FACTOR = 1 / 1.015;
let zoomRafId     = null;
let zoomDirection = 0;

function zoomTick() {
  if (!viewer || zoomDirection === 0) return;
  viewer.zoom(zoomDirection > 0 ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR);
  viewer.render();
  zoomRafId = requestAnimationFrame(zoomTick);
}
function startZoom(dir) {
  if (zoomDirection === dir) return;
  stopZoom(); zoomDirection = dir;
  zoomRafId = requestAnimationFrame(zoomTick);
}
function stopZoom() {
  zoomDirection = 0;
  if (zoomRafId) { cancelAnimationFrame(zoomRafId); zoomRafId = null; }
}
function attachZoomBtn(btn, dir) {
  if (!btn) return;
  btn.addEventListener('mousedown',  e => { e.stopPropagation(); startZoom(dir); });
  btn.addEventListener('mouseup',    () => stopZoom());
  btn.addEventListener('mouseleave', () => stopZoom());
  btn.addEventListener('touchstart', e => { e.preventDefault(); startZoom(dir); }, { passive: false });
  btn.addEventListener('touchend',   () => stopZoom());
}
attachZoomBtn(zoomInBtn,  1);
attachZoomBtn(zoomOutBtn, -1);

// ── Mouse tracking ───────────────────────────────────────────
viewerEl.addEventListener('mousedown', e => {
  if (e.target.closest('#zoom-control')) return;
  isDragging = true;
});
viewerEl.addEventListener('mouseup',   () => { isDragging = false; });
document.addEventListener('mouseup',   () => { isDragging = false; });
viewerEl.addEventListener('mousemove', e => {
  if (!isDragging) return;
  rotationY += (e.movementX || 0) * 0.012;
  rotationX += (e.movementY || 0) * 0.012;
});

// ── Control listeners ────────────────────────────────────────
btnReset?.addEventListener('click', smoothReset);

representationSelect?.addEventListener('change', applyRepresentation);
colorschemeSelect?.addEventListener('change',    applyRepresentation);

backgroundSelect?.addEventListener('change', e => {
  if (!viewer) return;
  const map = { black:'black', white:'white', 'dark-gray':'#2a2a2a' };
  viewer.setBackgroundColor(map[e.target.value] || 'black');
  viewer.render();
});

waterCheckbox?.addEventListener('change', e => {
  showWater = e.target.checked;
  applyRepresentation();
});

hbondCheckbox?.addEventListener('change', e => {
  showHBonds = e.target.checked;
  if (showHBonds) renderHBonds();
  else            clearHBonds();
  viewer.render();
  // Refresh info panel pills if something is selected
  if (selectedAtom) showAtomInfo(selectedAtom);
});

grooveCheckbox?.addEventListener('change', e => {
  showGrooves = e.target.checked;
  applyRepresentation(); // groove highlights are applied inside applyRepresentation
  if (selectedAtom) showAtomInfo(selectedAtom);
});

btnMeasure?.addEventListener('click', () => {
  if (selectedAtom) measureToCenter(selectedAtom);
});

// ── Boot ─────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initViewer);
} else {
  initViewer();
}