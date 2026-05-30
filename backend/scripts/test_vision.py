import os, sys, json, base64, fitz, io
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

import requests
key = os.environ.get('GROQ_API_KEY', '')
pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'frontend', 'public',
    'Dharmasindhu Marathi Translation Bapu Sastri Moghe 1886.pdf')

print(f"PDF exists: {os.path.exists(pdf_path)}")
doc = fitz.open(pdf_path)
page = doc[91]  # page 92
mat = fitz.Matrix(150/72.0, 150/72.0)
pix = page.get_pixmap(matrix=mat, colorspace=fitz.csGRAY)
b64 = base64.b64encode(pix.tobytes('png')).decode('utf-8')
print(f"Image size: {len(b64)//1024} KB")

r = requests.post(
    'https://api.groq.com/openai/v1/chat/completions',
    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    json={
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "max_tokens": 200,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": "Extract first 5 lines of Marathi/Sanskrit text from this page. Just the text."},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
        ]}]
    },
    timeout=60
)
print(f"Vision API Status: {r.status_code}")
if r.status_code == 200:
    print("Text:", r.json()['choices'][0]['message']['content'][:300])
else:
    print("Error:", r.text[:300])
