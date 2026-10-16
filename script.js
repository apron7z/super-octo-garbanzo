(() => {
  const display = document.getElementById('display');
  const buttons = document.querySelectorAll('.btn');

  let expression = '';
  let resetNext = false;
  const MAXLEN = 28;

  function show(text) {
    display.textContent = String(text).slice(0, MAXLEN) || '0';
  }

  function pushValue(v) {
    if (resetNext) {
      if (/\d|\./.test(v)) {
        expression = v === '.' ? '0.' : v;
      } else {
        expression = String(expression);
        expression += v;
      }
      resetNext = false;
    } else {
      if (/^[+\/*]/.test(v) && expression === '') return;
      if (/^[+\-*/]$/.test(v)) {
        if (/[+\-*/]$/.test(expression)) {
          if (v === '-' && /[+\-*/]$/.test(expression)) {
            expression += v;
          } else {
            expression = expression.slice(0, -1) + v;
          }
        } else {
          expression += v;
        }
      } else if (v === '.') {
        const lastSegment = expression.split(/[+\-*/()]/).pop() || '';
        if (lastSegment.includes('.')) return;
        expression += '.';
      } else {
        expression += v;
      }
    }
    show(expression || '0');
  }

  function clearAll() {
    expression = '';
    resetNext = false;
    show('0');
  }

  function backspace() {
    if (resetNext) {
      expression = '';
      resetNext = false;
      show('0');
      return;
    }
    expression = expression.slice(0, -1);
    show(expression || '0');
  }

  function toggleNeg() {
    const numMatch = expression.match(/(\(*-?\d+(\.\d+)?\)?)$/);
    if (!numMatch) return;
    const token = numMatch[0];
    const start = expression.length - token.length;

    if (/^\(.*\)$/.test(token)) {
      const inner = token.slice(1, -1);
      if (/^-/.test(inner)) {
        expression = expression.slice(0, start) + '(' + inner.slice(1) + ')';
      } else {
        expression = expression.slice(0, start) + '(-' + inner + ')';
      }
    } else {
      if (/^-/.test(token)) {
        expression = expression.slice(0, start) + token.slice(1);
      } else {
        expression = expression.slice(0, start) + '(-' + token + ')';
      }
    }
    show(expression);
  }

  function applyPercent() {
    const m = expression.match(/(\d+(\.\d+)?)$/);
    if (!m) return;
    const num = m[1];
    expression = expression.slice(0, m.index) + '(' + num + '/100)';
    show(expression);
  }

  function sanitize(expr) {
    expr = expr.replace(/[×✕]/g, '*').replace(/[÷]/g, '/').replace(/[−—–]/g, '-');
    expr = expr.replace(/(\d+(\.\d+)?)%/g, '($1/100)');
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) throw new Error('Invalid characters');
    expr = expr.replace(/[+\-*/]+$/g, '');
    return expr;
  }

  function evaluate() {
    try {
      const expr = sanitize(expression || '0');
      const raw = Function('"use strict";return (' + expr + ')')();
      if (raw === Infinity || raw === -Infinity || Number.isNaN(raw)) {
        show('Error');
        expression = '';
      } else {
        const rounded = Math.round((raw + Number.EPSILON) * 1e12) / 1e12;
        expression = String(rounded);
        show(expression);
      }
    } catch (e) {
      show('Error');
      expression = '';
    }
    resetNext = true;
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.value;
      const action = btn.dataset.action;
      if (action === 'clear') return clearAll();
      if (action === 'back') return backspace();
      if (action === 'neg') return toggleNeg();
      if (action === 'percent') return applyPercent();
      if (action === 'equals') return evaluate();
      if (v) {
        if (v === '×') pushValue('*');
        else if (v === '÷') pushValue('/');
        else pushValue(v);
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') { pushValue(e.key); e.preventDefault(); return; }
    if (e.key === '.') { pushValue('.'); e.preventDefault(); return; }
    if (e.key === 'Enter' || e.key === '=') { evaluate(); e.preventDefault(); return; }
    if (e.key === 'Backspace') { backspace(); e.preventDefault(); return; }
    if (e.key === 'Escape') { clearAll(); e.preventDefault(); return; }
    if (e.key === '%') { applyPercent(); e.preventDefault(); return; }
    if (['+', '-', '*', '/', '(', ')'].includes(e.key)) { pushValue(e.key); e.preventDefault(); return; }
  });

  show('0');
})();
