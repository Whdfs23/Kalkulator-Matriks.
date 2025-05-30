import numpy as np
from fractions import Fraction

def matriks_ke_pecahan(mat):
    if isinstance(mat, (int, float)):
        return str(Fraction(mat).limit_denominator())
    if isinstance(mat, np.ndarray):
        return [[str(Fraction(x).limit_denominator()) for x in row] for row in mat]
    return mat

def determinan(mat):
    try:
        det = np.linalg.det(mat)
        return matriks_ke_pecahan(det)
    except np.linalg.LinAlgError:
        return "Matriks harus persegi (square) untuk menghitung determinan"

def invers(mat):
    try:
        inv = np.linalg.inv(mat)
        return matriks_ke_pecahan(inv)
    except np.linalg.LinAlgError:
        return "Matriks singular (determinan = 0), tidak memiliki invers"

def transpose(mat):
    trans = mat.T
    return matriks_ke_pecahan(trans)

def perkalian_skalar(mat, scalar):
    result = mat * scalar
    return matriks_ke_pecahan(result)

def penjumlahan(mat1, mat2):
    try:
        result = mat1 + mat2
        return matriks_ke_pecahan(result)
    except ValueError:
        return "Dimensi matriks harus sama untuk penjumlahan"

def pengurangan(mat1, mat2):
    try:
        result = mat1 - mat2
        return matriks_ke_pecahan(result)
    except ValueError:
        return "Dimensi matriks harus sama untuk pengurangan"

def perkalian(mat1, mat2):
    try:
        result = mat1 * mat2
        return matriks_ke_pecahan(result)
    except ValueError:
        return "Dimensi matriks harus sama untuk perkalian elemen-wise"