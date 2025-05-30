from flask import Flask, request, jsonify
import numpy as np
from operasi import *
from flask import send_from_directory

app = Flask(__name__)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/matrix', methods=['POST'])
def api_matrix():
    data = request.json
    A = np.array(data['A'])
    B = np.array(data['B'])
    scalarA = data.get('scalarA', 1)
    scalarB = data.get('scalarB', 1)
    op = data['op']

    try:
        if op == 'detA':
            hasil = determinan(A)
        elif op == 'invA':
            hasil = invers(A)
        elif op == 'transA':
            hasil = transpose(A)
        elif op == 'skalarA':
            hasil = perkalian_skalar(A, scalarA)
        elif op == 'detB':
            hasil = determinan(B)
        elif op == 'invB':
            hasil = invers(B)
        elif op == 'transB':
            hasil = transpose(B)
        elif op == 'skalarB':
            hasil = perkalian_skalar(B, scalarB)
        elif op == 'penjumlahan':
            hasil = penjumlahan(A, B)
        elif op == 'pengurangan':
            hasil = pengurangan(A, B)
        elif op == 'perkalian':
            hasil = perkalian(A, B)
        else:
            hasil = 'Operasi tidak dikenali'
    except Exception as e:
        hasil = str(e)

    return jsonify({'hasil': hasil})

if __name__ == '__main__':
    app.run(debug=True)