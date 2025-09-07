class MatrixCalculator {
  constructor() {
    this.currentMatrixSize = 2;
    this.currentMatrixOperation = "add";
    this.resultDisplay = document.getElementById("matrix-result-display");
    this.historyList = document.getElementById("matrix-history-list");
    this.calculatorId = "matrix";
    this.history = [];

    this.initSizeButtons();
    this.initOperationSelector();
    this.initCalculateButton();
    this.setupClearHistoryButton();
    this.loadHistoryFromLocal();
    this.createMatrixInputs();
  }

  // ---------------- Init ----------------
  initSizeButtons() {
    const sizeButtons = document.querySelectorAll(".matrix-size-btn");
    sizeButtons.forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        sizeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentMatrixSize = +btn.dataset.size;
        this.createMatrixInputs();
      });
      if (idx === 0) btn.classList.add("active");
    });
  }

  initOperationSelector() {
    const operationSelect = document.getElementById("matrix-operation");
    operationSelect.addEventListener("change", () => {
      this.currentMatrixOperation = operationSelect.value;
      this.createMatrixInputs();
    });
  }

  initCalculateButton() {
    document
      .querySelector(".matrix-btn.calculate")
      .addEventListener("click", () => this.calculateMatrix());
  }

  setupClearHistoryButton() {
    const clearBtn = document.querySelector("#matrix-clear-history");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (confirm("Clear all history?")) {
          this.history = [];
          this.renderHistory();
          localStorage.removeItem(`${this.calculatorId}-history`);
        }
      });
    }
  }

  // ---------------- Matrix Input Handling ----------------
  createMatrixInputs() {
    const container = document.getElementById("matrix-inputs");
    container.innerHTML = "";

    const needTwo = !["determinant", "inverse"].includes(
      this.currentMatrixOperation
    );

    container.appendChild(this.createMatrix("A", this.currentMatrixSize));
    if (needTwo) {
      container.appendChild(this.createMatrix("B", this.currentMatrixSize));
    }
  }

  createMatrix(name, size) {
    const matrixDiv = document.createElement("div");
    matrixDiv.className = "matrix";

    const title = document.createElement("h3");
    title.textContent = `Matrix ${name}`;
    matrixDiv.appendChild(title);

    const gridDiv = document.createElement("div");
    gridDiv.className = "matrix-grid";
    gridDiv.style.gridTemplateColumns = `repeat(${size}, minmax(40px, 1fr))`;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const input = document.createElement("input");
        input.type = "number";
        input.step = "any";
        input.className = "matrix-input";
        input.id = `matrix-${name}-${i}-${j}`;
        input.placeholder = "0";
        gridDiv.appendChild(input);
      }
    }

    matrixDiv.appendChild(gridDiv);
    return matrixDiv;
  }

  getMatrixValues(name, size) {
    return Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) =>
        parseFloat(document.getElementById(`matrix-${name}-${i}-${j}`).value) || 0
      )
    );
  }

  // ---------------- Matrix Operations ----------------
  calculateMatrix() {
    try {
      const size = this.currentMatrixSize;
      const A = this.getMatrixValues("A", size);
      let B = null;
      let result;

      switch (this.currentMatrixOperation) {
        case "add":
          B = this.getMatrixValues("B", size);
          result = this.addMatrices(A, B);
          break;
        case "subtract":
          B = this.getMatrixValues("B", size);
          result = this.subtractMatrices(A, B);
          break;
        case "multiply":
          B = this.getMatrixValues("B", size);
          result = this.multiplyMatrices(A, B);
          break;
        case "determinant":
          result = this.calculateDeterminant(A);
          break;
        case "inverse":
          result = this.calculateInverse(A);
          break;
      }

      this.displayMatrixResult(result);
      this.addToHistory(this.formatHistoryEntry(A, B, result));
      this.saveHistoryToLocal();
    } catch (error) {
      this.resultDisplay.textContent = `Error: ${error.message}`;
    }
  }

  addMatrices(A, B) {
    return A.map((row, i) => row.map((val, j) => val + B[i][j]));
  }

  subtractMatrices(A, B) {
    return A.map((row, i) => row.map((val, j) => val - B[i][j]));
  }

  multiplyMatrices(A, B) {
    const size = A.length;
    return Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) =>
        A[i].reduce((sum, val, k) => sum + val * B[k][j], 0)
      )
    );
  }

  calculateDeterminant(m) {
    const size = m.length;
    if (size === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    if (size === 3) {
      return (
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
      );
    }
    throw new Error("Determinant only supported for 2x2 and 3x3");
  }

  calculateInverse(m) {
    const size = m.length;
    const det = this.calculateDeterminant(m);
    if (Math.abs(det) < 1e-10) throw new Error("Matrix is singular, no inverse");

    if (size === 2) {
      return [
        [m[1][1] / det, -m[0][1] / det],
        [-m[1][0] / det, m[0][0] / det],
      ];
    }
    if (size === 3) {
      return [
        [
          (m[1][1] * m[2][2] - m[1][2] * m[2][1]) / det,
          (m[0][2] * m[2][1] - m[0][1] * m[2][2]) / det,
          (m[0][1] * m[1][2] - m[0][2] * m[1][1]) / det,
        ],
        [
          (m[1][2] * m[2][0] - m[1][0] * m[2][2]) / det,
          (m[0][0] * m[2][2] - m[0][2] * m[2][0]) / det,
          (m[0][2] * m[1][0] - m[0][0] * m[1][2]) / det,
        ],
        [
          (m[1][0] * m[2][1] - m[1][1] * m[2][0]) / det,
          (m[0][1] * m[2][0] - m[0][0] * m[2][1]) / det,
          (m[0][0] * m[1][1] - m[0][1] * m[1][0]) / det,
        ],
      ];
    }
    throw new Error("Inverse only supported for 2x2 and 3x3");
  }

  // ---------------- Result & History ----------------
  displayMatrixResult(result) {
    if (typeof result === "number") {
      this.resultDisplay.textContent = `Result: ${this.formatNumber(result)}`;
    } else {
      this.resultDisplay.textContent =
        "Result:\n" + result.map(r => `[ ${r.join(", ")} ]`).join("\n");
    }
  }

  formatMatrix(m) {
    return `[ ${m.map(r => `[ ${r.join(", ")} ]`).join(" , ")} ]`;
  }

  formatHistoryEntry(A, B, result) {
    let op;
    switch (this.currentMatrixOperation) {
      case "add":
        op = `${this.formatMatrix(A)} + ${this.formatMatrix(B)}`;
        break;
      case "subtract":
        op = `${this.formatMatrix(A)} - ${this.formatMatrix(B)}`;
        break;
      case "multiply":
        op = `${this.formatMatrix(A)} × ${this.formatMatrix(B)}`;
        break;
      case "determinant":
        op = `Det ${this.formatMatrix(A)}`;
        break;
      case "inverse":
        op = `Inv ${this.formatMatrix(A)}`;
        break;
    }

    const resultStr =
      typeof result === "number"
        ? this.formatNumber(result)
        : this.formatMatrix(result);

    return `${op} → ${resultStr}`;
  }

  addToHistory(entry) {
    this.history.unshift(entry);
    if (this.history.length > 50) this.history.pop();
    this.renderHistory();
  }

  renderHistory() {
    this.historyList.innerHTML = this.history
      .map(entry => `<li>${entry}</li>`)
      .join("");
  }
  saveHistoryToLocal() {
    localStorage.setItem(
      `${this.calculatorId}-history`,
      JSON.stringify(this.history)
    );
  }

  loadHistoryFromLocal() {
    const saved = localStorage.getItem(`${this.calculatorId}-history`);
    if (saved) {
      this.history = JSON.parse(saved);
      this.renderHistory();
    }
  }

  formatNumber(num) {
    return Math.abs(num) < 1e-10 ? "0" : parseFloat(num.toFixed(2));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new MatrixCalculator();
});
