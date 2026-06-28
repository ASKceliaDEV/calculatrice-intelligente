// ===== ÉTAT GLOBAL =====
let currentBase = "DEC";   // base active : DEC | HEX | OCT | BIN
let wordBits = 32;         // taille mot : 8 | 16 | 32
let currentValue = 0;      // valeur entière courante
let inputBuffer = "";      // ce que l'utilisateur tape
let pendingOp = null;      // opération en attente
let firstOperand = null;   // premier opérande
let memStore = 0;          // mémoire MS/MR
let history = [];          // historique

// ===== INITIALISATION =====
document.addEventListener("DOMContentLoaded", () => {
    buildBitsDisplay();
    updateDisplay();
    bindButtons();
    bindBaseRows();
    bindBaseBtns();
    bindWordSize();
    bindHistory();
});

// ===== AFFICHAGE =====
function updateDisplay() {
    const v = currentValue >>> 0; // traiter comme non signé 32 bits

    document.getElementById("val-dec").textContent =
        formatDec(applyWordMask(currentValue));
    document.getElementById("val-hex").textContent =
        applyWordMask(v).toString(16).toUpperCase().padStart(wordBits / 4, "0");
    document.getElementById("val-oct").textContent =
        applyWordMask(v).toString(8);
    document.getElementById("val-bin").textContent =
        formatBin(applyWordMask(v));

    updateBitsDisplay(applyWordMask(v));
    updateHexButtons();
}

function applyWordMask(v) {
    if (wordBits === 8)  return v & 0xFF;
    if (wordBits === 16) return v & 0xFFFF;
    return v & 0xFFFFFFFF;
}

function formatDec(v) {
    // gestion signe selon wordSize
    if (wordBits === 8  && v > 127)  return String(v - 256);
    if (wordBits === 16 && v > 32767) return String(v - 65536);
    if (wordBits === 32 && v > 2147483647) return String(v - 4294967296);
    return String(v);
}

function formatBin(v) {
    let s = v.toString(2).padStart(wordBits, "0");
    // groupes de 4
    return s.match(/.{1,4}/g).join(" ");
}

// ===== BITS VISUALIZER =====
function buildBitsDisplay() {
    const container = document.getElementById("bitsDisplay");
    container.innerHTML = "";
    for (let i = wordBits - 1; i >= 0; i--) {
        if (i < wordBits - 1 && (i + 1) % 4 === 0) {
            const spacer = document.createElement("span");
            spacer.style.width = "4px";
            container.appendChild(spacer);
        }
        const bit = document.createElement("div");
        bit.className = "bit";
        bit.id = "bit-" + i;
        bit.textContent = "0";
        bit.title = "bit " + i;
        bit.addEventListener("click", () => toggleBit(i));
        container.appendChild(bit);
    }
}

function updateBitsDisplay(v) {
    for (let i = 0; i < wordBits; i++) {
        const el = document.getElementById("bit-" + i);
        if (!el) continue;
        const isOne = (v >> i) & 1;
        el.textContent = isOne ? "1" : "0";
        el.className = "bit" + (isOne ? " one" : "");
    }
}

function toggleBit(i) {
    currentValue ^= (1 << i);
    inputBuffer = String(applyWordMask(currentValue));
    updateDisplay();
}

// ===== ENTRÉE CLAVIER/BOUTON =====
function appendDigit(d) {
    const maxLen = { DEC: 10, HEX: 8, OCT: 11, BIN: wordBits }[currentBase];
    if (inputBuffer.length >= maxLen) return;

    // valider le chiffre selon la base
    const valid = {
        DEC: /^[0-9]$/,
        HEX: /^[0-9A-Fa-f]$/,
        OCT: /^[0-7]$/,
        BIN: /^[01]$/,
    };
    if (!valid[currentBase].test(d)) return;

    inputBuffer = (inputBuffer === "0" ? "" : inputBuffer) + d;
    currentValue = parseInt(inputBuffer || "0", baseRadix());
    updateDisplay();
}

function baseRadix() {
    return { DEC: 10, HEX: 16, OCT: 8, BIN: 2 }[currentBase];
}

