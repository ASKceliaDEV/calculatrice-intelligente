// ===== ÉTAT GLOBAL =====
const display = document.getElementById("display");
let resultatAffiche = false;
let premierNombre = 0;
let operation = "";
let modeDeg = true;
let modeText = document.getElementById("mode");
let secondMode = false;

// ===== MÉMOIRE =====
let memoire = 0;
let dernierResultat = 0; // stocke la valeur numérique brute
let modeExact = true;    // true = forme exacte, false = décimal
display.value = "";
//fonction de convention S<-->D
function gcd(a, b) {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { let t = b; b = a % b; a = t; }
  return a;
}
function toFractionLimitee(x, denomMax) {
  if (Math.abs(x) < 1e-9) return "0";
  const sign = x < 0 ? "-" : "";
  x = Math.abs(x);
  for (let d = 1; d <= denomMax; d++) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-9) {
      const g = gcd(n, d);
      const nd = n / g, dd = d / g;
      if (dd > denomMax) continue;
      return dd === 1 ? sign + nd : sign + nd + "/" + dd;
    }
  }
  return null;
}

function toExact(x) {
  if (isNaN(x) || !isFinite(x)) return null;

  // Multiples de π — seulement dénominateurs ≤ 12 (angles classiques)
  const ratio = x / Math.PI;
  const piFrac = toFractionLimitee(ratio, 12);
  if (piFrac) {
    if (piFrac === "1")  return "π";
    if (piFrac === "-1") return "-π";
    return piFrac.includes("/")
      ? piFrac.split("/")[0] + "π/" + piFrac.split("/")[1]
      : piFrac + "π";
  }

  // Racines carrées communes
  const racines = [
    { v: Math.sqrt(2)/2, l: "√2/2" },
    { v: Math.sqrt(3)/2, l: "√3/2" },
    { v: Math.sqrt(2),   l: "√2"   },
    { v: Math.sqrt(3),   l: "√3"   },
  ];
  for (const r of racines) {
    if (Math.abs(Math.abs(x) - r.v) < 1e-9)
      return (x < 0 ? "-" : "") + r.l;
  }

  // Fraction simple — dénominateur ≤ 999
  const frac = toFractionLimitee(x, 999);
  if (frac && frac !== String(parseFloat(x.toFixed(10)))) return frac;

  return null;
}

function afficherSD() {
  const exact = toExact(dernierResultat);
  if (modeExact && exact) {
    display.value = exact;
  } else {
    display.value = parseFloat(dernierResultat.toPrecision(10)).toString();
  }
}
// ===== UTILITAIRES =====
function effacer() {
  display.value = "";
}

function calculer() {
  let expression = display.value
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
  try {
    display.value = eval(expression);
  } catch {
    display.value = "erreur";
  }
}
function affichageApresResultat(value) {
  if (resultatAffiche) {
    effacer();
    resultatAffiche = false;
  }
  display.value += value;
  dernierResultat = Number(display.value); // ← ici
}
function power2() {
  display.value = Math.pow(Number(display.value), 2);
}

function power() {
  premierNombre = Number(display.value);
  operation = "pow";
  effacer();
}

function factorielle(n) {
  n = Number(n);
  if (n < 0 || !Number.isInteger(n)) return "erreur";
  if (n === 0 || n === 1) return 1;
  let resultat = 1;
  for (let i = 2; i <= n; i++) resultat *= i;
  return resultat;
}

// ===== CONVERSION DEGRÉS / RADIANS =====
function versRadians(valeur) {
  return modeDeg ? valeur * (Math.PI / 180) : valeur;
}
function versAffichage(radians) {
  return modeDeg ? radians * (180 / Math.PI) : radians;
}

// ===== FONCTIONS TRIGO DIRECTES =====
function sinFonction() {
  display.value = Math.sin(versRadians(Number(display.value)));
  dernierResultat = Number(display.value);
  resultatAffiche = true;
}
function cosFonction() {
  display.value = Math.cos(versRadians(Number(display.value)));
  dernierResultat = Number(display.value);
  resultatAffiche = true;
}
function tanFonction() {
  let angle = versRadians(Number(display.value));
  if (Math.abs(Math.cos(angle)) < 1e-10) {
    display.value = "erreur";
  } else {
    display.value = Math.tan(angle);
  }
  dernierResultat = Number(display.value);
  resultatAffiche = true;
}

