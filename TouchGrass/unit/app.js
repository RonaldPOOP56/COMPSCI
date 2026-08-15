// simple client-side unit converter (no external deps)
document.addEventListener('DOMContentLoaded', () => {
  const CATEGORIES = {
    Length: {
      base: 'm',
      units: {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        mi: 1609.344,
        yd: 0.9144,
        ft: 0.3048,
        in: 0.0254
      }
    },
    Weight: {
      base: 'kg',
      units: {
        kg: 1,
        g: 0.001,
        lb: 0.45359237,
        oz: 0.0283495231,
        t: 1000
      }
    },
    Temperature: {
      // handled specially
      units: ['C', 'F', 'K']
    },
    Volume: {
      base: 'l',
      units: {
        l: 1,
        ml: 0.001,
        m3: 1000,
        gal: 3.785411784,
        qt: 0.946352946
      }
    },
    Speed: {
      base: 'm/s',
      units: {
        'm/s': 1,
        'km/h': 1000/3600,
        'mph': 1609.344/3600,
        'knot': 1852/3600
      }
    }
  };

  const categoryEl = document.getElementById('category');
  const fromUnitEl = document.getElementById('fromUnit');
  const toUnitEl = document.getElementById('toUnit');
  const fromValueEl = document.getElementById('fromValue');
  const resultDisplay = document.getElementById('resultDisplay');
  const convertBtn = document.getElementById('convertBtn');
  const clearBtn = document.getElementById('clearBtn');
  const swapBtn = document.getElementById('swapBtn');
  const presetsEl = document.getElementById('presets');

  function populateCategories() {
    Object.keys(CATEGORIES).forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = cat;
      categoryEl.appendChild(opt);
    });
  }

  function populateUnits() {
    const cat = categoryEl.value;
    fromUnitEl.innerHTML = ''; toUnitEl.innerHTML = '';
    const def = CATEGORIES[cat];
    if (cat === 'Temperature') {
      ['C','F','K'].forEach(u => { fromUnitEl.append(new Option(u,u)); toUnitEl.append(new Option(u,u)); });
    } else {
      Object.keys(def.units).forEach(u => { fromUnitEl.append(new Option(u,u)); toUnitEl.append(new Option(u,u)); });
    }
  }

  function convertTemperature(val, from, to) {
    let c;
    if (from === 'C') c = val;
    if (from === 'F') c = (val - 32) * 5/9;
    if (from === 'K') c = val - 273.15;
    let out = c;
    if (to === 'C') out = c;
    if (to === 'F') out = c * 9/5 + 32;
    if (to === 'K') out = c + 273.15;
    return out;
  }

  function convertValue(value, category, fromUnit, toUnit) {
    if (!isFinite(value)) return NaN;
    if (category === 'Temperature') return convertTemperature(value, fromUnit, toUnit);
    const def = CATEGORIES[category];
    const toBase = value * def.units[fromUnit];
    const out = toBase / def.units[toUnit];
    return out;
  }

  function formatNumber(n) {
    if (!isFinite(n)) return '—';
    if (Math.abs(n) >= 1e6 || Math.abs(n) < 1e-3 && n !== 0) return n.toExponential(6);
    return Number(n.toFixed(6)).toString();
  }

  function setPresetsForCategory(cat) {
    presetsEl.innerHTML = '';
    const presets = {
      Length: [{v:1,u:'m'},{v:1,u:'km'},{v:1,u:'mi'}],
      Weight: [{v:1,u:'kg'},{v:1,u:'lb'},{v:1000,u:'g'}],
      Temperature: [{v:37,u:'C'},{v:98.6,u:'F'},{v:300,u:'K'}],
      Volume: [{v:1,u:'l'},{v:1,u:'gal'}],
      Speed: [{v:1,u:'m/s'},{v:100,u:'km/h'}]
    }[cat] || [];
    presets.forEach(p => {
      const b = document.createElement('button');
      b.textContent = `${p.v} ${p.u}`;
      b.addEventListener('click', () => {
        fromValueEl.value = p.v;
        fromUnitEl.value = p.u;
        toUnitEl.selectedIndex = 0;
        doConvert();
      });
      presetsEl.appendChild(b);
    });
  }

  function doConvert() {
    const cat = categoryEl.value;
    const v = parseFloat(fromValueEl.value);
    const fromU = fromUnitEl.value;
    const toU = toUnitEl.value;
    if (!fromU || !toU) { resultDisplay.textContent = 'Select units'; return; }
    if (!isFinite(v)) { resultDisplay.textContent = 'Enter valid number'; return; }
    const out = convertValue(v, cat, fromU, toU);
    resultDisplay.textContent = formatNumber(out) + ' ' + toU;
  }

  function swapUnits() {
    const a = fromUnitEl.value, b = toUnitEl.value;
    fromUnitEl.value = b; toUnitEl.value = a;
    const val = fromValueEl.value;
    // attempt to convert current displayed result back to input
    if (resultDisplay.textContent && resultDisplay.textContent !== '—') {
      const match = resultDisplay.textContent.match(/([-+0-9.eE]+)/);
      if (match) fromValueEl.value = match[1];
    }
    doConvert();
  }

  // init
  populateCategories();
  categoryEl.value = 'Length';
  populateUnits();
  setPresetsForCategory('Length');

  categoryEl.addEventListener('change', () => {
    populateUnits();
    setPresetsForCategory(categoryEl.value);
    resultDisplay.textContent = '—';
  });

  convertBtn.addEventListener('click', doConvert);
  clearBtn.addEventListener('click', () => {
    fromValueEl.value = '';
    resultDisplay.textContent = '—';
  });
  swapBtn.addEventListener('click', swapUnits);

  // update on unit change
  fromUnitEl.addEventListener('change', () => { resultDisplay.textContent = '—'; });
  toUnitEl.addEventListener('change', () => { resultDisplay.textContent = '—'; });

  // Enter converts
  fromValueEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') doConvert(); });

  // expose for quick manual testing
  window.unitConverter = { convertValue, CATEGORIES };
});