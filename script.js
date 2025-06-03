document.addEventListener('DOMContentLoaded', () => {
    let matrices = {}; 
    let lastResult = null;
    let lastResultSource = null; 

    const defaultMatrixB = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const inverseExampleMatrix = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; 
    const matrixPanelsContainer = document.getElementById('matrix-panels-container');
    const resultGeneralOutput = document.getElementById('result-general-output');
    const resultDetailedView = document.getElementById('result-detailed-view');
    const resultSummaryInputMatrix = document.getElementById('result-summary-input-matrix');
    const resultSummaryOperationSymbol = document.getElementById('result-summary-operation-symbol');
    const resultSummaryMainResult = document.getElementById('result-summary-main-result');
    const calculationMethodsContainer = document.getElementById('calculation-methods-container');
    const cleanOutputBtnDetailed = document.getElementById('clean-output-btn-detailed');
    const copyResultBtnDetailed = document.getElementById('copy-result-btn-detailed');
    const shareResultBtnDetailed = document.getElementById('share-result-btn-detailed');
    const cleanOutputBtn = document.getElementById('clean-output-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const displayDecimalsCheck = document.getElementById('display-decimals-check');
    const sigDigitsInput = document.getElementById('sig-digits-input');
    const customExprInput = document.getElementById('custom-expr-input');
    const evalExprBtn = document.getElementById('eval-expr-btn');

    function formatNumber(num) {
        if (typeof num !== 'number') return String(num);
        const tol = 1e-10; // Toleransi untuk pembulatan
        const isInt = Math.abs(num - Math.round(num)) < tol;

        if (!displayDecimalsCheck.checked && !isInt) {
            const frac = numberToFraction(num);
            if (frac) return frac; 
        }
        if (isInt) return String(Math.round(num)); 
        else {
             const sd = parseInt(sigDigitsInput.value) || 4;
             let fmt = num.toPrecision(sd);
             if (fmt.includes('.')) {
                 fmt = fmt.replace(/(\.[0-9]*[1-9])0+$/, '$1').replace(/\.0+$/, '.0');
             }
             if (fmt.endsWith('.') && !fmt.endsWith('.0')) {
                 fmt = fmt + '0';
             }
             return fmt;
        }
    }

    function numberToFraction(number, tolerance = 1.0E-6, maxDenominator = 1000) {
        if (Number.isInteger(number)) return String(number);
        if (Math.abs(number) < tolerance) return '0'; 

        let sign = number < 0 ? -1 : 1;
        number = Math.abs(number);

        // Kasus sederhana seperti 0.5 -> 1/2
        if (Math.abs(number - (1/2)) < tolerance) return (sign === -1 ? '-' : '') + '1/2';

        let h1=1,h2=0,k1=0,k2=1,b=number;
        let n = 0; 
        const maxIterations = 100; // Batas iterasi untuk mencegah loop tak terbatas

        do {
            let a=Math.floor(b);
            let aux=h1;h1=a*h1+h2;h2=aux;
            aux=k1;k1=a*k1+k2;k2=aux;
            if (Math.abs(b - a) < tolerance || k1 > maxDenominator || n++ > maxIterations) break;
            b=1/(b-a);
        } while(Math.abs(number-h1/k1)>number*tolerance); 

        // Jika tidak ditemukan pecahan yang baik dalam batas atau aproksimasi masih buruk
        if(k1 > maxDenominator || k1 === 0 || Math.abs(number - h1/k1) > number * tolerance * 1.01) { // Tambahkan margin kecil untuk pemeriksaan toleransi
             return null; // Kembalikan null untuk fallback ke desimal
        }

        // Sederhanakan pecahan
        const gcd = (a, b) => b === 0 ? Math.abs(a) : gcd(b, a % b); 
        const commonDivisor = gcd(h1, k1);
        h1 /= commonDivisor;
        k1 /= commonDivisor;

        return (sign === -1 ? '-' : '') + h1 + "/" + k1;
    }
    
    // Fungsi helper untuk memformat satu baris matriks
    function formatRowSimple(rowArray) {
        if (!rowArray) return "[ ]"; 
        if (rowArray.length === 0) return "[ ]";
        return "[ " + rowArray.map(val => formatNumber(val)).join(", ") + " ]";
    }

    // formatMatrixSimple yang direfaktor
    function formatMatrixSimple(matrix, options = { asFraction: false }) { 
         if (!matrix || !matrix.length || (matrix.length > 0 && !matrix[0]?.length && matrix[0] !== undefined)) { // Menangani matriks kosong atau 0 kolom
            if (!matrix || matrix.length === 0) return "[]"; // Matriks kosong (0 baris)
            // Matriks dengan baris tetapi 0 kolom
            return matrix.map(() => "[ ]").join("\n"); 
         }
         // Kasus standar
         return matrix.map(row => formatRowSimple(row || [])).join("\n");
    }
    
    // Fungsi ini untuk tampilan kaya dengan padding, bukan untuk langkah teks sederhana
    function formatMatrix(matrix) { 
         if (!matrix || !matrix.length || !matrix[0]?.length) return "<pre class='matrix-output'>[]</pre>";
         const r=matrix.length;
         const c=matrix[0].length;
         let o="<pre class='matrix-output'>"; // Gunakan tag pre untuk mempertahankan spasi
         let formattedCells = [];
         let maxW=0; // Lebar maksimum sel untuk padding

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

    // Fungsi baru untuk memformat matriks augmented [A | I] berdampingan
    function formatAugmentedMatrixSimple(matrixA, matrixI) {
        const aRows = matrixA.length;
        const iRows = matrixI.length;

        if (aRows === 0 && iRows === 0) return "[] | []";
        
        let outputLines = [];
        const numDisplayRows = Math.max(aRows, iRows);
        
        const placeholderACols = (aRows > 0 && matrixA[0]) ? matrixA[0].length : ( (iRows > 0 && matrixI[0]) ? matrixI[0].length : 1 );
        const placeholderICols = (iRows > 0 && matrixI[0]) ? matrixI[0].length : ( (aRows > 0 && matrixA[0]) ? matrixA[0].length : 1 );

        for (let i = 0; i < numDisplayRows; i++) {
            const rowA = matrixA[i];
            const rowI = matrixI[i];

            // Gunakan placeholder jika satu baris matriks tidak ada
            const rowAStr = rowA ? formatRowSimple(rowA) : formatRowSimple(Array(placeholderACols).fill(' ')); 
            const rowIStr = rowI ? formatRowSimple(rowI) : formatRowSimple(Array(placeholderICols).fill(' '));
            
            outputLines.push(rowAStr + " | " + rowIStr);
        }
        return outputLines.join("\n");
    }

    // --- Inisialisasi ---
    function initialize() {
        // Hanya inisialisasi Matriks A dan B
        addMatrixPanel('A', 3, 3, inverseExampleMatrix); // Pakai matriks contoh invers
        addBinaryOpsPanel('A', 'B'); // Tambahkan panel operasi biner antara A dan B
        if (!matrices['B']) { // Tambahkan matriks B jika belum ada
            addMatrixPanel('B', 3, 3, defaultMatrixB);
        }
        setupEventListeners();
        setupResultActionListeners();
        updateDecimalControlState();
        clearOutput(); // Bersihkan output saat awal
    }
    function addMatrixPanel(name, rows, cols, initialData = null) {
         if (name !== 'A' && name !== 'B') {
             console.warn(`Mencoba menambahkan panel matriks untuk ${name}, tetapi hanya A dan B yang diizinkan tanpa tombol '+'.`);
             return;
         }
        if (matrices[name]) return; 
        const panel = document.createElement('div');
        panel.className = 'matrix-panel';
        panel.id = `matrix-panel-${name}`;
        panel.innerHTML = `
            <div class="panel-header">
                <span class="matrix-name">Matriks ${name}</span>
                <div class="dimension-controls">
                    <label>Ukuran:</label>
                    <span class="dims" id="dims-${name}">${rows}x${cols}</span>
                    <span>Baris:</span>
                    <button class="dim-btn" data-matrix="${name}" data-action="dec-row">-</button>
                    <button class="dim-btn" data-matrix="${name}" data-action="inc-row">+</button>
                    <span>Kolom:</span>
                    <button class="dim-btn" data-matrix="${name}" data-action="dec-col">-</button>
                    <button class="dim-btn" data-matrix="${name}" data-action="inc-col">+</button>
                </div>
                <div class="panel-actions">
                    </div>
            </div>
            <div class="matrix-grid" id="matrix-grid-${name}" style="--rows: ${rows}; --cols: ${cols};"></div>
            <div class="matrix-operations-single">
                <button class="op-btn" data-op="det" data-matrix="${name}">Determinan</button>
                <button class="op-btn" data-op="inv" data-matrix="${name}">Invers</button>
                <button class="op-btn" data-op="trans" data-matrix="${name}">Transpos</button>
                <div>
                    <button class="op-btn" data-op="mul-scalar" data-matrix="${name}">Kalikan dengan</button>
                    <input type="number" class="op-input" id="scalar-${name}" value="2" step="any">
                </div>
                <div>
                    <button class="op-btn" data-op="pow" data-matrix="${name}">Pangkat</button>
                    <input type="number" class="op-input" id="power-${name}" value="2" step="1" min="0">
                </div>
            </div>
        `;
        matrixPanelsContainer.appendChild(panel); // Tambahkan panel ke kontainer utama
        matrices[name] = { rows, cols, data: createEmptyMatrix(rows, cols) }; // Inisialisasi data matriks
        renderMatrixInputs(name, initialData); // Render input field untuk matriks
    }

    function addBinaryOpsPanel(matrix1Name, matrix2Name) {
         // Hanya buat panel operasi biner untuk A dan B
         if (matrix1Name !== 'A' || matrix2Name !== 'B') {
             console.warn(`Mencoba menambahkan panel operasi biner untuk ${matrix1Name}-${matrix2Name}, tetapi hanya A-B yang didukung.`);
             return;
         }

        const panelId = `binary-ops-${matrix1Name}-${matrix2Name}`;
        if (document.getElementById(panelId)) return; 
        const panel1 = document.getElementById(`matrix-panel-${matrix1Name}`);
        if (!panel1) return; 

        const binaryOpsPanel = document.createElement('div');
        binaryOpsPanel.className = 'matrix-operations-binary';
        binaryOpsPanel.id = panelId;
        // HTML untuk tombol operasi biner
        binaryOpsPanel.innerHTML = `
            <button class="op-btn bin-op" data-op="mul" data-m1="${matrix1Name}" data-m2="${matrix2Name}">${matrix1Name} × ${matrix2Name}</button>
            <button class="op-btn bin-op" data-op="add" data-m1="${matrix1Name}" data-m2="${matrix2Name}">${matrix1Name} + ${matrix2Name}</button>
            <button class="op-btn bin-op" data-op="sub" data-m1="${matrix1Name}" data-m2="${matrix2Name}">${matrix1Name} - ${matrix2Name}</button>
            `;
        panel1.after(binaryOpsPanel); // Sisipkan panel operasi biner setelah panel matriks pertama
    }

    function renderMatrixInputs(matrixName, initialData = null) {
        const grid = document.getElementById(`matrix-grid-${matrixName}`);
        if(!grid) return;
        const { rows, cols } = matrices[matrixName];
        grid.innerHTML = ''; // Kosongkan grid sebelum merender ulang
        grid.style.setProperty('--rows', rows);
        grid.style.setProperty('--cols', cols);
        const currentData = matrices[matrixName].data; // Simpan data saat ini jika ada (untuk perubahan dimensi)
        matrices[matrixName].data = createEmptyMatrix(rows, cols); // Buat matriks data baru dengan dimensi yang benar

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.step = 'any'; // Izinkan angka desimal
                input.dataset.row = i;
                input.dataset.col = j;
                input.dataset.matrix = matrixName;
                let valueToSet = '';
                // Isi nilai dari initialData atau currentData
                if (initialData && i < initialData.length && initialData[i] && j < initialData[i].length && initialData[i][j] !== null && initialData[i][j] !== undefined) {
                    valueToSet = initialData[i][j];
                } else if (currentData && i < currentData.length && currentData[i] && j < currentData[i].length && currentData[i][j] !== null && currentData[i][j] !== undefined) {
                    valueToSet = currentData[i][j];
                }
                input.value = valueToSet;
                // Simpan nilai ke dalam state matriks, default ke 0 jika kosong atau tidak valid
                matrices[matrixName].data[i][j] = (valueToSet === '' || valueToSet === null || valueToSet === undefined) ? 0 : (parseFloat(valueToSet) || 0);
                grid.appendChild(input);
            }
        }
        const dimsSpan = document.getElementById(`dims-${matrixName}`);
        if (dimsSpan) dimsSpan.textContent = `${rows}x${cols}`; // Perbarui tampilan dimensi
    }

    function handleMatrixInputChange(event) {
        const inputElement = event.target;
        const matrixName = inputElement.dataset.matrix;
        const row = parseInt(inputElement.dataset.row);
        const col = parseInt(inputElement.dataset.col);
        const value = (inputElement.value === '' || inputElement.value === null || inputElement.value === undefined) ? 0 : (parseFloat(inputElement.value) || 0);
        // Perbarui data matriks di state
        if (matrices[matrixName]?.data[row]?.[col] !== undefined) {
            matrices[matrixName].data[row][col] = value;
        }
    }

    function readMatrixData(matrixName) {
        if (!matrices[matrixName]) {
            showError(`Matriks ${matrixName} tidak ditemukan.`);
            return null;
        }
        return matrices[matrixName].data; // Kembalikan data matriks dari state
    }

    function updateMatrixPanelData(matrixName, newData) {
        if (!matrices[matrixName] || !newData) return;
        const numNewRows = newData.length;
        const numNewCols = newData[0]?.length || 0;

         if (numNewRows === 0 && newData.length > 0) { // Periksa apakah ini array tapi baris pertama kosong
             showError(`Tidak dapat memperbarui ${matrixName} dengan kolom kosong.`);
             return;
         }
        if (numNewRows === 0) { // Tangani kasus matriks kosong secara eksplisit
            matrices[matrixName].rows = 0;
            matrices[matrixName].cols = 0;
            matrices[matrixName].data = [];
            renderMatrixInputs(matrixName, []); // Render grid kosong
            return;
        }

        matrices[matrixName].rows = numNewRows;
        matrices[matrixName].cols = numNewCols;
        matrices[matrixName].data = cloneMatrix(newData); // Simpan data baru
        renderMatrixInputs(matrixName, matrices[matrixName].data); // Render ulang panel dengan data baru
    }

    function changeMatrixDimensions(matrixName, action) {
         // Perubahan dimensi hanya diizinkan untuk A dan B
         if (matrixName !== 'A' && matrixName !== 'B') {
             console.warn(`Mencoba mengubah dimensi untuk ${matrixName}, tetapi hanya A dan B yang dapat dimodifikasi.`);
             return;
         }

        if (!matrices[matrixName]) return;
        let { rows, cols } = matrices[matrixName];
        switch (action) {
            case 'inc-row': rows++; break;
            case 'dec-row': rows = Math.max(1, rows - 1); break; // Minimal 1 baris
            case 'inc-col': cols++; break;
            case 'dec-col': cols = Math.max(1, cols - 1); break; // Minimal 1 kolom
        }
        if (rows !== matrices[matrixName].rows || cols !== matrices[matrixName].cols) {
            matrices[matrixName].rows = rows;
            matrices[matrixName].cols = cols;
            renderMatrixInputs(matrixName, matrices[matrixName].data); // Render ulang dengan data yang ada (mungkin terpotong atau ditambah 0)
        }
    }

    function displayResult(result, operationDesc, detailsIgnored, sourceId = null) {
        resultGeneralOutput.innerHTML = '';
        resultDetailedView.classList.add('hidden');
        resultSummaryInputMatrix.innerHTML = '';
        resultSummaryOperationSymbol.innerHTML = '';
        resultSummaryMainResult.innerHTML = '';
        calculationMethodsContainer.innerHTML = '';
        lastResult = null; // Reset hasil terakhir
        lastResultSource = sourceId;

        if (result === null || result === undefined) {
            resultGeneralOutput.innerHTML = `<span class="error-message">${operationDesc || "Operasi gagal."}</span>`;
            resultGeneralOutput.classList.remove('hidden');
            return;
        }

        // Cek jika hasil adalah objek terstruktur dengan 'methods' (untuk tampilan detail)
        if (typeof result === 'object' && !Array.isArray(result) && result.operationType && result.mainResult !== undefined && result.inputMatrix && Array.isArray(result.methods)) {
            // Tangani input matriks bisa berupa objek (untuk operasi biner) atau array (untuk operasi tunggal)
            if (result.inputMatrix.inputA && result.inputMatrix.inputB) { // Operasi biner
                 resultSummaryInputMatrix.innerHTML = `Input A:\n${formatMatrixSimple(result.inputMatrix.inputA)}\nInput B:\n${formatMatrixSimple(result.inputMatrix.inputB)}`;
            } else if (Array.isArray(result.inputMatrix)) { // Operasi tunggal
                 resultSummaryInputMatrix.innerHTML = formatMatrix(result.inputMatrix); // Gunakan format kaya untuk ringkasan input tunggal
            } else {
                 resultSummaryInputMatrix.innerHTML = 'Matriks Input: [Tidak tersedia]';
            }

            // Simbol operasi di ringkasan
            let opSymbol = '=';
             switch(result.operationType) {
                 case 'determinant': opSymbol = '='; break;
                 case 'inverse': opSymbol = '<sup>-1</sup>&nbsp;='; break; // &nbsp; untuk spasi
                 case 'rref': opSymbol = '&nbsp;~&gt;&nbsp;'; break; 
                 case 'lu': opSymbol = '&nbsp;=&nbsp;L·U'; break; 
                 case 'cholesky': opSymbol = '&nbsp;=&nbsp;L·L<sup>T</sup>'; break; 
                 case 'add': opSymbol = '+'; break;
                 case 'sub': opSymbol = '-'; break;
                 case 'mul': opSymbol = '×'; break;
                 case 'mul-scalar': opSymbol = '×'; break;
                 case 'pow': opSymbol = '^'; break;
                 case 'transpose': opSymbol = '<sup>T</sup>&nbsp;='; break;
                 case 'rank': opSymbol = 'Peringkat = '; break; 
                 case 'isDiagonal': opSymbol = 'Apakah Diagonal? '; break; 
             }
            resultSummaryOperationSymbol.innerHTML = opSymbol;

            // Tampilkan hasil utama (bisa skalar, matriks, atau objek kompleks seperti LU)
             if (typeof result.mainResult === 'number' || typeof result.mainResult === 'boolean') { 
                 resultSummaryMainResult.innerHTML = `<span class="result-scalar">${formatNumber(result.mainResult)}</span>`;
             }
             else if (typeof result.mainResult === 'object' && (result.mainResult.L || result.mainResult.U || result.mainResult.P)) { // Hasil LU, Cholesky
                 let mainResultHtml = '<div>';
                 if (result.mainResult.P) mainResultHtml += `<strong>P:</strong>${formatMatrix(result.mainResult.P)}`;
                 if (result.mainResult.L) mainResultHtml += `<strong>L:</strong>${formatMatrix(result.mainResult.L)}`;
                 if (result.mainResult.U) mainResultHtml += `<strong>U:</strong>${formatMatrix(result.mainResult.U)}`;
                 mainResultHtml += '</div>';
                 resultSummaryMainResult.innerHTML = mainResultHtml;
             }
             else if (Array.isArray(result.mainResult)) { // Hasil matriks
                 resultSummaryMainResult.innerHTML = formatMatrix(result.mainResult);
             }
             else { // Hasil lain (string, dll.)
                 resultSummaryMainResult.innerHTML = `<span class="result-other">${String(result.mainResult)}</span>`;
             }

            // Tampilkan detail metode perhitungan
             result.methods.forEach(method => {
                 // Filter detail spesifik Math.js dari tampilan UI
                 const mathJsMethodsToFilter = [
                     "Math.js det()", "Math.js inv()", "Math.js rref()",
                     "Math.js lup()", "Math.js cholesky()", "Math.js rank()"
                 ];
                  // Juga filter detail generik "Info" jika isinya tentang Math.js
                 const isMathJsInfo = method.name === "Info" && (method.details.includes("pustaka Math.js") || method.details.includes("Math.js menggunakan"));

                 if (mathJsMethodsToFilter.some(methodName => method.name.includes(methodName)) || isMathJsInfo) {
                     return; // Lewati penambahan detail metode ini
                 }

                 const detailsElement = document.createElement('details');
                 const summaryElement = document.createElement('summary');
                 const contentDiv = document.createElement('div');
                 const preElement = document.createElement('pre'); 
                 summaryElement.textContent = `Detail (${method.name})`; // Nama metode bisa diterjemahkan jika perlu di sini atau saat dibuat
                 preElement.innerHTML = method.details; // Gunakan innerHTML jika detail mengandung HTML
                 contentDiv.appendChild(preElement);
                 detailsElement.appendChild(summaryElement);
                 detailsElement.appendChild(contentDiv);
                 calculationMethodsContainer.appendChild(detailsElement);
             });

             resultDetailedView.classList.remove('hidden'); // Tampilkan view detail
             resultGeneralOutput.classList.add('hidden'); // Sembunyikan view umum
             lastResult = result; // Simpan objek hasil lengkap
        } else {
            // --- Tampilan Umum (jika hasil bukan objek terstruktur atau tidak ada 'methods') ---
             let output = `<strong class="result-title">${operationDesc}</strong>\n`;
             if (typeof result === 'number' || typeof result === 'boolean') { 
                 output += `<span class="result-scalar">${formatNumber(result)}</span>`;
             }
             else if (Array.isArray(result)) { // Jika hasilnya adalah array matriks sederhana
                 output += formatMatrix(result);
             }
             else if (typeof result === 'object' && result.matrix && result.details) { // Untuk hasil dari multiplyMatrices yang mengembalikan objek
                 output += formatMatrix(result.matrix);
                 output += `<details><summary>Langkah Perhitungan</summary><pre>${result.details}</pre></details>`;
             }
             else { // Hasil lain
                 output += `<span class="result-other">${String(result)}</span>`;
             }
             resultGeneralOutput.innerHTML = output;
             resultGeneralOutput.classList.remove('hidden'); // Tampilkan view umum
             resultDetailedView.classList.add('hidden'); // Sembunyikan view detail
             lastResult = result; // Simpan hasil sederhana
        }
         // Render MathJax setelah DOM diperbarui untuk rumus matematika
         if (window.MathJax) {
             MathJax.typesetPromise().catch((err) => console.error('Render MathJax gagal', err));
         }
    }

    function showError(message) {
        resultGeneralOutput.innerHTML = `<span class="error-message">Kesalahan: ${message}</span>`;
        resultGeneralOutput.classList.remove('hidden');
        resultDetailedView.classList.add('hidden');
        lastResult = null;
        lastResultSource = null;
    }

    function clearOutput() {
        resultGeneralOutput.innerHTML = 'Pilih operasi untuk melihat hasil.';
        resultGeneralOutput.classList.remove('hidden');
        resultDetailedView.classList.add('hidden');
        resultSummaryInputMatrix.innerHTML='';
        resultSummaryOperationSymbol.innerHTML='';
        resultSummaryMainResult.innerHTML='';
        calculationMethodsContainer.innerHTML='';
        lastResult = null;
        lastResultSource = null;
        customExprInput.value=''; // Kosongkan input ekspresi kustom
    }

    // --- Operasi Matriks (Logika Inti) ---
    function createEmptyMatrix(rows, cols) {
        if (rows <= 0 || cols <= 0) return []; 
        return Array(rows).fill(0).map(() => Array(cols).fill(0));
    }

    function cloneMatrix(matrix) {
        if (!matrix) return null;
        // Kloning mendalam untuk array bersarang
        return matrix.map(row => Array.isArray(row) ? [...row] : row);
    }

    function transpose(matrixData) {
        if (!matrixData || matrixData.length === 0 || matrixData[0]?.length === 0) { 
             const rows = matrixData ? matrixData.length : 0;
             const cols = (matrixData && matrixData[0]) ? matrixData[0].length : 0;
             return { operationType: 'transpose', mainResult: createEmptyMatrix(cols, rows), inputMatrix: matrixData || [], methods: [{name:"Info", details:"Transpos dari matriks kosong adalah kosong."}]};
        }
        const rows = matrixData.length;
        const cols = matrixData[0].length; 
        const result = createEmptyMatrix(cols, rows);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                result[j][i] = matrixData[i][j];
            }
        }
        return { 
            operationType: 'transpose', 
            mainResult: result, 
            inputMatrix: matrixData, 
            methods: [{name:"Transposisi Langsung", details: `Menukar baris & kolom.\nLama: ${rows}x${cols}, Baru: ${cols}x${rows}\nHasil:\n${formatMatrixSimple(result)}`}] 
        };
    }

    function add(matrixA, matrixB) {
        if (!matrixA || !matrixB) { showError("Matriks tidak ditemukan untuk penjumlahan."); return null; }
        const rA=matrixA.length, cA=matrixA[0]?.length||0;
        const rB=matrixB.length, cB=matrixB[0]?.length||0;
        if (rA !== rB || cA !== cB) {
             showError(`Ketidakcocokan dimensi untuk penjumlahan (${rA}x${cA} vs ${rB}x${cB}).`);
             return null;
        }
        if(rA===0)return []; // Jumlah matriks kosong adalah kosong

        const res=createEmptyMatrix(rA,cA);
        for(let i=0;i<rA;i++){
            for(let j=0;j<cA;j++){
                res[i][j]=(matrixA[i]?.[j]||0)+(matrixB[i]?.[j]||0);
            }
        }
        return res; // Kembalikan matriks untuk operasi biner, displayResult akan membungkusnya
    }

    function subtract(matrixA, matrixB) {
        if (!matrixA || !matrixB) { showError("Matriks tidak ditemukan untuk pengurangan."); return null; }
        const rA=matrixA.length, cA=matrixA[0]?.length||0;
        const rB=matrixB.length, cB=matrixB[0]?.length||0;
        if (rA !== rB || cA !== cB) {
             showError(`Ketidakcocokan dimensi untuk pengurangan (${rA}x${cA} vs ${rB}x${cB}).`);
             return null;
        }
        if(rA===0)return [];

        const res=createEmptyMatrix(rA,cA);
        for(let i=0;i<rA;i++){
            for(let j=0;j<cA;j++){
                res[i][j]=(matrixA[i]?.[j]||0)-(matrixB[i]?.[j]||0);
            }
        }
        return res; // Kembalikan matriks untuk operasi biner
    }

    function multiplyScalar(matrix, scalar) {
        if (!matrix) { showError("Matriks tidak ditemukan untuk perkalian skalar."); return null; }
        if (typeof scalar !== 'number' || isNaN(scalar)) { showError("Nilai skalar tidak valid."); return null; }
        if (matrix.length === 0 || matrix[0]?.length === 0) return []; // Hasil perkalian skalar matriks kosong adalah matriks kosong
        return matrix.map(row => row.map(val => (val || 0) * scalar));
    }

    function multiplyMatrices(matrixA, matrixB) {
        if (!matrixA || !matrixB) { showError("Matriks tidak ditemukan untuk perkalian."); return null; }
        const rA=matrixA.length, cA=matrixA[0]?.length||0;
        const rB=matrixB.length, cB=matrixB[0]?.length||0;
        if (cA !== rB) {
             showError(`Tidak dapat mengalikan: Jumlah kolom Matriks A (${cA}) harus sama dengan jumlah baris Matriks B (${rB}).`);
             return null;
        }
        if (rA === 0 || cB === 0) return { matrix: createEmptyMatrix(rA, cB), details: "Menghasilkan matriks kosong." };
        if (cA === 0) return { matrix: createEmptyMatrix(rA, cB), details: "Dimensi persekutuan adalah nol, hasil adalah matriks nol." };

        const res=createEmptyMatrix(rA,cB);
        for(let i=0;i<rA;i++){
            for(let j=0;j<cB;j++){
                for(let k=0;k<cA;k++){ // k adalah dimensi persekutuan
                    res[i][j]+=(matrixA[i]?.[k]||0)*(matrixB[k]?.[j]||0);
                }
            }
        }
        let details=`Mengalikan A (${rA}x${cA}) dengan B (${rB}x${cB}) menghasilkan C (${rA}x${cB})\nC[i][j] = Σ (A[i][k]*B[k][j])\n`;
         // Tambahkan contoh perhitungan untuk elemen pertama jika matriks tidak kosong
         if(rA>0 && cB>0 && cA>0 && res[0] !== undefined && res[0][0] !== undefined){
             details+=`Contoh C[0][0]: `;
             for(let k=0;k<cA;k++){
                 details+=`${formatNumber(matrixA[0][k])}*${formatNumber(matrixB[k][0])}${k<cA-1?" + ":""}`;
             }
             details+=` = ${formatNumber(res[0][0])}`;
         }
        return { matrix: res, details: details }; // Kembalikan objek untuk operasi biner
    }

    function power(matrix, exponent) {
        if (!matrix) { showError("Matriks tidak ditemukan untuk perhitungan pangkat."); return null; }
        const r=matrix.length,c=matrix[0]?.length||0;
        if (r === 0 || c === 0) { showError("Tidak dapat menghitung pangkat dari matriks kosong."); return null; }
        if (r !== c) { showError("Matriks harus persegi untuk perhitungan pangkat."); return null; }
        if (typeof exponent !== 'number' || !Number.isInteger(exponent) || exponent < 0) {
             showError("Eksponen harus bilangan bulat non-negatif untuk pangkat matriks.");
             return null;
        }

        if (exponent === 0) { // Pangkat 0 menghasilkan matriks identitas
            const id=createEmptyMatrix(r,r);
            for(let i=0;i<r;i++)id[i][i]=1;
            return id;
        }
        if (exponent === 1) return cloneMatrix(matrix); // Pangkat 1 adalah matriks itu sendiri

        let res=cloneMatrix(matrix);
        // Gunakan fungsi multiplyMatrices untuk menghitung pangkat
        for(let i=2; i<=exponent; i++){
            const mulRes=multiplyMatrices(res, matrix);
            if (!mulRes || !mulRes.matrix) { // Jika perkalian gagal
                showError("Kesalahan saat perkalian matriks untuk pangkat.");
                return null;
            }
            res = mulRes.matrix;
        }
        return res; // Kembalikan matriks hasil
    }

    // Fungsi Apakah Diagonal (dibiarkan, meski tombolnya dihapus dari UI utama)
    function isDiagonal(matrix) {
        if(!matrix){showError("Matriks tidak ditemukan untuk pengecekan diagonal.");return false;}
        const r=matrix.length;
        if(r===0)return true; // Matriks kosong dianggap diagonal
        const c=matrix[0]?.length||0;
        const methods = [];
        let isDiag = true;
        const tol=1e-10; // Toleransi untuk angka mendekati nol
        let details = "<strong>Pengecekan Matriks Diagonal.</strong>\n";

        if(r !== c) { // Matriks diagonal harus persegi
             isDiag = false;
             details += `Matriks berukuran ${r}x${c}. Matriks diagonal harus persegi.\nHasil: Bukan Diagonal`;
        } else {
            details += `Memeriksa apakah semua elemen non-diagonal adalah nol (dalam toleransi ${formatNumber(tol)}).\n`;
            for(let i=0;i<r;i++){
                for(let j=0;j<c;j++){
                    if(i!==j && Math.abs(matrix[i]?.[j]||0)>tol){ // Jika elemen non-diagonal tidak nol
                        isDiag = false;
                        details += `Elemen pada (${i+1}, ${j+1}) adalah ${formatNumber(matrix[i]?.[j]||0)}, yang bukan nol.\n`;
                    }
                }
            }
             details += `\nHasil: ${isDiag ? 'Adalah Diagonal' : 'Bukan Diagonal'}`;
        }
        methods.push({name:"Proses Pengecekan", details: details});
        return {operationType:'isDiagonal', mainResult:isDiag, inputMatrix:cloneMatrix(matrix), methods:methods}; // Kembalikan boolean dibungkus dalam objek
    }

    // --- Helper Perhitungan Detail (untuk tampilan langkah-langkah) ---
    function calculateSarrusDetails(matrix) {
        const a=matrix[0][0],b=matrix[0][1],c=matrix[0][2];
        const d=matrix[1][0],e=matrix[1][1],f=matrix[1][2];
        const g=matrix[2][0],h=matrix[2][1],i=matrix[2][2];
        const t1=a*e*i,t2=b*f*g,t3=c*d*h; // Suku positif
        const t4=c*e*g,t5=a*f*h,t6=b*d*i; // Suku negatif
        const det=t1+t2+t3-t4-t5-t6;
        return `<strong>Aturan Sarrus (3x3):</strong>\nPerluasan:\n| ${formatNumber(a)} ${formatNumber(b)} ${formatNumber(c)} | ${formatNumber(a)} ${formatNumber(b)}\n| ${formatNumber(d)} ${formatNumber(e)} ${formatNumber(f)} | ${formatNumber(d)} ${formatNumber(e)}\n| ${formatNumber(g)} ${formatNumber(h)} ${formatNumber(i)} | ${formatNumber(g)} ${formatNumber(h)}\n\nSuku positif: (${formatNumber(a)}*${formatNumber(e)}*${formatNumber(i)}) + (${formatNumber(b)}*${formatNumber(f)}*${formatNumber(g)}) + (${formatNumber(c)}*${formatNumber(d)}*${formatNumber(h)}) = ${formatNumber(t1)} + ${formatNumber(t2)} + ${formatNumber(t3)} = ${formatNumber(t1+t2+t3)}\nSuku negatif: (${formatNumber(c)}*${formatNumber(e)}*${formatNumber(g)}) + (${formatNumber(a)}*${formatNumber(f)}*${formatNumber(h)}) + (${formatNumber(b)}*${formatNumber(d)}*${formatNumber(i)}) = ${formatNumber(t4)} + ${formatNumber(t5)} + ${formatNumber(t6)} = ${formatNumber(t4+t5+t6)}\n\nDeterminan = (${formatNumber(t1+t2+t3)}) - (${formatNumber(t4+t5+t6)}) = ${formatNumber(det)}`;
    }

    function calculateTriangleDetails(matrix) {
        const a=matrix[0][0],b=matrix[0][1],c=matrix[0][2];
        const d=matrix[1][0],e=matrix[1][1],f=matrix[1][2];
        const g=matrix[2][0],h=matrix[2][1],i=matrix[2][2];
        const t1=a*e*i,t2=b*f*g,t3=c*d*h;
        const t4=c*e*g,t5=a*f*h,t6=b*d*i;
        const det=t1+t2+t3-t4-t5-t6;
        return `<strong>Aturan Segitiga (3x3):</strong>\nDiagonal positif (+):\n Utama: ${formatNumber(a)}*${formatNumber(e)}*${formatNumber(i)} = ${formatNumber(t1)}\n Segitiga 1: ${formatNumber(b)}*${formatNumber(f)}*${formatNumber(g)} = ${formatNumber(t2)}\n Segitiga 2: ${formatNumber(c)}*${formatNumber(d)}*${formatNumber(h)} = ${formatNumber(t3)}\n Jumlah(+) = ${formatNumber(t1+t2+t3)}\n\nDiagonal negatif (-):\n Anti-utama: ${formatNumber(c)}*${formatNumber(e)}*${formatNumber(g)} = ${formatNumber(t4)}\n Segitiga 3: ${formatNumber(a)}*${formatNumber(f)}*${formatNumber(h)} = ${formatNumber(t5)}\n Segitiga 4: ${formatNumber(b)}*${formatNumber(d)}*${formatNumber(i)} = ${formatNumber(t6)}\n Jumlah(-) = ${formatNumber(t4+t5+t6)}\n\nDeterminan = Jumlah(+) - Jumlah(-) = ${formatNumber(det)}`;
    }

    function calculateDeterminantUsingCofactorDetails(matrix, expansionRow = 0) {
        const n = matrix.length;
        if (n === 0) return "Determinan matriks 0x0 = 1.";
        if (n === 1) return `Determinan(${formatNumber(matrix[0][0])}) = ${formatNumber(matrix[0][0])}`;

        let detStr = `<strong>Ekspansi Kofaktor sepanjang baris ${expansionRow + 1}:</strong>\ndet(A) = Σ<sub>j=1 hingga ${n}</sub> (-1)<sup>${expansionRow + 1}+j</sup> * A<sub>${expansionRow + 1},j</sub> * M<sub>${expansionRow + 1},j</sub>\n\n`;
        let detVal = 0;

        for (let j = 0; j < n; j++) {
            const Aij = matrix[expansionRow][j];
            const sign = ((expansionRow + j) % 2 === 0) ? 1 : -1; // Tanda kofaktor
            const minorMatrix = submatrix(matrix, expansionRow, j);
            const minorDetObj = determinant(minorMatrix); // Hitung determinan dari minor
            const minorDetVal = minorDetObj ? minorDetObj.mainResult : NaN; // Ambil hasil skalar

            const term = sign * Aij * minorDetVal;
            detVal += term;

            detStr += `Suku j=${j + 1}: A<sub>${expansionRow + 1},${j + 1}</sub> = ${formatNumber(Aij)}\n`;
            detStr += `Minor M<sub>${expansionRow + 1},${j + 1}</sub> = det(\n${formatMatrixSimple(minorMatrix)}\n) = ${formatNumber(minorDetVal)}\n`;
            detStr += `Kofaktor C<sub>${expansionRow + 1},${j + 1}</sub> = (-1)<sup>${expansionRow + 1}+${j + 1}</sup> * M<sub>...</sub> = ${formatNumber(sign * minorDetVal)}\n`;
            detStr += `Suku = A<sub>...</sub> * C<sub>...</sub> = ${formatNumber(Aij)} * ${formatNumber(sign * minorDetVal)} = ${formatNumber(term)}\n\n`;
        }
        detStr += `<strong>Total Determinan = ${formatNumber(detVal)}</strong>`;
        return detStr;
    }

    function calculateInverseUsingAdjugateDetails(matrix, det, inverseMatrix) {
        const n = matrix.length;
        let detailsStr = `<strong>A<sup>-1</sup> = (1/detA) * adjA</strong>\ndetA = ${formatNumber(det)}\n\n`;
        detailsStr += `<strong>1. Hitung Matriks Kofaktor (C):</strong>\n`;
        const cofactorM = createEmptyMatrix(n, n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const cof = cofactor(matrix, i, j);
                if (isNaN(cof)) {
                     detailsStr += `Kesalahan menghitung kofaktor C<sub>${i+1},${j+1}</sub>\n`;
                     cofactorM[i][j] = NaN; // Tandai kesalahan
                     continue;
                }
                cofactorM[i][j] = cof;
                 detailsStr += ` C<sub>${i+1},${j+1}</sub> = ${formatNumber(cofactorM[i][j])}\n`; 
            }
        }
        detailsStr += `\nMatriks Kofaktor C:\n${formatMatrixSimple(cofactorM)}\n`;
        detailsStr += `<strong>2. Hitung Matriks Adjoin (adjA) = C<sup>T</sup>:</strong>\n`;
        const adjugateMObj = transpose(cofactorM); // transpose mengembalikan objek
        const adjugateM = adjugateMObj ? adjugateMObj.mainResult : null;

        if (!adjugateM) {
            detailsStr += "Kesalahan membuat matriks Adjoin.\n";
            return detailsStr;
        }
        detailsStr += `${formatMatrixSimple(adjugateM)}\n`;
        detailsStr += `<strong>3. Hitung Matriks Invers A<sup>-1</sup> = (1/detA) * adjA:</strong>\n`;
        detailsStr += `${formatMatrixSimple(inverseMatrix)}\n`; // Tampilkan matriks invers final
        return detailsStr;
    }
    
    // calculateInverseUsingGaussJordanDetails dengan format yang diperbaiki
    function calculateInverseUsingGaussJordanDetails(matrix) {
        const n = matrix.length;
        let steps = []; 
    
        if (n === 0) {
            steps.push("<strong>Invers menggunakan Eliminasi Gauss-Jordan</strong>\nTidak dapat menginvers matriks kosong.");
            const emptyAugmented = formatAugmentedMatrixSimple([], []); 
            return `<strong>Eliminasi Gauss-Jordan:</strong>\nTidak dapat menginvers matriks kosong.\nKeadaan Awal:\n${emptyAugmented}\n<details><summary>Langkah-langkah</summary><pre>${steps.join('\n')}</pre></details>\nMatriks Invers A<sup>-1</sup>:\n[]\n`;
        }
    
        let A = matrix.map(row => [...row]); // Kloning matriks input
        let I = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((_, j) => i === j ? 1 : 0)); // Buat matriks identitas
        const tol = 1e-9; 
        let stepCounter = 0; 
    
        steps.push(`<strong>Invers menggunakan Eliminasi Gauss-Jordan</strong>\nTujuan: Transformasi matriks augmented [A|I] menjadi [I|A<sup>-1</sup>]\n`);
        stepCounter++;
        steps.push(`Langkah ${stepCounter}: Matriks Augmented Awal [A | I]\n${formatAugmentedMatrixSimple(A, I)}`);
    
        for (let col = 0; col < n; col++) { // Iterasi per kolom (untuk pivot)
            // Cari baris dengan pivot terbesar (untuk stabilitas numerik)
            let maxRow = col;
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) {
                    maxRow = row;
                }
            }
    
            // Periksa matriks singular
            if (Math.abs(A[maxRow][col]) < tol) {
                stepCounter++;
                steps.push(`Langkah ${stepCounter}: Elemen pivot A[${maxRow+1}][${col+1}] mendekati nol (${formatNumber(A[maxRow][col])}). Matriks singular.`);
                steps.push(`Matriks saat ini:\n${formatAugmentedMatrixSimple(A, I)}`);
                return `<strong>Eliminasi Gauss-Jordan:</strong>\nMatriks singular (tidak dapat diinvers)\n<details><summary>Langkah-langkah hingga singularitas</summary><pre>${steps.join('\n')}</pre></details>`;
            }
    
            // Tukar baris jika perlu untuk mendapatkan pivot ke baris saat ini
            if (maxRow !== col) {
                [A[col], A[maxRow]] = [A[maxRow], A[col]];
                [I[col], I[maxRow]] = [I[maxRow], I[col]];
                stepCounter++;
                steps.push(`Langkah ${stepCounter}: Tukar baris ${col+1} dan ${maxRow+1}`);
                steps.push(`Matriks saat ini:\n${formatAugmentedMatrixSimple(A, I)}`);
            }
    
            // Normalisasi baris pivot (jadikan elemen pivot = 1)
            const pivotValue = A[col][col];
            // Hindari pembagian dengan nol atau pivot yang sangat kecil jika matriks tidak kosong
            if (Math.abs(pivotValue) < tol && n > 0) { 
                 stepCounter++;
                 steps.push(`Langkah ${stepCounter}: Matriks singular (pivot di baris ${col+1}, kolom ${col+1} terlalu kecil)`);
                 steps.push(`Matriks saat ini:\n${formatAugmentedMatrixSimple(A, I)}`);
                 return `<strong>Eliminasi Gauss-Jordan:</strong>\nMatriks singular (pivot di baris ${col+1}, kolom ${col+1} terlalu kecil)\n<details><summary>Langkah-langkah hingga singularitas</summary><pre>${steps.join('\n')}</pre></details>`;
            }
            // Hanya normalisasi jika pivot belum 1 (dalam toleransi)
            if (Math.abs(pivotValue - 1) > tol) { 
                stepCounter++;
                steps.push(`Langkah ${stepCounter}: Normalisasi baris ${col+1} dengan pivot ${formatNumber(pivotValue)}`);
                for (let j = col; j < n; j++) { // Mulai dari kolom pivot untuk A
                    A[col][j] /= pivotValue;
                }
                for (let j = 0; j < n; j++) { // Iterasi semua kolom I
                    I[col][j] /= pivotValue;
                }
                steps.push(`Matriks saat ini:\n${formatAugmentedMatrixSimple(A, I)}`);
            }
    
            // Eliminasi baris lain (buat elemen di kolom pivot saat ini menjadi nol)
            for (let row = 0; row < n; row++) {
                if (row !== col && Math.abs(A[row][col]) > tol) { // Hanya eliminasi jika elemen belum nol
                    const factor = A[row][col];
                    stepCounter++;
                    steps.push(`Langkah ${stepCounter}: Eliminasi baris ${row+1} menggunakan baris ${col+1} dengan faktor ${formatNumber(factor)}`);
                    for (let col2 = col; col2 < n; col2++) { // Mulai dari col2 = col untuk A
                        A[row][col2] -= factor * A[col][col2];
                         // Terapkan pembulatan kecil untuk mencegah akumulasi kesalahan floating point
                         if (typeof A[row][col2] === 'number' && Math.abs(A[row][col2]) < tol) A[row][col2] = 0;
                    }
                    for (let j = 0; j < n; j++) { // Iterasi semua kolom I
                        I[row][j] -= factor * I[col][j];
                         // Terapkan pembulatan kecil
                        if (typeof I[row][j] === 'number' && Math.abs(I[row][j]) < tol) I[row][j] = 0;
                    }
                    steps.push(`Matriks saat ini:\n${formatAugmentedMatrixSimple(A, I)}`);
                }
            }
        }
        // Setelah loop, A seharusnya mendekati Identitas, I seharusnya menjadi invers
        return `<strong>Eliminasi Gauss-Jordan:</strong>\nTransformasi selesai. Matriks invers adalah sisi kanan:\n<details><summary>Langkah-langkah</summary><pre>\n${steps.join('\n')}\n</pre></details>\nMatriks Invers A<sup>-1</sup>:\n${formatMatrixSimple(I)}\n`;
    }