function clearAll() {
    currentValue = 0;
    inputBuffer = "";
    pendingOp = null;
    firstOperand = null;
    updateDisplay();
}

function backspace() {
    inputBuffer = inputBuffer.slice(0, -1) || "0";
    currentValue = parseInt(inputBuffer, baseRadix());
    updateDisplay();
}

// ===== OPÉRATIONS ARITHMÉTIQUES =====
function applyArith(op) {
    if (firstOperand !== null && pendingOp) {
        currentValue = evalArith(firstOperand, pendingOp, currentValue);
        updateDisplay();
    }
    firstOperand = currentValue;
    pendingOp = op;
    inputBuffer = "";
}

function evalArith(a, op, b) {
    a = applyWordMask(a);
    b = applyWordMask(b);
    switch (op) {
        case "+":   return applyWordMask(a + b);
        case "−":   return applyWordMask(a - b);
        case "×":   return applyWordMask(a * b);
        case "÷":   return b === 0 ? 0 : Math.trunc(a / b);
        case "DIV": return b === 0 ? 0 : Math.trunc(a / b);
        case "MOD": return b === 0 ? 0 : a % b;
        default:    return b;
    }
}

function calculateEquals() {
    if (firstOperand === null || !pendingOp) return;
    const expr = formatDec(applyWordMask(firstOperand)) + " " + pendingOp + " " + formatDec(applyWordMask(currentValue));
    currentValue = evalArith(firstOperand, pendingOp, currentValue);
    addHistory(expr, formatDec(applyWordMask(currentValue)));
    pendingOp = null;
    firstOperand = null;
    inputBuffer = String(applyWordMask(currentValue));
    updateDisplay();
}

// ===== OPÉRATIONS BIT À BIT =====
function applyBitOp(op) {
    const a = applyWordMask(currentValue);
    let result;
    let expr = "";

    switch (op) {
        case "AND":
            applyArith("AND"); return;
        case "OR":
            applyArith("OR"); return;
        case "XOR":
            applyArith("XOR"); return;
        case "NAND":
            applyArith("NAND"); return;
        case "NOR":
            applyArith("NOR"); return;
        case "XNOR":
            applyArith("XNOR"); return;
        case "NOT":
            result = applyWordMask(~a);
            expr = "NOT " + a;
            break;
        case "LSH":
            result = applyWordMask(a << 1);
            expr = a + " LSH 1";
            break;
        case "RSH":
            result = applyWordMask(a >> 1);
            expr = a + " RSH 1";
            break;
        case "RoL":
            result = applyWordMask((a << 1) | (a >>> (wordBits - 1)));
            expr = a + " RoL";
            break;
        case "RoR":
            result = applyWordMask((a >>> 1) | ((a & 1) << (wordBits - 1)));
            expr = a + " RoR";
            break;
        case "2's":
            result = applyWordMask((~a + 1));
            expr = "2's(" + a + ")";
            break;
        case "1's":
            result = applyWordMask(~a);
            expr = "1's(" + a + ")";
            break;
        case "ABS":
            result = applyWordMask(Math.abs(a));
            expr = "ABS(" + a + ")";
            break;
        default: return;
    }

    addHistory(expr, formatDec(result));
    currentValue = result;
    inputBuffer = String(result);
    updateDisplay();
}

// Opérations binaires avec 2 opérandes (AND, OR, XOR...)
const binaryBitOps = ["AND", "OR", "XOR", "NAND", "NOR", "XNOR"];

function evalBitOp2(a, op, b) {
    switch (op) {
        case "AND":  return applyWordMask(a & b);
        case "OR":   return applyWordMask(a | b);
        case "XOR":  return applyWordMask(a ^ b);
        case "NAND": return applyWordMask(~(a & b));
        case "NOR":  return applyWordMask(~(a | b));
        case "XNOR": return applyWordMask(~(a ^ b));
        default:     return b;
    }
}

// Surcharge evalArith pour bit ops à 2 opérandes
const _evalArith = evalArith;
function evalArith(a, op, b) {
    if (binaryBitOps.includes(op)) return evalBitOp2(a, op, b);
    return _evalArith(a, op, b);
}

