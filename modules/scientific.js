class ScientificCalculator {
  constructor() {
    this.input = document.getElementById('scientific-input');
    this.preview = document.getElementById('scientific-preview-display');
    this.historyList = document.getElementById('scientific-history-list');
    this.calculatorId = 'scientific';

    this.expression = '';
    this.evalExpression = '';
    this.lastAnswer = '';
    this.history = [];

    this.angleMode = localStorage.getItem('angleMode') || 'DEG';

    this.initialize();
  }

  initialize() {
    this.input.setAttribute('readonly', true);

    this.initButtons();
    this.initKeyboardSupport();
    this.loadHistoryFromLocal();
    this.setupClearHistoryButton();
    this.setAngleMode(this.angleMode); // Set default active button
  }

  initButtons() {
    const buttons = document.querySelectorAll('.scientific-btn');
    buttons.forEach(btn => btn.addEventListener('click', () => this.handleButtonClick(btn)));

    document.querySelectorAll('.angle-mode')
      .forEach(btn => btn.addEventListener('click', () => this.setAngleMode(btn.textContent)));
  }

  handleButtonClick(button) {
    const value = button.textContent.trim();

    const numberOrOperator = ['+', '-', 'x', '÷', '.', ',', '(', ')'];
    if (button.classList.contains('number') || numberOrOperator.includes(value)) return this.appendToExpression(value);

    switch (value) {
      case 'C': return this.clear();
      case '⌫': return this.deleteLast();
      case '%': return this.appendToExpression('%');
      case 'Ans': return this.useLastAnswer();
      case '=': return this.calculate();
      case 'DEG': case 'RAD': return this.setAngleMode(value);
      default: return this.handleFunction(value);
    }
  }

  appendToExpression(symbol) {
    this.expression += symbol;
    this.updateEvalExpression();
    this.updateDisplay();
  }

  deleteLast() {
    this.expression = this.expression.slice(0, -1);
    this.updateEvalExpression();
    this.updateDisplay();
  }

  clear() {
    this.expression = '';
    this.updateEvalExpression();
    this.updateDisplay();
  }

  useLastAnswer() {
    if (!this.lastAnswer) return;
    this.expression += this.lastAnswer;
    this.updateEvalExpression();
    this.updateDisplay();
  }

  updateEvalExpression() {
    this.evalExpression = this.translateExpression(this.expression);
  }

  setAngleMode(mode) {
    this.angleMode = mode;
    localStorage.setItem('angleMode', mode);

    document.querySelectorAll('.angle-mode').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.angle-mode'))
                          .find(btn => btn.textContent === mode);
    if (activeBtn) activeBtn.classList.add('active');
  }

  handleFunction(func) {
    const mapping = {
      'π': 'π', 'e': 'e',
      'sin': 'sin(', 'cos': 'cos(', 'tan': 'tan(',
      'sin⁻¹': 'sin⁻¹(', 'cos⁻¹': 'cos⁻¹(', 'tan⁻¹': 'tan⁻¹(',
      'xʸ': '^', 'ⁿ√x': '√(', 'mod': ' mod ',
      'eˣ': 'exp(', 'logₙ': 'log(', 'ln': 'ln(', 'x!': '!'
    };

    if (mapping[func]) this.appendToExpression(mapping[func]);
  }

  sin(x) { return Math.sin(this.angleMode === 'DEG' ? x * Math.PI / 180 : x); }
  cos(x) { return Math.cos(this.angleMode === 'DEG' ? x * Math.PI / 180 : x); }
  tan(x) { return Math.tan(this.angleMode === 'DEG' ? x * Math.PI / 180 : x); }

  asin(x) { return this.angleMode === 'DEG' ? Math.asin(x) * 180 / Math.PI : Math.asin(x); }
  acos(x) { return this.angleMode === 'DEG' ? Math.acos(x) * 180 / Math.PI : Math.acos(x); }
  atan(x) { return this.angleMode === 'DEG' ? Math.atan(x) * 180 / Math.PI : Math.atan(x); }

  factorial(n) {
    n = Math.floor(n);
    if (n < 0) return NaN;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  logN(base, value) { return Math.log(value) / Math.log(base); }

  safeEval(expr) {
    expr = expr.replace(/√\(([^,]+),([^)]+)\)/g, 'Math.pow($1,1/$2)');
    const fn = new Function(
      'sin','cos','tan','asin','acos','atan','factorial','logN','ln','exp','Math',
      `return ${expr};`
    );
    return fn(
      this.sin.bind(this), this.cos.bind(this), this.tan.bind(this),
      this.asin.bind(this), this.acos.bind(this), this.atan.bind(this),
      this.factorial.bind(this), this.logN.bind(this), Math.log, Math.exp, Math
    );
  }

  calculate() {
    try {
      const result = this.safeEval(this.evalExpression);
      if (!isNaN(result)) {
        const historyEntry = `${this.expression} = ${result}`;
        this.lastAnswer = result.toString();
        this.expression = result.toString();
        this.updateEvalExpression();
        this.addToHistory(historyEntry);
        this.saveHistoryToLocal();
        this.updateDisplay();
      }
    } catch {
      alert('Invalid Expression');
    }
  }

  updateDisplay() {
    this.input.value = this.expression || '0';
    this.updatePreview();
  }

  updatePreview() {
    if (!this.evalExpression) return this.preview.textContent = '0';
    try {
      const result = this.safeEval(this.evalExpression);
      this.preview.textContent = !isNaN(result) ? `= ${result}` : '';
    } catch {
      this.preview.textContent = 'ERR';
    }
  }

  addToHistory(entry) {
    this.history.unshift(entry);
    if (this.history.length > 50) this.history.pop();
    this.renderHistory();
  }

  renderHistory() {
    this.historyList.innerHTML = '';
    this.history.forEach(entry => {
      const li = document.createElement('li');
      li.textContent = entry;
      li.addEventListener('click', () => this.loadFromHistory(entry));
      this.historyList.appendChild(li);
    });
  }

  loadFromHistory(entry) {
    const parts = entry.split('=');
    if (parts[0]) {
      this.expression = parts[0].trim();
      this.updateEvalExpression();
      this.updateDisplay();
    }
  }

  saveHistoryToLocal() {
    localStorage.setItem(`${this.calculatorId}-history`, JSON.stringify(this.history));
  }

  loadHistoryFromLocal() {
    const saved = localStorage.getItem(`${this.calculatorId}-history`);
    if (saved) {
      this.history = JSON.parse(saved);
      this.renderHistory();
    }
  }

  setupClearHistoryButton() {
    const clearBtn = document.getElementById('clear-history');
    if (!clearBtn) return;
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        this.history = [];
        this.renderHistory();
        localStorage.removeItem(`${this.calculatorId}-history`);
      }
    });
  }

  translateExpression(expr) {
    return expr.replace(/x/g,'*')
               .replace(/÷/g,'/')
               .replace(/%/g,'/100')
               .replace(/π/g,'Math.PI')
               .replace(/e/g,'Math.E')
               .replace(/\^/g,'**')
               .replace(/ mod /g,'%')
               .replace(/sin⁻¹\(/g,'asin(')
               .replace(/cos⁻¹\(/g,'acos(')
               .replace(/tan⁻¹\(/g,'atan(')
               .replace(/ln\(/g,'Math.log(')
               .replace(/exp\(/g,'Math.exp(')
               .replace(/log\(/g,'logN(10,')
               .replace(/(\d+)!/g,'factorial($1)');
  }

  initKeyboardSupport() {
    document.addEventListener('keydown', e => {
      if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;

      const key = e.key;
      const allowedKeys = ['0','1','2','3','4','5','6','7','8','9','.',',','+','-','*','/','^','(',')'];
      if (allowedKeys.includes(key)) {
        e.preventDefault();
        this.appendToExpression(key==='*' ? 'x' : key==='/ ' ? '÷' : key);
      } else if (key==='Enter'||key==='=') { e.preventDefault(); this.calculate(); }
      else if (key==='Backspace') { e.preventDefault(); this.deleteLast(); }
      else if (key==='Escape') { e.preventDefault(); this.clear(); }
    });
  }
}
document.addEventListener('DOMContentLoaded', ()=>new ScientificCalculator());
