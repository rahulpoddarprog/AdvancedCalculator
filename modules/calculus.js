class CalculusCalculator {
  constructor() {
    this.modeButtons = document.querySelectorAll('.calculus-mode-btn');
    this.functionInput = document.getElementById('calculus-input');
    this.integrationOptions = document.getElementById('integration-options');
    this.limitsContainer = document.getElementById('limits-input');
    this.lowerLimit = document.getElementById('lower-limit');
    this.upperLimit = document.getElementById('upper-limit');
    this.calculateBtn = document.querySelector('.calculus-btn.calculate');
    this.resultDisplay = document.getElementById('calculus-result');
    this.historyList = document.getElementById('calculus-history-list');
    this.clearHistoryBtn = document.querySelector('#calculus #clear-history');
    this.calculatorId = 'calculus';

    this.mode = 'differentiation';
    this.history = [];

    this.init();
  }

  init() {
    this.initModeButtons();
    this.initIntegrationOptions();
    this.initCalculateButton();
    this.loadHistoryFromLocal();
    this.setupClearHistoryButton();
    this.initKeyboardSupport();
  }

  initModeButtons() {
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.mode = btn.dataset.mode;
        this.updateModeUI();
      });
    });
    this.updateModeUI();
  }

  updateModeUI() {
    this.modeButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.calculus-mode-btn[data-mode="${this.mode}"]`).classList.add('active');
    this.integrationOptions.style.display = this.mode === 'integration' ? 'block' : 'none';
  }

  initIntegrationOptions() {
    const indefiniteRadio = document.getElementById('indefinite');
    const definiteRadio = document.getElementById('definite');

    indefiniteRadio.addEventListener('change', () => {
      this.limitsContainer.style.display = 'none';
    });
    definiteRadio.addEventListener('change', () => {
      this.limitsContainer.style.display = 'block';
    });
  }

  initCalculateButton() {
    this.calculateBtn.addEventListener('click', () => this.calculate());
  }

  calculate() {
    const funcStr = this.functionInput.value.trim();
    if (!funcStr) return alert('Enter a function!');

    try {
      let result;

      if (this.mode === 'differentiation') {
        result = math.derivative(funcStr, 'x').toString();
      } else if (this.mode === 'integration') {
        const isDefinite = document.getElementById('definite').checked;

        if (isDefinite) {
          const a = parseFloat(this.lowerLimit.value);
          const b = parseFloat(this.upperLimit.value);
          if (isNaN(a) || isNaN(b)) return alert('Enter valid limits!');

          if (typeof Algebrite === 'undefined') {
            alert("Algebrite library is not loaded. Integration will not work.");
            return;
          }

          const integralExpr = Algebrite.integral(funcStr).toString();
          const F = math.compile(integralExpr);
          result = F.evaluate({ x: b }) - F.evaluate({ x: a });
        } else {
          if (typeof Algebrite === 'undefined') {
            alert("Algebrite library is not loaded. Integration will not work.");
            return;
          }
          result = Algebrite.integral(funcStr).toString();
        }
      }

      this.resultDisplay.textContent = `Result: ${result}`;

      const historyEntry = `${this.mode.toString().replace(/\b\w/g, c => c.toUpperCase())}: ${funcStr} = ${result}`;
      this.addToHistory(historyEntry);
      this.saveHistoryToLocal();
    } catch (err) {
      alert('Invalid Expression or unsupported function! Check the syntax (e.g., use * for multiplication).');
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
    const splitIndex = entry.indexOf(':');
    if (splitIndex !== -1) {
      const mode = entry.substring(0, splitIndex).toLowerCase();
      const exprPart = entry.substring(splitIndex + 1).split('=')[0].trim();
      this.mode = mode;
      this.updateModeUI();
      this.functionInput.value = exprPart;
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
    this.clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        this.history = [];
        this.renderHistory();
        localStorage.removeItem(`${this.calculatorId}-history`);
      }
    });
  }

  initKeyboardSupport() {
    document.addEventListener('keydown', (event) => {
      const activeEl = document.activeElement;
      if (activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName)) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        this.calculate();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.functionInput.value = '';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => new CalculusCalculator());