// ===== CHANGEMENT DE BASE =====
function setBase(base) {
    currentBase = base;
    inputBuffer = applyWordMask(currentValue).toString(baseRadix()).toUpperCase();

    // activer le bon bouton
    document.querySelectorAll(".base-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.base === base);
    });

    // activer la bonne ligne display
    ["DEC","HEX","OCT","BIN"].forEach(b => {
        document.getElementById("row-" + b.toLowerCase())
            .classList.toggle("active", b === base);
    });

    updateHexButtons();
    updateDisplay();
}

function updateHexButtons() {
    const hexOnly = ["A","B","C","D","E","F"];
    hexOnly.forEach(c => {
        const el = document.getElementById("btn" + c);
        if (el) el.disabled = currentBase !== "HEX";
    });

    // désactiver 2-9 en BIN
    document.querySelectorAll(".btn-num").forEach(b => {
        const d = parseInt(b.textContent);
        if (currentBase === "BIN") b.disabled = d > 1;
        else if (currentBase === "OCT") b.disabled = d > 7;
        else b.disabled = false;
    });
}

// ===== HISTORIQUE =====
function addHistory(expr, result) {
    history.unshift({ expr, result });
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById("historyList");
    if (history.length === 0) {
        list.innerHTML = '<div class="history-empty">Aucun calcul pour l\'instant</div>';
        return;
    }
    list.innerHTML = history.map(h => `
        <div class="history-item" onclick="restoreFromHistory(${parseInt(h.result) || 0})">
            <div class="history-expression">${h.expr} =</div>
            <div class="history-result prog">${h.result}</div>
        </div>
    `).join("");
}

function restoreFromHistory(val) {
    currentValue = val;
    inputBuffer = String(val);
    updateDisplay();
}

// ===== BINDINGS =====
function bindButtons() {
    document.querySelectorAll(".btn button").forEach(btn => {
        btn.addEventListener("click", () => {
            const v = btn.textContent.trim();

            // chiffres et hex
            if (/^[0-9A-F]$/.test(v)) { appendDigit(v); return; }

            switch (v) {
                case "C":    clearAll(); break;
                case "CE":
                case "⌫":   backspace(); break;
                case "=":    calculateEquals(); break;
                case "+":
                case "−":
                case "×":
                case "÷":
                case "MOD":
                case "DIV":  applyArith(v); break;
                case "%":
                    currentValue = applyWordMask(Math.floor(currentValue / 100));
                    inputBuffer = String(currentValue);
                    updateDisplay();
                    break;
                case "±":
                    currentValue = applyWordMask(-currentValue);
                    inputBuffer = String(currentValue);
                    updateDisplay();
                    break;
                case ".": break; // pas de décimaux en mode programmer
                case "(":
                case ")": break;
                case "MS": memStore = currentValue; break;
                case "MR":
                    currentValue = memStore;
                    inputBuffer = String(memStore);
                    updateDisplay();
                    break;
                default:
                    // opérations bit à bit
                    if (["AND","OR","XOR","NOT","LSH","RSH","NAND","NOR","XNOR","RoL","RoR","2's","1's","ABS"].includes(v)) {
                        if (binaryBitOps.includes(v)) {
                            applyArith(v);
                        } else {
                            applyBitOp(v);
                        }
                    }
            }
        });
    });
}

function bindBaseRows() {
    ["dec","hex","oct","bin"].forEach(b => {
        document.getElementById("row-" + b).addEventListener("click", () => {
            setBase(b.toUpperCase());
        });
    });
}

function bindBaseBtns() {
    document.querySelectorAll(".base-btn").forEach(btn => {
        btn.addEventListener("click", () => setBase(btn.dataset.base));
    });
}

function bindWordSize() {
    document.querySelectorAll(".ws-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            wordBits = parseInt(btn.dataset.bits);
            document.querySelectorAll(".ws-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentValue = applyWordMask(currentValue);
            inputBuffer = String(currentValue);
            buildBitsDisplay();
            updateDisplay();
        });
    });
}

function bindHistory() {
    document.getElementById("clearHistory").addEventListener("click", () => {
        history = [];
        renderHistory();
    });
}