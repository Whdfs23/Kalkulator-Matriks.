document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let matrices = {};
    // let nextMatrixName = 'C'; // Tidak perlu jika tidak ada tombol tambah matriks

    // --- Default Matrices ---
    const defaultMatrixA = [[1, 3, 5], [4, 2, 9], [8, 7, 6]];
    const defaultMatrixB = [[1, 3, 5], [2, 5, -1], [5, 2, 7]];
    const inverseExampleMatrix = [[-1, 2, 5], [4, -3, 1], [0, 2, 3]];

    // --- DOM Elements ---
    const matrixPanelsContainer = document.getElementById('matrix-panels-container');
    const resultGeneralOutput = document.getElementById('result-general-output');
    const resultDetailedView = document.getElementById('result-detailed-view');
    const resultSummaryInputMatrix = document.getElementById('result-summary-input-matrix');
    const resultSummaryOperationSymbol = document.getElementById('result-summary-operation-symbol');
    const resultSummaryMainResult = document.getElementById('result-summary-main-result');
    const calculationMethodsContainer = document.getElementById('calculation-methods-container');
    // Tombol insertResultABtn dan insertResultBBtn DIHAPUS dari sini
    const cleanOutputBtnDetailed = document.getElementById('clean-output-btn-detailed');
    const copyResultBtnDetailed = document.getElementById('copy-result-btn-detailed');
    const shareResultBtnDetailed = document.getElementById('share-result-btn-detailed');
    // Tombol addMatrixBtn DIHAPUS dari sini
    const cleanOutputBtn = document.getElementById('clean-output-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const displayDecimalsCheck = document.getElementById('display-decimals-check');
    const sigDigitsInput = document.getElementById('sig-digits-input');
    const customExprInput = document.getElementById('custom-expr-input');
    const evalExprBtn = document.getElementById('eval-expr-btn');

    // --- Initialization ---
    function initialize() {
        // Hanya inisialisasi Matriks A dan B
        addMatrixPanel('A', 3, 3, inverseExampleMatrix); // Pakai matriks contoh invers
        addBinaryOpsPanel('A', 'B');
        if (!matrices['B']) {
            addMatrixPanel('B', 3, 3, defaultMatrixB);
        }
        setupEventListeners();
        setupResultActionListeners();
        // Pastikan checkbox desimal tidak tercentang secara default
        displayDecimalsCheck.checked = false;
        updateDecimalControlState(); // Perbarui tampilan awal
        clearOutput();
    }

    // --- Matrix Panel Management ---
    // Fungsi getNextMatrixName tidak lagi digunakan karena tidak ada tombol tambah matriks
    // function getNextMatrixName() { ... }

    function addMatrixPanel(name, rows, cols, initialData = null) {
        if (matrices[name]) return;
        const panel = document.createElement('div');
        panel.className = 'matrix-panel';
        panel.id = `matrix-panel-${name}`;

        // Hapus tombol upload/kamera, Paste, LU, Cholesky, Is Diagonal, RANK, dan RREF dari innerHTML
        panel.innerHTML = `
            <div class="panel-header">
                <span class="matrix-name">Matrix ${name}</span>
                <div class="dimension-controls">
                    <label>Cells:</label>
                    <button class="dim-btn" data-matrix="${name}" data-action="dec-row">-</button>
                    <span class="dims" id="dims-${name}">${rows}x${cols}</span>
                    <button class="dim-btn" data-matrix="${name}" data-action="inc-row">+</button>
                    <span>Rows</span>
                    <button class="dim-btn" data-matrix="${name}" data-action="dec-col">-</button>
                    <button class="dim-btn" data-matrix="${name}" data-action="inc-col">+</button>
                    <span>Cols</span>
                </div>
                <div class="panel-actions">
                    ${name !== 'A' && name !== 'B' ? `<button class="icon-btn remove-matrix-btn" data-matrix="${name}" data-action="remove" title="Remove Matrix ${name}">×</button>` : ''}
                </div>
            </div>
            <div class="matrix-grid" id="matrix-grid-${name}" style="--rows: ${rows}; --cols: ${cols};"></div>
            <div class="matrix-operations-single">
                <button class="op-btn" data-op="det" data-matrix="${name}">Determinant</button>
                <button class="op-btn" data-op="inv" data-matrix="${name}">Inverse</button>
                <button class="op-btn" data-op="trans" data-matrix="${name}">Transpose</button>
                <div>
                    <button class="op-btn" data-op="mul-scalar" data-matrix="${name}">Multiply by</button>
                    <input type="number" class="op-input" id="scalar-${name}" value="2" step="any">
                </div>
                <div>
                    <button class="op-btn" data-op="pow" data-matrix="${name}">To power of</button>
                    <input type="number" class="op-input" id="power-${name}" value="2" step="1" min="0">
                </div>
            </div>
        `;
        // Sisipkan panel di akhir container, karena tombol addMatrixBtn dihapus
        matrixPanelsContainer.appendChild(panel);
        matrices[name] = { rows, cols, data: createEmptyMatrix(rows, cols) };
        renderMatrixInputs(name, initialData);
    }

    function addBinaryOpsPanel(matrix1Name, matrix2Name) {
        const panelId = `binary-ops-${matrix1Name}-${matrix2Name}`;
        if (document.getElementById(panelId)) return;
        const panel1 = document.getElementById(`matrix-panel-${matrix1Name}`);
        if (!panel1) return;
        // Pastikan Matriks B ada jika panel A-B dibuat
        if (matrix1Name === 'A' && matrix2Name === 'B' && !matrices['B']) {
            addMatrixPanel('B', 3, 3, defaultMatrixB);
        }
        const panel2 = document.getElementById(`matrix-panel-${matrix2Name}`);
        if(!panel2) return;

        const binaryOpsPanel = document.createElement('div');
        binaryOpsPanel.className = 'matrix-operations-binary';
        binaryOpsPanel.id = panelId;
        // Tombol copy-buttons DIHAPUS dari innerHTML
        binaryOpsPanel.innerHTML = `
            <button class="op-btn bin-op" data-op="mul" data-m1="${matrix1Name}" data-m2="${matrix2Name}">${matrix1Name} × ${matrix2Name}</button>
            <button class="op-btn bin-op" data-op="add" data-m1="${matrix1Name}" data-m2="${matrix2Name}">${matrix1Name} + ${matrix2Name}</button>
            <button class="op-btn bin-op" data-op="sub" data-m1="${matrix1Name}" data-m2="${matrix2Name}">${matrix1Name} - ${matrix2Name}</button>
            `;
        panel1.after(binaryOpsPanel);
    }

    function removeAssociatedBinaryOps(matrixName) {
         // Fungsi ini tetap relevan jika Anda ingin menghapus panel operasi biner saat salah satu matriks dihapus (meskipun tombol hapus hanya ada di matriks C+)
        const relatedOpsPanels = matrixPanelsContainer.querySelectorAll(`[id^="binary-ops-"]`);
        relatedOpsPanels.forEach(p => {
            const inv = p.id.split('-').slice(2);
            if (inv.includes(matrixName)) p.remove();
        });
    }

    function removeMatrixPanel(name) {
        // Tombol remove hanya ada di matriks C+, jadi ini hanya relevan untuk itu
        if (name === 'A' || name === 'B') return; // Pastikan A dan B tidak bisa dihapus
        const p = document.getElementById(`matrix-panel-${name}`);
        if (p) p.remove();
        delete matrices[name];
        removeAssociatedBinaryOps(name);
        // Logika penamaan matriks berikutnya tidak relevan lagi

        clearOutput();
    }

    function renderMatrixInputs(matrixName, initialData = null) {
        const grid = document.getElementById(`matrix-grid-${matrixName}`);
        if(!grid) return;
        const { rows, cols } = matrices[matrixName];
        grid.innerHTML = '';
        grid.style.setProperty('--rows', rows);
        grid.style.setProperty('--cols', cols);
        const currentData = matrices[matrixName].data;
        matrices[matrixName].data = createEmptyMatrix(rows, cols);

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any';
                input.dataset.row = i;
                input.dataset.col = j;
                input.dataset.matrix = matrixName;
                let valueToSet = '';
                if (initialData && i < initialData.length && initialData[i] && j < initialData[i].length && initialData[i][j] !== null && initialData[i][j] !== undefined) {
                    valueToSet = initialData[i][j];
                } else if (currentData && i < currentData.length && currentData[i] && j < currentData[i].length && currentData[i][j] !== null && currentData[i][j] !== undefined) {
                    valueToSet = currentData[i][j];
                }
                input.value = valueToSet;
                matrices[matrixName].data[i][j] = (valueToSet === '' || valueToSet === null || valueToSet === undefined) ? 0 : (parseFloat(valueToSet) || 0);
                grid.appendChild(input);
            }
        }
        const dimsSpan = document.getElementById(`dims-${matrixName}`);
        if (dimsSpan) dimsSpan.textContent = `${rows}x${cols}`;
    }

    function handleMatrixInputChange(event) {
        const i = event.target;
        const n = i.dataset.matrix;
        const r = parseInt(i.dataset.row);
        const c = parseInt(i.dataset.col);
        const v = (i.value === '' || i.value === null || i.value === undefined) ? 0 : (parseFloat(i.value) || 0);
        if (matrices[n]?.data[r]?.[c] !== undefined) matrices[n].data[r][c] = v;
    }

    function readMatrixData(matrixName) {
        if (!matrices[matrixName]) {
            showError(`Matrix ${matrixName} not found.`);
            return null;
        }
        return matrices[matrixName].data;
    }

    function updateMatrixPanelData(matrixName, newData) {
        if (!matrices[matrixName] || !newData) return;
        const nr = newData.length;
        const nc = newData[0]?.length || 0;
        if (nr === 0 && newData.length > 0) { // Check if it's an array but first row is empty
             showError(`Cannot update ${matrixName} with empty columns.`);
             return;
        }
         if (nr === 0) { // Handle empty matrix case explicitly
            matrices[matrixName].rows = 0;
            matrices[matrixName].cols = 0;
            matrices[matrixName].data = [];
            renderMatrixInputs(matrixName, []); // Render empty grid
            return;
         }


        matrices[matrixName].rows = nr;
        matrices[matrixName].cols = nc;
        matrices[matrixName].data = cloneMatrix(newData);
        renderMatrixInputs(matrixName, matrices[matrixName].data);
    }

    function changeMatrixDimensions(matrixName, action) {
        if (!matrices[matrixName]) return;
        let { rows, cols } = matrices[matrixName];
        switch (action) {
            case 'inc-row':
                rows++;
                break;
            case 'dec-row':
                rows = Math.max(1, rows - 1);
                break;
            case 'inc-col':
                cols++;
                break;
            case 'dec-col':
                cols = Math.max(1, cols - 1);
                break;
        }
        if (rows !== matrices[matrixName].rows || cols !== matrices[matrixName].cols) {
            matrices[matrixName].rows = rows;
            matrices[matrixName].cols = cols;
            renderMatrixInputs(matrixName, matrices[matrixName].data);
        }
    }

    // --- Output Display ---
    function formatNumber(num) {
        if (typeof num !== 'number') return String(num);
        const tol = 1e-10;
        const isInt = Math.abs(num - Math.round(num)) < tol;

        // Jika checkbox "Display decimals" tidak dicentang, coba konversi ke pecahan
        if (!displayDecimalsCheck.checked && !isInt) {
            const frac = numberToFraction(num);
            if (frac) return frac; // Jika berhasil konversi ke pecahan, kembalikan pecahan
        }

        // Jika checkbox dicentang atau gagal konversi ke pecahan, format sebagai desimal
        if (isInt) return String(Math.round(num)); // Tampilkan integer tanpa .0
        else {
             const sd = parseInt(sigDigitsInput.value) || 4;
             let fmt = num.toPrecision(sd);
             // Hapus trailing zeros setelah titik desimal, tapi biarkan .0
             if (fmt.includes('.')) {
                 fmt = fmt.replace(/(\.[0-9]*[1-9])0+$/, '$1').replace(/\.0+$/, '.0');
             }
              // Tangani kasus ketika formatPrecision menghasilkan angka seperti '5.'
             if (fmt.endsWith('.') && !fmt.endsWith('.0')) {
                 fmt = fmt + '0';
             }

             return fmt;
        }
    }

    function formatMatrix(matrix) {
         if (!matrix || !matrix.length || !matrix[0]?.length) return "<pre class='matrix-output'>[]</pre>";
         const r=matrix.length;
         const c=matrix[0].length;
         let o="<pre class='matrix-output'>";
         let formattedCells = [];
         let maxW=0;

         // Format semua sel terlebih dahulu untuk mengetahui lebar maksimum
         for(let i=0;i<r;i++) {
             formattedCells[i] = [];
             for(let j=0;j<c;j++) {
                 const formatted = formatNumber(matrix[i]?.[j]);
                 formattedCells[i][j] = formatted;
                 maxW = Math.max(maxW, formatted.length);
             }
         }

         // Bangun string output dengan padding
         for(let i=0;i<r;i++){
             o+="[ ";
             for(let j=0;j<c;j++) {
                 o += formattedCells[i][j].padStart(maxW,' ') + (j<c-1?", ":"");
             }
             o+=" ]\n";
         }
         o+="</pre>";
         return o.trim();
    }

    function formatMatrixSimple(matrix, options = { asFraction: false }) {
         if (!matrix || matrix.length === 0) return "[]";
         return matrix.map(row =>
             "[ " + row.map(val => {
                 // Opsi asFraction diabaikan, formatNumber sudah menangani pecahan
                 return formatNumber(val);
             }).join(", ") + " ]"
         ).join("\n");
    }

    function numberToFraction(number, tolerance = 1.0E-6, maxDenominator = 1000) {
        if (Number.isInteger(number)) return String(number);
        if (Math.abs(number) < tolerance) return '0'; // Handle near-zero explicitly

        let sign = number < 0 ? -1 : 1;
        number = Math.abs(number);

        // Check if it's a simple case like 0.5 -> 1/2
        if (Math.abs(number - (1/2)) < tolerance) return (sign === -1 ? '-' : '') + '1/2';

        let h1=1,h2=0,k1=0,k2=1,b=number;
        let n = 0; // Limit iterations to prevent infinite loops for irrationals
        const maxIterations = 100; // Safety limit

        do {
            let a=Math.floor(b);
            let aux=h1;h1=a*h1+h2;h2=aux;
            aux=k1;k1=a*k1+k2;k2=aux;
            if (Math.abs(b - a) < tolerance || k1 > maxDenominator || n++ > maxIterations) break;
            b=1/(b-a);
        } while(Math.abs(number-h1/k1)>number*tolerance); // Continue if approximation is not good enough


        if(k1 > maxDenominator || k1 === 0 || Math.abs(number - h1/k1) > number * tolerance) {
             // If did not find a good fraction within limits or approximation is still poor
             return null; // Return null for fallback to decimal
        }

        // Sederhanakan pecahan jika memungkinkan
        const gcd = (a, b) => b === 0 ? Math.abs(a) : gcd(b, a % b); // Use Math.abs for GCD
        const commonDivisor = gcd(h1, k1);
        h1 /= commonDivisor;
        k1 /= commonDivisor;

        return (sign === -1 ? '-' : '') + h1 + "/" + k1;
    }


    function displayResult(result, operationDesc, detailsIgnored, sourceId = null) {
        resultGeneralOutput.innerHTML = '';
        resultDetailedView.classList.add('hidden');
        resultSummaryInputMatrix.innerHTML = '';
        resultSummaryOperationSymbol.innerHTML = '';
        resultSummaryMainResult.innerHTML = '';
        calculationMethodsContainer.innerHTML = '';
        lastResult = null;
        lastResultSource = sourceId;

        if (result === null || result === undefined) {
            resultGeneralOutput.innerHTML = `<span class="error-message">${operationDesc || "Operation failed."}</span>`;
            resultGeneralOutput.classList.remove('hidden');
            return;
        }

        // Cek jika hasil adalah objek terstruktur dengan 'methods'
        if (typeof result === 'object' && !Array.isArray(result) && result.operationType && result.mainResult !== undefined && result.inputMatrix && Array.isArray(result.methods)) {
            // Tangani input matrix bisa berupa objek (untuk binary ops) atau array (untuk single ops)
            if (result.inputMatrix.inputA && result.inputMatrix.inputB) {
                 resultSummaryInputMatrix.innerHTML = `Input A:\n${formatMatrixSimple(result.inputMatrix.inputA)}\nInput B:\n${formatMatrixSimple(result.inputMatrix.inputB)}`;
            } else if (Array.isArray(result.inputMatrix)) {
                 resultSummaryInputMatrix.innerHTML = formatMatrix(result.inputMatrix);
            } else {
                 resultSummaryInputMatrix.innerHTML = 'Input Matrix(es): [Not available]';
            }


            resultSummaryOperationSymbol.innerHTML = result.operationType === 'determinant' ? '=' : (result.operationType === 'inverse' ? '<sup>-1</sup> =' : (result.operationType === 'rref' ? ' ~> ' : (result.operationType === 'lu' ? ' = L·U' : (result.operationType === 'cholesky' ? ' = L·L<sup>T</sup>' : ' =' ) ) ) );
             if (typeof result.mainResult === 'number' || typeof result.mainResult === 'boolean') { // Tambahkan boolean untuk isDiagonal
                 resultSummaryMainResult.innerHTML = `<span class="result-scalar">${formatNumber(result.mainResult)}</span>`;
             }
             else if (result.mainResult.L || result.mainResult.U || result.mainResult.P) { // Handle LU, Cholesky results
                 let mainResultHtml = '<div>';
                 if (result.mainResult.P) mainResultHtml += `<strong>P:</strong>${formatMatrix(result.mainResult.P)}`;
                 if (result.mainResult.L) mainResultHtml += `<strong>L:</strong>${formatMatrix(result.mainResult.L)}`;
                 if (result.mainResult.U) mainResultHtml += `<strong>U:</strong>${formatMatrix(result.mainResult.U)}`;
                 mainResultHtml += '</div>';
                 resultSummaryMainResult.innerHTML = mainResultHtml;
             }
             else if (Array.isArray(result.mainResult)) { // Handle matrix results
                 resultSummaryMainResult.innerHTML = formatMatrix(result.mainResult);
             }
             else {
                 resultSummaryMainResult.innerHTML = `<span class="result-other">${String(result.mainResult)}</span>`;
             }


             result.methods.forEach(method => {
                 // Filter out Math.js specific details based on method name
                 const mathJsMethodsToFilter = [
                     "Math.js det()",
                     "Math.js inv()",
                     "Math.js rref()",
                     "Math.js lup()",
                     "Math.js cholesky()",
                     "Math.js rank()",
                     "Info" // Filter out generic "Info" method used for Math.js calculation note
                 ];
                 if (mathJsMethodsToFilter.includes(method.name)) {
                     // Skip adding this method detail if it's a Math.js specific one or generic Info
                     return;
                 }

                 const d=document.createElement('details');
                 const s=document.createElement('summary');
                 const c=document.createElement('div');
                 const p=document.createElement('pre'); // Use pre for formatting
                 s.textContent=`Detail (${method.name})`;
                 p.innerHTML=method.details; // Use innerHTML if details contain HTML (like strong tags)
                 c.appendChild(p);
                 d.appendChild(s);
                 d.appendChild(c);
                 calculationMethodsContainer.appendChild(d);
             });

             resultDetailedView.classList.remove('hidden');
             resultGeneralOutput.classList.add('hidden');
             lastResult = result; // Simpan objek lengkap
        } else {
            // --- Tampilan Umum ---
             let output = `<strong class="result-title">${operationDesc}</strong>\n`;
             if (typeof result === 'number' || typeof result === 'boolean') { // Tambahkan boolean
                 output += `<span class="result-scalar">${formatNumber(result)}</span>`;
             }
             else if (Array.isArray(result)) {
                 output += formatMatrix(result);
             }
             else if (typeof result === 'object' && result.matrix && result.details) {
                 output += formatMatrix(result.matrix);
                 output += `<details><summary>Calculation Steps</summary><pre>${result.details}</pre></details>`;
             }
             else {
                 output += `<span class="result-other">${String(result)}</span>`;
             }
             resultGeneralOutput.innerHTML = output;
             resultGeneralOutput.classList.remove('hidden');
             resultDetailedView.classList.add('hidden');
             lastResult = result; // Simpan hasil sederhana
        }
         // Render MathJax setelah DOM diperbarui
         if (window.MathJax) {
             MathJax.typesetPromise().catch((err) => console.error('MathJax render failed', err));
         }
    }

    function showError(message) {
        resultGeneralOutput.innerHTML = `<span class="error-message">Error: ${message}</span>`;
        resultGeneralOutput.classList.remove('hidden');
        resultDetailedView.classList.add('hidden');
        lastResult = null;
        lastResultSource = null;
    }

    function clearOutput() {
        resultGeneralOutput.innerHTML = 'Select an operation to see the result.';
        resultGeneralOutput.classList.remove('hidden');
        resultDetailedView.classList.add('hidden');
        resultSummaryInputMatrix.innerHTML='';
        resultSummaryOperationSymbol.innerHTML='';
        resultSummaryMainResult.innerHTML='';
        calculationMethodsContainer.innerHTML='';
        lastResult = null;
        lastResultSource = null;
        customExprInput.value='';
    }

    // --- Matrix Operations (Core Logic) ---
    function createEmptyMatrix(rows, cols) {
        if (rows <= 0 || cols <= 0) return []; // Handle creating 0x0 or invalid size
        return Array(rows).fill(0).map(() => Array(cols).fill(0));
    }

    function cloneMatrix(matrix) {
        if (!matrix) return null;
        // Deep clone nested arrays
        return matrix.map(row => Array.isArray(row) ? [...row] : row);
    }

    function transpose(matrixData) {
        if (!matrixData || matrixData.length === 0 || matrixData[0]?.length === 0) { // Handle empty or vector cases
             const rows = matrixData ? matrixData.length : 0;
             const cols = (matrixData && matrixData[0]) ? matrixData[0].length : 0;
             return { operationType: 'transpose', mainResult: createEmptyMatrix(cols, rows), inputMatrix: matrixData || [], methods: [{name:"Info", details:"Transpose of empty matrix is empty."}]};
        }
        const rows = matrixData.length;
        const cols = matrixData[0].length; // Assumes rectangular matrix
        const result = createEmptyMatrix(cols, rows);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                result[j][i] = matrixData[i][j];
            }
        }
        return { operationType: 'transpose', mainResult: result, inputMatrix: matrixData, methods: [{name:"Direct Transposition", details: `Swapped rows & columns.\nOld: ${rows}x${cols}, New: ${cols}x${rows}\nResult:\n${formatMatrixSimple(result)}`}] };
    }

    function add(matrixA, matrixB) {
        if (!matrixA || !matrixB) { showError("Matrices missing for add."); return null; }
        const rA=matrixA.length, cA=matrixA[0]?.length||0;
        const rB=matrixB.length, cB=matrixB[0]?.length||0;
        if (rA !== rB || cA !== cB) {
             showError(`Dimension mismatch for addition (${rA}x${cA} vs ${rB}x${cB}).`);
             return null;
        }
        if(rA===0)return []; // Sum of empty matrices is empty

        const res=createEmptyMatrix(rA,cA);
        for(let i=0;i<rA;i++){
            for(let j=0;j<cA;j++){
                res[i][j]=(matrixA[i]?.[j]||0)+(matrixB[i]?.[j]||0);
            }
        }
        return res; // Return matrix for binary ops, displayResult will wrap
    }

    function subtract(matrixA, matrixB) {
        if (!matrixA || !matrixB) { showError("Matrices missing for subtraction."); return null; }
        const rA=matrixA.length, cA=matrixA[0]?.length||0;
        const rB=matrixB.length, cB=matrixB[0]?.length||0;
        if (rA !== rB || cA !== cB) {
             showError(`Dimension mismatch for subtraction (${rA}x${cA} vs ${rB}x${cB}).`);
             return null;
        }
        if(rA===0)return [];

        const res=createEmptyMatrix(rA,cA);
        for(let i=0;i<rA;i++){
            for(let j=0;j<cA;j++){
                res[i][j]=(matrixA[i]?.[j]||0)-(matrixB[i]?.[j]||0);
            }
        }
        return res; // Return matrix for binary ops
    }

    function multiplyScalar(matrix, scalar) {
        if (!matrix) { showError("Matrix missing for scalar multiplication."); return null; }
        if (typeof scalar !== 'number' || isNaN(scalar)) { showError("Invalid scalar value."); return null; }
        if (matrix.length === 0 || matrix[0]?.length === 0) return [];
        return matrix.map(row => row.map(val => (val || 0) * scalar));
    }

    function multiplyMatrices(matrixA, matrixB) {
        if (!matrixA || !matrixB) { showError("Matrices missing for multiplication."); return null; }
        const rA=matrixA.length, cA=matrixA[0]?.length||0;
        const rB=matrixB.length, cB=matrixB[0]?.length||0;
        if (cA !== rB) {
             showError(`Cannot multiply: Matrix A columns (${cA}) must equal Matrix B rows (${rB}).`);
             return null;
        }
        if (rA === 0 || cB === 0) return { matrix: createEmptyMatrix(rA, cB), details: "Resulted in an empty matrix." };
        if (cA === 0) return { matrix: createEmptyMatrix(rA, cB), details: "Common dimension is zero, result is a zero matrix." };

        const res=createEmptyMatrix(rA,cB);
        for(let i=0;i<rA;i++){
            for(let j=0;j<cB;j++){
                for(let k=0;k<cA;k++){
                    res[i][j]+=(matrixA[i]?.[k]||0)*(matrixB[k]?.[j]||0);
                }
            }
        }
        let details=`Multiplied A (${rA}x${cA}) by B (${rB}x${cB}) to get C (${rA}x${cB})\nC[i][j] = Σ (A[i][k]*B[k][j])\n`;
         if(rA>0 && cB>0 && cA>0){
             details+=`Example C[0][0]: `;
             for(let k=0;k<cA;k++){
                 details+=`${formatNumber(matrixA[0][k])}*${formatNumber(matrixB[k][0])}${k<cA-1?" + ":""}`;
             }
             details+=` = ${formatNumber(res[0][0])}`;
         }
        return { matrix: res, details: details }; // Return object for binary ops
    }

    function power(matrix, exponent) {
        if (!matrix) { showError("Matrix missing for power calculation."); return null; }
        const r=matrix.length,c=matrix[0]?.length||0;
        if (r === 0 || c === 0) { showError("Cannot calculate power of an empty matrix."); return null; }
        if (r !== c) { showError("Matrix must be square for power calculation."); return null; }
        if (typeof exponent !== 'number' || !Number.isInteger(exponent) || exponent < 0) {
             showError("Exponent must be a non-negative integer for matrix power.");
             return null;
        }

        if (exponent === 0) { // Identity matrix
            const id=createEmptyMatrix(r,r);
            for(let i=0;i<r;i++)id[i][i]=1;
            return id;
        }
        if (exponent === 1) return cloneMatrix(matrix);

        let res=cloneMatrix(matrix);
        // Use the multiplyMatrices function to calculate power
        for(let i=2; i<=exponent; i++){
            const mulRes=multiplyMatrices(res, matrix);
            if (!mulRes || !mulRes.matrix) {
                showError("Error during matrix multiplication for power.");
                return null;
            }
            res = mulRes.matrix;
        }
        return res; // Return matrix
    }

    function isDiagonal(matrix) {
        if(!matrix){showError("Matrix missing for diagonal check.");return false;}
        const r=matrix.length;
        if(r===0)return true;
        const c=matrix[0]?.length||0;
        const methods = [];
        let isDiag = true;
        const tol=1e-10;
        let details = "<strong>Diagonal Matrix Check.</strong>\n";

        if(r !== c) {
             isDiag = false;
             details += `Matrix is ${r}x${c}. A diagonal matrix must be square.\nResult: Not Diagonal`;
        } else {
            details += `Checking if all non-diagonal elements are zero (within tolerance ${tol}).\n`;
            for(let i=0;i<r;i++){
                for(let j=0;j<c;j++){
                    if(i!==j && Math.abs(matrix[i]?.[j]||0)>tol){
                        isDiag = false;
                        details += `Element at (${i+1}, ${j+1}) is ${formatNumber(matrix[i]?.[j]||0)}, which is not zero.\n`;
                    }
                }
            }
             details += `\nResult: ${isDiag ? 'Is Diagonal' : 'Not Diagonal'}`;
        }

        methods.push({name:"Check Process", details: details});

        return {operationType:'isDiagonal', mainResult:isDiag, inputMatrix:cloneMatrix(matrix), methods:methods}; // Return boolean wrapped in object
    }

    // --- Detail Calculation Helpers ---
    function calculateSarrusDetails(matrix) {
        const a=matrix[0][0],b=matrix[0][1],c=matrix[0][2];
        const d=matrix[1][0],e=matrix[1][1],f=matrix[1][2];
        const g=matrix[2][0],h=matrix[2][1],i=matrix[2][2];
        const t1=a*e*i,t2=b*f*g,t3=c*d*h;
        const t4=c*e*g,t5=a*f*h,t6=b*d*i;
        const det=t1+t2+t3-t4-t5-t6;
         // Use formatNumber for all values
        return `<strong>Rule of Sarrus (3x3):</strong>\nAugment:\n| ${formatNumber(a)} ${formatNumber(b)} ${formatNumber(c)} | ${formatNumber(a)} ${formatNumber(b)}\n| ${formatNumber(d)} ${formatNumber(e)} ${formatNumber(f)} | ${formatNumber(d)} ${formatNumber(e)}\n| ${formatNumber(g)} ${formatNumber(h)} ${formatNumber(i)} | ${formatNumber(g)} ${formatNumber(h)}\n\nPositive terms: (${formatNumber(a)}*${formatNumber(e)}*${formatNumber(i)}) + (${formatNumber(b)}*${formatNumber(f)}*${formatNumber(g)}) + (${formatNumber(c)}*${formatNumber(d)}*${formatNumber(h)}) = ${formatNumber(t1)} + ${formatNumber(t2)} + ${formatNumber(t3)} = ${formatNumber(t1+t2+t3)}\nNegative terms: (${formatNumber(c)}*${formatNumber(e)}*${formatNumber(g)}) + (${formatNumber(a)}*${formatNumber(f)}*${formatNumber(h)}) + (${formatNumber(b)}*${formatNumber(d)}*${formatNumber(i)}) = ${formatNumber(t4)} + ${formatNumber(t5)} + ${formatNumber(t6)} = ${formatNumber(t4+t5+t6)}\n\nDet = (${formatNumber(t1+t2+t3)}) - (${formatNumber(t4+t5+t6)}) = ${formatNumber(det)}`;
    }

    function calculateTriangleDetails(matrix) {
         const a=matrix[0][0],b=matrix[0][1],c=matrix[0][2];
        const d=matrix[1][0],e=matrix[1][1],f=matrix[1][2];
        const g=matrix[2][0],h=matrix[2][1],i=matrix[2][2];
        const t1=a*e*i,t2=b*f*g,t3=c*d*h;
        const t4=c*e*g,t5=a*f*h,t6=b*d*i;
        const det=t1+t2+t3-t4-t5-t6;
         // Use formatNumber for all values
        return `<strong>Triangle Rule (3x3):</strong>\nPositive (+) diagonals:\n Main: ${formatNumber(a)}*${formatNumber(e)}*${formatNumber(i)} = ${formatNumber(t1)}\n Triangle 1: ${formatNumber(b)}*${formatNumber(f)}*${formatNumber(g)} = ${formatNumber(t2)}\n Triangle 2: ${formatNumber(c)}*${formatNumber(d)}*${formatNumber(h)} = ${formatNumber(t3)}\n Sum(+) = ${formatNumber(t1+t2+t3)}\n\nNegative (-) diagonals:\n Anti-main: ${formatNumber(c)}*${formatNumber(e)}*${formatNumber(g)} = ${formatNumber(t4)}\n Triangle 3: ${formatNumber(a)}*${formatNumber(f)}*${formatNumber(h)} = ${formatNumber(t5)}\n Triangle 4: ${formatNumber(b)}*${formatNumber(d)}*${formatNumber(i)} = ${formatNumber(t6)}\n Sum(-) = ${formatNumber(t4+t5+t6)}\n\nDet = Sum(+) - Sum(-) = ${formatNumber(det)}`;
    }

    function calculateDeterminantUsingCofactorDetails(matrix, expansionRow = 0) {
        const n = matrix.length;
        if (n === 0) return "Det 0x0 = 1.";
        if (n === 1) return `det(${formatNumber(matrix[0][0])}) = ${formatNumber(matrix[0][0])}`;

        let detStr = `<strong>Expanding along row ${expansionRow + 1}:</strong>\ndet(A) = Σ<sub>j=1 to ${n}</sub> (-1)<sup>${expansionRow + 1}+j</sup> * A<sub>${expansionRow + 1},j</sub> * M<sub>${expansionRow + 1},j</sub>\n\n`;
        let detVal = 0;

        for (let j = 0; j < n; j++) {
            const Aij = matrix[expansionRow][j];
            const sgn = ((expansionRow + j) % 2 === 0) ? 1 : -1;
            const Mij_m = submatrix(matrix, expansionRow, j);
             const Mij_d_o = determinant(Mij_m); // Calculate determinant of the minor
            const Mij_d = Mij_d_o ? Mij_d_o.mainResult : NaN; // Get the scalar result

            const term = sgn * Aij * Mij_d;
            detVal += term;

            detStr += `Term j=${j + 1}: A<sub>${expansionRow + 1},${j + 1}</sub> = ${formatNumber(Aij)}\n`;
            detStr += `Minor M<sub>${expansionRow + 1},${j + 1}</sub> = det(\n${formatMatrixSimple(Mij_m)}\n) = ${formatNumber(Mij_d)}\n`;
            detStr += `Cofactor C<sub>${expansionRow + 1},${j + 1}</sub> = (-1)<sup>${expansionRow + 1}+${j + 1}</sup> * M<sub>...</sub> = ${formatNumber(sgn * Mij_d)}\n`;
            detStr += `Term = A<sub>...</sub> * C<sub>...</sub> = ${formatNumber(Aij)} * ${formatNumber(sgn * Mij_d)} = ${formatNumber(term)}\n\n`;
        }

        detStr += `<strong>Total Determinant = ${formatNumber(detVal)}</strong>`;
        return detStr;
    }


    function calculateInverseUsingAdjugateDetails(matrix, det, inverseMatrix) {
        const n = matrix.length;
        let detStr = `<strong>A<sup>-1</sup> = (1/detA) * adjA</strong>\ndetA = ${formatNumber(det)}\n\n`;

        detStr += `<strong>1. Calculate Cofactor Matrix (C):</strong>\n`;
        const cofM = createEmptyMatrix(n, n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const cof = cofactor(matrix, i, j);
                if (isNaN(cof)) {
                     detStr += `Error calculating cofactor C<sub>${i+1},${j+1}</sub>\n`;
                     cofM[i][j] = NaN; // Indicate error
                     continue;
                }
                cofM[i][j] = cof;
                 detStr += ` C<sub>${i+1},${j+1}</sub> = ${formatNumber(cofM[i][j])}\n`; // Add detail for each cofactor
            }
        }
        detStr += `\nCofactor Matrix C:\n${formatMatrixSimple(cofM)}\n`;

        detStr += `<strong>2. Calculate Adjugate Matrix (adjA) = C<sup>T</sup>:</strong>\n`;
        const adjM_obj = transpose(cofM);
        const adjM = adjM_obj ? adjM_obj.mainResult : null;

        if (!adjM) {
            detStr += "Error creating Adjugate matrix.\n";
            return detStr;
        }
        detStr += `${formatMatrixSimple(adjM)}\n`;


        detStr += `<strong>3. Calculate Inverse Matrix A<sup>-1</sup> = (1/detA) * adjA:</strong>\n`;
         // Use formatMatrixSimple for the final inverse matrix
        detStr += `${formatMatrixSimple(inverseMatrix)}\n`;


        return detStr;
    }

    function calculateInverseUsingGaussJordanDetails(matrix) {
        const n = matrix.length;
        // Clone the matrix to avoid modifying the original
        let A = matrix.map(row => [...row]);
        // Create an identity matrix of the same size
        let I = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((_, j) => i === j ? 1 : 0));
        let steps = [];
        const tol = 1e-9; // Tolerance for checking zero


        steps.push(`<strong>Inverse using Gauss-Jordan Elimination</strong>\nGoal: Transform augmented matrix [A|I] into [I|A<sup>-1</sup>]\n`);
        steps.push(`Langkah 0: Augmented Matrix [A | I]\n${formatMatrixSimple(A)} | ${formatMatrixSimple(I)}`);


        for (let col = 0; col < n; col++) {
            let maxRow = col;
            // Find pivot row
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) {
                    maxRow = row;
                }
            }

            // Check for singular matrix
            if (Math.abs(A[maxRow][col]) < tol) {
                return `<strong>Gauss-Jordan:</strong>\nMatriks singular (tidak dapat diinvers)\n<details><summary>Langkah-langkah hingga singularitas</summary><pre>${steps.join('\n')}</pre></details>`;
            }

            // Swap rows if necessary to get pivot to current row
            if (maxRow !== col) {
                [A[col], A[maxRow]] = [A[maxRow], A[col]];
                [I[col], I[maxRow]] = [I[maxRow], I[col]];
                steps.push(`Langkah ${col+1}: Tukar baris ${col+1} dan ${maxRow+1}`);
                 steps.push(`Matriks saat ini:\n${formatMatrixSimple(A)} | ${formatMatrixSimple(I)}`);
            }

            // Normalize the pivot row
            const pivot = A[col][col];
            for (let j = col; j < n; j++) {
                A[col][j] /= pivot;
            }
            for (let j = 0; j < n; j++) {
                I[col][j] /= pivot;
            }
            steps.push(`Langkah ${col+1}: Normalisasi baris ${col+1} dengan pivot ${formatNumber(pivot)}`);
            steps.push(`Matriks saat ini:\n${formatMatrixSimple(A)} | ${formatMatrixSimple(I)}`);

            // Eliminate other rows (make elements in current column zero)
            for (let row = 0; row < n; row++) {
                if (row !== col && Math.abs(A[row][col]) > tol) {
                    const factor = A[row][col];
                    for (let j = col; j < n; j++) {
                        A[row][j] -= factor * A[col][j];
                         // Apply small rounding to prevent floating point errors accumulating
                         if (Math.abs(A[row][j]) < tol) A[row][j] = 0;
                    }
                    for (let j = 0; j < n; j++) {
                        I[row][j] -= factor * I[col][j];
                         // Apply small rounding
                        if (Math.abs(I[row][j]) < tol) I[row][j] = 0;
                    }
                    steps.push(`Langkah ${col+1}: Eliminasi baris ${row+1} menggunakan baris ${col+1} dengan faktor ${formatNumber(factor)}`);
                     steps.push(`Matriks saat ini:\n${formatMatrixSimple(A)} | ${formatMatrixSimple(I)}`);
                }
            }
        }

        // After loop, A should be close to Identity, I should be the inverse
        // Use formatMatrixSimple for the final inverse matrix
        return `<strong>Gauss-Jordan:</strong>\nTransformation complete. The inverse matrix is the right side:\n<details><summary>Langkah-langkah</summary><pre>\n${steps.join('\n')}\n</pre></details>\nInverse Matrix A<sup>-1</sup>:\n${formatMatrixSimple(I)}\n`;
    }
    function calculateInverseUsingMontanteDetails(matrix) { return "<strong>Montante (Bareiss):</strong> Placeholder - Detailed step-by-step is highly complex."; }


    function calculateDeterminantUsingMontanteDetails(matrix) {
        const n = matrix.length;
        if (n === 0) return "Det 0x0=1.";
        if (n !== matrix[0]?.length) { // Check if square
            return "Montante requires a square matrix.";
        }
        // Clone the matrix
        let A = matrix.map(row => [...row]);
        let steps = [];
        let pivot = 1; // The previous pivot, starts as 1
        let detSign = 1;
        const tol = 1e-9; // Tolerance for checking zero


        steps.push(`<strong>Determinant using Montante (Bareiss) Method</strong>\n`);
        steps.push(`Langkah 0: Matriks Awal\n${formatMatrixSimple(A)}`);


        for (let k = 0; k < n - 1; k++) {
            // Find pivot (A[k][k]) - if zero, swap with a row below
            if (Math.abs(A[k][k]) < tol) {
                let nonZeroRow = -1;
                for (let i = k + 1; i < n; i++) {
                    if (Math.abs(A[i][k]) > tol) {
                        nonZeroRow = i;
                        break;
                    }
                }
                if (nonZeroRow === -1) {
                    return `<strong>Montante:</strong>\nMatriks singular (determinan = 0)\n<details><summary>Langkah-langkah hingga singularitas</summary><pre>${steps.join('\n')}</pre></details>`;
                }
                // Swap rows
                [A[k], A[nonZeroRow]] = [A[nonZeroRow], A[k]];
                detSign *= -1; // Swapping rows changes the sign of the determinant
                steps.push(`Langkah ${k+1}: Tukar baris ${k+1} dan ${nonZeroRow+1} (det × -1)`);
                 steps.push(`Matriks saat ini:\n${formatMatrixSimple(A)}`);
            }

            // Apply the Montante formula
            for (let i = k + 1; i < n; i++) {
                for (let j = k + 1; j < n; j++) {
                    // Formula: A[i][j] = (A[i][j] * A[k][k] - A[i][k] * A[k][j]) / previous_pivot
                    A[i][j] = (A[i][j] * A[k][k] - A[i][k] * A[k][j]) / pivot;
                    // Apply small rounding to prevent floating point errors
                    if (Math.abs(A[i][j]) < tol) A[i][j] = 0;
                }
                A[i][k] = 0; // Elements in the pivot column below the pivot become zero
            }
             steps.push(`Langkah ${k+1}: Transformasi menggunakan pivot ${formatNumber(A[k][k])} dan pivot sebelumnya ${formatNumber(pivot)}`);
             steps.push(`Matriks saat ini:\n${formatMatrixSimple(A)}`);


            pivot = A[k][k]; // The current pivot becomes the previous pivot for the next step
        }

        // The determinant is the last element A[n-1][n-1] multiplied by the determinant sign
        let det = detSign * A[n-1][n-1];

         // Apply small rounding to the final determinant
         if (typeof det === 'number' && Math.abs(det) < tol) det = 0;


        return `<strong>Montante (Bareiss):</strong>\n<details><summary>Langkah-langkah</summary><pre>\n${steps.join('\n')}\n</pre></details>\nDeterminan = ${formatNumber(detSign)} × ${formatNumber(A[n-1][n-1])} = ${formatNumber(det)}\n`;
    }

    function calculateDeterminantUsingGaussianDetails(matrix) {
        const n = matrix.length;
        if (n === 0) return "Det 0x0=1.";
         if (n !== matrix[0]?.length) { // Check if square
            return "Gaussian Elimination for Determinant requires a square matrix.";
        }
        // Clone the matrix
        let A = matrix.map(row => [...row]);
        let steps = [];
        let detSign = 1; // Tracks determinant sign changes due to row swaps
        const tol = 1e-9; // Tolerance for checking zero


        steps.push(`<strong>Determinant using Gaussian Elimination</strong>\nGoal: Transform matrix into upper triangular form. Determinant is the product of diagonal elements, adjusted by row swaps.\n`);
        steps.push(`Langkah 0: Matriks Awal\n${formatMatrixSimple(A)}`);


        for (let col = 0; col < n; col++) {
            let maxRow = col;
            // Find pivot row (for numerical stability)
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) {
                    maxRow = row;
                }
            }

            // If the pivot is zero, the determinant is zero.
            if (Math.abs(A[maxRow][col]) < tol) {
                 steps.push(`Langkah ${col+1}: Pivot element A[${maxRow+1}][${col+1}] is close to zero (${formatNumber(A[maxRow][col])}). Matrix is singular.`);
                // The remaining diagonal elements will cause the product to be zero
                let det = 0; // Determinant is 0
                 return `<strong>Gaussian Elimination:</strong>\nMatriks singular (determinan = 0)\n<details><summary>Langkah-langkah hingga singularitas</summary><pre>\n${steps.join('\n')}\n</pre></details>\nDeterminan = ${formatNumber(det)}\n`;
            }

            // Swap rows if the pivot is not in the current row
            if (maxRow !== col) {
                [A[col], A[maxRow]] = [A[maxRow], A[col]];
                detSign *= -1; // Swapping rows changes the sign of the determinant
                steps.push(`Langkah ${col+1}: Tukar baris ${col+1} dan ${maxRow+1} (det × -1)`);
                 steps.push(`Matriks saat ini:\n${formatMatrixSimple(A)}`);
            }

            // Eliminate elements below the pivot
            for (let row = col + 1; row < n; row++) {
                 if (Math.abs(A[row][col]) > tol) { // Only perform elimination if the element is not already zero
                    const factor = A[row][col] / A[col][col];
                    steps.push(`Langkah ${col+1}: Hilangkan elemen di baris ${row+1}, kolom ${col+1} dengan faktor ${formatNumber(factor)}`);
                    for (let col2 = col; col2 < n; col2++) {
                        A[row][col2] -= factor * A[col][col2];
                         // Apply small rounding to prevent floating point errors
                        if (Math.abs(A[row][col2]) < tol) A[row][col2] = 0;
                    }
                     steps.push(`Matriks saat ini:\n${formatMatrixSimple(A)}`);
                 }
            }
        }

        // The determinant is the product of the diagonal elements multiplied by the determinant sign
        let det = detSign;
        for (let i = 0; i < n; i++) {
            det *= A[i][i];
        }

         // Apply small rounding to the final determinant
         if (typeof det === 'number' && Math.abs(det) < tol) det = 0;


        return `<strong>Gaussian Elimination:</strong>\nMatrix reduced to upper triangular form.\n<details><summary>Langkah-langkah</summary><pre>\n${steps.join('\n')}\n</pre></details>\nDeterminan = (${formatNumber(detSign)}) × (${A.map((row, i) => formatNumber(row[i])).join(' × ')}) = ${formatNumber(det)}\n`;
    }

    // --- More Complex Operations (Returning Objects) ---
    function submatrix(matrix, rR, cR) {
        if (!matrix || matrix.length === 0) return [];
        const rows = matrix.length;
        const cols = matrix[0]?.length || 0;
         if (rR < 0 || rR >= rows || cR < 0 || cR >= cols) {
             console.error(`Invalid indices for submatrix: ${rR}, ${cR}`);
             return null; // Or handle error appropriately
         }

        return matrix.filter((_,i) => i !== rR).map(row => row.filter((_,j) => j !== cR));
    }

    function cofactor(matrix, row, col) {
         if (!matrix || matrix.length === 0 || !matrix[row] || matrix[row].length === 0) return NaN; // Handle empty or invalid matrix/row

        const sub = submatrix(matrix, row, col);
        if (sub === null) { // submatrix returns null on invalid input
             return NaN;
         }
         if (sub.length === 0 && (matrix.length > 1 || matrix[0].length > 1)) {
             // If submatrix is empty for non-1x1 original matrix, something is wrong
             console.error("Submatrix is empty unexpectedly.");
             return NaN;
         }


        const mDetObj = determinant(sub); // Calculate determinant of the minor
        if (mDetObj === null || mDetObj.mainResult === undefined) {
             // If determinant calculation fails for the minor
             console.error(`Could not calculate determinant of submatrix for cofactor (${row}, ${col}).`);
             return NaN;
        }

        const minorDet = mDetObj.mainResult;
        const sgn = ((row + col) % 2 === 0) ? 1 : -1;

        return sgn * minorDet;
    }


    function determinant(matrixData) {
        if (!matrixData) { showError("Matrix missing for determinant."); return null; }
        const rows = matrixData.length;
        const cols = matrixData[0]?.length || 0;

        if (rows !== cols) {
             showError("Matrix must be square to calculate determinant.");
             return null;
        }
         if (rows === 0) return { operationType: 'determinant', mainResult: 1, inputMatrix: [], methods: [{name:"Info",details:"Determinant of an empty (0x0) matrix is defined as 1."}]};


        const inputM = cloneMatrix(matrixData);
        let detValue;
        const methods = [];


        // Prefer Math.js for core calculation if available
        if (window.math && typeof window.math.det === 'function') {
            try {
                const m = math.matrix(inputM);
                detValue = math.det(m);
                 methods.push({name:"Info", details: `Determinant calculated using Math.js library.`});
            } catch(e) {
                console.warn("Math.js determinant failed, falling back to manual methods.", e);
                 // Fallback to manual methods if Math.js fails
                 if (rows === 1) {
                     detValue = matrixData[0][0];
                 } else if (rows === 2) {
                     detValue = matrixData[0][0] * matrixData[1][1] - matrixData[0][1] * matrixData[1][0];
                 } else {
                     detValue = 0;
                     // Use cofactor expansion along the first row as a manual fallback
                     for(let j=0; j<cols; j++){
                         const cof = cofactor(matrixData, 0, j);
                         if (isNaN(cof)) { // Check for NaN result from cofactor
                             showError(`Could not calculate cofactor for manual determinant calculation at (0, ${j}).`);
                             return null;
                         }
                         detValue += (matrixData[0]?.[j] || 0) * cof;
                     }
                 }
                 methods.push({name:"Manual Calculation (Fallback)", details: `Determinant calculated manually (e.g., using cofactor expansion for n>2). Used as fallback when Math.js failed.`});
            }
        } else {
            // Use manual methods if Math.js is not loaded
             if (rows === 1) {
                 detValue = matrixData[0][0];
             } else if (rows === 2) {
                 detValue = matrixData[0][0] * matrixData[1][1] - matrixData[0][1] * matrixData[1][0];
             } else {
                 detValue = 0;
                 // Use cofactor expansion along the first row as a manual fallback
                 for(let j=0; j<cols; j++){
                     const cof = cofactor(matrixData, 0, j);
                     if (isNaN(cof)) {
                         showError(`Could not calculate cofactor for manual determinant calculation at (0, ${j}).`);
                         return null;
                     }
                     detValue += (matrixData[0]?.[j] || 0) * cof;
                 }
             }
              methods.push({name:"Manual Calculation", details: `Determinant calculated manually (e.g., using cofactor expansion for n>2). Math.js library was not available or missing det().`});
        }


        // Add detailed methods for display (exclude Math.js specific details in displayResult loop)
        if (rows === 3) {
            methods.push({name:"Triangle Rule (3x3)",details:calculateTriangleDetails(inputM)});
            methods.push({name:"Sarrus Rule (3x3)",details:calculateSarrusDetails(inputM)});
        }
        // Add cofactor details if not already the main manual method and size > 1
        const isCofactorPrimary = methods.some(m => m.name.includes("Manual Calculation") && m.details.includes("cofactor expansion"));
        if (rows > 1 && !isCofactorPrimary) {
             methods.push({ name: "Cofactor Expansion (Row 1)", details: calculateDeterminantUsingCofactorDetails(inputM, 0) });
        }
         if (rows > 1) {
            methods.push({name:"Montante (Bareiss)",details:calculateDeterminantUsingMontanteDetails(inputM)});
            methods.push({name:"Gaussian Elimination",details:calculateDeterminantUsingGaussianDetails(inputM)});
         }


        // Apply small rounding to the final determinant value
        const tol = 1e-10;
        if (typeof detValue === 'number' && Math.abs(detValue) < tol) detValue = 0;


        return { operationType:'determinant', mainResult:detValue, inputMatrix:inputM, methods:methods };
    }

    function inverse(matrixData) {
        if (!matrixData) { showError("Matrix missing for inverse."); return null; }
        const rows = matrixData.length;
        const cols = matrixData[0]?.length || 0;
        if(rows!==cols){showError("Matrix must be square to calculate inverse.");return null;}
        if (rows === 0) return {operationType:'inverse', mainResult:[], inputMatrix:[], methods:[{name:"Info",details:"Inverse of an empty (0x0) matrix is empty."}]};


        const inputM = cloneMatrix(matrixData);
        const detRes = determinant(inputM); // Use the updated determinant function
        if(detRes===null || detRes.mainResult === undefined){
             showError("Cannot calculate determinant for inverse.");
             return null;
        }
        const det = detRes.mainResult;
        const tol = 1e-10;
        if(typeof det !== 'number' || Math.abs(det)<tol){
             showError(`Singular matrix (determinant ≈ ${formatNumber(det)}). Inverse does not exist.`);
             return null;
        }

        let invMtx;
        const methods = [];

         // Prefer Math.js for core calculation if available
         if (window.math && typeof window.math.inv === 'function') {
             try {
                 const m = math.matrix(inputM);
                 invMtx = math.inv(m).toArray();
                 methods.push({name:"Info", details: `Inverse calculated using Math.js library.`});
             } catch(e) {
                 console.warn("Math.js inverse failed, falling back to manual methods.", e);
                 // Fallback to manual methods if Math.js fails
                  if (rows === 1) {
                      invMtx = [[1 / matrixData[0][0]]];
                  } else {
                      // Fallback to Adjugate method
                      const cofM = createEmptyMatrix(rows, rows);
                      let cofactorError = false;
                      for (let i = 0; i < rows; i++) {
                          for (let j = 0; j < rows; j++) {
                              const cof = cofactor(matrixData, i, j);
                              if (isNaN(cof)) {
                                  console.error(`Cofactor error at (${i},${j}) for manual inverse calculation.`);
                                  cofM[i][j] = NaN; // Indicate error
                                   cofactorError = true;
                              } else {
                                  cofM[i][j] = cof;
                              }
                          }
                      }
                       if (cofactorError) {
                           showError("Failed to calculate all cofactors for Adjugate method fallback.");
                           return null;
                       }

                      const adjM_obj = transpose(cofM);
                       if (!adjM_obj || !Array.isArray(adjM_obj.mainResult)) {
                           showError("Failed to transpose cofactor matrix for Adjugate method fallback.");
                           return null;
                       }
                      const adjM = adjM_obj.mainResult;
                      invMtx = multiplyScalar(adjM, 1 / det);
                  }
                  methods.push({name:"Manual Calculation (Adjugate Method Fallback)", details: calculateInverseUsingAdjugateDetails(inputM, det, invMtx)});
             }
         } else {
             // Use manual methods if Math.js is not loaded
              if (rows === 1) {
                  invMtx = [[1 / matrixData[0][0]]];
              } else {
                  // Use Adjugate method
                   const cofM = createEmptyMatrix(rows, rows);
                   let cofactorError = false;
                   for (let i = 0; i < rows; i++) {
                       for (let j = 0; j < rows; j++) {
                           const cof = cofactor(matrixData, i, j);
                           if (isNaN(cof)) {
                               console.error(`Cofactor error at (${i},${j}) for Adjugate inverse calculation.`);
                               cofM[i][j] = NaN;
                                cofactorError = true;
                           } else {
                               cofM[i][j] = cof;
                           }
                       }
                   }
                    if (cofactorError) {
                        showError("Failed to calculate all cofactors for Adjugate method.");
                        return null;
                    }
                   const adjM_obj = transpose(cofM);
                    if (!adjM_obj || !Array.isArray(adjM_obj.mainResult)) {
                        showError("Failed to transpose cofactor matrix for Adjugate method.");
                        return null;
                    }
                   const adjM = adjM_obj.mainResult;
                   invMtx = multiplyScalar(adjM, 1 / det);
               }
              methods.push({name:"Manual Calculation (Adjugate Method)", details: calculateInverseUsingAdjugateDetails(inputM, det, invMtx)});
         }


        if(!invMtx){
            showError("Failed to calculate inverse matrix.");
            return null;
        }

         // Apply small rounding to elements of the inverse matrix
         invMtx = invMtx.map(row => row.map(val => {
              if (typeof val === 'number' && Math.abs(val) < tol) return 0;
              return val;
         }));


        // Add detailed methods for display (exclude Math.js specific details in displayResult loop)
         // Only add Adjugate details if it wasn't the primary method used (i.e., Math.js was used first)
        const isMathJsInvPrimary = window.math && typeof window.math.inv === 'function' && methods.some(m => m.name && m.name.includes("Info") && m.details.includes("Math.js library"));

        if (isMathJsInvPrimary) {
             // If Math.js was used, add Adjugate as a detailed method
             // Recalculate cofactor matrix and adjugate for details display
             const cofM = createEmptyMatrix(rows, rows);
             for (let i = 0; i < rows; i++) {
                 for (let j = 0; j < rows; j++) {
                      const cof = cofactor(inputM, i, j); // Use original inputM
                      cofM[i][j] = isNaN(cof) ? 'Error' : cof;
                 }
             }
             const adjM_obj = transpose(cofM);
             const adjM = adjM_obj ? adjM_obj.mainResult : null;

             if (adjM) { // Only add if adjugate could be formed
                  methods.push({name:"Adjugate Matrix Method Details",details:calculateInverseUsingAdjugateDetails(inputM, det, invMtx)}); // Pass inputM, det, and final invMtx
             }
        }


        methods.push({name:"Gauss-Jordan Elimination Details",details:calculateInverseUsingGaussJordanDetails(inputM)});
        methods.push({name:"Montante (Bareiss) - Placeholder",details:calculateInverseUsingMontanteDetails(inputM)});


        return {operationType:'inverse',mainResult:invMtx,inputMatrix:inputM,methods:methods};
    }


    // --- RREF, LU, Cholesky, Rank using Math.js with descriptive details ---
    function rowEchelonForm(matrixData) {
         // Fungsi ini tidak lagi dipanggil dari tombol RREF, tapi mungkin masih dipanggil internal oleh Rank atau fungsi lain.
         // Jika Anda ingin sepenuhnya menghapus fungsi ini, hapus saja.
         // Namun, jika Rank masih membutuhkannya secara internal, biarkan fungsinya tapi pastikan tidak ada detail "Math.js..." di dalamnya.

        if (!matrixData || matrixData.length === 0) return { operationType: 'rref', mainResult: [], inputMatrix: matrixData || [], methods: [{name:"Info", details:"RREF of empty matrix is empty."}]};

        const inputM = cloneMatrix(matrixData);
        let rrefMtx = null;
        const methods = [];
        let error = null;

        if (window.math && typeof window.math.rref === 'function') {
            try {
                const m = math.matrix(inputM);
                const rrefRes = math.rref(m);
                rrefMtx = (Array.isArray(rrefRes)?rrefRes[0]:rrefRes).toArray();
                let pivInfo = "";
                if(Array.isArray(rrefRes) && rrefRes[1]) pivInfo =`\nPivots (1-indexed columns): ${rrefRes[1].map(p=>p+1).join(', ')}`;
                let dets = `<strong>Row Echelon Form (RREF) via Gaussian/Gauss-Jordan Elimination.</strong>\nTransforms the matrix into RREF using elementary row operations.\n(Calculation performed by Math.js library)${pivInfo}\n\nResulting RREF Matrix:\n${formatMatrixSimple(rrefMtx)}`;
                 // Mengubah nama metode agar tidak difilter jika Math.js detail spesifik difilter
                methods.push({name:"RREF Calculation Process",details:dets});
            } catch(e) {
                console.error("Math.js RREF failed:",e);
                error = "RREF Error (Math.js): " + e.message;
                methods.push({name:"RREF Calculation Failed", details: error + "\nCould not calculate RREF using Math.js. Manual step-by-step calculation is complex."});
            }
        } else {
            error = "Math.js not loaded or missing rref(). Cannot calculate RREF.";
             methods.push({name:"RREF Calculation Failed", details: error + "\nRREF calculation requires the Math.js library."});
        }

        if (error) {
             // Tidak perlu showError di sini jika dipanggil internal oleh Rank.
             // Error akan ditangani oleh pemanggil (Rank) atau displayResult jika RREF dipanggil langsung.
             return { operationType: 'rref', mainResult: null, inputMatrix: inputM, methods: methods, error: error }; // Return object with error info
        }


        return {operationType:'rref', mainResult:rrefMtx, inputMatrix:inputM, methods:methods};
    }

    function rank(matrixData) {
         // Fungsi ini tidak lagi dipanggil dari tombol Rank, jadi bisa dihapus atau dibiarkan jika ada penggunaan lain.
         // Jika dihapus, pastikan tidak ada kode lain yang memanggilnya.
         // Jika dibiarkan, pastikan detailnya sudah seperti yang diinginkan.

        if (!matrixData || matrixData.length === 0) return { operationType: 'rank', mainResult: 0, inputMatrix: matrixData || [], methods: [{name:"Info", details:"Rank of an empty matrix is 0."}]};

        const inputM = cloneMatrix(matrixData);
        let rankVal = null;
        const methods = [];
        let error = null;

        if (window.math && typeof window.math.rank === 'function') {
            try {
                const m = math.matrix(inputM);
                rankVal = math.rank(m);
                 let details = `<strong>Rank of the Matrix.</strong>\n`;
                 details += `The rank is the maximum number of linearly independent row or column vectors.\n`;
                 details += `It is also equal to the number of non-zero rows in the Row Echelon Form (RREF) of the matrix.\n`;
                 details += `Rank calculated using Math.js library: ${rankVal}`;

                 // Optionally, include the RREF matrix in the details for context
                 // Be careful not to trigger full RREF step-by-step calculation here if it's complex
                 const rrefResult = rowEchelonForm(inputM); // Calculate RREF (will use Math.js if available)
                 if (rrefResult && rrefResult.mainResult) {
                      details += `\n\nMatrix in RREF:\n${formatMatrixSimple(rrefResult.mainResult)}`;
                 } else if (rrefResult && rrefResult.error) {
                      details += `\n\nCould not calculate RREF to show here: ${rrefResult.error}`;
                 }


                methods.push({ name: "Rank Definition and Calculation", details: details }); // Mengubah nama metode
            } catch (e) {
                 console.error("Math.js Rank failed:",e);
                 error = "Rank Error (Math.js): " + e.message;
                 methods.push({name:"Rank Calculation Failed", details: error + "\nCould not calculate Rank using Math.js."});
            }
        } else {
            error = "Math.js not loaded or missing rank(). Cannot calculate Rank.";
             methods.push({name:"Rank Calculation Failed", details: error + "\nRank calculation requires the Math.js library."});
        }

        if (error) {
            // Tidak perlu showError di sini jika tidak dipanggil langsung dari tombol.
            // Namun, jika Anda menghapus tombolnya, fungsi ini mungkin tidak pernah dipanggil.
            // Jika ada penggunaan internal lain yang masih memanggilnya, pertimbangkan bagaimana error ditangani.
            // Untuk saat ini, karena tombolnya dihapus, fungsi ini mungkin tidak lagi diperlukan kecuali ada kode lain yang memanggilnya.
            // Jika Anda yakin tidak ada lagi yang memanggil Rank/RREF, Anda bisa menghapus fungsi ini sepenuhnya.
            // Untuk amannya, saya biarkan fungsinya tapi hapus pemanggilan showError di sini jika tidak dipanggil langsung.
             // showError(error); // Dihapus karena tombol Rank sudah dihapus.
            return { operationType: 'rank', mainResult: null, inputMatrix: inputM, methods: methods, error: error }; // Return object with error info
        }


        return { operationType: 'rank', mainResult: rankVal, inputMatrix: inputM, methods: methods };
    }


    function luDecomposition(matrixData) {
         // Fungsi ini tidak lagi dipanggil dari tombol LU, jadi bisa dihapus atau dibiarkan jika ada penggunaan lain.
        if (!matrixData || matrixData.length === 0) { showError("Matrix missing or empty for LU Decomposition."); return null; }
        const r = matrixData.length;
        const c = matrixData[0]?.length || 0;
        if(r !== c){showError("LU Decomposition requires a square matrix.");return null;}

        const inputM = cloneMatrix(matrixData);
        let luResult = null;
        const methods = [];
        let error = null;

        if (window.math && typeof window.math.lup === 'function') { // math.js uses LUP
            try {
                const lu = math.lup(math.matrix(inputM));

                const L = lu.L.toArray();
                const U = lu.U.toArray();
                const P_m = math.matrix(math.zeros(r, r));
                lu.p.forEach((col_idx, row_idx) => P_m.set([row_idx, col_idx], 1));
                const P = P_m.toArray();

                luResult = {L:L, U:U, P:P};

                let dets = `<strong>LU Decomposition (PA=LU) via Math.js.</strong>\nDecomposes matrix A into a Permutation matrix P, a Lower Triangular matrix L, and an Upper Triangular matrix U such that PA = LU.\n(Calculation performed by Math.js library)\n\n<strong>P (Permutation Matrix):</strong>\n${formatMatrixSimple(P)}\n\n<strong>L (Lower Triangular Matrix):</strong>\n${formatMatrixSimple(L)}\n\n<strong>U (Upper Triangular Matrix):</strong>\n${formatMatrixSimple(U)}\n`;
                 methods.push({name:"LUP Decomposition Process",details:dets}); // Mengubah nama metode
            } catch(e) {
                console.error("Math.js LU failed:",e);
                error = "LU Decomposition Error (Math.js): "+e.message;
                 methods.push({name:"LU Calculation Failed", details: error + "\nCould not calculate LU Decomposition using Math.js."}); // Mengubah nama metode
            }
        } else {
            error = "Math.js not loaded or missing lup(). Cannot calculate LU Decomposition.";
             methods.push({name:"LU Calculation Failed", details: error + "\nLU Decomposition requires the Math.js library."}); // Mengubah nama metode
        }

        if (error) {
             // showError(error); // Dihapus karena tombol LU sudah dihapus.
             return {operationType:'lu', mainResult:null, inputMatrix:inputM, methods:methods, error:error};
        }

        return {operationType:'lu', mainResult:luResult, inputMatrix:inputM, methods:methods};
    }

    function choleskyDecomposition(matrixData) {
         // Fungsi ini tidak lagi dipanggil dari tombol Cholesky, jadi bisa dihapus atau dibiarkan jika ada penggunaan lain.
        if (!matrixData || matrixData.length === 0) { showError("Matrix missing or empty for Cholesky Decomposition."); return null; }
        const r = matrixData.length;
        const c = matrixData[0]?.length || 0;
        if(r !== c){showError("Cholesky Decomposition requires a square matrix.");return null;}

        // Check for symmetry (with tolerance) - still a necessary check
        const tol = 1e-9;
        for(let i = 0; i < r; i++){
            for(let j = i + 1; j < c; j++){
                if(Math.abs((matrixData[i]?.[j] || 0) - (matrixData[j]?.[i] || 0)) > tol){
                    showError("Cholesky Decomposition requires a symmetric matrix.");
                    return null;
                }
            }
        }

        const inputM = cloneMatrix(matrixData);
        let choleskyResult = null;
        const methods = [];
        let error = null;


        if (!window.math || typeof window.math.cholesky !== 'function') {
            error = "Math.js not loaded or missing cholesky(). Cannot calculate Cholesky Decomposition.";
            methods.push({name:"Cholesky Calculation Failed", details: error + "\nCholesky Decomposition requires the Math.js library."}); // Mengubah nama metode
        } else {
            try {
                 // math.cholesky returns the lower triangular matrix L
                 const L_m = math.cholesky(math.matrix(inputM));
                 const L = L_m.toArray();
                 choleskyResult = {L:L};

                 let dets = `<strong>Cholesky Decomposition (A=L·L<sup>T</sup>) via Math.js.</strong>\nRequires a symmetric positive definite matrix.\nDecomposes matrix A into a lower triangular matrix L such that A = L·L<sup>T</sup>.\n(Calculation performed by Math.js library)\n\n<strong>L (Lower Triangular Matrix):</strong>\n${formatMatrixSimple(L)}\n`;
                 methods.push({name:"Cholesky Decomposition Process",details:dets}); // Mengubah nama metode

            } catch(e) {
                 console.error("Math.js Cholesky failed:",e);
                 error = "Cholesky Decomposition Error (Math.js): ";
                 let errMsg = e.message;
                 if (errMsg.includes("Positive definite")) {
                     errMsg = "Matrix must be symmetric positive definite.";
                 }
                 error += errMsg;
                 methods.push({name:"Cholesky Calculation Failed", details: error + "\nCould not calculate Cholesky Decomposition using Math.js."}); // Mengubah nama metode
            }
        }


        if (error) {
             // showError(error); // Dihapus karena tombol Cholesky sudah dihapus.
             return {operationType:'cholesky', mainResult:null, inputMatrix:inputM, methods:methods, error:error};
        }


        return {operationType:'cholesky', mainResult:choleskyResult, inputMatrix:inputM, methods:methods};
    }

    // Fungsi evaluateCustomExpression dan parseTerm - Biarkan ini jika Anda ingin fungsi custom expression tetap ada

    // --- Event Listeners & Handlers ---
    function setupEventListeners() {
        matrixPanelsContainer.addEventListener('click',handlePanelClick);
        matrixPanelsContainer.addEventListener('input',handlePanelInput);
        // Event listener untuk addMatrixBtn DIHAPUS
        // addMatrixBtn.addEventListener('click',(...));
        cleanOutputBtn.addEventListener('click',clearOutput);
        resetAllBtn.addEventListener('click',resetAll);
        displayDecimalsCheck.addEventListener('change',updateDecimalControlState);
        sigDigitsInput.addEventListener('input',updateDecimalControlState);
        // Event listener untuk evalExprBtn - Biarkan jika custom expression tetap ada
        evalExprBtn.addEventListener('click',()=>{const expr=customExprInput.value;if(!expr)return;clearOutput();const res=evaluateCustomExpression(expr);if(res!==null)displayResult(res,`Result of: "${expr}"`,null,'result-expr');});
    }

    function handlePanelClick(event) {
        const target=event.target;
        const button=target.closest('button');
        if(!button)return;
        const matrixName=button.dataset.matrix;
        const action=button.dataset.action;

        if(button.classList.contains('dim-btn') && matrixName && action) {
            changeMatrixDimensions(matrixName,action);
        } else if(button.classList.contains('op-btn') && matrixName && !button.classList.contains('bin-op')) {
            handleSingleMatrixOperation(button);
        } else if(button.classList.contains('bin-op')) {
            handleBinaryMatrixOperation(button);
        }
        // Event listener untuk copy-btn DIHAPUS dari sini
        // else if(button.classList.contains('copy-btn')) { handleCopyResult(button); }
        else if(button.classList.contains('icon-btn') && matrixName && action) {
            switch(action){
                // case 'upload':alert(`Upload ${matrixName} NI.');break; // Sudah dihapus sebelumnya
                // case 'paste':alert(`Paste ${matrixName} feature not implemented yet.');break; // Dihapus sepenuhnya
                case 'remove':
                    // Tombol remove hanya ada di matriks C+, jadi ini hanya relevan untuk itu
                    // Jika Anda ingin menghapus A/B, tambahkan logika di sini, tapi hati-hati!
                    if (confirm(`Are you sure you want to remove Matrix ${matrixName}?`)) { // Confirmation for A/B too if needed, or restrict with if(matrixName !== 'A' && matrixName !== 'B')
                        removeMatrixPanel(matrixName);
                    }
                    break;
                 // Default case for other icon-buttons if needed
                 // default: console.warn(`Unhandled icon-btn action: ${action}`); break;
            }
        }
    }

    function handlePanelInput(event) {
        if(event.target.tagName==='INPUT'&&event.target.type==='number'&&event.target.closest('.matrix-grid')) {
            handleMatrixInputChange(event);
        }
    }

    function handleSingleMatrixOperation(button) {
        const op = button.dataset.op;
        const matrixName = button.dataset.matrix;
        const matrix = readMatrixData(matrixName);
        if (!matrix) return;

        let result = undefined;
        let opDesc = `${op}(${matrixName})`; // Default description
        const sourceId = `result-${matrixName}-${op}`;

        let scalarVal = undefined;
        let exponentVal = undefined;
        if (op === 'mul-scalar') {
            const scalarInput = document.getElementById(`scalar-${matrixName}`);
            if (scalarInput) scalarVal = parseFloat(scalarInput.value);
            if (isNaN(scalarVal)){ showError("Invalid scalar value."); return;}
        } else if (op === 'pow') {
            const powerInput = document.getElementById(`power-${matrixName}`);
            if (powerInput) exponentVal = parseInt(powerInput.value);
             if (isNaN(exponentVal) || exponentVal < 0){ showError("Exponent must be a non-negative integer."); return;}
        }


        try {
            switch(op){
                case 'det': result = determinant(matrix); opDesc = `Determinant(${matrixName})`; break;
                case 'inv': result = inverse(matrix); opDesc = `Inverse(${matrixName})`; break;
                case 'trans': result = transpose(matrix); opDesc = `Transpose(${matrixName})`; break;
                // case 'rank': result = rank(matrix); opDesc = `Rank(${matrixName})`; break; // DIHAPUS
                // case 'rref': result = rowEchelonForm(matrix); opDesc = `RREF(${matrixName})`; break; // DIHAPUS
                // case 'lu': result = luDecomposition(matrix); opDesc = `LU Decomposition(${matrixName})`; break; // DIHAPUS
                // case 'chol': result = choleskyDecomposition(matrix); opDesc = `Cholesky Decomposition(${matrixName})`; break; // DIHAPUS
                // case 'diag': result = isDiagonal(matrix); opDesc = `Is ${matrixName} Diagonal?`; break; // DIHAPUS
                case 'mul-scalar':
                    result = multiplyScalar(cloneMatrix(matrix), scalarVal);
                    opDesc = `${formatNumber(scalarVal)} * ${matrixName}`;
                     // Wrap simple result for detailed display
                     result = { operationType: 'mul-scalar', mainResult: result, inputMatrix: cloneMatrix(matrix), methods: [{name:"Direct Calculation", details:`Calculated ${formatNumber(scalarVal)} * ${matrixName}.`}]};
                    break;
                case 'pow':
                    result = power(cloneMatrix(matrix), exponentVal);
                    opDesc = `${matrixName} ^ ${exponentVal}`;
                     // Wrap simple result for detailed display
                     result = { operationType: 'pow', mainResult: result, inputMatrix: cloneMatrix(matrix), methods: [{name:"Direct Calculation", details:`Calculated ${matrixName} to the power of ${exponentVal}.`}]};
                    break;
                default:
                    // Tambahkan case untuk operasi yang tidak dihapus di sini jika ada
                    // Contoh: if (op === 'customOp') { ... }
                    showError(`Unknown or unsupported operation: ${op}`); return;
            }

             // Display result handles different object structures
            if (result !== undefined && result !== null) {
                 displayResult(result, opDesc, null, sourceId);
            } else if (result === null) {
                 // If result is null, an error likely occurred and was handled by showError
            }


        } catch(e){
            console.error(`Calculation Error (${opDesc}):`,e);
            showError(`Unexpected error during ${opDesc}: ${e.message}`);
        }
    }

    function handleBinaryMatrixOperation(button) {
        const op = button.dataset.op;
        const m1N = button.dataset.m1;
        const m2N = button.dataset.m2;

        const m1 = readMatrixData(m1N);
        const m2 = readMatrixData(m2N);
        if(!m1 || !m2) return;

        let result = undefined;
        let opDesc = `${m1N} ${op} ${m2N}`;
        const srcId = `result-${m1N}-${op}-${m2N}`;
        const inputMatrices = { inputA: cloneMatrix(m1), inputB: cloneMatrix(m2) };

        try {
            switch(op){
                case 'add': result = add(m1, m2); opDesc = `${m1N} + ${m2N}`; break;
                case 'sub': result = subtract(m1, m2); opDesc = `${m1N} - ${m2N}`; break;
                case 'mul': result = multiplyMatrices(m1, m2); opDesc = `${m1N} × ${m2N}`; break;
                default: showError(`Unknown binary operation: ${op}`); return;
            }

            if (result !== undefined && result !== null) {
                // For binary ops, result might be just the matrix or an object (like multiplyMatrices)
                // Wrap them consistently for displayResult

                let mainResult = result;
                let details = `Calculated ${opDesc}.`;
                if (typeof result === 'object' && result.matrix && result.details) {
                     mainResult = result.matrix;
                     details = result.details; // Use detailed message from multiplyMatrices
                }

                displayResult({
                    operationType: op,
                    mainResult: mainResult,
                    inputMatrix: inputMatrices,
                    methods: [{ name: "Direct Calculation", details: details }]
                }, opDesc, null, srcId);

            } else if (result === null) {
                 // If result is null, an error likely occurred and was handled by showError
            }

        } catch(e){
            console.error(`Calculation Error (${opDesc}):`,e);
            showError(`Unexpected error during ${opDesc}: ${e.message}`);
        }
    }

    // Fungsi handleCopyResult DIHAPUS

    function setupResultActionListeners() {
        // Event listeners untuk insertResultABtn dan insertResultBBtn DIHAPUS
        // if(insertResultABtn) insertResultABtn.addEventListener('click', (...) );
        // if(insertResultBBtn) insertResultBBtn.addEventListener('click', (...) );

        if(cleanOutputBtnDetailed) cleanOutputBtnDetailed.addEventListener('click', clearOutput);

        if(copyResultBtnDetailed) copyResultBtnDetailed.addEventListener('click', () => {
             let txt = "";
             if (lastResult && typeof lastResult === 'object' && lastResult.operationType) {
                 txt += `Matrix Calculation Result:\n\n`;
                 txt += `Operation: ${lastResult.operationType}\n\n`;

                 if (lastResult.inputMatrix) {
                     if (lastResult.inputMatrix.inputA && lastResult.inputMatrix.inputB) {
                         txt += `Input Matrix 1:\n${formatMatrixSimple(lastResult.inputMatrix.inputA)}\n\n`;
                         txt += `Input Matrix 2:\n${formatMatrixSimple(lastResult.inputMatrix.inputB)}\n\n`;
                     } else if (Array.isArray(lastResult.inputMatrix)) {
                          txt += `Input Matrix:\n${formatMatrixSimple(lastResult.inputMatrix)}\n\n`;
                     }
                 }

                 txt += `Result:\n`;
                 if (typeof lastResult.mainResult === 'number' || typeof lastResult.mainResult === 'boolean') {
                     txt += formatNumber(lastResult.mainResult);
                 } else if (Array.isArray(lastResult.mainResult)) {
                     txt += formatMatrixSimple(lastResult.mainResult);
                 } else if (typeof lastResult.mainResult === 'object' && (lastResult.mainResult.L || lastResult.mainResult.U || lastResult.mainResult.P)) {
                      txt += "Complex Result (L, U, P):\n";
                      if (lastResult.mainResult.P) txt += `P:\n${formatMatrixSimple(lastResult.mainResult.P)}\n`;
                      if (lastResult.mainResult.L) txt += `L:\n${formatMatrixSimple(lastResult.mainResult.L)}\n`;
                      if (lastResult.mainResult.U) txt += `U:\n${formatMatrixSimple(lastResult.mainResult.U)}\n`;
                 } else {
                     txt += String(lastResult.mainResult);
                 }
                 txt += "\n";


                 // Salin Detail Perhitungan (kecuali yang difilter)
                 const allDetails = calculationMethodsContainer?.querySelectorAll('details');
                 if (allDetails && allDetails.length > 0) {
                     let detailsText = "";
                     // Daftar nama metode yang DIFILTER dari tampilan detail GUI, jadi juga difilter saat copy
                      const methodsToFilterFromCopy = [
                         "Math.js det()",
                         "Math.js inv()",
                         "Math.js rref()",
                         "Math.js lup()",
                         "Math.js cholesky()",
                         "Math.js rank()",
                         "Info" // Filter out generic "Info" method used for Math.js calculation note
                     ];
                     allDetails.forEach(detailElement => {
                         const summaryText = detailElement.querySelector('summary')?.textContent || '';
                          // Cek jika detail ini BUKAN yang difilter
                         let shouldFilter = false;
                         for (const filterName of methodsToFilterFromCopy) {
                             if (summaryText.includes(filterName)) {
                                 shouldFilter = true;
                                 break;
                             }
                         }

                         if (!shouldFilter) {
                            const preElement = detailElement.querySelector('div pre');
                             if (preElement) {
                                 detailsText += `\n-- Calculation Details (${summaryText}) --\n`;
                                 detailsText += preElement.textContent.trim();
                             }
                         }
                     });
                     if (detailsText) {
                          txt += detailsText; // Add only non-filtered details
                     }
                 }


             } else if (resultGeneralOutput && resultGeneralOutput.textContent.trim() !== 'Select an operation to see the result.') {
                  txt = resultGeneralOutput.textContent.trim();
             }

             if(!txt.trim()){
                 showError("Nothing to copy.");
                 return;
             }

             navigator.clipboard.writeText(txt.trim())
                 .then(()=>{
                     copyResultBtnDetailed.innerHTML='<i class="fas fa-check"></i> Copied!';
                     setTimeout(()=>copyResultBtnDetailed.innerHTML='<i class="fas fa-copy"></i>',1500);
                 })
                 .catch(err=>showError('Failed to copy result to clipboard: ' + err));
         });


        if(shareResultBtnDetailed) shareResultBtnDetailed.addEventListener('click', () => {
             let shareTxt="Matrix Calculation Result:\n\n";
             if (lastResult && typeof lastResult === 'object' && lastResult.operationType) {
                  shareTxt += `Operation: ${lastResult.operationType}\n\n`;

                  if (lastResult.inputMatrix) {
                     if (lastResult.inputMatrix.inputA && lastResult.inputMatrix.inputB) {
                         shareTxt += `Input Matrix 1:\n${formatMatrixSimple(lastResult.inputMatrix.inputA)}\n\n`;
                         shareTxt += `Input Matrix 2:\n${formatMatrixSimple(lastResult.inputMatrix.inputB)}\n\n`;
                     } else if (Array.isArray(lastResult.inputMatrix)) {
                          shareTxt += `Input Matrix:\n${formatMatrixSimple(lastResult.inputMatrix)}\n\n`;
                     }
                 }

                  shareTxt += `Result:\n`;
                 if (typeof lastResult.mainResult === 'number' || typeof lastResult.mainResult === 'boolean') {
                      shareTxt += formatNumber(lastResult.mainResult);
                  } else if (Array.isArray(lastResult.mainResult)) {
                      shareTxt += formatMatrixSimple(lastResult.mainResult);
                  } else if (typeof lastResult.mainResult === 'object' && (lastResult.mainResult.L || lastResult.mainResult.U || lastResult.mainResult.P)) {
                      shareTxt += "Complex Result (e.g., LU Decomposition) - See the application for details.\n";
                 } else {
                     shareTxt += String(lastResult.mainResult);
                 }
                 shareTxt += "\n";


             } else if (resultGeneralOutput && resultGeneralOutput.textContent.trim() !== 'Select an operation to see the result.') {
                  shareTxt += resultGeneralOutput.textContent.trim();
             } else {
                 showError("Nothing to share.");
                 return;
             }

             const sData={ title:'Matrix Result', text: shareTxt.trim() };

             if(navigator.share && navigator.canShare(sData)) {
                 navigator.share(sData).catch(err=>console.error("Share failed:",err));
             } else {
                 navigator.clipboard.writeText(sData.text)
                     .then(()=>alert("Share API not supported on this browser. Result copied to clipboard."))
                     .catch(err=>alert("Share and Copy failed."));
             }
         });
    }

    function updateDecimalControlState() {
        sigDigitsInput.disabled = !displayDecimalsCheck.checked;

        if (lastResult !== null) {
            let operationDesc = "Last Result";
            if (typeof lastResult === 'object' && lastResult.operationType) {
                operationDesc = lastResult.operationType.charAt(0).toUpperCase() + lastResult.operationType.slice(1) + " Result";
                 if (lastResult.inputMatrix && lastResult.inputMatrix.inputA && lastResult.inputMatrix.inputB) {
                       let m1N = 'Matrix 1';
                       let m2N = 'Matrix 2';
                       // Find matrix names based on data (heuristic, might be slow for many matrices)
                       for (const name in matrices) {
                           if (matrices[name].data === lastResult.inputMatrix.inputA) m1N = name;
                           if (matrices[name].data === lastResult.inputMatrix.inputB) m2N = name;
                       }
                      const opSymbol = lastResult.operationType === 'add' ? '+' : (lastResult.operationType === 'sub' ? '-' : (lastResult.operationType === 'mul' ? '×' : lastResult.operationType));
                       operationDesc = `${m1N} ${opSymbol} ${m2N} Result`;
                 } else if (lastResult.inputMatrix && Array.isArray(lastResult.inputMatrix)) {
                       let mName = 'Matrix';
                        // Find matrix name based on data (heuristic)
                       for (const name in matrices) {
                           if (matrices[name].data === lastResult.inputMatrix) mName = name;
                       }
                       operationDesc = `${lastResult.operationType.charAt(0).toUpperCase() + lastResult.operationType.slice(1)}(${mName})`;
                 } else if (lastResultSource === 'result-expr' && customExprInput.value) {
                      operationDesc = `Result of: "${customExprInput.value}"`;
                 }


            } else {
                 const titleElement = resultGeneralOutput.querySelector('.result-title');
                 if (titleElement) {
                     operationDesc = titleElement.textContent.trim();
                 }
            }

            // Re-display the last result with the potentially updated formatting
             displayResult(lastResult, operationDesc, null, lastResultSource);
        }
    }


    function resetAll() {
         if(!confirm("Are you sure you want to reset all matrices and clear the output?"))return;
         matrixPanelsContainer.innerHTML='';
         // Tidak perlu menambahkan addMatrixBtn lagi karena sudah dihapus dari HTML
         // matrixPanelsContainer.appendChild(addMatrixBtn);
         matrices={};
         // nextMatrixName = 'C'; // Tidak perlu direset jika tidak menambah matriks baru
         lastResult=null;
         lastResultSource = null;
         initialize(); // Inisialisasi ulang hanya A dan B
         customExprInput.value='';
         clearOutput();
         displayDecimalsCheck.checked=false;
         sigDigitsInput.value=4;
         updateDecimalControlState();
    }

    // --- Start the application ---
    initialize();
});
