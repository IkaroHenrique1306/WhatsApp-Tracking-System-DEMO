from flask import Flask, render_template, request, redirect, jsonify
import json, os

app = Flask(__name__)
DADOS_FILE = "dados.json"

def carregar_dados():
    if not os.path.exists(DADOS_FILE):
        return {}
    with open(DADOS_FILE, "r", encoding="utf-8") as f:
        conteudo = f.read().strip()
    if not conteudo:
        return {}
    try:
        return json.loads(conteudo)
    except json.JSONDecodeError:
        return {}

def salvar_dados(dados):
    with open(DADOS_FILE, "w", encoding="utf-8") as f:
        json.dump(dados, f, indent=4, ensure_ascii=False)

def normalizar(dados):
    """Garante que os códigos sejam sempre listas."""
    for nome in dados:
        for numero, valor in dados[nome].items():
            if isinstance(valor, str):
                dados[nome][numero] = [valor]
    return dados

@app.route("/")
def index():
    dados = normalizar(carregar_dados())
    return render_template("index.html", dados=dados)

@app.route("/adicionar", methods=["POST"])
def adicionar():
    nome   = (request.form.get("nome")   or "").strip()
    numero = (request.form.get("numero") or "").strip()
    codigo = (request.form.get("codigo") or "").strip()
    if nome and numero and codigo:
        dados = normalizar(carregar_dados())
        if nome not in dados:
            dados[nome] = {}
        if numero not in dados[nome]:
            dados[nome][numero] = []
        if codigo not in dados[nome][numero]:
            dados[nome][numero].append(codigo)
            salvar_dados(dados)
    return redirect("/")

@app.route("/remover/<nome>/<numero>/<codigo>")
def remover(nome, numero, codigo):
    dados = normalizar(carregar_dados())
    if nome in dados and numero in dados[nome]:
        if codigo in dados[nome][numero]:
            dados[nome][numero].remove(codigo)
        if not dados[nome][numero]:
            del dados[nome][numero]
        if nome in dados and not dados[nome]:
            del dados[nome]
        salvar_dados(dados)
    return redirect("/")

@app.route("/dados")
def dados():
    return jsonify(normalizar(carregar_dados()))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
