function changeMatrixSize(matrixId, type, change) {
  const matrixDiv = document.getElementById(`matrix${matrixId}`);
  const currentRows = matrixDiv.children.length / (matrixDiv.dataset.cols || 3);
  const currentCols = parseInt(matrixDiv.dataset.cols) || 3;

  let newRows = currentRows;
  let newCols = currentCols;

  if (type === 'row') {
    newRows = Math.max(1, currentRows + change);
  } else {
    newCols = Math.max(1, currentCols + change);
  }

  matrixDiv.dataset.cols = newCols;
  createMatrixInputs(`matrix${matrixId}`, newRows, newCols);
}

function createMatrixInputs(containerId, rows = 3, cols = 3) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
  container.style.gridTemplateRows = `repeat(${rows}, 40px)`;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = 0;

      // Validasi input saat diketik
      input.addEventListener('input', function() {
        const error = validateInput(this);
        if (error) console.error(error);
      });

      container.appendChild(input);
    }
  }
}

function getMatrix(containerId) {
  // Ambil dan parsing nilai input matriks
  const container = document.getElementById(containerId);
  const inputs = container.getElementsByTagName('input');
  const cols = parseInt(container.dataset.cols) || 3;
  const matrix = [];

  for (let i = 0; i < inputs.length; i += cols) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      const value = inputs[i + j]?.value.trim();
      row.push(parseFraction(value));
    }
    matrix.push(row);
  }

  return matrix;
}

function displayResult(data) {
  // Tampilkan hasil perhitungan
  const hasilElement = document.getElementById('hasil');
  if (Array.isArray(data)) {
    hasilElement.textContent = data.map(row => `  [${row.join(', ')}]`).join('\n');
  } else {
    hasilElement.textContent = data;
  }
}

function resetAll() {
  // Reset semua input dan hasil
  document.getElementById('hasil').textContent = 'Pilih operasi untuk melihat hasil.';
  const matrixA = document.getElementById('matrixA');
  const inputsA = matrixA.getElementsByTagName('input');
  for (let input of inputsA) input.value = '0';
  const matrixB = document.getElementById('matrixB');
  const inputsB = matrixB.getElementsByTagName('input');
  for (let input of inputsB) input.value = '0';
}

async function hitung(operation) {
  // Kirim permintaan operasi matriks ke server
  const A = getMatrix('matrixA');
  const B = getMatrix('matrixB');
  const scalarA = parseFloat(document.getElementById('scalarA').value);
  const scalarB = parseFloat(document.getElementById('scalarB').value);

  const body = { op: operation, A, B, scalarA, scalarB };

  const response = await fetch('/api/matrix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  displayResult(result.hasil);
}

document.addEventListener('DOMContentLoaded', () => {
  createMatrixInputs('matrixA');
  createMatrixInputs('matrixB');
});

function parseFraction(value) {
  // Parsing string menjadi angka atau pecahan
  if (!value) return 0;
  try {
    const normalizedValue = value.replace(',', '.');
    if (normalizedValue.includes('/')) {
      const parts = normalizedValue.split('/');
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (denominator !== 0) return numerator / denominator;
        return 0;
      }
    }
    const num = parseFloat(normalizedValue);
    return isNaN(num) ? 0 : num;
  } catch (e) {
    return 0;
  }
}

function validateInput(inputElement) {
  // Validasi isi input agar sesuai format
  const value = inputElement.value;
  const validChars = /^[0-9.,/]*$/;
  if (!validChars.test(value)) {
    inputElement.value = value.replace(/[^0-9.,/]/g, '');
    return "Error: Input hanya boleh berisi angka (0-9), koma (,), titik (.), atau slash (/)";
  }

  const hasComma = value.includes(',');
  const hasDot = value.includes('.');
  if ((hasComma && hasDot) || 
      (value.match(/,/g)?.length > 1) || 
      (value.match(/\./g)?.length > 1)) {
    let cleanedValue = value;
    if (hasComma) {
      const parts = value.split(',');
      cleanedValue = parts[0] + ',' + parts.slice(1).join('').replace(/[,.]/g, '');
    } else if (hasDot) {
      const parts = value.split('.');
      cleanedValue = parts[0] + '.' + parts.slice(1).join('').replace(/[,.]/g, '');
    }
    inputElement.value = cleanedValue;
    return "Error: Hanya boleh ada satu koma atau titik, tidak boleh keduanya";
  }

  return null;
}
