from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json()
    A = np.array(data["matrixA"])
    B = np.array(data["matrixB"]) if "matrixB" in data else None
    op = data["operation"]

    try:
        if op == "add":
            result = A + B
        elif op == "multiply":
            result = np.dot(A, B)
        elif op == "determinant":
            result = np.linalg.det(A)
        elif op == "inverse":
            result = np.linalg.inv(A).tolist()
        else:
            return jsonify({"error": "Operasi tidak didukung"}), 400

        return jsonify({"result": result.tolist()})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)