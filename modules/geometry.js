class GeometryCalculator {
  constructor() {
    this.calculatorId = 'geometry';
    this.modeButtons = document.querySelectorAll('.geometry-mode');
    this.shapeSelect = document.getElementById('geometry-shape-select');
    this.inputsContainer = document.getElementById('geometry-inputs');
    this.formulaDisplay = document.getElementById('geometry-formula-display');
    this.resultDisplay = document.getElementById('geometry-result');
    this.clearHistoryBtn = document.getElementById('clear-history');
    this.historyList = document.getElementById('geometry-history-list');

    this.currentMode = 'area';
    this.currentShape = '';
    this.history = [];

    this.shapes = {
      area: {
        square: { name: 'Square', inputs: ['side'], formula: 'A = side²' },
        rectangle: { name: 'Rectangle', inputs: ['length', 'width'], formula: 'A = length x width' },
        triangle: { name: 'Triangle', inputs: ['base', 'height'], formula: 'A = 1/2 x base x height' },
        circle: { name: 'Circle', inputs: ['radius'], formula: 'A = π x radius²' },
        trapezium: { name: 'Trapezium', inputs: ['base1', 'base2', 'height'], formula: 'A = 1/2 x (base1 + base2) x height' },
        parallelogram: { name: 'Parallelogram', inputs: ['base', 'height'], formula: 'A = base x height' },
        rhombus: { name: 'Rhombus', inputs: ['diagonal1', 'diagonal2'], formula: 'A = 1/2 x diagonal1 x diagonal2' },
        ellipse: { name: 'Ellipse', inputs: ['semiMajor', 'semiMinor'], formula: 'A = π x a x b' }
      },
      volume: {
        cube: { name: 'Cube', inputs: ['side'], formula: 'V = side³' },
        cuboid: { name: 'Cuboid', inputs: ['length', 'width', 'height'], formula: 'V = length x width x height' },
        sphere: { name: 'Sphere', inputs: ['radius'], formula: 'V = (4/3) x π x radius³' },
        cylinder: { name: 'Cylinder', inputs: ['radius', 'height'], formula: 'V = π x radius² x height' },
        cone: { name: 'Cone', inputs: ['radius', 'height'], formula: 'V = (1/3) x π x radius² x height' },
        pyramid: { name: 'Pyramid', inputs: ['baseArea', 'height'], formula: 'V = (1/3) x baseArea x height' },
        prism: { name: 'Prism', inputs: ['baseArea', 'height'], formula: 'V = baseArea x height' }
      }
    };

    this.inputLabels = {
      side: 'Side',
      length: 'Length',
      width: 'Width',
      height: 'Height',
      base: 'Base',
      radius: 'Radius',
      base1: 'Base 1',
      base2: 'Base 2',
      diagonal1: 'Diagonal 1',
      diagonal2: 'Diagonal 2',
      semiMajor: 'Semi-major axis (a)',
      semiMinor: 'Semi-minor axis (b)',
      baseArea: 'Base Area'
    };

    this.init();
  }

  init() {
    this.setupModeButtons();
    this.loadStateFromLocal();
    this.populateShapeSelect();
    this.setupClearHistoryButton();
    this.loadHistoryFromLocal();
    this.setupCalculateButton();
  }

  setupModeButtons() {
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.setMode(btn.dataset.type));
    });
  }

  setMode(mode) {
    this.currentMode = mode;
    localStorage.setItem(`${this.calculatorId}-mode`, mode);

    this.modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.type === mode));
    this.populateShapeSelect();
  }

  populateShapeSelect() {
    const shapes = this.shapes[this.currentMode];
    this.shapeSelect.innerHTML = '';

    Object.entries(shapes).forEach(([key, shape]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = shape.name;
      this.shapeSelect.appendChild(option);
    });

    this.currentShape = this.currentShape && shapes[this.currentShape]
      ? this.currentShape
      : this.shapeSelect.value;

    this.shapeSelect.value = this.currentShape;

    const newSelect = this.shapeSelect.cloneNode(true);
    this.shapeSelect.replaceWith(newSelect);
    this.shapeSelect = newSelect;
    this.shapeSelect.addEventListener('change', () => this.changeShape());

    this.changeShape();
  }

  changeShape() {
    this.currentShape = this.shapeSelect.value;
    localStorage.setItem(`${this.calculatorId}-shape`, this.currentShape);

    const shape = this.shapes[this.currentMode][this.currentShape];
    if (!shape) return;

    this.inputsContainer.innerHTML = '';
    shape.inputs.forEach(inputName => {
      const row = document.createElement('div');
      row.className = 'input-row';

      const label = document.createElement('label');
      label.textContent = `${this.inputLabels[inputName]}:`;

      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.id = `geometry-input-${inputName}`;
      input.placeholder = `Enter ${this.inputLabels[inputName].toLowerCase()}`;

      row.append(label, input);
      this.inputsContainer.appendChild(row);
    });

    this.formulaDisplay.textContent = `Formula: ${shape.formula}`;
    this.resultDisplay.textContent = 'Result: 0';
  }

  setupCalculateButton() {
    document.querySelector('.geometry-btn.calculate').addEventListener('click', () => this.calculate());
  }

  calculate() {
    const shape = this.shapes[this.currentMode][this.currentShape];
    if (!shape) return;

    const values = {};
    let valid = true;

    shape.inputs.forEach(inputName => {
      const input = document.getElementById(`geometry-input-${inputName}`);
      const value = parseFloat(input.value);
      if (isNaN(value) || value <= 0) {
        valid = false;
        input.style.borderColor = '#ef4444';
      } else {
        values[inputName] = value;
        input.style.borderColor = '#e5e7eb';
      }
    });

    if (!valid) return alert('Please enter valid positive numbers');

    const result = this.currentMode === 'area'
      ? this.calculateArea(this.currentShape, values)
      : this.calculateVolume(this.currentShape, values);

    const unit = this.currentMode === 'area' ? 'square units' : 'cubic units';
    this.resultDisplay.textContent = `Result: ${result.toFixed(2)} ${unit}`;

    const paramsString = Object.entries(values)
      .map(([k, v]) => `${this.inputLabels[k]}=${v}`)
      .join(', ');

    const historyEntry = `${shape.name} (${this.currentMode}) [${paramsString}] → ${result.toFixed(2)} ${unit}`;

    this.addToHistory(historyEntry);
    this.saveHistoryToLocal();
  }

  calculateArea(shape, v) {
    switch (shape) {
      case 'square': return v.side ** 2;
      case 'rectangle': return v.length * v.width;
      case 'triangle': return 0.5 * v.base * v.height;
      case 'circle': return Math.PI * v.radius ** 2;
      case 'trapezium': return 0.5 * (v.base1 + v.base2) * v.height;
      case 'parallelogram': return v.base * v.height;
      case 'rhombus': return 0.5 * v.diagonal1 * v.diagonal2;
      case 'ellipse': return Math.PI * v.semiMajor * v.semiMinor;
      default: return 0;
    }
  }

  calculateVolume(shape, v) {
    switch (shape) {
      case 'cube': return v.side ** 3;
      case 'cuboid': return v.length * v.width * v.height;
      case 'sphere': return (4 / 3) * Math.PI * v.radius ** 3;
      case 'cylinder': return Math.PI * v.radius ** 2 * v.height;
      case 'cone': return (1 / 3) * Math.PI * v.radius ** 2 * v.height;
      case 'pyramid': return (1 / 3) * v.baseArea * v.height;
      case 'prism': return v.baseArea * v.height;
      default: return 0;
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
    alert(`History clicked: ${entry}`);
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
      if (!confirm('Clear all history?')) return;
      this.history = [];
      localStorage.removeItem(`${this.calculatorId}-history`);
      this.renderHistory();
    });
  }

  loadStateFromLocal() {
    const savedMode = localStorage.getItem(`${this.calculatorId}-mode`);
    if (savedMode) this.currentMode = savedMode;

    const savedShape = localStorage.getItem(`${this.calculatorId}-shape`);
    if (savedShape) this.currentShape = savedShape;

    this.setMode(this.currentMode);
  }
}
document.addEventListener('DOMContentLoaded', () => new GeometryCalculator());
