class BasicCalculator {
  constructor() {
    this.input = document.getElementById('basic-input');
    this.preview = document.getElementById('basic-preview-display');
    this.historyList = document.getElementById('basic-history-list');
    this.calculatorId = 'basic';

    this.expression = '';
    this.evalExpression = '';
    this.lastAnswer = '';
    this.history = [];

    this.init();
  }

  init() {
    this.input.setAttribute('readonly', true);
    this.initButtons();
    this.initKeyboardSupport();
    this.loadHistoryFromLocal();
    this.setupClearHistoryButton();
  }

  initButtons() {
    const buttons = document.querySelectorAll('.basic-calculator .basic-btn');
    buttons.forEach(button => {
      button.addEventListener('click', () => this.handleButtonClick(button));
    });
  }

  handleButtonClick(button) {
    const value = button.textContent.trim();

    if (button.classList.contains('number') || ['+', '-', 'x', '÷', '.'].includes(value)) {
      this.appendToExpression(value);
    } else {
      switch (value) {
        case 'C': this.clear(); break;
        case '⌫': this.deleteLast(); break;
        case '%': this.appendToExpression('%'); break;
        case 'Ans': this.useLastAnswer(); break;
        case '=': this.calculate(); break;
      }
    }
  }

  appendToExpression(symbol) {
    this.expression += symbol;
    this.evalExpression += this.convertOperator(symbol);
    this.updateDisplay();
  }

  convertOperator(symbol) {
    return symbol === 'x' ? '*' : symbol === '÷' ? '/' : symbol === '%' ? '/100' : symbol;
  }

  deleteLast() {
    this.expression = this.expression.slice(0, -1);
    this.evalExpression = this.evalExpression.slice(0, -1);
    this.updateDisplay();
  }

  clear() {
    this.expression = '';
    this.evalExpression = '';
    this.updateDisplay();
  }

  useLastAnswer() {
    if (this.lastAnswer) {
      this.expression += this.lastAnswer;
      this.evalExpression += this.lastAnswer;
      this.updateDisplay();
    }
  }

  calculate() {
    try {
      const result = eval(this.evalExpression);
      if (!isNaN(result)) {
        const historyEntry = `${this.expression} = ${result}`;
        this.lastAnswer = result.toString();
        this.expression = this.evalExpression = this.lastAnswer;
        this.addToHistory(historyEntry);
        this.saveHistoryToLocal();
        this.updateDisplay();
      }
    } catch {
      alert('Invalid Expression');
    }
  }

  translateExpression(userExpr) {
    return userExpr.replace(/x/g, '*').replace(/÷/g, '/').replace(/%/g, '/100');
  }

  updateDisplay() {
    this.input.value = this.expression || '0';
    this.updatePreview();
  }

  updatePreview() {
    if (!this.evalExpression) return (this.preview.textContent = '0');
    try {
      const result = eval(this.evalExpression);
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
      li.addEventListener('click', () => this.loadHistoryEntry(entry));
      this.historyList.appendChild(li);
    });
  }

  loadHistoryEntry(entry) {
    const [expr] = entry.split('=');
    if (expr) {
      this.expression = expr.trim();
      this.evalExpression = this.translateExpression(this.expression);
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
    const clearBtn = document.querySelector('#clear-history');
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        this.history = [];
        this.renderHistory();
        localStorage.removeItem(`${this.calculatorId}-history`);
      }
    });
  }

  initKeyboardSupport() {
    document.addEventListener('keydown', (event) => this.handleKeyboard(event));
  }

  handleKeyboard(event) {
    const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '+', '-', '*', '/'];
    const activeEl = document.activeElement;
    if (activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName)) return;

    if (allowedKeys.includes(event.key)) {
      event.preventDefault();
      let symbol = event.key === '*' ? 'x' : event.key === '/' ? '÷' : event.key;
      this.appendToExpression(symbol);
    } else if (event.key === 'Enter' || event.key === '=') {
      event.preventDefault();
      this.calculate();
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      this.deleteLast();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.clear();
    }
  }
}
document.addEventListener('DOMContentLoaded', () => new BasicCalculator());
