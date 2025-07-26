class BasicCalculator {
  constructor() {
    this.input = document.getElementById('basic-input');
    this.preview = document.getElementById('basic-preview-display');
    this.expression = '';
    this.lastAnswer = '';
    this.calculatorId = 'basic';
    this.historyList = document.getElementById('basic-history-list');
    this.historyBox = document.getElementById('basic-history-box');
    this.initButtons();
    this.setupHistoryToggle();
    this.loadHistoryFromLocal();
    this.initKeyboardSupport();
    this.setupClearHistoryButton();
    this.input.setAttribute('readonly', true); // Prevent manual typing
  }

  initButtons() {
    const buttons = document.querySelectorAll('.basic-calculator .basic-btn');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const value = button.textContent.trim();

        if (button.classList.contains('number') || ['+', '-', '×', '/', '.'].includes(value)) {
          this.appendToExpression(this.convertOperator(value));
        } else if (value === 'C') {
          this.clear();
        } else if (value === '⌫') {
          this.deleteLast();
        } else if (value === '%') {
          this.appendToExpression('/100');
        } else if (value === 'Ans') {
          this.useLastAnswer();
        } else if (value === '=') {
          this.calculate();
        }
      });
    });
  }

  appendToExpression(value) {
    const lastChar = this.expression.slice(-1);
    if (/[+\-*/]/.test(lastChar) && /[+\-*/]/.test(value)) {
      this.expression = this.expression.slice(0, -1) + value;
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
    this.expression = this.expression.slice(0, -1);
    this.updateDisplay();
  }

  clear() {
    this.expression = '';
    this.updateDisplay();
  }

  calculate() {
    try {
      const result = eval(this.expression);
      if (!isNaN(result)) {
        const historyEntry = `${this.expression} = ${result}`;
        this.expression = result.toString();
        this.lastAnswer = result.toString();
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
    if (!this.expression) {
      this.preview.textContent = '0';
      return;
    }
    try {
      const result = eval(this.expression);
      if (!isNaN(result)) {
        this.preview.textContent = `Ans = ${result}`;
      } else {
        this.preview.textContent = '';
      }
    } catch {
      this.preview.textContent = 'ERR';
    }
  }

  convertOperator(symbol) {
    return symbol === '×' ? '*' : symbol;
  }

  setupHistoryToggle() {
    const toggleBtn = document.getElementById('basic-history-toggle');
    toggleBtn.addEventListener('click', () => {
      const visible = this.historyBox.style.display === 'block';
      this.historyBox.style.display = visible ? 'none' : 'block';
    });
  }

  addToHistory(entry) {
    const li = document.createElement('li');
    li.textContent = entry;

    // Optional: Click to reuse result
    li.addEventListener('click', () => {
      const parts = entry.split('=');
      if (parts[1]) {
        this.expression = parts[1].trim();
        this.updateDisplay();
      }
    });

    this.historyList.prepend(li);

    if (this.historyList.children.length > 50) {
      this.historyList.removeChild(this.historyList.lastChild);
    }
  }

  saveHistoryToLocal() {
    const entries = Array.from(this.historyList.children).map(li => li.textContent);
    localStorage.setItem(`${this.calculatorId}-history`, JSON.stringify(entries));
  }

  loadHistoryFromLocal() {
    const saved = localStorage.getItem(`${this.calculatorId}-history`);
    if (saved) {
      JSON.parse(saved).forEach(entry => {
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
    }
  }

  setupClearHistoryButton() {
    const clearBtn = document.getElementById('basic-clear-history');
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        this.historyList.innerHTML = '';
        localStorage.removeItem(`${this.calculatorId}-history`);
      }
    });
  }

  initKeyboardSupport() {
    document.addEventListener('keydown', (event) => {
      const key = event.key;
      const allowedKeys = ['0','1','2','3','4','5','6','7','8','9','.','+','-','*','/'];

      // If the user is typing into an input/textarea (e.g. console or form), ignore
      const activeEl = document.activeElement;
      const isTyping = activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName);
      if (isTyping) return;

      if (allowedKeys.includes(key)) {
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
      }
      // Let all other keys like F12, Ctrl+Shift+I work normally
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BasicCalculator();
});
