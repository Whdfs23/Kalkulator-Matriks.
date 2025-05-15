document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let matrices = {};
    let nextMatrixName = 'C';
    let lastResult = null; // Menyimpan objek hasil lengkap terakhir
    let lastResultSource = null; // Untuk identifikasi sumber hasil

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
    const insertResultABtn = document.getElementById('insert-result-a-btn');
    const insertResultBBtn = document.getElementById('insert-result-b-btn');
    const cleanOutputBtnDetailed = document.getElementById('clean-output-btn-detailed');
    const copyResultBtnDetailed = document.getElementById('copy-result-btn-detailed');
    const shareResultBtnDetailed = document.getElementById('share-result-btn-detailed');
    const addMatrixBtn = document.getElementById('add-matrix-btn');
    const cleanOutputBtn = document.getElementById('clean-output-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const displayDecimalsCheck = document.getElementById('display-decimals-check');
    const sigDigitsInput = document.getElementById('sig-digits-input');
    const customExprInput = document.getElementById('custom-expr-input');
    const evalExprBtn = document.getElementById('eval-expr-btn');

    // --- Initialization ---
    function initialize() {
        addMatrixPanel('A', 3, 3, inverseExampleMatrix); // Pakai matriks contoh invers
        addBinaryOpsPanel('A', 'B');
        if (!matrices['B']) {
            addMatrixPanel('B', 3, 3, defaultMatrixB);
        }
        setupEventListeners();
        setupResultActionListeners();
        updateDecimalControlState();
        clearOutput();
    }

    // --- Matrix Panel Management ---
    function getNextMatrixName() {
        const name = nextMatrixName; let nextCharCode = nextMatrixName.charCodeAt(0) + 1;
        if (nextCharCode > 'Z'.charCodeAt(0)) { if (nextMatrixName === 'Z') nextMatrixName = 'AA'; else if (nextMatrixName.length === 1) nextMatrixName = String.fromCharCode(nextMatrixName.charCodeAt(0) + 1); else { let lc = nextMatrixName.slice(-1); let b = nextMatrixName.slice(0, -1); if (lc === 'Z') { b = String.fromCharCode(b.charCodeAt(0) + 1); lc = 'A'; } else { lc = String.fromCharCode(lc.charCodeAt(0) + 1); } nextMatrixName = b + lc; } } else { nextMatrixName = String.fromCharCode(nextCharCode); } return name;
    }
    function addMatrixPanel(name, rows, cols, initialData = null) {
        if (matrices[name]) return; const panel = document.createElement('div'); panel.className = 'matrix-panel'; panel.id = `matrix-panel-${name}`;
        panel.innerHTML = `<div class="panel-header"><span class="matrix-name">Matrix ${name}</span><div class="dimension-controls"><label>Cells:</label><button class="dim-btn" data-matrix="${name}" data-action="dec-row">-</button><span class="dims" id="dims-${name}">${rows}x${cols}</span><button class="dim-btn" data-matrix="${name}" data-action="inc-row">+</button><span>Rows</span><button class="dim-btn" data-matrix="${name}" data-action="dec-col">-</button><button class="dim-btn" data-matrix="${name}" data-action="inc-col">+</button><span>Cols</span></div><div class="panel-actions"><button title="Upload/Camera" class="icon-btn" data-matrix="${name}" data-action="upload"><i class="fas fa-camera"></i></button><button title="Paste" class="icon-btn" data-matrix="${name}" data-action="paste"><i class="fas fa-paste"></i></button>${name !== 'A' && name !== 'B' ? `<button class="icon-btn remove-matrix-btn" data-matrix="${name}" data-action="remove" title="Remove Matrix ${name}">×</button>` : ''}</div></div><div class="matrix-grid" id="matrix-grid-${name}" style="--rows: ${rows}; --cols: ${cols};"></div><div class="matrix-operations-single"><button class="op-btn" data-op="det" data-matrix="${name}">Determinant</button><button class="op-btn" data-op="inv" data-matrix="${name}">Inverse</button><button class="op-btn" data-op="trans" data-matrix="${name}">Transpose</button><button class="op-btn" data-op="rank" data-matrix="${name}">Rank</button><button class="op-btn" data-op="rref" data-matrix="${name}">Row Echelon</button><button class="op-btn" data-op="lu" data-matrix="${name}">LU</button><button class="op-btn" data-op="chol" data-matrix="${name}">Cholesky</button><button class="op-btn" data-op="diag" data-matrix="${name}">Is Diagonal?</button><div><button class="op-btn" data-op="mul-scalar" data-matrix="${name}">Multiply by</button><input type="number" class="op-input" id="scalar-${name}" value="2" step="any"></div><div><button class="op-btn" data-op="pow" data-matrix="${name}">To power of</button><input type="number" class="op-input" id="power-${name}" value="2" step="1" min="0"></div></div>`;
        matrixPanelsContainer.insertBefore(panel, addMatrixBtn); matrices[name] = { rows, cols, data: createEmptyMatrix(rows, cols) }; renderMatrixInputs(name, initialData);
    }
    function addBinaryOpsPanel(matrix1Name, matrix2Name) {
        const panelId = `binary-ops-${matrix1Name}-${matrix2Name}`; if (document.getElementById(panelId)) return; const panel1 = document.getElementById(`matrix-panel-${matrix1Name}`); if (!panel1) return; if (matrix1Name === 'A' && matrix2Name === 'B' && !matrices['B']) { addMatrixPanel('B', 3, 3, defaultMatrixB); } const panel2 = document.getElementById(`matrix-panel-${matrix2Name}`); if(!panel2) return; const binaryOpsPanel = document.createElement('div'); binaryOpsPanel.className = 'matrix-operations-binary'; binaryOpsPanel.id = panelId; const sourceId = `result-${matrix1Name}-${matrix2Name}`;
        binaryOpsPanel.innerHTML = `<button class="op-btn bin-op" data-op="mul" data-m1="${matrix1Name}" data-m2="${matrix2Name}">${matrix1Name} × ${matrix2Name}</button><button class="op-btn bin-op" data-op="add" data-m1="${matrix1Name}" data-m2="${matrix2Name}">${matrix1Name} + ${matrix2Name}</button><button class="op-btn bin-op" data-op="sub" data-m1="${matrix1Name}" data-m2="${matrix2Name}">${matrix1Name} - ${matrix2Name}</button><div class="copy-buttons"><button class="copy-btn" title="Copy result to ${matrix1Name}" data-target="${matrix1Name}" data-source="${sourceId}">← ${matrix1Name}</button><button class="copy-btn" title="Copy result to ${matrix2Name}" data-target="${matrix2Name}" data-source="${sourceId}">${matrix2Name} →</button></div>`;
        panel1.after(binaryOpsPanel);
    }
    function removeAssociatedBinaryOps(matrixName) { const relatedOpsPanels = matrixPanelsContainer.querySelectorAll(`[id^="binary-ops-"]`); relatedOpsPanels.forEach(p => { const inv = p.id.split('-').slice(2); if (inv.includes(matrixName)) p.remove(); });}
    function removeMatrixPanel(name) { if (name === 'A' || name === 'B') return; const p = document.getElementById(`matrix-panel-${name}`); if (p) p.remove(); delete matrices[name]; removeAssociatedBinaryOps(name); const mNames = Object.keys(matrices).filter(n => n !== 'A' && n !== 'B').sort(); if (mNames.length > 0) { const last = mNames[mNames.length - 1]; let nc = last.charCodeAt(0) + 1; nextMatrixName = (nc > 'Z'.charCodeAt(0)) ? 'AA' : String.fromCharCode(nc); } else { nextMatrixName = 'C'; } clearOutput(); }
    function renderMatrixInputs(matrixName, initialData = null) {
        const grid = document.getElementById(`matrix-grid-${matrixName}`); if(!grid) return; const { rows, cols } = matrices[matrixName]; grid.innerHTML = ''; grid.style.setProperty('--rows', rows); grid.style.setProperty('--cols', cols); const currentData = matrices[matrixName].data; matrices[matrixName].data = createEmptyMatrix(rows, cols);
        for (let i = 0; i < rows; i++) { for (let j = 0; j < cols; j++) { const input = document.createElement('input'); input.type = 'number'; input.step = 'any'; input.dataset.row = i; input.dataset.col = j; input.dataset.matrix = matrixName; let valueToSet = ''; if (initialData && i < initialData.length && j < initialData[i]?.length && initialData[i][j] !== null && initialData[i][j] !== undefined) { valueToSet = initialData[i][j]; } else if (currentData && i < currentData.length && j < currentData[i]?.length && currentData[i][j] !== null && currentData[i][j] !== undefined) { valueToSet = currentData[i][j]; } input.value = valueToSet; matrices[matrixName].data[i][j] = (valueToSet === '' || valueToSet === null || valueToSet === undefined) ? 0 : (parseFloat(valueToSet) || 0); grid.appendChild(input); } }
        const dimsSpan = document.getElementById(`dims-${matrixName}`); if (dimsSpan) dimsSpan.textContent = `${rows}x${cols}`;
    }
    function handleMatrixInputChange(event) { const i = event.target; const n = i.dataset.matrix; const r = parseInt(i.dataset.row); const c = parseInt(i.dataset.col); const v = (i.value === '' || i.value === null || i.value === undefined) ? 0 : (parseFloat(i.value) || 0); if (matrices[n]?.data[r]?.[c] !== undefined) matrices[n].data[r][c] = v; }
    function readMatrixData(matrixName) { if (!matrices[matrixName]) { showError(`Matrix ${matrixName} not found.`); return null; } return matrices[matrixName].data; }
    function updateMatrixPanelData(matrixName, newData) { if (!matrices[matrixName] || !newData) return; const nr = newData.length; const nc = newData[0]?.length || 0; if (nr === 0) { showError(`Cannot update ${matrixName} with empty rows.`); return; } if (nc === 0 && nr > 0) { showError(`Cannot update ${matrixName} with 0 columns.`); return; } matrices[matrixName].rows = nr; matrices[matrixName].cols = nc; matrices[matrixName].data = cloneMatrix(newData); renderMatrixInputs(matrixName, matrices[matrixName].data); }
    function changeMatrixDimensions(matrixName, action) { if (!matrices[matrixName]) return; let { rows, cols } = matrices[matrixName]; switch (action) { case 'inc-row': rows++; break; case 'dec-row': rows = Math.max(1, rows - 1); break; case 'inc-col': cols++; break; case 'dec-col': cols = Math.max(1, cols - 1); break; } if (rows !== matrices[matrixName].rows || cols !== matrices[matrixName].cols) { matrices[matrixName].rows = rows; matrices[matrixName].cols = cols; renderMatrixInputs(matrixName, matrices[matrixName].data); } }

    // --- Output Display ---
    function formatNumber(num) { if (typeof num !== 'number') return String(num); const tol = 1e-10; const isInt = Math.abs(num - Math.round(num)) < tol; if (!displayDecimalsCheck.checked && isInt) return String(Math.round(num)); else { const sd = parseInt(sigDigitsInput.value) || 4; let fmt = num.toPrecision(sd); if (fmt.includes('.')) { fmt = fmt.replace(/(\.[0-9]*[1-9])0+$/, '$1').replace(/\.0+$/, '.0').replace(/\.$/, ''); } return fmt; } }
    function formatMatrix(matrix) { if (!matrix || !matrix.length || !matrix[0]?.length) return "<pre class='matrix-output'>[]</pre>"; const r=matrix.length;const c=matrix[0].length;let o="<pre class='matrix-output'>";let maxW=0;for(let i=0;i<r;i++)for(let j=0;j<c;j++)maxW=Math.max(maxW,String(formatNumber(matrix[i]?.[j])).length);for(let i=0;i<r;i++){o+="[ ";for(let j=0;j<c;j++)o+=String(formatNumber(matrix[i]?.[j])).padStart(maxW,' ')+(j<c-1?", ":"");o+=" ]\n";}o+="</pre>";return o.trim();}
    function formatMatrixSimple(matrix, options = { asFraction: false }) { if (!matrix || matrix.length === 0) return "[]"; return matrix.map(row => "[ " + row.map(val => { if (options.asFraction && typeof val==='number' && !Number.isInteger(val)) { const frac = numberToFraction(val); if(frac) return frac;} return formatNumber(val);}).join(", ") + " ]" ).join("\n");}
    function numberToFraction(number, tolerance = 1.0E-6, maxDenominator = 1000) { if (Number.isInteger(number)) return String(number); let sign = number < 0 ? -1 : 1; number = Math.abs(number); let h1=1,h2=0,k1=0,k2=1,b=number; do { let a=Math.floor(b); let aux=h1;h1=a*h1+h2;h2=aux; aux=k1;k1=a*k1+k2;k2=aux; b=1/(b-a); } while(Math.abs(number-h1/k1)>number*tolerance && k1<=maxDenominator); if(k1>maxDenominator || h1 === 0 && k1 === 0) return null; if (k1 === 0) return null; return (sign*h1)+"/"+k1;}

    function displayResult(result, operationDesc, detailsIgnored, sourceId = null) {
        resultGeneralOutput.innerHTML = ''; resultDetailedView.classList.add('hidden'); resultSummaryInputMatrix.innerHTML = ''; resultSummaryOperationSymbol.innerHTML = ''; resultSummaryMainResult.innerHTML = ''; calculationMethodsContainer.innerHTML = '';
        lastResult = null; lastResultSource = sourceId;

        if (result === null || result === undefined) { resultGeneralOutput.innerHTML = `<span class="error-message">${operationDesc || "Operation failed."}</span>`; resultGeneralOutput.classList.remove('hidden'); return; }

        // Cek jika hasil adalah objek terstruktur dengan 'methods'
        if (typeof result === 'object' && !Array.isArray(result) && result.operationType && result.mainResult !== undefined && result.inputMatrix && Array.isArray(result.methods)) {
            resultSummaryInputMatrix.innerHTML = formatMatrix(result.inputMatrix);
            resultSummaryOperationSymbol.innerHTML = result.operationType === 'determinant' ? '=' : (result.operationType === 'inverse' ? '<sup>-1</sup> =' : (result.operationType === 'rref' ? ' ~> ' :(result.operationType === 'lu' ? ' = L·U' : (result.operationType === 'cholesky' ? ' = L·L<sup>T</sup>' : ' =' ) ) ) );
             if (typeof result.mainResult === 'number') { resultSummaryMainResult.innerHTML = `<span class="result-scalar">${formatNumber(result.mainResult)}</span>`; }
             else if (result.mainResult.L && result.mainResult.U) { resultSummaryMainResult.innerHTML = `<div><strong>L:</strong>${formatMatrix(result.mainResult.L)}<strong>U:</strong>${formatMatrix(result.mainResult.U)}${result.mainResult.P ? `<strong>P:</strong>${formatMatrix(result.mainResult.P)}` : ''}</div>`; }
             else if (result.mainResult.L) { resultSummaryMainResult.innerHTML = `<div><strong>L:</strong>${formatMatrix(result.mainResult.L)}</div>`; }
             else { resultSummaryMainResult.innerHTML = formatMatrix(result.mainResult); }
             result.methods.forEach(method => { const d=document.createElement('details');const s=document.createElement('summary');const c=document.createElement('div');const p=document.createElement('pre');s.textContent=`Detail (${method.name})`;p.innerHTML=method.details;c.appendChild(p);d.appendChild(s);d.appendChild(c);calculationMethodsContainer.appendChild(d); });
             resultDetailedView.classList.remove('hidden'); resultGeneralOutput.classList.add('hidden');
             lastResult = result; // Simpan objek lengkap
        } else {
            // --- Tampilan Umum ---
             let output = `<strong class="result-title">${operationDesc}</strong>\n`;
             if (typeof result === 'number' || typeof result === 'boolean') { output += `<span class="result-scalar">${formatNumber(result)}</span>`; }
             else if (Array.isArray(result)) { output += formatMatrix(result); }
             else if (typeof result === 'object' && result.matrix && result.details) { output += formatMatrix(result.matrix); output += `<details><summary>Calculation Steps</summary><pre>${result.details}</pre></details>`; }
             else { output += `<span class="result-other">${String(result)}</span>`; }
             resultGeneralOutput.innerHTML = output; resultGeneralOutput.classList.remove('hidden'); resultDetailedView.classList.add('hidden');
             lastResult = result; // Simpan hasil sederhana
        }
    }
    function showError(message) { resultGeneralOutput.innerHTML = `<span class="error-message">Error: ${message}</span>`; resultGeneralOutput.classList.remove('hidden'); resultDetailedView.classList.add('hidden'); lastResult = null; lastResultSource = null; }
    function clearOutput() { resultGeneralOutput.innerHTML = 'Select an operation to see the result.'; resultGeneralOutput.classList.remove('hidden'); resultDetailedView.classList.add('hidden'); resultSummaryInputMatrix.innerHTML=''; resultSummaryOperationSymbol.innerHTML=''; resultSummaryMainResult.innerHTML=''; calculationMethodsContainer.innerHTML=''; lastResult = null; lastResultSource = null; customExprInput.value = ''; }

    // --- Matrix Operations (Core Logic) ---
    function createEmptyMatrix(rows, cols) { return Array(rows).fill(0).map(() => Array(cols).fill(0)); }
    function cloneMatrix(matrix) { if (!matrix) return null; return matrix.map(row => Array.isArray(row) ? [...row] : row); }
    function transpose(matrixData) { if (!matrixData || matrixData.length === 0) return { operationType: 'transpose', mainResult: [], inputMatrix: matrixData || [], methods: [{name:"Direct", details: "Transpose of empty."}]}; const rows = matrixData.length; const cols = matrixData[0]?.length || 0; if (cols === 0) return { operationType: 'transpose', mainResult: createEmptyMatrix(0, rows), inputMatrix: matrixData, methods: [{name:"Direct", details:"Transpose of col vector."}]}; const result = createEmptyMatrix(cols, rows); for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) if (matrixData[i] !== undefined && matrixData[i][j] !== undefined) result[j][i] = matrixData[i][j]; return { operationType: 'transpose', mainResult: result, inputMatrix: matrixData, methods: [{name:"Direct Transposition", details: `Swapped rows & columns.\nOld: ${rows}x${cols}, New: ${cols}x${rows}`}] }; }
    function add(matrixA, matrixB) { if (!matrixA || !matrixB) { showError("Matrices missing for add."); return null; } const rA=matrixA.length,cA=matrixA[0]?.length||0,rB=matrixB.length,cB=matrixB[0]?.length||0; if(rA===0&&rB===0)return[]; if(rA!==rB||cA!==cB){showError(`Dim mismatch for add (${rA}x${cA} vs ${rB}x${cB}).`);return null;} if(rA===0||cA===0)return[]; const res=createEmptyMatrix(rA,cA); for(let i=0;i<rA;i++)for(let j=0;j<cA;j++)res[i][j]=(matrixA[i]?.[j]||0)+(matrixB[i]?.[j]||0); return res; }
    function subtract(matrixA, matrixB) { if (!matrixA || !matrixB) { showError("Matrices missing for sub."); return null; } const rA=matrixA.length,cA=matrixA[0]?.length||0,rB=matrixB.length,cB=matrixB[0]?.length||0; if(rA===0&&rB===0)return[]; if(rA!==rB||cA!==cB){showError(`Dim mismatch for sub (${rA}x${cA} vs ${rB}x${cB}).`);return null;} if(rA===0||cA===0)return[]; const res=createEmptyMatrix(rA,cA); for(let i=0;i<rA;i++)for(let j=0;j<cA;j++)res[i][j]=(matrixA[i]?.[j]||0)-(matrixB[i]?.[j]||0); return res; }
    function multiplyScalar(matrix, scalar) { if (!matrix) { showError("Matrix missing for scalar mul."); return null; } if (typeof scalar !== 'number' || isNaN(scalar)) { showError("Invalid scalar."); return null; } if (matrix.length === 0 || matrix[0]?.length === 0) return []; return matrix.map(row => row.map(val => (val || 0) * scalar)); }
    function multiplyMatrices(matrixA, matrixB) { if (!matrixA || !matrixB) { showError("Matrices missing for mul."); return null; } const rA=matrixA.length, cA=matrixA[0]?.length||0, rB=matrixB.length, cB=matrixB[0]?.length||0; if(cA!==rB){showError(`Cannot mul: A cols (${cA}) != B rows (${rB}).`); return null;} if(rA===0||cB===0)return {matrix:createEmptyMatrix(rA,cB),details:"Resulted in empty."}; if(cA===0)return {matrix:createEmptyMatrix(rA,cB),details:"0 common dim -> zero."}; const res=createEmptyMatrix(rA,cB); for(let i=0;i<rA;i++)for(let j=0;j<cB;j++)for(let k=0;k<cA;k++)res[i][j]+=(matrixA[i]?.[k]||0)*(matrixB[k]?.[j]||0); let details=`Mul A (${rA}x${cA}) by B (${rB}x${cB}) -> C (${rA}x${cB})\nC[i][j] = Σ (A[i][k]*B[k][j])\nEx C[0][0]: `; if(rA>0&&cB>0&&cA>0){for(let k=0;k<cA;k++)details+=`${formatNumber(matrixA[0][k])}*${formatNumber(matrixB[k][0])}${k<cA-1?" + ":""}`; details+=` = ${formatNumber(res[0][0])}`;} return {matrix:res,details:details};}
    function power(matrix, exponent) { if (!matrix) { showError("Matrix missing for pow."); return null; } const r=matrix.length,c=matrix[0]?.length||0; if(r===0||c===0){showError("Cannot pow empty.");return null;} if(r!==c){showError("Matrix must be square for pow.");return null;} if(typeof exponent!=='number'||!Number.isInteger(exponent)||exponent<0){showError("Exp must be non-neg int.");return null;} if(exponent===0){const id=createEmptyMatrix(r,r);for(let i=0;i<r;i++)id[i][i]=1;return id;} if(exponent===1)return cloneMatrix(matrix); let res=cloneMatrix(matrix); for(let i=2;i<=exponent;i++){const mulRes=multiplyMatrices(res,matrix);if(!mulRes||!mulRes.matrix)return null;res=mulRes.matrix;} return res; }
    function isDiagonal(matrix) { if(!matrix){showError("Matrix missing for diag check.");return false;}const r=matrix.length;if(r===0)return true; const c=matrix[0]?.length||0;if(r!==c)return false; const tol=1e-10; for(let i=0;i<r;i++)for(let j=0;j<c;j++)if(i!==j&&Math.abs(matrix[i]?.[j]||0)>tol)return false; return true;}

    // --- Detail Calculation Helpers ---
    function calculateSarrusDetails(matrix) { const a=matrix[0][0],b=matrix[0][1],c=matrix[0][2],d=matrix[1][0],e=matrix[1][1],f=matrix[1][2],g=matrix[2][0],h=matrix[2][1],i=matrix[2][2];const t1=a*e*i,t2=b*f*g,t3=c*d*h,t4=c*e*g,t5=a*f*h,t6=b*d*i;const det=t1+t2+t3-t4-t5-t6; return `<strong>Rule of Sarrus (3x3):</strong>\nAugment:\n| ${formatNumber(a)} ${formatNumber(b)} ${formatNumber(c)} | ${formatNumber(a)} ${formatNumber(b)}\n| ${formatNumber(d)} ${formatNumber(e)} ${formatNumber(f)} | ${formatNumber(d)} ${formatNumber(e)}\n| ${formatNumber(g)} ${formatNumber(h)} ${formatNumber(i)} | ${formatNumber(g)} ${formatNumber(h)}\n\nSum(+) = ${formatNumber(t1)}+${formatNumber(t2)}+${formatNumber(t3)} = ${formatNumber(t1+t2+t3)}\nSum(-) = ${formatNumber(t4)}+${formatNumber(t5)}+${formatNumber(t6)} = ${formatNumber(t4+t5+t6)}\n\nDet = Sum(+) - Sum(-) = ${formatNumber(det)}`;}
    function calculateTriangleDetails(matrix) { const a=matrix[0][0],b=matrix[0][1],c=matrix[0][2],d=matrix[1][0],e=matrix[1][1],f=matrix[1][2],g=matrix[2][0],h=matrix[2][1],i=matrix[2][2];const t1=a*e*i,t2=b*f*g,t3=c*d*h,t4=c*e*g,t5=a*f*h,t6=b*d*i;const det=t1+t2+t3-t4-t5-t6; return `<strong>Triangle Rule (3x3):</strong>\nPositive (+):\n Main: ${formatNumber(t1)}\n T1: ${formatNumber(t2)}\n T2: ${formatNumber(t3)}\n Sum(+) = ${formatNumber(t1+t2+t3)}\n\nNegative (-):\n Anti: ${formatNumber(t4)}\n T3: ${formatNumber(t5)}\n T4: ${formatNumber(t6)}\n Sum(-) = ${formatNumber(t4+t5+t6)}\n\nDet = Sum(+) - Sum(-) = ${formatNumber(det)}`;}
    function calculateDeterminantUsingCofactorDetails(matrix, expansionRow = 0) { const n=matrix.length;if(n===0)return"Det 0x0=1.";if(n===1)return`det(${formatNumber(matrix[0][0])})=${formatNumber(matrix[0][0])}`;let detStr=`<strong>Expanding along row ${expansionRow+1}:</strong>\ndet(A) = Σ (-1)<sup>${expansionRow+1}+j</sup> * A<sub>${expansionRow+1},j</sub> * M<sub>${expansionRow+1},j</sub>\n\n`;let detVal=0;for(let j=0;j<n;j++){const Aij=matrix[expansionRow][j];const sgn=((expansionRow+j)%2===0)?1:-1;const Mij_m=submatrix(matrix,expansionRow,j);const Mij_d_o=determinant(Mij_m);const Mij_d=Mij_d_o?Mij_d_o.mainResult:NaN;const term=sgn*Aij*Mij_d;detVal+=term;detStr+=`Term j=${j+1}: C<sub>${expansionRow+1},${j+1}</sub> = (-1)<sup>${expansionRow+1}+${j+1}</sup> * M<sub>...</sub>\nA<sub>${expansionRow+1},${j+1}</sub>=${formatNumber(Aij)}\nMinor M<sub>...</sub>=det(\n${formatMatrixSimple(Mij_m)}\n)=${formatNumber(Mij_d)}\nCofactor C<sub>...</sub>=${formatNumber(sgn*Mij_d)}\nTerm=${formatNumber(Aij)}*${formatNumber(sgn*Mij_d)}=${formatNumber(term)}\n\n`;} detStr+=`<strong>Total Determinant = ${formatNumber(detVal)}</strong>`; return detStr;}
    function calculateInverseUsingAdjugateDetails(matrix, det, inverseMatrix) { const n=matrix.length;let detStr=`<strong>A<sup>-1</sup>=(1/detA)*adjA</strong>\ndetA=${formatNumber(det)}\n<strong>1.Cofactors:</strong>\n`;const cofM=createEmptyMatrix(n,n);for(let i=0;i<n;i++)for(let j=0;j<n;j++){const Mij_m=submatrix(matrix,i,j);const Mij_d_o=determinant(Mij_m);const Mij_d=Mij_d_o?Mij_d_o.mainResult:NaN;const sgn=((i+j)%2===0)?1:-1;cofM[i][j]=sgn*Mij_d;detStr+=` C<sub>${i+1},${j+1}</sub>=${formatNumber(cofM[i][j])}\n`;}detStr+=`\nCofactor Mtx C:\n${formatMatrixSimple(cofM)}\n`;const adjM_obj=transpose(cofM);const adjM=adjM_obj?adjM_obj.mainResult:null;if(!adjM){return detStr+"\nError creating Adjugate";}detStr+=`\n<strong>2.Adjugate adjA=C<sup>T</sup>:</strong>\n${formatMatrixSimple(adjM)}\n`;detStr+=`\n<strong>3.Inverse A<sup>-1</sup>:</strong>\n${formatMatrixSimple(inverseMatrix,{asFraction:true})}\n`;return detStr;}
    function calculateInverseUsingGaussJordanDetails(matrix) {
        const n = matrix.length;
        let A = matrix.map(row => [...row]);
        let I = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((_, j) => i === j ? 1 : 0));
        let steps = [];

        steps.push(`<strong>Invers dengan Gauss-Jordan</strong>
Langkah 0: Matriks Augmented [A|I]
${formatMatrixSimple(A)} | ${formatMatrixSimple(I)}`);

        for (let col = 0; col < n; col++) {
            let maxRow = col;
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) {
                    maxRow = row;
                }
            }

            if (A[maxRow][col] === 0) {
                return `<strong>Gauss-Jordan:</strong>
Matriks singular (tidak dapat diinvers)
${steps.join('\n')}`;
            }

            if (maxRow !== col) {
                [A[col], A[maxRow]] = [A[maxRow], A[col]];
                [I[col], I[maxRow]] = [I[maxRow], I[col]];
                steps.push(`Langkah ${col+1}: Tukar baris ${col+1} dan ${maxRow+1}`);
            }

            const pivot = A[col][col];
            for (let j = col; j < n; j++) {
                A[col][j] /= pivot;
            }
            for (let j = 0; j < n; j++) {
                I[col][j] /= pivot;
            }
            steps.push(`Langkah ${col+1}: Normalisasi baris ${col+1} dengan pivot ${formatNumber(pivot)}`);

            for (let row = 0; row < n; row++) {
                if (row !== col && A[row][col] !== 0) {
                    const factor = A[row][col];
                    for (let j = col; j < n; j++) {
                        A[row][j] -= factor * A[col][j];
                    }
                    for (let j = 0; j < n; j++) {
                        I[row][j] -= factor * I[col][j];
                    }
                    steps.push(`Langkah ${col+1}: Eliminasi baris ${row+1} menggunakan baris ${col+1} dengan faktor ${formatNumber(factor)}`);
                }
            }
        }

        return `<strong>Gauss-Jordan:</strong>
<details>
<summary>Langkah-langkah</summary>
<pre>
${steps.join('\n')}
</pre>
</details>
Invers A:
${formatMatrixSimple(I)}
</strong>`;
    }
    function calculateInverseUsingMontanteDetails(matrix) { return "<strong>Montante (Bareiss):</strong> Placeholder - Detailed step-by-step is highly complex."; }
    function calculateDeterminantUsingMontanteDetails(matrix) {
        const n = matrix.length;
        let A = matrix.map(row => [...row]);
        let steps = [];
        let pivot = 1;
        let detSign = 1;

        steps.push(`<strong>Langkah 0: Matriks Awal</strong>
${formatMatrixSimple(A)}`);

        for (let k = 0; k < n - 1; k++) {
            if (A[k][k] === 0) {
                let nonZeroRow = -1;
                for (let i = k + 1; i < n; i++) {
                    if (A[i][k] !== 0) {
                        nonZeroRow = i;
                        break;
                    }
                }
                if (nonZeroRow === -1) {
                    return `<strong>Montante:</strong>
Matriks singular (determinan = 0)
${steps.join('\n')}`;
                }
                [A[k], A[nonZeroRow]] = [A[nonZeroRow], A[k]];
                detSign *= -1;
                steps.push(`Langkah ${k+1}: Tukar baris ${k+1} dan ${nonZeroRow+1} (det × -1)`);
            }

            for (let i = k + 1; i < n; i++) {
                for (let j = k + 1; j < n; j++) {
                    A[i][j] = (A[i][j] * A[k][k] - A[i][k] * A[k][j]) / pivot;
                }
                A[i][k] = 0;
                steps.push(`Langkah ${k+1}: Eliminasi baris ${i+1} menggunakan baris ${k+1}`);
            }
            pivot = A[k][k];
        }

        const det = detSign * A[n-1][n-1];

        return `<strong>Montante (Bareiss):</strong>
<details>
<summary>Langkah-langkah</summary>
<pre>
${steps.join('\n')}
</pre>
</details>
Determinan = ${detSign} × ${formatNumber(A[n-1][n-1])} = ${formatNumber(det)}
</strong>`;
    }
    function calculateDeterminantUsingGaussianDetails(matrix) {
        const n = matrix.length;
        let A = matrix.map(row => [...row]);
        let steps = [];
        let detSign = 1;
        let rank = 0;

        steps.push(`<strong>Eliminasi Gauss untuk Determinan</strong>
Langkah 0: Matriks Awal
${formatMatrixSimple(A)}`);

        for (let col = 0; col < n; col++) {
            let maxRow = col;
            for (let row = col + 1; row < n; row++) {
                if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) {
                    maxRow = row;
                }
            }

            if (A[maxRow][col] === 0) {
                continue;
            }

            rank++;

            if (maxRow !== col) {
                [A[col], A[maxRow]] = [A[maxRow], A[col]];
                detSign *= -1;
                steps.push(`Langkah ${col+1}: Tukar baris ${col+1} dan ${maxRow+1} (det × -1)`);
            }

            for (let row = col + 1; row < n; row++) {
                const factor = A[row][col] / A[col][col];
                for (let col2 = col; col2 < n; col2++) {
                    A[row][col2] -= factor * A[col][col2];
                }
                steps.push(`Langkah ${col+1}: Hilangkan elemen di baris ${row+1}, kolom ${col+1} dengan faktor ${formatNumber(factor)}`);
            }
        }

        let det = detSign;
        for (let i = 0; i < n; i++) {
            det *= A[i][i];
        }

        return `<strong>Eliminasi Gauss:</strong>
<details>
<summary>Langkah-langkah</summary>
<pre>
${steps.join('\n')}
</pre>
</details>
Determinan = ${formatNumber(det)}
</strong>`;
    }

    // --- More Complex Operations (Returning Objects) ---
    function submatrix(matrix, rR, cR) { return matrix.filter((_,i)=>i!==rR).map(row=>row.filter((_,j)=>j!==cR)); }
    function cofactor(matrix, row, col) { const sub=submatrix(matrix,row,col); if(!sub)return null; const mDetObj=determinant(sub); if(mDetObj===null||mDetObj.mainResult===undefined)return null; return (((row+col)%2===0)?1:-1)*mDetObj.mainResult; }

    function determinant(matrixData) { if (!matrixData) { showError("Matrix missing for det."); return null; } const rows=matrixData.length; if (rows === 0) return { operationType: 'determinant', mainResult: 1, inputMatrix: [], methods: [{name:"Info",details:"Det of 0x0 is 1."}]}; const cols=matrixData[0]?.length||0; if (rows !== cols) { showError("Matrix must be square for det."); return null; } const inputM = cloneMatrix(matrixData); let detValue; if (rows === 1) detValue = matrixData[0][0]; else if (rows === 2) detValue = matrixData[0][0]*matrixData[1][1] - matrixData[0][1]*matrixData[1][0]; else { detValue = 0; for(let j=0;j<cols;j++){ const cof=cofactor(matrixData,0,j); if(cof===null)return null; detValue+=(matrixData[0]?.[j]||0)*cof;} } const methods = []; if (rows === 3) { methods.push({name:"Triangle Rule",details:calculateTriangleDetails(inputM)}); methods.push({name:"Sarrus Rule",details:calculateSarrusDetails(inputM)}); } if (rows > 1) methods.push({ name: "Cofactor Expansion", details: calculateDeterminantUsingCofactorDetails(inputM) }); methods.push({name:"Montante (Bareiss)",details:calculateDeterminantUsingMontanteDetails(inputM)}); methods.push({name:"Gaussian Elimination",details:calculateDeterminantUsingGaussianDetails(inputM)}); return { operationType:'determinant', mainResult:detValue, inputMatrix:inputM, methods:methods }; }
    function inverse(matrixData) { if (!matrixData) { showError("Matrix missing for inv."); return null; } const rows = matrixData.length; if (rows === 0) return {operationType:'inverse', mainResult:[], inputMatrix:[], methods:[{name:"Info",details:"Inv of empty."}]}; const cols = matrixData[0]?.length||0; if(rows!==cols){showError("Matrix must be square for inv.");return null;} const inputM = cloneMatrix(matrixData); const detRes = determinant(inputM); if(detRes===null||detRes.mainResult===undefined){showError("Cannot get det for inv.");return null;} const det = detRes.mainResult; const tol=1e-10; if(Math.abs(det)<tol){showError(`Singular matrix (det ≈ ${formatNumber(det)}).`);return null;} let invMtx; if(rows===1){invMtx=[[1/matrixData[0][0]]];}else{ const cofM=createEmptyMatrix(rows,rows); for(let i=0;i<rows;i++)for(let j=0;j<rows;j++){const cof=cofactor(matrixData,i,j);if(cof===null){showError(`Cofactor err at (${i},${j}).`);return null;}cofM[i][j]=cof;} const adjM_obj=transpose(cofM); if(!adjM_obj||!adjM_obj.mainResult){showError("Adj err.");return null;} const adjM = adjM_obj.mainResult; invMtx=multiplyScalar(adjM,1/det); } if(!invMtx){showError("Failed to calc inv with adj.");return null;} const methods = []; methods.push({name:"Adjugate Matrix",details:calculateInverseUsingAdjugateDetails(inputM,det,invMtx)}); methods.push({name:"Gauss-Jordan Elimination",details:calculateInverseUsingGaussJordanDetails(inputM)}); methods.push({name:"Montante (Bareiss)",details:calculateInverseUsingMontanteDetails(inputM)}); return {operationType:'inverse',mainResult:invMtx,inputMatrix:inputM,methods:methods}; }

    // --- RREF, LU, Cholesky using Math.js with descriptive details ---
    function rowEchelonForm(matrixData) { if (!matrixData || matrixData.length === 0) return { operationType: 'rref', mainResult: [], inputMatrix: matrixData || [], methods: [{name:"Info", details:"RREF of empty."}]}; if (!window.math) { showError("Math.js not loaded."); return null; } try { const m = math.matrix(matrixData); const rrefRes = math.rref(m); const resM = (Array.isArray(rrefRes)?rrefRes[0]:rrefRes).toArray(); let pivInfo = ""; if(Array.isArray(rrefRes)&&rrefRes[1])pivInfo=`\nPivots (1-idx): ${rrefRes[1].map(p=>p+1).join(', ')}`; let dets = `<strong>RREF via Gaussian Elim & Gauss-Jordan.</strong>\nTransforms to RREF using row ops.\n(Details steps by Math.js).${pivInfo}\n`; return {operationType:'rref', mainResult:resM, inputMatrix:cloneMatrix(matrixData), methods:[{name:"Math.js rref()",details:dets}]}; } catch(e) { showError("RREF Error (Math.js): "+e.message); return null; } }
    function luDecomposition(matrixData) { if (!matrixData || matrixData.length === 0) return null; const r=matrixData.length,c=matrixData[0]?.length||0; if(r!==c){showError("LU needs square matrix.");return null;} if (!window.math) { showError("Math.js not loaded."); return null; } try { const m = math.matrix(matrixData); const lu = math.lup(m); const L=lu.L.toArray(); const U=lu.U.toArray(); const P_m=math.matrix(math.zeros(r,r)); lu.p.forEach((v,i)=>P_m.set([i,v],1)); const P=P_m.toArray(); let dets = `<strong>LU Decomp (PA=LU) via Math.js.</strong>\nP: Permutation, L: Lower Tri, U: Upper Tri.\n\n<strong>P:</strong>\n${formatMatrixSimple(P)}\n<strong>L:</strong>\n${formatMatrixSimple(L)}\n<strong>U:</strong>\n${formatMatrixSimple(U)}\n`; return {operationType:'lu', mainResult:{L:L,U:U,P:P}, inputMatrix:cloneMatrix(matrixData), methods:[{name:"Math.js lup()",details:dets}]}; } catch(e) { showError("LU Error (Math.js): "+e.message); return null; } }
    function choleskyDecomposition(matrixData) { if (!matrixData || matrixData.length === 0) return null; const r=matrixData.length,c=matrixData[0]?.length||0; if(r!==c){showError("Cholesky needs square.");return null;} for(let i=0;i<r;i++)for(let j=i+1;j<c;j++)if(Math.abs((matrixData[i]?.[j]||0)-(matrixData[j]?.[i]||0))>1e-9){showError("Cholesky needs symmetric.");return null;} if (!window.math) { showError("Math.js not loaded."); return null; } try { const m = math.matrix(matrixData); const L_m = math.cholesky(m); const L=L_m.toArray(); let dets = `<strong>Cholesky Decomp (A=L·L<sup>T</sup>) via Math.js.</strong>\nRequires symmetric positive definite matrix.\n\n<strong>L:</strong>\n${formatMatrixSimple(L)}\n`; return {operationType:'cholesky', mainResult:{L:L}, inputMatrix:cloneMatrix(matrixData), methods:[{name:"Math.js cholesky()",details:dets}]}; } catch(e) { showError("Cholesky Error (Math.js): "+e.message+"\n(Needs symmetric positive definite)."); return null; } }
    function rank(matrixData) {
        if (!matrixData || matrixData.length === 0) return { operationType: 'rank', mainResult: 0, inputMatrix: matrixData || [], methods: [{name:"Info", details:"Rank of empty is 0."}]};
        if (!window.math) { showError("Math.js not loaded."); return null; }
        try {
            const m = math.matrix(matrixData);
            const rankVal = math.rank(m);
             let details = `<strong>Rank calculated using Math.js.</strong>\n`;
             details += `Rank is the maximum number of linearly independent rows (or columns).\n`;
             details += `Often found by converting to Row Echelon Form and counting non-zero rows.\n`;
             return { operationType: 'rank', mainResult: rankVal, inputMatrix: cloneMatrix(matrixData), methods: [{ name: "Math.js rank()", details: details }] };
        } catch (e) {
            showError("Rank Error (Math.js): " + e.message);
            return null;
        }
    }

    // --- Custom Expression Evaluation (Basic) ---
    function evaluateCustomExpression(expr) { console.warn("Using basic expr parser."); expr=expr.replace(/\s+/g,''); if(!expr)return null; const terms=expr.split(/(?=[+-])|(?<=[+-])/g).filter(t=>t); if(terms.length===0){showError("Expr empty.");return null;} let currRes=parseTerm(terms[0]); if(currRes===null)return null; for(let i=1;i<terms.length;i+=2){const op=terms[i]; const nextTermStr=terms[i+1]; if(!nextTermStr){showError(`Op '${op}' needs term.`);return null;} if(op!=='+'&&op!=='-'){showError(`Unsupported op: '${op}'.`);return null;} const nextTermRes=parseTerm(nextTermStr); if(nextTermRes===null)return null; const isCurrM=Array.isArray(currRes)&&(currRes.length===0||Array.isArray(currRes[0])); const isNextM=Array.isArray(nextTermRes)&&(nextTermRes.length===0||Array.isArray(nextTermRes[0])); if(!isCurrM||!isNextM){showError(`Cannot op '${op}' matrix & non-matrix.`);return null;} if(op==='+')currRes=add(currRes,nextTermRes); else if(op==='-')currRes=subtract(currRes,nextTermRes); if(currRes===null)return null;} return currRes; }
    function parseTerm(term) { term=term.trim(); const m=term.match(/^([+-]?)(\d+(\.\d+)?)?(\*)?([A-Z][A-Z0-9]*)$/i); if(!m){showError(`Invalid term: "${term}".`);return null;} const sign=m[1]==='-'?-1:1; const sStr=m[2]; const star=m[4]==='*'; const mName=m[5].toUpperCase(); let scalar=sign; if(sStr){scalar=sign*parseFloat(sStr); if(!star){showError(`Invalid: "${term}". Missing '*'`);return null;}}else if(star){showError(`Invalid: "${term}". '*' w/o scalar.`);return null;} const mData=readMatrixData(mName); if(!mData)return null; if(scalar===1)return cloneMatrix(mData); else return multiplyScalar(mData,scalar); }

    // --- Event Listeners & Handlers ---
    function setupEventListeners() { matrixPanelsContainer.addEventListener('click',handlePanelClick); matrixPanelsContainer.addEventListener('input',handlePanelInput); addMatrixBtn.addEventListener('click',()=>{const n=getNextMatrixName();addMatrixPanel(n,3,3);const pN=String.fromCharCode(n.charCodeAt(0)-1);if(pN>='A'&&matrices[pN])addBinaryOpsPanel(pN,n);}); cleanOutputBtn.addEventListener('click',clearOutput); resetAllBtn.addEventListener('click',resetAll); displayDecimalsCheck.addEventListener('change',updateDecimalControlState); sigDigitsInput.addEventListener('input',updateDecimalControlState); evalExprBtn.addEventListener('click',()=>{const expr=customExprInput.value;if(!expr)return;clearOutput();const res=evaluateCustomExpression(expr);if(res!==null)displayResult(res,`Result of: "${expr}"`,null,'result-expr');});}
    function handlePanelClick(event) { const target=event.target;const button=target.closest('button');if(!button)return; const matrixName=button.dataset.matrix; const action=button.dataset.action; if(button.classList.contains('dim-btn')&&matrixName&&action)changeMatrixDimensions(matrixName,action); else if(button.classList.contains('op-btn')&&matrixName&&!button.classList.contains('bin-op'))handleSingleMatrixOperation(button); else if(button.classList.contains('bin-op'))handleBinaryMatrixOperation(button); else if(button.classList.contains('copy-btn'))handleCopyResult(button); else if(button.classList.contains('icon-btn')&&matrixName&&action){switch(action){case'upload':alert(`Upload ${matrixName} NI.`);break;case'paste':alert(`Paste ${matrixName} NI.`);break;case'remove':if(matrixName!=='A'&&matrixName!=='B'&&confirm(`Remove ${matrixName}?`))removeMatrixPanel(matrixName);break;}}}
    function handlePanelInput(event) { if(event.target.tagName==='INPUT'&&event.target.type==='number'&&event.target.closest('.matrix-grid'))handleMatrixInputChange(event); }

    function handleSingleMatrixOperation(button) { const op=button.dataset.op; const matrixName=button.dataset.matrix; const matrix=readMatrixData(matrixName); if(!matrix)return; let result=undefined; let opDesc=`${op}(${matrixName})`; const sourceId=`result-${matrixName}-${op}`; try { switch(op){ case 'det':result=determinant(matrix); opDesc=`Determinant(${matrixName})`; break; case 'inv':result=inverse(matrix); opDesc=`Inverse(${matrixName})`; break; case 'trans':result=transpose(matrix); opDesc=`Transpose(${matrixName})`; break; case 'rank':result=rank(matrix); opDesc=`Rank(${matrixName})`; break; case 'rref':result=rowEchelonForm(matrix); opDesc=`RREF(${matrixName})`; break; case 'lu':result=luDecomposition(matrix); opDesc=`LU Decomp(${matrixName})`; break; case 'chol':result=choleskyDecomposition(matrix); opDesc=`Cholesky(${matrixName})`; break; case 'diag':result=isDiagonal(matrix); opDesc=`Is ${matrixName} Diagonal?`; break; case 'mul-scalar':const sVal=parseFloat(document.getElementById(`scalar-${matrixName}`)?.value); if(isNaN(sVal)){showError("Invalid scalar.");return;} result=multiplyScalar(cloneMatrix(matrix),sVal); opDesc=`${formatNumber(sVal)}*${matrixName}`; break; case 'pow':const exp=parseInt(document.getElementById(`power-${matrixName}`)?.value); if(isNaN(exp)||exp<0){showError("Exp must be non-neg int.");return;} result=power(cloneMatrix(matrix),exp); opDesc=`${matrixName}^${exp}`; break; default: showError(`Unknown op: ${op}`); return; } if(result!==undefined)displayResult(result,opDesc,null,sourceId); } catch(e){console.error(`Calc Err (${opDesc}):`,e); showError(`Unexpected err: ${e.message}`);}}
    function handleBinaryMatrixOperation(button) { const op=button.dataset.op; const m1N=button.dataset.m1; const m2N=button.dataset.m2; const m1=readMatrixData(m1N); const m2=readMatrixData(m2N); if(!m1||!m2)return; let result=undefined; let opDesc=`${m1N} ${op} ${m2N}`; const srcId=`result-${m1N}-${op}-${m2N}`; try{ switch(op){ case 'add': result=add(m1,m2); break; case 'sub': result=subtract(m1,m2); break; case 'mul': result=multiplyMatrices(m1,m2); break; default: showError(`Unknown bin op: ${op}`); return;} if(result!==undefined)displayResult(result,opDesc,null,srcId); }catch(e){console.error(`Calc Err (${opDesc}):`,e); showError(`Unexpected err: ${e.message}`);}}
    function handleCopyResult(button) { const targetMName=button.dataset.target; const srcId=button.dataset.source; if(!lastResult){showError("No result to copy.");return;} if(lastResultSource!==srcId){showError("Result source mismatch.");return;} let mToCopy=null; if(Array.isArray(lastResult)&&(lastResult.length===0||Array.isArray(lastResult[0])))mToCopy=lastResult; else if(typeof lastResult==='object'&&lastResult!==null&&lastResult.mainResult&&Array.isArray(lastResult.mainResult))mToCopy=lastResult.mainResult; else if(typeof lastResult==='object'&&lastResult!==null&&lastResult.matrix&&Array.isArray(lastResult.matrix))mToCopy=lastResult.matrix; if(mToCopy===null){showError(`Cannot copy type ${typeof lastResult}`);return;} if(!matrices[targetMName]){showError(`Target ${targetMName} not found.`);return;} updateMatrixPanelData(targetMName,mToCopy); const fb=document.createElement('span');fb.textContent=" Copied!";fb.style.color="green";button.after(fb);setTimeout(()=>fb.remove(),1500);}

    function setupResultActionListeners() {
        if(insertResultABtn) insertResultABtn.addEventListener('click', () => { let matrixToInsert = null; if(lastResult && typeof lastResult === 'object' && lastResult.mainResult && Array.isArray(lastResult.mainResult)) matrixToInsert = lastResult.mainResult; else if(lastResult && Array.isArray(lastResult)) matrixToInsert = lastResult; if (matrixToInsert) updateMatrixPanelData('A', matrixToInsert); else showError("No valid matrix result to insert.");});
        if(insertResultBBtn) insertResultBBtn.addEventListener('click', () => { let matrixToInsert = null; if(lastResult && typeof lastResult === 'object' && lastResult.mainResult && Array.isArray(lastResult.mainResult)) matrixToInsert = lastResult.mainResult; else if(lastResult && Array.isArray(lastResult)) matrixToInsert = lastResult; if (matrixToInsert) updateMatrixPanelData('B', matrixToInsert); else showError("No valid matrix result to insert."); });
        if(cleanOutputBtnDetailed) cleanOutputBtnDetailed.addEventListener('click', clearOutput);
        if(copyResultBtnDetailed) copyResultBtnDetailed.addEventListener('click', () => { let txt=""; if(lastResult&&typeof lastResult==='object'&&lastResult.inputMatrix){txt+=`Input:\n${formatMatrixSimple(lastResult.inputMatrix)}\nRes (${lastResult.operationType}):\n`;txt+=typeof lastResult.mainResult==='number'?formatNumber(lastResult.mainResult):formatMatrixSimple(lastResult.mainResult,{asFraction:true});const openD=calculationMethodsContainer?.querySelector('details[open] div pre');if(openD)txt+=`\n\nDetails:\n${openD.textContent}`;}else if(lastResult){txt=resultGeneralOutput.textContent||"";} if(!txt.trim()){showError("Nothing to copy.");return;} navigator.clipboard.writeText(txt.trim()).then(()=>{copyResultBtnDetailed.innerHTML='<i class="fas fa-check"></i> Copied';setTimeout(()=>copyResultBtnDetailed.innerHTML='<i class="fas fa-copy"></i>',1500);}).catch(err=>showError('Failed to copy.'));});
        if(shareResultBtnDetailed) shareResultBtnDetailed.addEventListener('click', () => { let shareTxt="Matrix Calc:\n"; if(lastResult&&typeof lastResult==='object'&&lastResult.inputMatrix){shareTxt+=`Input:\n${formatMatrixSimple(lastResult.inputMatrix)}\nRes (${lastResult.operationType}):\n`;shareTxt+=typeof lastResult.mainResult==='number'?formatNumber(lastResult.mainResult):formatMatrixSimple(lastResult.mainResult,{asFraction:true});}else if(lastResult){shareTxt=resultGeneralOutput.textContent||"";}else{showError("Nothing to share.");return;} const sData={title:'Matrix Result',text:shareTxt}; if(navigator.share&&navigator.canShare(sData))navigator.share(sData).catch(err=>console.error("Share fail",err));else{navigator.clipboard.writeText(sData.text).then(()=>alert("Share API not supported. Copied.")).catch(err=>alert("Share & Copy failed."));}});
    }
    function updateDecimalControlState() { sigDigitsInput.disabled = !displayDecimalsCheck.checked; if (lastResult !== null && lastResultSource) { const descE = document.querySelector('#result-general-output .result-title, #result-detailed-view #result-summary-operation-symbol'); let desc = "Last Result"; if (descE){if(descE.id==='result-summary-operation-symbol'&&lastResult&&lastResult.operationType)desc=`${lastResult.operationType.charAt(0).toUpperCase()+lastResult.operationType.slice(1)} Result`;else desc=descE.textContent||"Last Result";} displayResult(lastResult, desc, null, lastResultSource); }}
    function resetAll() { if(!confirm("Reset all?"))return; matrixPanelsContainer.innerHTML=''; matrixPanelsContainer.appendChild(addMatrixBtn); matrices={}; nextMatrixName='C'; lastResult=null; lastResultSource=null; initialize(); customExprInput.value=''; clearOutput(); displayDecimalsCheck.checked=false; sigDigitsInput.value=4; updateDecimalControlState(); }

    // --- Start the application ---
    initialize();
});