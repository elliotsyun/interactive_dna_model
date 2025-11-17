let element = document.querySelector('#window');

let config = { backgroundColor: 'black' }
let viewer = $3Dmol.createViewer(element, config);

const START_ORIENTATION = [
  -5.387970011534036,
  -13.061460207612456,
  -46.140005767012674,
  -73.1810316527869,
  0.42104097169766236,
  0.5941813986457555,
  -0.5634482855917644,
  0.3901268961747755
]

$3Dmol.download('pdb:3BSE', viewer, {}, function () {
  viewer.setStyle({}, { stick: { color: 'spectrum' } });
  viewer.zoomTo();

  // orientation settings
  viewer.setView(START_ORIENTATION);

  viewer.render();
});

//TODO: Make style switching functions
