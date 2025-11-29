// BMI calculator + small horizontal chart
document.addEventListener('DOMContentLoaded', () => {
  const weightEl = document.getElementById('weight');
  const weightUnitEl = document.getElementById('weightUnit');
  const heightEl = document.getElementById('height');
  const heightUnitEl = document.getElementById('heightUnit');
  const calcBtn = document.getElementById('calcBtn');
  const resetBtn = document.getElementById('resetBtn');
  const bmiValueEl = document.getElementById('bmiValue');
  const bmiCategoryEl = document.getElementById('bmiCategory');
  const pointer = document.getElementById('pointer');
  const pointerTip = document.getElementById('pointerTip');

  function computeBMI(w, h, wUnit, hUnit) {
    // convert to kg and meters
    let kg = wUnit === 'lb' ? w * 0.45359237 : w;
    let m = hUnit === 'in' ? h * 0.0254 : h / 100;
    if (m <= 0) return null;
    const bmi = kg / (m * m);
    return bmi;
  }

  function categoryForBMI(bmi) {
    if (bmi < 18.5) return {name: 'Underweight', color: 'under'};
    if (bmi < 25) return {name: 'Normal weight', color: 'normal'};
    if (bmi < 30) return {name: 'Overweight', color: 'over'};
    return {name: 'Obesity', color: 'obese'};
  }

  function updatePointer(bmi) {
    // map BMI to a 10..50 scale for display (clamped)
    const min = 10, max = 50;
    const val = Math.min(max, Math.max(min, bmi || 0));
    const pct = ((val - min) / (max - min)) * 100;
    pointer.style.left = pct + '%';
    pointerTip.textContent = isFinite(bmi) ? bmi.toFixed(1) : '—';
  }

  function showResult(bmi) {
    if (!isFinite(bmi) || bmi <= 0) {
      bmiValueEl.textContent = '—';
      bmiCategoryEl.textContent = 'Category: —';
      updatePointer(NaN);
      return;
    }
    const rounded = Math.round(bmi * 10) / 10;
    bmiValueEl.textContent = rounded;
    const cat = categoryForBMI(rounded);
    bmiCategoryEl.textContent = 'Category: ' + cat.name;
    updatePointer(rounded);
  }

  calcBtn.addEventListener('click', () => {
    const w = parseFloat(weightEl.value);
    const h = parseFloat(heightEl.value);
    if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) {
      bmiValueEl.textContent = 'Invalid input';
      bmiCategoryEl.textContent = '';
      updatePointer(NaN);
      return;
    }
    const bmi = computeBMI(w, h, weightUnitEl.value, heightUnitEl.value);
    showResult(bmi);
  });

  resetBtn.addEventListener('click', () => {
    weightEl.value = '';
    heightEl.value = '';
    bmiValueEl.textContent = '—';
    bmiCategoryEl.textContent = 'Category: —';
    updatePointer(NaN);
  });

  // quick calculate on Enter
  [weightEl, heightEl].forEach(input => input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') calcBtn.click();
  }));

  // init pointer center
  updatePointer(NaN);
});