#!/usr/bin/env python3
"""Quick test — EasyOCR on page 1 of Dharmasindhu"""
import sys, os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import fitz, easyocr, numpy as np

PDF_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public',
    'Dharmasindhu Marathi Translation Bapu Sastri Moghe 1886.pdf')

print("Loading model (first time = download ~100MB)...")
reader = easyocr.Reader(['hi'], gpu=False, verbose=False)
print("Model loaded!")

doc  = fitz.open(PDF_PATH)
page = doc[0]
mat  = fitz.Matrix(200/72.0, 200/72.0)
pix  = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
img  = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)

print("Running OCR on page 1...")
results = reader.readtext(img, detail=0, paragraph=True)
text = '\n'.join(results)
print(f"\nWords found: {len(text.split())}")
print("--- Sample text ---")
print(text[:500])
