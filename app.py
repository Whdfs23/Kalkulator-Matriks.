from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json()
    A_data = data.get("matrixA")
    B_data = data.get("matrixB") # Bisa None jika tidak ada
    op = data.get("operation")

    if A_data is None:
        return jsonify({"error": "Matriks A tidak ditemukan dalam permintaan."}), 400
    
    try:
        A = np.array(A_data, dtype=float) # Tentukan dtype untuk konsistensi
    except Exception as e:
        return jsonify({"error": f"Format Matriks A tidak valid: {str(e)}"}), 400

    B = None
    if B_data is not None:
        try:
            B = np.array(B_data, dtype=float) # Tentukan dtype untuk konsistensi
        except Exception as e:
            return jsonify({"error": f"Format Matriks B tidak valid: {str(e)}"}), 400

    if op is None:
        return jsonify({"error": "Operasi tidak ditemukan dalam permintaan."}), 400

    result = None # Inisialisasi result

    try:
        if op == "add":
            if B is None:
                return jsonify({"error": "Matriks B diperlukan untuk operasi penjumlahan."}), 400
            result = A + B
        elif op == "multiply": # Ini perkalian matriks (dot product)
            if B is None:
                return jsonify({"error": "Matriks B diperlukan untuk operasi perkalian matriks."}), 400
            result = np.dot(A, B)
        elif op == "determinant":
            result = np.linalg.det(A)
        elif op == "inverse":
            # Pastikan matriks adalah float untuk np.linalg.inv
            if A.dtype != float and A.dtype != np.float64: # atau np.float32
                 A = A.astype(float)
            result = np.linalg.inv(A) # Ini akan menghasilkan error jika singular, yang akan ditangkap
        else:
            return jsonify({"error": "Operasi tidak didukung oleh endpoint API ini."}), 400

        # Konversi hasil ke list untuk JSON. np.linalg.det mengembalikan float.
        if isinstance(result, np.ndarray):
            return jsonify({"result": result.tolist()})
        else: # Untuk determinan (float) atau hasil skalar lainnya
            return jsonify({"result": result})

    except np.linalg.LinAlgError as e: # Kesalahan aljabar linear spesifik (misal, matriks singular untuk invers)
        # Pesan error dari numpy mungkin dalam bahasa Inggris.
        pesan_error_id = str(e)
        if "singular matrix" in pesan_error_id.lower():
            pesan_error_id = "Matriks singular, tidak dapat diinvers."
        elif "last 2 dimensions of the array must be square" in pesan_error_id.lower():
             pesan_error_id = "Matriks harus persegi untuk operasi ini."
        # Tambahkan terjemahan lain jika diperlukan
        return jsonify({"error": f"Kesalahan Aljabar Linear: {pesan_error_id}"}), 400
    except ValueError as e: # Kesalahan nilai (misal, ketidakcocokan dimensi)
        pesan_error_id = str(e)
        if "shapes" in pesan_error_id.lower() and "not aligned" in pesan_error_id.lower():
            pesan_error_id = "Ketidakcocokan dimensi antar matriks."
        # Tambahkan terjemahan lain jika diperlukan
        return jsonify({"error": f"Kesalahan Nilai: {pesan_error_id}"}), 400
    except Exception as e: # Tangkapan umum untuk kesalahan tak terduga lainnya
        return jsonify({"error": f"Terjadi kesalahan umum pada server: {str(e)}"}), 400

if __name__ == "__main__":
    app.run(debug=True)