function calculateInverseUsingMontanteDetails(matrixInitial) {
    const n = matrixInitial.length;
    let steps = [];

    if (n === 0) {
        steps.push("<strong>Invers menggunakan Metode Montante (Bareiss)</strong>");
        steps.push("Matriks kosong tidak memiliki invers.");
        return { error: true, steps: steps.join('<br>') };
    }
    if (n !== matrixInitial[0]?.length) {
        steps.push("<strong>Invers menggunakan Metode Montante (Bareiss)</strong>");
        steps.push("Matriks harus persegi untuk diinvers.");
        return { error: true, steps: steps.join('<br>') };
    }

    // Buat matriks augmented [A | I]
    let M = matrixInitial.map((row, i) => [
        ...row.map(val => Number(val)),
        ...Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))
    ]);
    steps.push(`<strong>Invers Matriks menggunakan Algoritma Montante (Bareiss)</strong>`);
    steps.push(`Langkah 0: Matriks Diperluas Awal [A | I]:\n${formatAugmentedMatrixSimple(M.map(r => r.slice(0, n)), M.map(r => r.slice(n)))}`);

    let p_prev = 1;
    let det_sign = 1;

    for (let k = 0; k < n; k++) {
        // Pivot harus tidak nol, jika nol cari baris lain untuk swap
        if (Math.abs(M[k][k]) < 1e-12) {
            let swapRow = -1;
            for (let r = k + 1; r < n; r++) {
                if (Math.abs(M[r][k]) > 1e-12) {
                    swapRow = r;
                    break;
                }
            }
            if (swapRow !== -1) {
                [M[k], M[swapRow]] = [M[swapRow], M[k]];
                det_sign *= -1;
                steps.push(`<hr>Iterasi ${k + 1}: Pivot A[${k + 1},${k + 1}] nol. Tukar baris ${k + 1} dengan baris ${swapRow + 1}.`);
                steps.push(`Matriks setelah pertukaran baris:\n${formatAugmentedMatrixSimple(M.map(r => r.slice(0, n)), M.map(r => r.slice(n)))}`);
            } else {
                steps.push(`<span class="error-message">Kesalahan: Tidak dapat tukar baris. Matriks singular.</span>`);
                return { error: true, steps: steps.join('<br>') };
            }
        }

        let p_cur = M[k][k];
        steps.push(`<hr>Langkah ${k + 1}: Eliminasi dengan pivot A[${k + 1},${k + 1}] = ${formatNumber(p_cur)} (pivot sebelumnya = ${formatNumber(p_prev)})`);
        let M_next = M.map(row => [...row]);

        for (let i = 0; i < n; i++) {
            if (i === k) continue;
            for (let j = 0; j < 2 * n; j++) {
                if (j === k) continue;
                const numerator = (M[i][j] * p_cur) - (M[i][k] * M[k][j]);
                if (Math.abs(p_prev) < 1e-12) {
                    steps.push(`<span class="error-message">Kesalahan: Pembagian dengan pivot sebelumnya nol!</span>`);
                    return { error: true, steps: steps.join('<br>') };
                }
                let newValue = numerator / p_prev;
                M_next[i][j] = Math.abs(newValue) < 1e-12 ? 0 : newValue;
            }
        }

        // Set kolom k selain baris k ke 0, dan baris k selain kolom k tetap
        for (let i = 0; i < n; i++) {
            if (i !== k) M_next[i][k] = 0;
        }
        for (let j = 0; j < 2 * n; j++) {
            if (j !== k) M_next[k][j] = M[k][j];
        }

        M = M_next;
        steps.push(`Matriks setelah iterasi ke-${k + 1}:\n${formatAugmentedMatrixSimple(M.map(r => r.slice(0, n)), M.map(r => r.slice(n)))}`);
        p_prev = p_cur;
    }

    // Cek determinan
    let detA = p_prev * det_sign;
    steps.push(`<hr><strong>Langkah Final: Normalisasi Diagonal</strong>`);
    steps.push(`Determinan A = ${formatNumber(detA)}.`);

    if (Math.abs(detA) < 1e-12) {
        steps.push(`<span class="error-message">Determinan nol (${formatNumber(detA)}). Matriks tidak memiliki invers.</span>`);
        return { error: true, steps: steps.join('<br>') };
    }

    // Normalisasi: bagi bagian kanan dengan determinan
    let A_inverse = createEmptyMatrix(n, n);
    let M_final = M.map(r => [...r]);
    steps.push(`Normalisasi: Bagi elemen augmented dengan ${formatNumber(detA)} untuk ubah kiri jadi identitas.`);
    for (let i = 0; i < n; i++) {
        for (let j = n; j < 2 * n; j++) {
            M_final[i][j] = M[i][j] / detA;
            if (Math.abs(M_final[i][j]) < 1e-12) M_final[i][j] = 0;
            A_inverse[i][j - n] = M_final[i][j];
        }
    }

    steps.push(`Matriks setelah normalisasi [I | A<sup>-1</sup>]:\n${formatAugmentedMatrixSimple(M_final.map(r => r.slice(0, n)), M_final.map(r => r.slice(n)))}`);
    steps.push(`Matriks Invers Akhir A<sup>-1</sup>:\n${formatMatrixSimple(A_inverse)}`);

    return { mainResult: A_inverse, steps: steps.join('<br>') };
}

    function calculateDeterminantUsingMontanteDetails(matrix) {
        const n = matrix.length;
        if (n === 0) return "Determinan matriks 0x0 = 1.";
        if (n !== matrix[0]?.length) { // Periksa apakah persegi
            return "Metode Montante memerlukan matriks persegi.";
        }
        let A = matrix.map(row => [...row]); // Kloning matriks
        let steps = [];
        let previous_pivot = 1; // Pivot dari iterasi utama sebelumnya (k)
        let detSign = 1; // Untuk melacak perubahan tanda determinan akibat pertukaran baris
        const tol = 1e-9; 

        steps.push(`<strong>Determinan menggunakan Metode Montante (Bareiss)</strong>\n`);
        steps.push(`Langkah 0: Matriks Awal\n${formatMatrixSimple(A)}`);
        steps.push(`Pivot sebelumnya (untuk iterasi pertama) = ${formatNumber(previous_pivot)}`);

        for (let k = 0; k < n - 1; k++) { // Iterasi utama
            let current_pivot = A[k][k];

            // Cari pivot (A[k][k]) - jika nol, tukar dengan baris di bawahnya
            if (Math.abs(current_pivot) < tol) {
                let nonZeroRow = -1;
                for (let i = k + 1; i < n; i++) {
                    if (Math.abs(A[i][k]) > tol) {
                        nonZeroRow = i;
                        break;
                    }
                }
                if (nonZeroRow === -1) { // Jika semua di bawah pivot juga nol
                     steps.push(`Langkah ${k+1}: Elemen pivot A[${k+1}][${k+1}] (${formatNumber(A[k][k])}) dan semua elemen di bawahnya pada kolom ${k+1} adalah nol.`);
                    return `<strong>Metode Montante:</strong>\nMatriks singular (determinan = 0)\n<details><summary>Langkah-langkah hingga singularitas</summary><pre>${steps.join('\n')}</pre></details>`;
                }
                // Tukar baris
                [A[k], A[nonZeroRow]] = [A[nonZeroRow], A[k]];
                detSign *= -1; // Pertukaran baris mengubah tanda determinan
                steps.push(`Langkah ${k+1}: Elemen pivot A[${k+1}][${k+1}] adalah 0. Tukar baris ${k+1} dan ${nonZeroRow+1}. Determinan dikalikan -1.`);
                 steps.push(`Matriks setelah pertukaran baris:\n${formatMatrixSimple(A)}`);
                 current_pivot = A[k][k]; // Perbarui pivot saat ini setelah pertukaran
            }

             steps.push(`Langkah ${k+1}: Menggunakan pivot ${formatNumber(current_pivot)} di A[${k+1}][${k+1}]. Pivot sebelumnya = ${formatNumber(previous_pivot)}.`);

            // Terapkan rumus Montante untuk elemen di baris > k dan kolom > k
            for (let i = k + 1; i < n; i++) {
                 for (let j = k + 1; j < n; j++) {
                     // Rumus: A[i][j] = (A[i][j] * A[k][k] - A[i][k] * A[k][j]) / previous_pivot
                     const term1 = (A[i][j] || 0) * (current_pivot || 0);
                     const term2 = (A[i][k] || 0) * (A[k][j] || 0);
                     // Hindari pembagian dengan nol atau pivot sebelumnya yang sangat kecil
                     const newValue = (Math.abs(previous_pivot) < tol && (term1 - term2) !== 0) ?
                                    'Tidak Terdefinisi/Kesalahan' : // Tunjukkan masalah jika membagi dengan nol dekat
                                    (term1 - term2) / (previous_pivot || 1); // Bagi dengan 1 jika previous_pivot tepat 0

                     steps.push(`  Transformasi A[${i+1}][${j+1}]: ( ${formatNumber(A[i][j]||0)} * ${formatNumber(current_pivot||0)} - ${formatNumber(A[i][k]||0)} * ${formatNumber(A[k][j]||0)} ) / ${formatNumber(previous_pivot||1)} = (${formatNumber(term1)} - ${formatNumber(term2)}) / ${formatNumber(previous_pivot||1)} = ${formatNumber(newValue)}`);
                     A[i][j] = newValue;
                     // Terapkan pembulatan kecil
                     if (typeof A[i][j] === 'number' && Math.abs(A[i][j]) < tol) A[i][j] = 0;
                 }
                 // Setelah mentransformasi baris i, atur elemen di kolom pivot menjadi nol
                 if (Math.abs(A[i][k]) > tol) { // Hanya jika belum nol
                     steps.push(`  Mengatur A[${i+1}][${k+1}] menjadi 0.`);
                     A[i][k] = 0;
                 }
             }
              steps.push(`Matriks setelah Langkah ${k+1}:\n${formatMatrixSimple(A)}`);
            // Perbarui pivot sebelumnya untuk iterasi berikutnya
            previous_pivot = current_pivot;
        }

        // Determinan adalah elemen terakhir A[n-1][n-1] dikalikan dengan tanda determinan
        let det = detSign * (A[n-1][n-1] || 0);
         // Terapkan pembulatan kecil pada determinan final
         if (typeof det === 'number' && Math.abs(det) < tol) det = 0;
        return `<strong>Metode Montante (Bareiss):</strong>\n<details><summary>Langkah-langkah</summary><pre>\n${steps.join('\n')}\n</pre></details>\nDeterminan = ${formatNumber(detSign)} × ${formatNumber(A[n-1][n-1] || 0)} = ${formatNumber(det)}\n`;
    }

    function calculateDeterminantUsingGaussianDetails(matrix) {
        const n = matrix.length;
        if (n === 0) return "Determinan matriks 0x0 = 1.";
         if (n !== matrix[0]?.length) { // Periksa apakah persegi
            return "Eliminasi Gaussian untuk Determinan memerlukan matriks persegi.";
        }
        let A = matrix.map(row => [...row]); // Kloning matriks
        let steps = [];
        let detSign = 1; // Melacak perubahan tanda determinan akibat pertukaran baris
        const tol = 1e-9; 

        steps.push(`<strong>Determinan menggunakan Eliminasi Gaussian</strong>\nTujuan: Transformasi matriks menjadi bentuk segitiga atas. Determinan adalah hasil kali elemen diagonal, disesuaikan dengan pertukaran baris.\n`);
        steps.push(`Langkah 0: Matriks Awal\n${formatMatrixSimple(A)}`);

        for (let col = 0; col < n; col++) { // Iterasi per kolom
            // Cari baris pivot (untuk stabilitas numerik)
            let maxRow = col;
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) {
                    maxRow = row;
                }
            }

            // Jika pivot adalah nol, determinan adalah nol.
            if (Math.abs(A[maxRow][col]) < tol) {
                 steps.push(`Langkah ${col+1}: Elemen pivot A[${maxRow+1}][${col+1}] mendekati nol (${formatNumber(A[maxRow][col])}). Matriks singular.`);
                let det = 0; // Determinan adalah 0
                 return `<strong>Eliminasi Gaussian:</strong>\nMatriks singular (determinan = 0)\n<details><summary>Langkah-langkah hingga singularitas</summary><pre>\n${steps.join('\n')}\n</pre></details>\nDeterminan = ${formatNumber(det)}\n`;
            }

            // Tukar baris jika pivot tidak berada di baris saat ini
            if (maxRow !== col) {
                [A[col], A[maxRow]] = [A[maxRow], A[col]];
                detSign *= -1; // Pertukaran baris mengubah tanda determinan
                steps.push(`Langkah ${col+1}: Tukar baris ${col+1} dan ${maxRow+1} (determinan × -1)`);
                 steps.push(`Matriks saat ini:\n${formatMatrixSimple(A)}`);
            }

            // Eliminasi elemen di bawah pivot
            for (let row = col + 1; row < n; row++) {
                 if (Math.abs(A[row][col]) > tol) { // Hanya lakukan eliminasi jika elemen belum nol
                    const factor = A[row][col] / A[col][col];
                    steps.push(`Langkah ${col+1}: Hilangkan elemen di baris ${row+1}, kolom ${col+1} dengan faktor ${formatNumber(factor)}`);
                    for (let col2 = col; col2 < n; col2++) {
                        A[row][col2] -= factor * A[col][col2];
                         // Terapkan pembulatan kecil
                        if (typeof A[row][col2] === 'number' && Math.abs(A[row][col2]) < tol) A[row][col2] = 0;
                    }
                     steps.push(`Matriks saat ini:\n${formatMatrixSimple(A)}`);
                 }
            }
        }

        // Determinan adalah hasil kali elemen diagonal dikalikan dengan tanda determinan
        let det = detSign;
        for (let i = 0; i < n; i++) {
            det *= (A[i][i] || 0); // Gunakan 0 jika elemen diagonal hilang/null
        }
         // Terapkan pembulatan kecil pada determinan final
         if (typeof det === 'number' && Math.abs(det) < tol) det = 0;
        return `<strong>Eliminasi Gaussian:</strong>\nMatriks direduksi menjadi bentuk segitiga atas.\n<details><summary>Langkah-langkah</summary><pre>\n${steps.join('\n')}\n</pre></details>\nDeterminan = (${formatNumber(detSign)}) × (${A.map((row, i) => formatNumber(row ? (row[i] || 0) : 0)).join(' × ')}) = ${formatNumber(det)}\n`;
    }

    // --- Operasi Lebih Kompleks (Mengembalikan Objek) ---
    function submatrix(matrix, rowToRemove, colToRemove) {
        if (!matrix || matrix.length === 0) return [];
        const rows = matrix.length;
        const cols = matrix[0]?.length || 0;
         // Periksa apakah indeks valid
         if (rowToRemove < 0 || rowToRemove >= rows || colToRemove < 0 || colToRemove >= cols) {
             console.error(`Indeks tidak valid untuk submatriks: ${rowToRemove}, ${colToRemove}`);
             return []; // Kembalikan array kosong untuk indeks tidak valid
         }
        // Filter baris dan kolom yang tidak diinginkan
        return matrix.filter((_,i) => i !== rowToRemove).map(row => row.filter((_,j) => j !== colToRemove));
    }

    function cofactor(matrix, row, col) {
         // Tangani matriks/baris kosong atau tidak valid
         if (!matrix || matrix.length === 0 || !matrix[row] || matrix[row].length === 0) return NaN; 

        const sub = submatrix(matrix, row, col); // Dapatkan submatriks (minor)
        // Tangani kasus khusus jika submatriks menjadi kosong dari matriks 1x1
        if (sub.length === 0 && (matrix.length > 1 || (matrix[0]?.length || 0) > 1)) {
             if (matrix.length === 1 && (matrix[0]?.length || 0) === 1) { // Submatriks dari 1x1 adalah 0x0, determinannya 1
                  const sign = ((row + col) % 2 === 0) ? 1 : -1;
                 return sign * 1; 
             }
              console.error("Submatriks kosong secara tidak terduga untuk perhitungan kofaktor.");
             return NaN; // Tunjukkan kesalahan jika submatriks kosong untuk matriks asli non-1x1
        }

        const minorDetObj = determinant(sub); // Hitung determinan dari minor
        if (minorDetObj === null || minorDetObj.mainResult === undefined) { // Jika perhitungan determinan minor gagal
             console.error(`Tidak dapat menghitung determinan submatriks untuk kofaktor (${row}, ${col}).`);
             return NaN;
        }
        const minorDet = minorDetObj.mainResult; // Ambil nilai skalar determinan minor
        const sign = ((row + col) % 2 === 0) ? 1 : -1; // Tentukan tanda kofaktor (+/-)
        return sign * minorDet; // Kofaktor = tanda * determinan minor
    }

    function determinant(matrixData) {
        if (!matrixData) { showError("Matriks tidak ditemukan untuk determinan."); return null; }
        const rows = matrixData.length;
        const cols = matrixData[0]?.length || 0;

        if (rows !== cols) { // Determinan hanya untuk matriks persegi
             showError("Matriks harus persegi untuk menghitung determinan.");
             return null;
        }
        // Determinan matriks 0x0 didefinisikan sebagai 1
         if (rows === 0) return { operationType: 'determinant', mainResult: 1, inputMatrix: [], methods: [{name:"Info",details:"Determinan dari matriks kosong (0x0) didefinisikan sebagai 1."}]};

        const inputM = cloneMatrix(matrixData); // Kloning matriks input untuk menghindari modifikasi
        let detValue;
        const methods = []; // Array untuk menyimpan detail metode perhitungan

        // Utamakan Math.js untuk perhitungan inti jika tersedia
        if (window.math && typeof window.math.det === 'function') {
            try {
                const m = math.matrix(inputM); // Konversi ke format matriks Math.js
                detValue = math.det(m); // Hitung determinan menggunakan Math.js
                 methods.push({name:"Info", details: `Determinan dihitung menggunakan pustaka Math.js.`}); 
            } catch(e) { // Jika Math.js gagal, fallback ke metode manual
                console.warn("Determinan Math.js gagal, kembali ke metode manual.", e);
                 if (rows === 1) { // Matriks 1x1
                     detValue = matrixData[0][0];
                 } else if (rows === 2) { // Matriks 2x2
                     detValue = matrixData[0][0] * matrixData[1][1] - matrixData[0][1] * matrixData[1][0];
                 } else { // Matriks > 2x2, gunakan ekspansi kofaktor
                     detValue = 0;
                     for(let j=0; j<cols; j++){ // Ekspansi sepanjang baris pertama
                         const cof = cofactor(matrixData, 0, j);
                         if (isNaN(cof)) { 
                             showError(`Tidak dapat menghitung kofaktor untuk perhitungan determinan manual pada (0, ${j}).`);
                             return null;
                         }
                         detValue += (matrixData[0]?.[j] || 0) * cof;
                     }
                 }
                 methods.push({name:"Perhitungan Manual (Fallback)", details: `Determinan dihitung secara manual (misalnya, menggunakan ekspansi kofaktor untuk n>2). Digunakan sebagai fallback ketika Math.js gagal.`});
            }
        } else { // Jika Math.js tidak dimuat, gunakan metode manual
             if (rows === 1) {
                 detValue = matrixData[0][0];
             } else if (rows === 2) {
                 detValue = matrixData[0][0] * matrixData[1][1] - matrixData[0][1] * matrixData[1][0];
             } else {
                 detValue = 0;
                 for(let j=0; j<cols; j++){
                     const cof = cofactor(matrixData, 0, j);
                     if (isNaN(cof)) {
                         showError(`Tidak dapat menghitung kofaktor untuk perhitungan determinan manual pada (0, ${j}).`);
                         return null;
                     }
                     detValue += (matrixData[0]?.[j] || 0) * cof;
                 }
             }
              methods.push({name:"Perhitungan Manual", details: `Determinan dihitung secara manual (misalnya, menggunakan ekspansi kofaktor untuk n>2). Pustaka Math.js tidak tersedia atau det() tidak ditemukan.`});
        }

        // Tambahkan metode perhitungan detail untuk ditampilkan (kecuali detail spesifik Math.js yang difilter di displayResult)
        if (rows === 3) { // Untuk matriks 3x3, tambahkan Aturan Sarrus dan Segitiga
            methods.push({name:"Aturan Segitiga (3x3)",details:calculateTriangleDetails(inputM)});
            methods.push({name:"Aturan Sarrus (3x3)",details:calculateSarrusDetails(inputM)});
        }
        // Tambahkan detail ekspansi kofaktor jika bukan metode manual utama dan ukuran > 1
        const isCofactorPrimary = methods.some(m => m.name.includes("Perhitungan Manual") && m.details.includes("ekspansi kofaktor"));
        if (rows > 1 && !isCofactorPrimary) {
             methods.push({ name: "Ekspansi Kofaktor (Baris 1)", details: calculateDeterminantUsingCofactorDetails(inputM, 0) });
        }
         if (rows > 1) { // Untuk matriks > 1x1, tambahkan metode Montante dan Gaussian
            methods.push({name:"Metode Montante (Bareiss)",details:calculateDeterminantUsingMontanteDetails(inputM)});
            methods.push({name:"Eliminasi Gaussian",details:calculateDeterminantUsingGaussianDetails(inputM)});
         }

        // Terapkan pembulatan kecil pada nilai determinan final
        const tol = 1e-10;
        if (typeof detValue === 'number' && Math.abs(detValue) < tol) detValue = 0;
        return { operationType:'determinant', mainResult:detValue, inputMatrix:inputM, methods:methods };
    }

    function inverse(matrixData) {
        if (!matrixData) { showError("Matriks tidak ditemukan untuk invers."); return null; }
        const rows = matrixData.length;
        const cols = matrixData[0]?.length || 0;
        if(rows!==cols){showError("Matriks harus persegi untuk invers.");return null;} // Invers hanya untuk matriks persegi
        if (rows === 0) return {operationType:'inverse', mainResult:[], inputMatrix:[], methods:[{name:"Info",details:"Invers dari matriks kosong."}]}; // Invers matriks kosong

        const inputM = cloneMatrix(matrixData); 
        const detRes = determinant(inputM);
        if(detRes===null || detRes.mainResult === undefined){
             showError("Tidak bisa mendapatkan determinan untuk invers.");
             return null;
        }
        const det = detRes.mainResult; 
        const tol = 1e-10; 
        if(typeof det !== 'number' || Math.abs(det)<tol){
             showError(`Matriks singular (determinan ≈ ${formatNumber(det)}). Invers tidak ada.`);
             return null;
        }

        let invMtx; // Untuk menyimpan matriks invers
        const methods = []; // Array untuk detail metode

         // Utamakan Math.js jika tersedia
         if (window.math && typeof window.math.inv === 'function') {
             try {
                 const m = math.matrix(inputM); // Konversi ke format Math.js
                 invMtx = math.inv(m).toArray(); // Hitung invers menggunakan Math.js
                 methods.push({name:"Info", details: `Invers dihitung menggunakan pustaka Math.js.`}); 
             } catch(e) { // Jika Math.js gagal, fallback ke metode manual (Adjoin)
                 console.warn("Invers Math.js gagal, kembali ke metode manual.", e);
                  if (rows === 1) { // Matriks 1x1
                      invMtx = [[1 / matrixData[0][0]]];
                  } else { // Metode Adjoin untuk matriks > 1x1
                      const cofM = createEmptyMatrix(rows, rows);
                      let cofactorError = false;
                      for (let i = 0; i < rows; i++) {
                          for (let j = 0; j < rows; j++) {
                              const cof = cofactor(matrixData, i, j);
                              if (isNaN(cof)) {
                                  console.error(`Kesalahan kofaktor pada (${i},${j}) untuk perhitungan invers manual.`);
                                  cofM[i][j] = NaN; 
                                   cofactorError = true;
                              } else {
                                  cofM[i][j] = cof;
                              }
                          }
                      }
                       if (cofactorError) {
                           showError("Gagal menghitung semua kofaktor untuk fallback metode Adjoin.");
                           return null;
                       }
                      const adjM_obj = transpose(cofM);
                       if (!adjM_obj || !Array.isArray(adjM_obj.mainResult)) {
                           showError("Gagal mentranspos matriks kofaktor untuk fallback metode Adjoin.");
                           return null;
                       }
                      const adjM = adjM_obj.mainResult;
                      invMtx = multiplyScalar(adjM, 1 / det); // Invers = (1/det) * Adjoin
                  }
                  methods.push({name:"Perhitungan Manual (Fallback Metode Adjoin)", details: calculateInverseUsingAdjugateDetails(inputM, det, invMtx)});
             }
         } else { // Jika Math.js tidak tersedia, gunakan metode Adjoin
              if (rows === 1) {
                  invMtx = [[1 / matrixData[0][0]]];
              } else {
                   const cofM = createEmptyMatrix(rows, rows);
                   let cofactorError = false;
                   for (let i = 0; i < rows; i++) {
                       for (let j = 0; j < rows; j++) {
                           const cof = cofactor(matrixData, i, j);
                           if (isNaN(cof)) {
                               console.error(`Kesalahan kofaktor pada (${i},${j}) untuk perhitungan invers metode Adjoin.`);
                               cofM[i][j] = NaN;
                                cofactorError = true;
                           } else {
                               cofM[i][j] = cof;
                           }
                       }
                   }
                    if (cofactorError) {
                        showError("Gagal menghitung semua kofaktor untuk metode Adjoin.");
                        return null;
                    }
                   const adjM_obj = transpose(cofM);
                    if (!adjM_obj || !Array.isArray(adjM_obj.mainResult)) {
                        showError("Gagal mentranspos matriks kofaktor untuk metode Adjoin.");
                        return null;
                    }
                   const adjM = adjM_obj.mainResult;
                   invMtx = multiplyScalar(adjM, 1 / det);
               }
              methods.push({name:"Perhitungan Manual (Metode Adjoin)", details: calculateInverseUsingAdjugateDetails(inputM, det, invMtx)});
         }

        if(!invMtx){ // Jika invers masih gagal dihitung
            showError("Gagal menghitung matriks invers.");
            return null;
        }

         // Terapkan pembulatan kecil pada elemen matriks invers
         invMtx = invMtx.map(row => row.map(val => {
              if (typeof val === 'number' && Math.abs(val) < tol) return 0;
              return val;
         }));

        // Tambahkan detail metode perhitungan lain
        const isMathJsInvPrimary = window.math && typeof window.math.inv === 'function' && methods.some(m => m.name && m.name.includes("Info") && m.details.includes("pustaka Math.js"));
        // Hanya tambahkan detail Adjoin jika Math.js adalah metode utama (untuk perbandingan)
        if (isMathJsInvPrimary) {
             const cofM_detail = createEmptyMatrix(rows, rows);
             for (let i = 0; i < rows; i++) {
                 for (let j = 0; j < rows; j++) {
                      const cof_detail = cofactor(inputM, i, j); 
                      cofM_detail[i][j] = isNaN(cof_detail) ? 'Kesalahan' : cof_detail;
                 }
             }
             const adjM_obj_detail = transpose(cofM_detail);
             if (adjM_obj_detail && adjM_obj_detail.mainResult) { // Hanya tambahkan jika adjoin bisa dibentuk
                  methods.push({name:"Detail Metode Matriks Adjoin",details:calculateInverseUsingAdjugateDetails(inputM, det, invMtx)}); 
             }
        }
        methods.push({name:"Detail Eliminasi Gauss-Jordan",details:calculateInverseUsingGaussJordanDetails(inputM)});
        const montanteResult = calculateInverseUsingMontanteDetails(inputM);
if (montanteResult && montanteResult.mainResult) {
    // Jadikan hasil utama dari Montante
    invMtx = montanteResult.mainResult;
    methods.push({name:"Metode Montante (Bareiss)", details: montanteResult.steps});
} else {
    // Jika gagal, tampilkan error Montante di detail
    methods.push({name:"Metode Montante (Bareiss)", details: (montanteResult && montanteResult.steps) ? montanteResult.steps : "Gagal menghitung invers dengan Montante."});
} // Placeholder
        return {operationType:'inverse',mainResult:invMtx,inputMatrix:inputM,methods:methods};
    }

    // --- RREF, Peringkat, Dekomposisi LU & Cholesky (dijaga tapi tombolnya tidak aktif di UI utama) ---
    function rowEchelonForm(matrixData) { // Bentuk Eselon Baris Tereduksi
        if (!matrixData || matrixData.length === 0) return { operationType: 'rref', mainResult: [], inputMatrix: matrixData || [], methods: [{name:"Info", details:"RREF dari matriks kosong adalah kosong."}]};
        // Membutuhkan Math.js
        if (!window.math || typeof window.math.rref !== 'function') {
            return { operationType: 'rref', mainResult: null, inputMatrix: cloneMatrix(matrixData), methods: [{name:"Perhitungan Gagal", details: "Perhitungan RREF memerlukan pustaka Math.js (math.rref tidak ditemukan atau Math.js tidak dimuat)."}], error: "Math.js tidak dimuat atau rref() tidak ditemukan. Tidak dapat menghitung RREF." };
        }
        try {
            const m = math.matrix(matrixData);
            const rrefRes = math.rref(m); // Math.js rref bisa mengembalikan array [RREF_matrix, pivot_columns]
            const resM = (Array.isArray(rrefRes)?rrefRes[0]:rrefRes).toArray(); // Ambil matriks RREF
            let pivInfo = "";
            if(Array.isArray(rrefRes) && rrefRes[1]) pivInfo =`\nPivot (kolom diindeks dari 1): ${rrefRes[1].map(p=>p+1).join(', ')}`;
            let dets = `<strong>Bentuk Eselon Baris Tereduksi (RREF) melalui Eliminasi Gaussian / Gauss-Jordan.</strong>\nMentransformasi matriks menjadi Bentuk Eselon Baris Tereduksi menggunakan serangkaian operasi baris.\n(Detail operasi baris elementer ditangani secara internal oleh pustaka Math.js.)${pivInfo}\n\nHasil Matriks RREF:\n${formatMatrixSimple(resM)}`;
            return {operationType:'rref', mainResult:resM, inputMatrix:cloneMatrix(matrixData), methods:[{name:"Proses Perhitungan RREF",details:dets}]}; 
        } catch(e) {
            console.error("RREF Math.js gagal:",e);
             return { operationType: 'rref', mainResult: null, inputMatrix: cloneMatrix(matrixData), methods: [{name:"Perhitungan RREF Gagal", details: "Kesalahan RREF (Math.js): " + e.message + "\nTidak dapat menghitung RREF menggunakan Math.js."}], error: "Kesalahan RREF (Math.js): " + e.message };
        }
    }

    function rank(matrixData) { // Peringkat matriks
        if (!matrixData || matrixData.length === 0) return { operationType: 'rank', mainResult: 0, inputMatrix: matrixData || [], methods: [{name:"Info", details:"Peringkat dari matriks kosong adalah 0."}]};
         // Membutuhkan Math.js
         if (!window.math || typeof window.math.rank !== 'function') {
             return { operationType: 'rank', mainResult: null, inputMatrix: cloneMatrix(matrixData), methods: [{name:"Perhitungan Gagal", details: "Perhitungan peringkat memerlukan pustaka Math.js (math.rank tidak ditemukan atau Math.js tidak dimuat)."}], error: "Math.js tidak dimuat atau math.rank() tidak ditemukan. Tidak dapat menghitung Peringkat." };
         }
        try {
            const m = math.matrix(matrixData);
            const rankVal = math.rank(m); // Hitung peringkat menggunakan Math.js
             let details = `<strong>Peringkat Matriks.</strong>\n`;
             details += `Peringkat adalah jumlah maksimum baris (atau kolom) yang bebas linier.\n`;
             details += `Seringkali ditemukan dengan mereduksi matriks ke bentuk eselon baris dan menghitung jumlah baris non-nol.\n`;
             details += `Peringkat dihitung menggunakan pustaka Math.js: ${rankVal}`;
             // Sertakan matriks RREF dalam detail untuk konteks
             const rrefResult = rowEchelonForm(matrixData); 
             if (rrefResult && rrefResult.mainResult) {
                  details += `\n\nMatriks dalam RREF:\n${formatMatrixSimple(rrefResult.mainResult)}`;
             } else if (rrefResult && rrefResult.error) {
                  details += `\n\nTidak dapat menghitung RREF untuk ditampilkan di sini: ${rrefResult.error}`;
             }
             return { operationType: 'rank', mainResult: rankVal, inputMatrix: cloneMatrix(matrixData), methods: [{ name: "Definisi dan Perhitungan Peringkat", details: details }] }; 
        } catch (e) {
            console.error("Peringkat Math.js gagal:",e);
             return { operationType: 'rank', mainResult: null, inputMatrix: cloneMatrix(matrixData), methods: [{name:"Perhitungan Gagal", details: "Kesalahan Peringkat (Math.js): " + e.message + "\nTidak dapat menghitung Peringkat menggunakan Math.js."}], error: "Kesalahan Peringkat (Math.js): " + e.message };
        }
    }

    function luDecomposition(matrixData) { // Dekomposisi LU
        if (!matrixData || matrixData.length === 0) { showError("Matriks hilang atau kosong untuk Dekomposisi LU."); return null; }
        const r = matrixData.length;
        const c = matrixData[0]?.length || 0;
        if(r !== c){showError("Dekomposisi LU memerlukan matriks persegi.");return null;}
         // Membutuhkan Math.js
         if (!window.math || typeof window.math.lup !== 'function') {
             showError("Dekomposisi LU memerlukan pustaka Math.js (math.lup tidak ditemukan atau Math.js tidak dimuat).");
             return null;
         }
        try {
            const m = math.matrix(matrixData);
            const lu = math.lup(m); // Math.js menggunakan dekomposisi LUP (PA=LU)
            const L = lu.L.toArray(); // Matriks Segitiga Bawah
            const U = lu.U.toArray(); // Matriks Segitiga Atas
            // Rekonstruksi matriks Permutasi P dari indeks pivot lu.p
            const P_m = math.matrix(math.zeros(r, r));
            lu.p.forEach((col_idx, row_idx) => P_m.set([row_idx, col_idx], 1));
            const P = P_m.toArray(); // Matriks Permutasi

            let dets = `<strong>Dekomposisi LU (PA=LU) melalui Math.js.</strong>\nMenguraikan matriks A menjadi matriks Permutasi P, matriks Segitiga Bawah L, dan matriks Segitiga Atas U sehingga PA = LU.\n(Perhitungan dilakukan oleh pustaka Math.js)\n\n<strong>P (Matriks Permutasi):</strong>\n${formatMatrixSimple(P)}\n\n<strong>L (Matriks Segitiga Bawah):</strong>\n${formatMatrixSimple(L)}\n\n<strong>U (Matriks Segitiga Atas):</strong>\n${formatMatrixSimple(U)}\n`;
             return {operationType:'lu', mainResult:{L:L, U:U, P:P}, inputMatrix:cloneMatrix(matrixData), methods:[{name:"Proses Dekomposisi LUP",details:dets}]}; 
        } catch(e) {
            showError("Kesalahan Dekomposisi LU (Math.js): "+e.message);
            return null;
        }
    }

    function choleskyDecomposition(matrixData) { // Dekomposisi Cholesky
        if (!matrixData || matrixData.length === 0) { showError("Matriks hilang atau kosong untuk Dekomposisi Cholesky."); return null; }
        const r = matrixData.length;
        const c = matrixData[0]?.length || 0;
        if(r !== c){showError("Dekomposisi Cholesky memerlukan matriks persegi.");return null;}

        // Periksa simetri (dengan toleransi)
        const tol = 1e-9;
        for(let i = 0; i < r; i++){
            for(let j = i + 1; j < c; j++){
                if(Math.abs((matrixData[i]?.[j] || 0) - (matrixData[j]?.[i] || 0)) > tol){
                    showError("Dekomposisi Cholesky memerlukan matriks simetris.");
                    return null;
                }
            }
        }
        // Membutuhkan Math.js
        if (!window.math || typeof window.math.cholesky !== 'function') {
             showError("Dekomposisi Cholesky memerlukan pustaka Math.js (math.cholesky tidak ditemukan atau Math.js tidak dimuat).");
             return null;
        }
        try {
            const m = math.matrix(matrixData);
            // Math.js cholesky mengembalikan matriks segitiga bawah L
            const L_m = math.cholesky(m); 
            const L = L_m.toArray();

            let dets = `<strong>Dekomposisi Cholesky (A=L·L<sup>T</sup>) melalui Math.js.</strong>\nMemerlukan matriks simetris definit positif.\nMenguraikan matriks A menjadi matriks segitiga bawah L sehingga A = L·L<sup>T</sup>.\n(Perhitungan dilakukan oleh pustaka Math.js)\n\n<strong>L (Matriks Segitiga Bawah):</strong>\n${formatMatrixSimple(L)}\n`;
            return {operationType:'cholesky', mainResult:{L:L}, inputMatrix:cloneMatrix(matrixData), methods:[{name:"Proses Dekomposisi Cholesky",details:dets}]}; 
        } catch(e) { // Tangani kesalahan, misal matriks tidak definit positif
             let errMsg = e.message;
             if (errMsg.includes("Positive definite")) { // Pesan kesalahan spesifik dari Math.js
                 errMsg = "Matriks harus simetris definit positif.";
             }
             showError("Kesalahan Dekomposisi Cholesky (Math.js): "+ errMsg);
             return null;
        }
    }

    // --- Evaluasi Ekspresi Kustom (Dasar) ---
    function evaluateCustomExpression(expr) {
        console.warn("Menggunakan parser ekspresi dasar.");
        expr = expr.replace(/\s+/g, ''); // Hapus semua spasi
        if (!expr) { // Jika ekspresi kosong
            return null;
        }

        // Regex sederhana untuk mencocokkan skalar*Matriks, Op(Matriks), Matriks op Matriks
        const singleOpMatch = expr.match(/^(det|inv|trans|rank|rref|lu|chol|diag)\(([A-Z][A-Z0-9]*)\)$/i);
        const scalarMulMatch = expr.match(/^([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)\*([A-Z][A-Z0-9]*)$/i); // Cocokkan skalar*Matriks (termasuk notasi ilmiah)
        const matrixNameMatch = expr.match(/^([A-Z][A-Z0-9]*)$/i); // Cocokkan hanya NamaMatriks
        const binaryOpMatch = expr.match(/^([A-Z][A-Z0-9]*)([+*^-])([A-Z][A-Z0-9]*)$/i); // Cocokkan A+B, A*B, A-B (ganti * dengan simbol perkalian jika perlu)

        if (singleOpMatch) { // Jika cocok dengan Op(Matriks)
            const op = singleOpMatch[1].toLowerCase();
            const matrixName = singleOpMatch[2].toUpperCase();
            const matrixData = readMatrixData(matrixName);
            if (!matrixData) return null; // Kesalahan sudah ditangani oleh readMatrixData

            switch(op) {
                case 'det': return determinant(matrixData);
                case 'inv': return inverse(matrixData);
                case 'trans': return transpose(matrixData);
                case 'rank': return rank(matrixData);
                case 'rref': return rowEchelonForm(matrixData);
                case 'lu': return luDecomposition(matrixData);
                case 'chol': return choleskyDecomposition(matrixData);
                case 'diag': return isDiagonal(matrixData);
                default: showError(`Fungsi tidak didukung dalam ekspresi: ${op}`); return null;
            }
        } else if (scalarMulMatch) { // Jika cocok dengan skalar*Matriks
             const scalar = parseFloat(scalarMulMatch[1]);
             const matrixName = scalarMulMatch[2].toUpperCase();
             const matrixData = readMatrixData(matrixName);
            if (!matrixData) return null;
            if (isNaN(scalar)) { showError("Nilai skalar tidak valid dalam ekspresi."); return null; }
             const resultMatrix = multiplyScalar(matrixData, scalar);
            // Bungkus hasil dalam format terstruktur untuk displayResult
            return {
                operationType: 'mul-scalar',
                mainResult: resultMatrix,
                inputMatrix: cloneMatrix(matrixData),
                methods: [{ name: "Evaluasi Ekspresi", details: `Perkalian skalar dievaluasi: ${formatNumber(scalar)} * ${matrixName}` }]
            };
        } else if (binaryOpMatch) { // Jika cocok dengan Matriks op Matriks
            const m1Name = binaryOpMatch[1].toUpperCase();
            const opSymbol = binaryOpMatch[2];
            const m2Name = binaryOpMatch[3].toUpperCase();
             const m1Data = readMatrixData(m1Name);
             const m2Data = readMatrixData(m2Name);
            if (!m1Data || !m2Data) return null;

            let resultData = null; // Bisa matriks atau objek {matrix, details}
            let operationType = '';
            let details = `Operasi biner dievaluasi: ${m1Name} ${opSymbol} ${m2Name}`;

            switch(opSymbol) {
                case '+': resultData = add(m1Data, m2Data); operationType = 'add'; break;
                case '-': resultData = subtract(m1Data, m2Data); operationType = 'sub'; break;
                case '*': 
                         const mulResultObj = multiplyMatrices(m1Data, m2Data);
                         if (mulResultObj && mulResultObj.matrix !== undefined) {
                            resultData = mulResultObj.matrix;
                            details = mulResultObj.details; // Gunakan detail dari multiplyMatrices
                         } else {
                            return null; // Kesalahan ditangani di multiplyMatrices
                         }
                         operationType = 'mul'; 
                         break;
                // case '^': // Pangkat matriks dengan matriks tidak umum, mungkin pangkat dengan skalar saja
                //     showError("Operasi pangkat matriks dengan matriks belum didukung dalam ekspresi kustom."); return null;
                default: showError(`Operator biner tidak didukung dalam ekspresi: ${opSymbol}`); return null;
            }
            if (resultData === null && operationType !== 'mul') return null; // Kesalahan ditangani oleh add/sub
            
            // Bungkus hasil dalam format terstruktur
            return {
                operationType: operationType,
                mainResult: resultData, // Ini adalah array matriks
                 inputMatrix: { inputA: cloneMatrix(m1Data), inputB: cloneMatrix(m2Data) },
                methods: [{ name: "Evaluasi Ekspresi", details: details }]
            };
        } else if (matrixNameMatch) { // Jika hanya nama matriks
             const matrixName = matrixNameMatch[1].toUpperCase();
             const matrixData = readMatrixData(matrixName);
             if (!matrixData) return null;
             // Tampilkan matriks itu sendiri
             return {
                operationType: 'display', // Tipe kustom untuk hanya menampilkan matriks
                mainResult: cloneMatrix(matrixData),
                inputMatrix: cloneMatrix(matrixData), // Input adalah matriks itu sendiri
                methods: [{ name: "Evaluasi Ekspresi", details: `Menampilkan matriks ${matrixName}` }]
             };
        }
        else { // Jika format ekspresi tidak cocok
            showError(`Format ekspresi tidak valid: "${expr}". Coba skalar*Matriks, Op(Matriks), atau Matriks1 op Matriks2.`);
            return null;
        }
    }

    // --- Event Listeners & Handlers ---
    function setupEventListeners() {
        matrixPanelsContainer.addEventListener('click',handlePanelClick); // Klik pada tombol di panel
        matrixPanelsContainer.addEventListener('input',handlePanelInput); // Input pada sel matriks
        cleanOutputBtn.addEventListener('click',clearOutput); // Tombol bersihkan output
        resetAllBtn.addEventListener('click',resetAll); // Tombol reset semua
        displayDecimalsCheck.addEventListener('change',updateDecimalControlState); // Checkbox tampilkan desimal
        sigDigitsInput.addEventListener('input',updateDecimalControlState); // Input angka signifikan
        evalExprBtn.addEventListener('click',()=>{
            const expr=customExprInput.value;
            if(!expr)return; 
            const res=evaluateCustomExpression(expr);
             if(res!==null)displayResult(res,`Hasil dari: "${expr}"`,null,'result-expr'); // displayResult menangani berbagai tipe hasil
        }); 
    }

    function handlePanelClick(event) {
        const target=event.target;
        const button=target.closest('button'); 
        if(!button)return; 

        const matrixName=button.dataset.matrix;
        const action=button.dataset.action; 
        if(button.classList.contains('dim-btn') && matrixName && action) { // Tombol pengubah dimensi
            changeMatrixDimensions(matrixName,action);
        } else if(button.classList.contains('op-btn') && matrixName && !button.classList.contains('bin-op')) { // Tombol operasi tunggal
            handleSingleMatrixOperation(button);
        } else if(button.classList.contains('bin-op')) { 
            handleBinaryMatrixOperation(button);
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
        let opDesc = `${op}(${matrixName})`;
        const sourceId = `result-${matrixName}-${op}`; 

        let scalarVal = undefined;
        let exponentVal = undefined;
        if (op === 'mul-scalar') {             const scalarInput = document.getElementById(`scalar-${matrixName}`);
            if (scalarInput) scalarVal = parseFloat(scalarInput.value);
            if (isNaN(scalarVal)){ showError("Nilai skalar tidak valid."); return;}
        } else if (op === 'pow') { // Jika operasi pangkat
            const powerInput = document.getElementById(`power-${matrixName}`);
            if (powerInput) exponentVal = parseInt(powerInput.value);
             if (isNaN(exponentVal) || exponentVal < 0){ showError("Eksponen harus bilangan bulat non-negatif."); return;}
        }

        try {
            switch(op){
                case 'det': result = determinant(matrix); opDesc = `Determinan(${matrixName})`; break;
                case 'inv': result = inverse(matrix); opDesc = `Invers(${matrixName})`; break;
                case 'trans': result = transpose(matrix); opDesc = `Transpos(${matrixName})`; break;
                case 'mul-scalar':
                    const resultMatrixScalar = multiplyScalar(cloneMatrix(matrix), scalarVal);
                    opDesc = `${formatNumber(scalarVal)} * ${matrixName}`;
                    // Bungkus hasil sederhana untuk tampilan detail
                    result = { 
                        operationType: 'mul-scalar', 
                        mainResult: resultMatrixScalar, 
                        inputMatrix: cloneMatrix(matrix), 
                        methods: [{name:"Perhitungan Langsung", details:`Menghitung ${formatNumber(scalarVal)} * ${matrixName}.\nHasil:\n${formatMatrixSimple(resultMatrixScalar)}`}]
                    };
                    break;
                case 'pow':
                    const resultMatrixPow = power(cloneMatrix(matrix), exponentVal);
                    opDesc = `${matrixName} ^ ${exponentVal}`;
                    // Bungkus hasil sederhana untuk tampilan detail
                    result = { 
                        operationType: 'pow', 
                        mainResult: resultMatrixPow, 
                        inputMatrix: cloneMatrix(matrix), 
                        methods: [{name:"Perhitungan Langsung", details:`Menghitung ${matrixName} pangkat ${exponentVal}.\nHasil:\n${formatMatrixSimple(resultMatrixPow)}`}]
                    };
                    break;
                default:
                    showError(`Operasi tidak dikenal atau tidak didukung: ${op}`); return;
            }
            // displayResult sekarang mengharapkan objek hasil terstruktur
            if (result !== undefined && result !== null) { // Jika ada hasil yang valid
                 displayResult(result, opDesc, null, sourceId);
            } 
            // Jika result null, kesalahan kemungkinan sudah ditangani oleh showError di dalam fungsi operasi
        } catch(e){
            console.error(`Kesalahan Perhitungan (${opDesc}):`,e);
            showError(`Kesalahan tak terduga selama ${opDesc}: ${e.message}`);
        }
    }

    function handleBinaryMatrixOperation(button) {
        const op = button.dataset.op; // Operasi (add, sub, mul)
        const m1N = button.dataset.m1; // Nama matriks pertama (selalu 'A')
        const m2N = button.dataset.m2; // Nama matriks kedua (selalu 'B')
        const m1 = readMatrixData(m1N); // Baca data matriks A
        const m2 = readMatrixData(m2N); // Baca data matriks B
        if(!m1 || !m2) return; // Jika salah satu matriks tidak ada, keluar

        let resultMatrix = undefined; // Hasil bisa berupa matriks atau objek (untuk perkalian)
        let opDesc = `${m1N} ${op} ${m2N}`; // Deskripsi operasi default
        const srcId = `result-${m1N}-${op}-${m2N}`; // ID sumber
        const inputMatrices = { inputA: cloneMatrix(m1), inputB: cloneMatrix(m2) }; // Simpan input untuk tampilan
        let detailsForDisplay = `Menghitung ${opDesc}.`; // Detail default

        try {
            switch(op){
                case 'add': resultMatrix = add(m1, m2); opDesc = `${m1N} + ${m2N}`; break;
                case 'sub': resultMatrix = subtract(m1, m2); opDesc = `${m1N} - ${m2N}`; break;
                case 'mul':
                     const mulResObj = multiplyMatrices(m1, m2); // multiplyMatrices mengembalikan {matrix, details}
                     if (!mulResObj || mulResObj.matrix === undefined) { // Periksa apakah objek hasil atau matriks di dalamnya tidak valid
                        // Kesalahan kemungkinan sudah ditangani oleh multiplyMatrices jika mengembalikan null atau ada masalah
                        if(!mulResObj) showError("Perkalian gagal, objek hasil adalah null."); 
                        return; 
                     }
                     resultMatrix = mulResObj.matrix; // Ini adalah array matriks hasil
                     opDesc = `${m1N} × ${m2N}`;
                     detailsForDisplay = mulResObj.details; // Gunakan detail dari fungsi multiplyMatrices
                     break;
                default: showError(`Operasi biner tidak dikenal: ${op}`); return;
            }

            // Bungkus semua hasil operasi biner (add, sub, mul) dalam objek terstruktur untuk displayResult
            if (resultMatrix !== undefined && resultMatrix !== null) {
                 displayResult({
                     operationType: op, // 'add', 'sub', atau 'mul'
                     mainResult: resultMatrix, // Array matriks hasil
                     inputMatrix: inputMatrices, // Objek dengan inputA dan inputB
                     methods: [{ name: "Perhitungan Langsung", details: detailsForDisplay + `\nHasil:\n${formatMatrixSimple(resultMatrix)}` }]
                 }, opDesc, null, srcId);
            }
             // Jika resultMatrix null, kesalahan kemungkinan sudah ditangani oleh fungsi add/sub/multiplyMatrices
        } catch(e){
            console.error(`Kesalahan Perhitungan (${opDesc}):`,e);
            showError(`Kesalahan tak terduga selama ${opDesc}: ${e.message}`);
        }
    }
    
    // Pengaturan listener untuk tombol aksi pada tampilan hasil detail
    function setupResultActionListeners() {
        if(cleanOutputBtnDetailed) cleanOutputBtnDetailed.addEventListener('click', clearOutput); // Tombol hapus di tampilan detail

        if(copyResultBtnDetailed) copyResultBtnDetailed.addEventListener('click', () => { // Tombol salin
             let textToCopy = "";
             if (lastResult && typeof lastResult === 'object' && lastResult.operationType) { // Jika ada hasil terstruktur
                 textToCopy += `Hasil Perhitungan Matriks:\n\n`;
                 textToCopy += `Operasi: ${lastResult.operationType}\n\n`;
                 // Tambahkan matriks input ke teks
                 if (lastResult.inputMatrix) {
                     if (lastResult.inputMatrix.inputA && lastResult.inputMatrix.inputB) { // Untuk operasi biner
                         textToCopy += `Matriks Input 1:\n${formatMatrixSimple(lastResult.inputMatrix.inputA)}\n\n`;
                         textToCopy += `Matriks Input 2:\n${formatMatrixSimple(lastResult.inputMatrix.inputB)}\n\n`;
                     } else if (Array.isArray(lastResult.inputMatrix)) { // Untuk operasi tunggal
                          textToCopy += `Matriks Input:\n${formatMatrixSimple(lastResult.inputMatrix)}\n\n`;
                     }
                 }
                 textToCopy += `Hasil:\n`;
                 // Tambahkan hasil utama ke teks
                 if (typeof lastResult.mainResult === 'number' || typeof lastResult.mainResult === 'boolean') {
                     textToCopy += formatNumber(lastResult.mainResult);
                 }
                 else if (typeof lastResult.mainResult === 'object' && (lastResult.mainResult.L || lastResult.mainResult.U || lastResult.mainResult.P)) { // Untuk LU, Cholesky
                      textToCopy += "Hasil Kompleks (L, U, P):\n";
                      if (lastResult.mainResult.P) textToCopy += `P:\n${formatMatrixSimple(lastResult.mainResult.P)}\n`;
                      if (lastResult.mainResult.L) textToCopy += `L:\n${formatMatrixSimple(lastResult.mainResult.L)}\n`;
                      if (lastResult.mainResult.U) textToCopy += `U:\n${formatMatrixSimple(lastResult.mainResult.U)}\n`;
                 }
                 else if (Array.isArray(lastResult.mainResult)) { // Jika hasil berupa matriks
                     textToCopy += formatMatrixSimple(lastResult.mainResult);
                 }
                 else { // Hasil lain
                     textToCopy += String(lastResult.mainResult);
                 }
                 textToCopy += "\n";

                 // Salin Detail Perhitungan (kecuali yang difilter)
                 const allDetailElements = calculationMethodsContainer?.querySelectorAll('details');
                 if (allDetailElements && allDetailElements.length > 0) {
                     let detailsTextContent = "\n--- Detail Perhitungan ---\n";
                     // Daftar nama metode yang DIFILTER dari tampilan detail GUI, jadi juga difilter saat disalin
                      const methodsToFilterFromCopy = [
                         "Math.js det()", "Math.js inv()", "Math.js rref()",
                         "Math.js lup()", "Math.js cholesky()", "Math.js rank()", "Info"
                     ];
                     allDetailElements.forEach(detailElement => {
                         const summaryText = detailElement.querySelector('summary')?.textContent || '';
                         let shouldFilter = false;
                         for (const filterName of methodsToFilterFromCopy) {
                             if (summaryText.includes(filterName)) {
                                 shouldFilter = true;
                                 break;
                             }
                         }
                         if (!shouldFilter) { // Hanya salin detail yang tidak difilter
                            const preElement = detailElement.querySelector('div pre');
                             if (preElement) {
                                 detailsTextContent += `\nMetode: ${summaryText.replace('Detail (', '').replace(')', '')}\n`; 
                                 detailsTextContent += preElement.textContent.trim() + "\n";
                             }
                         }
                     });
                     // Hanya tambahkan bagian detail jika ada konten detail yang disalin
                     if (detailsTextContent.length > "\n--- Detail Perhitungan ---\n".length + 1) { 
                          textToCopy += detailsTextContent; 
                     }
                 }
             } else if (resultGeneralOutput && resultGeneralOutput.textContent.trim() !== 'Pilih operasi untuk melihat hasil.') { // Jika hasil ada di tampilan umum
                  textToCopy = resultGeneralOutput.textContent.trim();
             }

             if(!textToCopy.trim()){ showError("Tidak ada yang bisa disalin."); return; } // Jika tidak ada teks untuk disalin

             navigator.clipboard.writeText(textToCopy.trim()) // Salin ke clipboard
                 .then(()=>{
                     copyResultBtnDetailed.innerHTML='<i class="fas fa-check"></i> Tersalin!'; // Ubah teks tombol sementara
                     setTimeout(()=>copyResultBtnDetailed.innerHTML='<i class="fas fa-copy"></i>',1500); // Kembalikan teks tombol
                 })
                 .catch(err=>showError('Gagal menyalin hasil ke clipboard: ' + err));
         });

        if(shareResultBtnDetailed) shareResultBtnDetailed.addEventListener('click', () => { // Tombol bagikan
             let shareTextContent="Hasil Perhitungan Matriks:\n\n";
             if (lastResult && typeof lastResult === 'object' && lastResult.operationType) { // Jika ada hasil terstruktur
                  shareTextContent += `Operasi: ${lastResult.operationType}\n\n`;
                  if (lastResult.inputMatrix) {
                     if (lastResult.inputMatrix.inputA && lastResult.inputMatrix.inputB) {
                         shareTextContent += `Matriks Input 1:\n${formatMatrixSimple(lastResult.inputMatrix.inputA)}\n\n`;
                         shareTextContent += `Matriks Input 2:\n${formatMatrixSimple(lastResult.inputMatrix.inputB)}\n\n`;
                     } else if (Array.isArray(lastResult.inputMatrix)) {
                          shareTextContent += `Matriks Input:\n${formatMatrixSimple(lastResult.inputMatrix)}\n\n`;
                     }
                 }
                  shareTextContent += `Hasil:\n`;
                 if (typeof lastResult.mainResult === 'number' || typeof lastResult.mainResult === 'boolean') {
                      shareTextContent += formatNumber(lastResult.mainResult);
                 }
                 else if (typeof lastResult.mainResult === 'object' && (lastResult.mainResult.L || lastResult.mainResult.U || lastResult.mainResult.P)) {
                      shareTextContent += "Hasil Kompleks (cth., Dekomposisi LU) - Lihat aplikasi untuk detail.\n"; // Sederhanakan untuk dibagikan
                 }
                 else if (Array.isArray(lastResult.mainResult)) {
                      shareTextContent += formatMatrixSimple(lastResult.mainResult);
                 }
                 else {
                     shareTextContent += String(lastResult.mainResult);
                 }
                 shareTextContent += "\n";
                 // Catatan: Membagikan langkah detail mungkin membuat teks terlalu panjang. Biasanya hanya hasil utama.
             } else if (resultGeneralOutput && resultGeneralOutput.textContent.trim() !== 'Pilih operasi untuk melihat hasil.') { // Jika hasil ada di tampilan umum
                  shareTextContent += resultGeneralOutput.textContent.trim();
             } else { showError("Tidak ada yang bisa dibagikan."); return; }

             const shareData={ title:'Hasil Matriks', text: shareTextContent.trim() };

             if(navigator.share && navigator.canShare(shareData)) { // Gunakan Web Share API jika didukung
                 navigator.share(shareData).catch(err=>console.error("Berbagi gagal:",err));
             } else { // Fallback: salin ke clipboard
                 navigator.clipboard.writeText(shareData.text)
                     .then(()=>alert("API Bagikan tidak didukung di browser ini. Hasil disalin ke clipboard."))
                     .catch(err=>alert("Berbagi & Salin gagal."));
             }
         });
    }

    // Perbarui status kontrol desimal dan format ulang hasil terakhir jika perlu
    function updateDecimalControlState() {
        sigDigitsInput.disabled = !displayDecimalsCheck.checked; // Aktifkan/nonaktifkan input angka signifikan

        if (lastResult !== null) { // Jika ada hasil terakhir yang tersimpan
            let operationDesc = "Hasil Terakhir"; // Deskripsi fallback
            // Rekonstruksi deskripsi operasi untuk tampilan ulang
            if (typeof lastResult === 'object' && lastResult.operationType) {
                 let inputDesc = '';
                 if (lastResult.inputMatrix) {
                     if (lastResult.inputMatrix.inputA && lastResult.inputMatrix.inputB) { // Operasi biner
                           let m1N = 'Matriks 1', m2N = 'Matriks 2'; // Fallback nama
                           // Heuristik untuk menemukan nama matriks (bisa ditingkatkan jika nama disimpan di lastResult)
                           try {
                             Object.keys(matrices).forEach(name => { // Cocokkan data untuk menemukan nama
                               if(JSON.stringify(matrices[name].data) === JSON.stringify(lastResult.inputMatrix.inputA)) m1N = name;
                               if(JSON.stringify(matrices[name].data) === JSON.stringify(lastResult.inputMatrix.inputB)) m2N = name;
                             });
                           } catch (e) { console.warn("Kesalahan mencocokkan nama matriks untuk deskripsi", e); }
                           
                           const opSymbol = lastResult.operationType === 'add' ? '+' : (lastResult.operationType === 'sub' ? '-' : (lastResult.operationType === 'mul' ? '×' : lastResult.operationType));
                           inputDesc = `${m1N} ${opSymbol} ${m2N}`;
                     } else if (Array.isArray(lastResult.inputMatrix)) { // Operasi tunggal
                           let mName = 'Matriks'; // Fallback nama
                           try {
                            Object.keys(matrices).forEach(name => {
                                if(JSON.stringify(matrices[name].data) === JSON.stringify(lastResult.inputMatrix)) mName = name;
                            });
                           } catch (e) { console.warn("Kesalahan mencocokkan nama matriks untuk deskripsi", e); }
                           inputDesc = mName;
                     }
                 }
                 // Konstruksi deskripsi operasi berdasarkan tipe
                 switch(lastResult.operationType) {
                     case 'determinant': operationDesc = `Determinan(${inputDesc})`; break;
                     case 'inverse': operationDesc = `Invers(${inputDesc})`; break;
                     case 'transpose': operationDesc = `Transpos(${inputDesc})`; break;
                     case 'rank': operationDesc = `Peringkat(${inputDesc})`; break;
                     case 'rref': operationDesc = `RREF(${inputDesc})`; break;
                     case 'lu': operationDesc = `Dekomposisi LU(${inputDesc})`; break;
                     case 'cholesky': operationDesc = `Dekomposisi Cholesky(${inputDesc})`; break;
                     case 'isDiagonal': operationDesc = `Apakah ${inputDesc} Diagonal?`; break;
                     case 'mul-scalar':
                         let scalarVal = 'Skalar'; 
                         // Coba dapatkan nilai skalar dari detail metode
                         if (lastResult.methods && lastResult.methods[0]?.details.includes("Menghitung") && lastResult.methods[0]?.details.includes("*")) {
                              const match = lastResult.methods[0].details.match(/Menghitung (-?\d*\.?\d+(?:\/-?\d*\.?\d+)?) \*/); // Mendukung pecahan dalam deskripsi
                              if (match && match[1]) scalarVal = match[1]; // Sudah diformat
                         }
                         operationDesc = `${scalarVal} × ${inputDesc}`;
                         break;
                     case 'pow':
                          let exponentVal = 'Eksponen'; 
                         // Coba dapatkan nilai eksponen dari detail metode
                         if (lastResult.methods && lastResult.methods[0]?.details.includes("pangkat")) {
                             const match = lastResult.methods[0].details.match(/pangkat (-?\d+)\.?\d*/); 
                             if (match && match[1]) exponentVal = match[1];
                         } else if (lastResult.methods && lastResult.methods[0]?.details.includes("^")) { // Periksa evaluasi ekspresi kustom
                              const match = lastResult.methods[0].details.match(/\^ (-?\d+)\.?\d*/);
                               if (match && match[1]) exponentVal = match[1];
                         }
                         operationDesc = `${inputDesc} ^ ${exponentVal}`;
                         break;
                     case 'add': case 'sub': case 'mul': // Operasi biner ditangani oleh konstruksi inputDesc
                         operationDesc = inputDesc; 
                         break;
                     default: operationDesc = `${lastResult.operationType}(${inputDesc || 'input'})`; break; // Fallback
                 }
            } else { // Fallback untuk hasil sederhana lama di resultGeneralOutput
                 const titleElement = resultGeneralOutput.querySelector('.result-title');
                 if (titleElement) operationDesc = titleElement.textContent.trim();
            }
            // Tampilkan ulang hasil terakhir dengan format yang mungkin diperbarui
            displayResult(lastResult, operationDesc, null, lastResultSource);
        }
    }

    // Atur ulang semua matriks dan output
    function resetAll() {
         if(!confirm("Anda yakin ingin mengatur ulang semua matriks dan membersihkan output?"))return;
         matrixPanelsContainer.innerHTML=''; // Kosongkan kontainer panel
         matrices={}; // Reset state matriks
         lastResult=null;
         lastResultSource = null;
         initialize(); // Inisialisasi ulang panel A, B, dan panel operasi biner
         customExprInput.value=''; // Kosongkan input ekspresi
         // clearOutput(); // Sudah dipanggil di dalam initialize() atau bisa dipanggil eksplisit
         displayDecimalsCheck.checked=false; // Reset checkbox desimal
         sigDigitsInput.value=4; // Reset angka signifikan
         updateDecimalControlState(); // Perbarui status kontrol
    }

    // --- Mulai aplikasi ---
    initialize();
});
