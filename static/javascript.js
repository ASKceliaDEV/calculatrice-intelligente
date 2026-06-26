const display = document.getElementById("display");
//récupère l'élément HTML avec l'id "display" et le stocke dans la variable display pour pouvoir manipuler son contenu.
let resultatAffiche = false;
let premierNombre = 0;
let operation = "";
let modeDeg = true; // true pour Deg, false pour Rad
let modeText = document.getElementById("mode"); //indique le mode actuel (Deg ou Rad) à l'utilisateur
let secondMode = false; //indique si le bouton "2nd" a été activé pour afficher les fonctions secondaires
display.value = "";

function effacer() {
  display.value = "";
}

function calculer() {
  // les boutons affichent ÷ × − mais eval() a besoin de / * -
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
  if (n < 0) return "erreur";
  if (n === 0 || n === 1) return 1;
  let resultat = 1;
  for (let i = 2; i <= n; i++) {
    resultat *= i;
  }
  return resultat;
}
function versRadians(valeur) {
  if (modeDeg) {
    //si je suis en mode degre il faut le convertire en radian
    return valeur * (Math.PI / 180);
  }
  return valeur; //deja en mode radian
}
function sinFonction() {
  display.value = Math.sin(versRadians(Number(display.value)));
  resultatAffiche = true;
}
function cosFonction() {
  display.value = Math.cos(versRadians(Number(display.value)));
  resultatAffiche = true;
}
function tanFonction() {
  //tan(90°) et tan(π/2) sont indéfinis, donc on affiche "erreur" dans ces cas
  if (modeDeg && Number(display.value) % 180 === 90) {
    display.value = "erreur";
  } else if (!modeDeg && Number(display.value) % Math.PI === Math.PI / 2) {
    display.value = "erreur";
  } else {
    display.value = Math.tan(versRadians(Number(display.value)));
  }
}
function cosInverseFonction() {
  let x = Number(display.value);
  if (x < -1 || x > 1) {
    display.value = "erreur";
    return;
  } else {
    display.value = Math.acos(x);
    resultatAffiche = true;
  }
}
function sinInverseFonction() {
  let x = Number(display.value);
  if (x < -1 || x > 1) {
    display.value = "erreur";
    return;
  } else {
    display.value = Math.asin(x);
    resultatAffiche = true;
  }
}
function tanInverseFonction() {
  let x = Number(display.value);
  let result = Math.atan(x);
  if (x < -1 || x > 1) {
    display.value = "erreur";
    return;
  } else {
    //si on est en mode degre on convertit le resultat en degre
    display.value = modeDeg ? Math.atan(x) * (180 / Math.PI) : result;
    resultatAffiche = true;
  }
}

const buttons = document.querySelectorAll(".btn button");

buttons.forEach(function (button) {
  button.addEventListener("click", function () {
    const value = button.textContent.trim();

    switch (value) {
      case "C":
        effacer();
        resultatAffiche = false;
        operation = "";
        break;

      case "CE":
        if (display.value === "erreur") {
          effacer();
        } else {
          display.value = display.value.slice(0, -1);
        }
        break;
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

      // opérateurs — affichés avec symboles spéciaux
      case "÷":
        affichageApresResultat("÷");
        break;
      case "×":
        affichageApresResultat("×");
        break;
      case "−":
        affichageApresResultat("−");
        break;

      case "π":
        display.value += Math.PI;
        break;

      case "e":
        display.value += Math.E;
        break;

      case "(":
        display.value += "(";
        break;

      case ")":
        display.value += ")";
        break;

      case "%":
        display.value += "%";
        break;

      case "±":
        if (display.value !== "" && display.value !== "erreur") {
          if (display.value.startsWith("-")) {
            display.value = display.value.slice(1);
          } else {
            display.value = "-" + display.value;
          }
        }
        break;

      case "x²":
        power2();
        resultatAffiche = true;
        break;

      case "x³":
        display.value = Math.pow(Number(display.value), 3);
        resultatAffiche = true;
        break;

      case "xʸ":
        power();
        break;

      case "eˣ":
        display.value = Math.exp(Number(display.value));
        resultatAffiche = true;
        break;

      case "10ˣ":
        display.value = Math.pow(10, Number(display.value));
        resultatAffiche = true;
        break;

      case "2ˣ":
        display.value = Math.pow(2, Number(display.value));
        resultatAffiche = true;
        break;

      case "|x|":
        display.value = Math.abs(Number(display.value));
        resultatAffiche = true;
        break;

      case "√":
        display.value = Math.sqrt(Number(display.value));
        resultatAffiche = true;
        break;

      case "ln":
        if (Number(display.value) <= 0) {
          display.value = "erreur";
        } else {
          display.value = Math.log(Number(display.value));
        }
        resultatAffiche = true;
        break;

      case "logₓ":
        if (Number(display.value) <= 0) {
          display.value = "erreur";
        } else {
          display.value = Math.log10(Number(display.value));
        }
        resultatAffiche = true;
        break;

      case "x!":
        display.value = factorielle(display.value);
        resultatAffiche = true;
        break;

      // boutons pour demain
      case "2nd":
        secondMode = !secondMode;
        break; // bascule entre les fonctions principales et secondaires
      case "mr":
      case "m+":
      case "mc":
      case "sin":
        sinFonction();
        break;
      case "cos":
        cosFonction();
        break;
      case "tan":
        tanFonction();
        break;
      case "Deg/Rad":
        modeDeg = !modeDeg; // bascule entre les modes Deg et Rad
        modeText.textContent = modeDeg ? "Deg" : "Rad"; // met à jour le texte affiché pour indiquer le mode actuel
        break;

      case "log꜀x":
        break;

      default:
        affichageApresResultat(value);
    }
  });
});
