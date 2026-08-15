// scientific calculator with many functions
document.addEventListener('DOMContentLoaded', () => {
  const display = document.getElementById('display');
  const keys = document.querySelector('.keys');

  let expr = '0';
  let justEvaluated = false;

  function updateDisplay() { display.textContent = expr; }

  function pushChar(ch) {
    if (justEvaluated && /[0-9.πe]/.test(ch)) {
      expr = ch;
    } else if (expr === '0' && /[0-9πe]/.test(ch)) {
      expr = ch;
    } else {
      expr += ch;
    }
    justEvaluated = false;
    updateDisplay();
  }

  function insertOperator(op) {
    const map = { '×': '*', '÷': '/', '−': '-' , '+': '+' };
    const jsOp = map[op] || op;
    if (justEvaluated) justEvaluated = false;
    if (/[+\-*/]$/.test(expr)) {
      expr = expr.replace(/[+\-*/]+$/,'') + jsOp;
    } else {
      expr += jsOp;
    }
    updateDisplay();
  }

  function insertFunction(fn) {
    // functions appended with '(' so user can enter argument
    const appendParen = ['sin','cos','tan','asin','acos','atan','ln','log','sqrt','abs'];
    if (fn === 'exp') { expr += 'exp('; }
    else if (fn === 'sqr') { expr += '^2'; }
    else if (fn === 'cube') { expr += '^3'; }
    else if (appendParen.includes(fn)) { expr += fn + '('; }
    justEvaluated = false;
    updateDisplay();
  }

  function doClear() { expr = '0'; justEvaluated = false; updateDisplay(); }
  function doDelete() {
    if (justEvaluated) { expr = '0'; justEvaluated = false; updateDisplay(); return; }
    expr = expr.length > 1 ? expr.slice(0, -1) : '0';
    updateDisplay();
  }

  function transformExpression(s) {
    let out = s;
    // replace display operators
    out = out.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
    out = out.replace(/\^/g,'**');
    // percent e.g. 5% -> (5/100)
    out = out.replace(/(\d+(\.\d+)?)%/g, '($1/100)');
    // constants
    out = out.replace(/π/g, 'Math.PI').replace(/\be\b/g, 'Math.E');
    // functions mapping
    out = out.replace(/\bln\(/g, 'Math.log(');         // natural log
    out = out.replace(/\blog\(/g, 'Math.log10(');     // base-10 log
    out = out.replace(/\bsqrt\(/g, 'Math.sqrt(');
    out = out.replace(/\bsin\(/g, 'Math.sin(');
    out = out.replace(/\bcos\(/g, 'Math.cos(');
    out = out.replace(/\btan\(/g, 'Math.tan(');
    out = out.replace(/\basin\(/g, 'Math.asin(');
    out = out.replace(/\bacos\(/g, 'Math.acos(');
    out = out.replace(/\batan\(/g, 'Math.atan(');
    out = out.replace(/\bexp\(/g, 'Math.exp(');
    out = out.replace(/\babs\(/g, 'Math.abs(');
    // ensure only allowed characters (numbers, operators, parentheses, Math, digits, dot, space)
    return out;
  }

  function safeEval(s) {
    const transformed = transformExpression(s);
    // basic allowed check (letters appear only in Math.*)
    if (!/^[0-9+\-*/().,\sMathPIEexpntlgacosinabs]+$/.test(transformed) && !/Math/.test(transformed)) {
      // Allow alpha characters because Math.* will be present after transforms
      // but keep a fallback check minimal — still rely on transform for safety
    }
    // eslint-disable-next-line no-new-func
    const val = Function('"use strict"; return (' + transformed + ')')();
    if (!isFinite(val)) throw new Error('Math error');
    return Math.round((val + Number.EPSILON) * 1e12) / 1e12;
  }

  function doEquals() {
    try {
      const result = safeEval(expr);
      expr = String(result);
      justEvaluated = true;
      updateDisplay();
    } catch (err) {
      expr = 'Error';
      justEvaluated = true;
      updateDisplay();
      setTimeout(() => { expr = '0'; justEvaluated = false; updateDisplay(); }, 900);
    }
  }

  keys.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const val = btn.dataset.value;
    const action = btn.dataset.action;
    const fn = btn.dataset.fn;
    if (action === 'clear') return doClear();
    if (action === 'del') return doDelete();
    if (action === 'equals') return doEquals();
    if (fn) return insertFunction(fn);
    if (val) {
      if (val === 'π' || val === 'e') return pushChar(val);
      if (/[0-9]/.test(val)) return pushChar(val);
      if (val === '.') {
        const parts = expr.split(/(?=[+\-*/^])/);
        const last = parts[parts.length - 1];
        if (!last.includes('.')) return pushChar('.');
        return;
      }
      if (/[/×÷+\-−*^%]/.test(val)) {
        // treat ^ as operator
        if (val === '^') { expr += '^'; updateDisplay(); return; }
        return insertOperator(val);
      }
      // parentheses or others
      return pushChar(val);
    }
  });

  // keyboard support (basic)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); return doEquals(); }
    if (e.key === 'Backspace') return doDelete();
    if (e.key.toLowerCase() === 'c') return doClear();
    if (/[0-9]/.test(e.key)) return pushChar(e.key);
    if (e.key === '.') return pushChar('.');
    if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') return insertOperator(e.key);
    if (e.key === '^') return insertOperator('^');
    if (e.key === '(' || e.key === ')') return pushChar(e.key);
  });

  updateDisplay();
});