// ===== FONCTIONS TRIGO INVERSES =====
function sinInverseFonction() {
  let x = Number(display.value);
  display.value = (x < -1 || x > 1) ? "erreur" : versAffichage(Math.asin(x));
  dernierResultat = Number(display.value);
  resultatAffiche = true;
}
function cosInverseFonction() {
  let x = Number(display.value);
  display.value = (x < -1 || x > 1) ? "erreur" : versAffichage(Math.acos(x));
  dernierResultat = Number(display.value);
  resultatAffiche = true;
}
function tanInverseFonction() {
  display.value = versAffichage(Math.atan(Number(display.value)));
  dernierResultat = Number(display.value);
  resultatAffiche = true;
}

// ===== GESTION DU MODE 2ND =====
function toggleSecondMode(button) {
  secondMode = !secondMode;
  button.style.background = secondMode ? "rgba(244,114,182,0.4)" : "";
  document.querySelectorAll("[data-second]").forEach(btn => {
    if (secondMode) {
      btn.dataset.original = btn.textContent;
      btn.textContent = btn.dataset.second;
    } else {
      btn.textContent = btn.dataset.original;
    }
  });
}

// ===== ÉVÉNEMENTS =====
const buttons = document.querySelectorAll(".btn button");

buttons.forEach(function(button) {
  button.addEventListener("click", function() {
    const value = button.textContent.trim();

    switch (value) {
      case "C":
        effacer();
        dernierResultat = Number(display.value);
        resultatAffiche = false;
        operation = "";
        break;

      case "CE":
      case "⌫":
        if (display.value === "erreur") {
          effacer();
        } else {
          display.value = display.value.slice(0, -1);
        }
        break;

      case "=":
        resultatAffiche = true;
        if (operation === "pow") {
          display.value = Math.pow(premierNombre, Number(display.value));
          operation = "";
        } else {
          calculer();
        }
        break;

      case "÷": affichageApresResultat("÷"); break;
      case "×": affichageApresResultat("×"); break;
      case "−": affichageApresResultat("−"); break;
      case "+": affichageApresResultat("+"); break;

      case "π": display.value += Math.PI; break;
      case "e":  display.value += Math.E;  break;
      case "(": display.value += "("; break;
      case ")": display.value += ")"; break;
      case "%": display.value += "%"; break;

      case "±":
        if (display.value && display.value !== "erreur") {
          display.value = display.value.startsWith("-")
            ? display.value.slice(1)
            : "-" + display.value;
        }
        break;

      case "x²": 
        power2(); 
        dernierResultat = Number(display.value);
        resultatAffiche = true; 
        break;

      case "x³":
        display.value = Math.pow(Number(display.value), 3);
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "xʸ": power(); break;

      case "eˣ":
        display.value = Math.exp(Number(display.value));
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "10ˣ":
        display.value = Math.pow(10, Number(display.value));
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "2ˣ":
        display.value = Math.pow(2, Number(display.value));
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "|x|":
        display.value = Math.abs(Number(display.value));
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "√":
        display.value = Math.sqrt(Number(display.value));
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "ln":
        display.value = Number(display.value) <= 0
          ? "erreur"
          : Math.log(Number(display.value));
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "log₁₀":
      case "logₓ":
        display.value = Number(display.value) <= 0
          ? "erreur"
          : Math.log10(Number(display.value));
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "log꜀x":
        const base = Number(prompt("Entrez la base du logarithme :"));
        if (isNaN(base) || base <= 0 || base === 1) {
          display.value = "erreur";
        } else {
          display.value = Number(display.value) <= 0
            ? "erreur"
            : Math.log(Number(display.value)) / Math.log(base);
        }
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "x!":
        display.value = factorielle(display.value);
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "1/x":
        display.value = Number(display.value) === 0
          ? "erreur"
          : 1 / Number(display.value);
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;

      case "2nd":
        toggleSecondMode(button);
        break;

      case "sin":
        secondMode ? sinInverseFonction() : sinFonction();
        break;
      case "cos":
        secondMode ? cosInverseFonction() : cosFonction();
        break;
      case "tan":
        secondMode ? tanInverseFonction() : tanFonction();
        break;

      case "sin⁻¹": sinInverseFonction(); break;
      case "cos⁻¹": cosInverseFonction(); break;
      case "tan⁻¹": tanInverseFonction(); break;
      case "S⇔D":
        if (isNaN(dernierResultat)) break; // sécurité
        modeExact = !modeExact;
        afficherSD();
        break;
      case "mc":
        memoire = 0;
        break;
      case "mr":
        display.value = memoire;
        dernierResultat = Number(display.value);
        resultatAffiche = true;
        break;
      case "m+":
        memoire += Number(display.value);
        break;
      case "m-":
        memoire -= Number(display.value);
        break;

      case "Deg/Rad":
        modeDeg = !modeDeg;
        modeText.textContent = modeDeg ? "Deg" : "Rad";
        break;

      default:
        affichageApresResultat(value);
    }
  });
});