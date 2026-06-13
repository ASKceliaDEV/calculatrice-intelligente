const display = document.getElementById("display");
let resultatAffiche = false;
let premierNombre = 0;
let operation = "";

display.value = "";

function effacer(){ 
    display.value = ""; 
} 

function calculer(){ 
    // les boutons affichent ÷ × − mais eval() a besoin de / * -
    let expression = display.value
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-");
    try{ 
        display.value = eval(expression); 
    } catch{ 
        display.value = "erreur"; 
    } 
} 

function affichageApresResultat(value){ 
    if(resultatAffiche){ 
        effacer(); 
        resultatAffiche = false; 
    } 
    display.value += value; 
} 

function power2(){ 
    display.value = Math.pow(Number(display.value), 2); 
} 

function power(){ 
    premierNombre = Number(display.value); 
    operation = "pow"; 
    effacer(); 
}

function factorielle(n){
    n = Number(n);
    if(n < 0) return "erreur";
    if(n === 0 || n === 1) return 1;
    let resultat = 1;
    for(let i = 2; i <= n; i++){
        resultat *= i;
    }
    return resultat;
}

const buttons = document.querySelectorAll(".btn button");

buttons.forEach(function(button){
    button.addEventListener("click", function(){
        const value = button.textContent.trim();

        switch(value){
            case "C":
                effacer();
                resultatAffiche = false;
                operation = "";
                break;

            case "CE":
                if(display.value === "erreur"){
                    effacer();
                } else {
                    display.value = display.value.slice(0, -1);
                }
                break;

            case "⌫":
                if(display.value === "erreur"){
                    effacer();
                } else {
                    display.value = display.value.slice(0, -1);
                }
                break;

            case "=":
                resultatAffiche = true;
                if(operation === "pow"){
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
                if(display.value !== "" && display.value !== "erreur"){
                    if(display.value.startsWith("-")){
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
                if(Number(display.value) <= 0){
                    display.value = "erreur";
                } else {
                    display.value = Math.log(Number(display.value));
                }
                resultatAffiche = true;
                break;

            case "logₓ":
                if(Number(display.value) <= 0){
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
            case "mr":
            case "m+":
            case "mc":
            case "sin":
            case "cos":
            case "tan":
            case "cot":
            case "sec":
            case "csc":
            case "Deg":
            case "log꜀x":
                break;

            default:
                affichageApresResultat(value);
        }
    });
});