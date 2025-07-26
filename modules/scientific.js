class ScientificCalculator {
  constructor() {
    this.input = document.getElementById('scientific-input');
    this.preview = document.getElementById('scientific-preview-display');
    this.expression = '';
    this.lastAnswer = '0';
    this.angleMode = localStorage.getItem('sci-angle-mode') || 'DEG';
    this.calculatorId = 'scientific';

    this.historyList = document.getElementById('scientific-history-list');
    this.historyBox = document.getElementById('scientific-history-box');

    this.initButtons();
    this.setupHistoryToggle();
    this.loadHistoryFromLocal();
    this.initKeyboardSupport();
    this.setupClearHistoryButton();

    this.input.setAttribute('readonly', true);
    this.updateAngleModeUI();
    this.updateDisplay();
  }

  initButtons() {
    const buttons = document.querySelectorAll('.scientific-calculator .scientific-btn');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const value = button.textContent.trim();
        this.handleButtonClick(value, button);
      });
    });
  }

  handleButtonClick(value, buttonElement) {
    // Handle angle mode buttons
    if (buttonElement.classList.contains('angle-mode')) {
      this.setAngleMode(value);
      return;
    }

    // Handle different button types
    if (
      buttonElement.classList.contains('number') ||
      ['+', '-', '×', '/', '.', '(', ')', ','].includes(value)
    ) {
      this.appendToExpression(this.convertSymbol(value));
    } else if (value === 'C') {
      this.clear();
    } else if (value === '⌫') {
      this.deleteLast();
    } else if (value === '=') {
      this.calculate();
    } else if (value === '%') {
      this.appendToExpression('/100');
    } else if (value === 'Ans') {
      this.useLastAnswer();
    } else if (value === 'π') {
      this.appendToExpression('π');
    } else if (value === 'e') {
      this.appendToExpression('e');
    } else if (value === 'xʸ') {
      this.appendToExpression('^');
    } else if (value === 'ⁿ√x') {
      this.appendToExpression('nthroot(');
    } else if (value === 'x!') {
      this.appendToExpression('!');
    } else if (value === 'sin') {
      this.appendToExpression('sin(');
    } else if (value === 'cos') {
      this.appendToExpression('cos(');
    } else if (value === 'tan') {
      this.appendToExpression('tan(');
    } else if (value === 'sin⁻¹') {
      this.appendToExpression('asin(');
    } else if (value === 'cos⁻¹') {
      this.appendToExpression('acos(');
    } else if (value === 'tan⁻¹') {
      this.appendToExpression('atan(');
    } else if (value === 'eˣ') {
      this.appendToExpression('exp(');
    } else if (value === 'log') {
      this.appendToExpression('log10(');
    } else if (value === 'ln') {
      this.appendToExpression('ln(');
    } else if (value === 'mod') {
      this.appendToExpression(' mod ');
    }
  }

  convertSymbol(symbol) {
    const conversions = {
      '×': '*',
      '÷': '/',
      ',': '.',
    };
    return conversions[symbol] || symbol;
  }

  setAngleMode(mode) {
    if (mode !== 'DEG' && mode !== 'RAD') return;
    this.angleMode = mode;
    localStorage.setItem('sci-angle-mode', this.angleMode);
    this.updateAngleModeUI();
    this.updatePreview();
  }

  updateAngleModeUI() {
    const angleButtons = document.querySelectorAll('.scientific-btn.angle-mode');
    angleButtons.forEach((btn) => {
      const mode = btn.getAttribute('data-mode');
      if (mode === this.angleMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  appendToExpression(value) {
    // We want to disallow consecutive operators (except for minus which can also be unary, but still let's keep it simple)

    // Define operator tokens including multi-char ' mod '
    const operatorTokens = ['+', '-', '*', '/', '^', ' mod '];

    // Helper: extract the last token (operators or a number/function etc.)

    const expr = this.expression;

    // Check last token:
    // We'll try to find if expression ends with any operator token from operatorTokens.

    // Sort operator tokens descending by length to prioritize longer operators first (e.g. ' mod ' first)
    const sortedOps = operatorTokens.sort((a, b) => b.length - a.length);

    // Find last operator token if expression ends with it
    let lastOp = null;
    for (const op of sortedOps) {
      if (expr.endsWith(op)) {
        lastOp = op;
        break;
      }
    }

    // If both last token and current value are operators, replace it
    if (
      lastOp !== null &&
      operatorTokens.includes(value) &&
      !(value === '-' && lastOp !== '-') // allow minus after operator for negative numbers
    ) {
      // Replace last operator with new one
      this.expression = expr.slice(0, -lastOp.length) + value;
    } else {
      this.expression += value;
    }
    this.updateDisplay();
  }

  useLastAnswer() {
    if (this.lastAnswer !== '') {
      this.expression += this.lastAnswer;
      this.updateDisplay();
    }
  }

  deleteLast() {
    // Handle multi-character function tokens first (sorted longest first to match longest)
    const functions = [
      'sin(',
      'cos(',
      'tan(',
      'asin(',
      'acos(',
      'atan(',
      'ln(',
      'exp(',
      'log10(',
      'nthroot(',
      ' mod ',
    ];

    for (const func of functions.sort((a, b) => b.length - a.length)) {
      if (this.expression.endsWith(func)) {
        this.expression = this.expression.slice(0, -func.length);
        this.updateDisplay();
        return;
      }
    }

    // Regular character deletion
    this.expression = this.expression.slice(0, -1);
    this.updateDisplay();
  }

  clear() {
    this.expression = '';
    this.updateDisplay();
  }

  calculate() {
    try {
      if (!this.expression.trim()) {
        return;
      }

      const result = this.evaluateExpression(this.expression);

      if (result !== undefined && !isNaN(result) && isFinite(result)) {
        const formattedResult = this.formatResult(result);
        const historyEntry = `${this.expression} = ${formattedResult}`;

        this.lastAnswer = String(result);
        this.expression = formattedResult;

        this.addToHistory(historyEntry);
        this.saveHistoryToLocal();
        this.updateDisplay();
      } else {
        throw new Error('Invalid result');
      }
    } catch (error) {
      this.showError('Invalid Expression');
    }
  }

  evaluateExpression(expr) {
    try {
      // Replace mathematical constants and last answer
      let processedExpr = expr
        .replace(/π/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')
        .replace(/Ans/g, this.lastAnswer || '0');

      // Handle factorial: replace occurrences of 'number!' or '(expression)!' with factorial(number/expression)
      // Use a while loop to replace multiple factorials in the expression (since regex replace processes all occurrences, this is optional)
      processedExpr = processedExpr.replace(/(\d+(\.\d+)?|\([^()]+\))!/g, (match, num) => {
        return `factorial(${num})`;
      });

      // Handle power operator '^': replace all a^b with Math.pow(a,b)
      // Use a loop to catch nested powers
      const powerRegex = /(\([^()]+\)|\w+|\d+(\.\d+)?|\.\d+)\^(\([^()]+\)|\w+|\d+(\.\d+)?|\.\d+)/;
      while (powerRegex.test(processedExpr)) {
        processedExpr = processedExpr.replace(powerRegex, 'Math.pow($1,$3)');
      }

      // nthroot handling: syntax nthroot(rootDegree, value)
      // Users enter nthroot(rootDegree, value), replace with Math.pow(value, 1/rootDegree)
      processedExpr = processedExpr.replace(/nthroot\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, (match, root, value) => {
        return `Math.pow(${value}, 1/(${root}))`;
      });

      // If there's nthroot with single argument (like nthroot(x)), treat as square root
      processedExpr = processedExpr.replace(/nthroot\(\s*([^)]+)\s*\)/g, (match, val) => {
        return `Math.sqrt(${val})`;
      });

      // Trig functions replacements with internal trig wrappers to handle DEG/RAD modes
      processedExpr = processedExpr
        .replace(/sin\(/g, 'trigSin(')
        .replace(/cos\(/g, 'trigCos(')
        .replace(/tan\(/g, 'trigTan(')
        .replace(/asin\(/g, 'trigAsin(')
        .replace(/acos\(/g, 'trigAcos(')
        .replace(/atan\(/g, 'trigAtan(');

      // Logarithms and exponentials
      processedExpr = processedExpr
        .replace(/ln\(/g, 'Math.log(')
        .replace(/log10\(/g, 'Math.log10(')
        .replace(/exp\(/g, 'Math.exp(');

      // Handle modulo
      processedExpr = processedExpr.replace(/ mod /g, ' % ');

      // Context for evaluation
      const context = {
        Math: Math,
        factorial: this.factorial,
        trigSin: (x) => this.trigFunction(Math.sin, x),
        trigCos: (x) => this.trigFunction(Math.cos, x),
        trigTan: (x) => this.trigFunction(Math.tan, x),
        trigAsin: (x) => this.invTrigFunction(Math.asin, x),
        trigAcos: (x) => this.invTrigFunction(Math.acos, x),
        trigAtan: (x) => this.invTrigFunction(Math.atan, x),
      };

      // Uncomment this to debug generated JS expression:
      // console.log('Evaluating expression: ', processedExpr);

      const func = new Function(...Object.keys(context), `"use strict"; return (${processedExpr});`);
      return func(...Object.values(context));
    } catch (error) {
      throw new Error('Evaluation failed');
    }
  }

  factorial(n) {
    n = Number(n);
    if (n < 0) throw new Error('Factorial of negative number');
    if (n > 170) throw new Error('Factorial too large');
    if (!Number.isInteger(n)) throw new Error('Factorial not integer');
    if (n === 0 || n === 1) return 1;

    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  trigFunction(fn, x) {
    if (this.angleMode === 'DEG') {
      x = (x * Math.PI) / 180;
    }
    return fn(x);
  }

  invTrigFunction(fn, x) {
    let result = fn(x);
    if (this.angleMode === 'DEG') {
      result = (result * 180) / Math.PI;
    }
    return result;
  }

  formatResult(value) {
    if (typeof value !== 'number') return String(value);

    if (Math.abs(value) < 1e-12) return '0';

    // Exponential notation for very large/small numbers
    if (Math.abs(value) > 1e10 || (Math.abs(value) < 1e-6 && value !== 0)) {
      return value.toExponential(6);
    }

    if (Number.isInteger(value)) {
      return String(value);
    }

    // Round to avoid floating point errors - round to 12 decimal places
    const rounded = Math.round(value * 1e12) / 1e12;
    return String(rounded);
  }

  showError(message) {
    this.preview.textContent = message;
    setTimeout(() => {
      this.updatePreview();
    }, 2000);
  }

  updateDisplay() {
    this.input.value = this.expression || '0';
    this.updatePreview();
  }

  updatePreview() {
    if (!this.expression.trim()) {
      this.preview.textContent = '0';
      return;
    }

    try {
      const result = this.evaluateExpression(this.expression);
      if (!isNaN(result) && isFinite(result)) {
        this.preview.textContent = `= ${this.formatResult(result)}`;
      } else {
        this.preview.textContent = '';
      }
    } catch {
      this.preview.textContent = '';
    }
  }

  setupHistoryToggle() {
    const toggleBtn = document.getElementById('scientific-history-toggle');
    toggleBtn.addEventListener('click', () => {
      const isVisible = this.historyBox.style.display === 'block';
      this.historyBox.style.display = isVisible ? 'none' : 'block';
    });
  }

  addToHistory(entry) {
    const li = document.createElement('li');
    li.textContent = entry;

    li.addEventListener('click', () => {
      const parts = entry.split('=');
      if (parts[1]) {
        this.expression = parts[1].trim();
        this.updateDisplay();
      }
    });

    this.historyList.prepend(li);

    // Limit history to 100 entries
    if (this.historyList.children.length > 100) {
      this.historyList.removeChild(this.historyList.lastChild);
    }
  }

  saveHistoryToLocal() {
    const entries = Array.from(this.historyList.children).map((li) => li.textContent);
    localStorage.setItem(`${this.calculatorId}-history`, JSON.stringify(entries));
  }

  loadHistoryFromLocal() {
    const saved = localStorage.getItem(`${this.calculatorId}-history`);
    if (saved) {
      try {
        const entries = JSON.parse(saved);
        entries.forEach((entry) => {
          const li = document.createElement('li');
          li.textContent = entry;
          li.addEventListener('click', () => {
            const parts = entry.split('=');
            if (parts[1]) {
              this.expression = parts[1].trim();
              this.updateDisplay();
            }
          });
          this.historyList.appendChild(li);
        });
      } catch (error) {
        console.warn('Failed to load history from localStorage');
      }
    }
  }

  setupClearHistoryButton() {
    const clearBtn = document.getElementById('scientific-clear-history');
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        this.historyList.innerHTML = '';
        localStorage.removeItem(`${this.calculatorId}-history`);
      }
    });
  }

  initKeyboardSupport() {
    document.addEventListener('keydown', (event) => {
      // Check if we're in the scientific calculator tab
      const scientificTab = document.getElementById('scientific');
      if (!scientificTab.classList.contains('active')) {
        return;
      }

      const key = event.key;
      const activeEl = document.activeElement;
      const isTyping = activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName);

      if (isTyping) return;

      const basicKeys = ['0','1','2','3','4','5','6','7','8','9','.','+','-','*','/','(',')','^','%'];

      if (basicKeys.includes(key)) {
        event.preventDefault();
        this.appendToExpression(key);
      } else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        this.calculate();
      } else if (key === 'Backspace') {
        event.preventDefault();
        this.deleteLast();
      } else if (key === 'Escape') {
        event.preventDefault();
        this.clear();
      } else if (key === '!') {
        event.preventDefault();
        this.appendToExpression('!');
      }
      // Quick function shortcuts
      else if (key.toLowerCase() === 's' && event.ctrlKey) {
        event.preventDefault();
        this.appendToExpression('sin(');
      } else if (key.toLowerCase() === 'c' && event.ctrlKey) {
        event.preventDefault();
        this.appendToExpression('cos(');
      } else if (key.toLowerCase() === 't' && event.ctrlKey) {
        event.preventDefault();
        this.appendToExpression('tan(');
      } else if (key === 'E' && event.shiftKey) {
        event.preventDefault();
        this.appendToExpression('e');
      } else if (key === 'L' && event.shiftKey) {
        event.preventDefault();
        this.appendToExpression('ln(');
      } else if (key === 'P' && event.shiftKey) {
        event.preventDefault();
        this.appendToExpression('π');
      }
    });
  }
}

// Initialize the scientific calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ScientificCalculator();
});
