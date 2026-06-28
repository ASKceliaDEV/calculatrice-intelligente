#importer Flask et render_template depuis le module flask 
# qui permet de créer une application web et de rendre des templates HTML.
from flask import Flask, render_template 

app = Flask(__name__) #le point d'entrée de l'application Flask, qui crée une instance de l'application.

@app.route("/")#utilisateur accède à la page d'accueil de l'application en visitant l'URL racine ("/").
def home():
    return render_template("index.html") #rend le template HTML "index.html" situé dans le dossier "templates".
@app.route("/graph")#utilisateur accède à la page graph de l'application en visitant l'URL "/graph.html".
def graph():
    return render_template("graph.html")
@app.route("/programmer")
def programmer():
    return render_template("programmer.html")
if __name__ == "__main__":
    app.run(debug=True)