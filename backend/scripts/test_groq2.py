import os, sys, json
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
print(f"Key: {key[:20]}...")

r = requests.post(
    'https://api.groq.com/openai/v1/chat/completions',
    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    json={"model": "llama-3.3-70b-versatile", "max_tokens": 10, "messages": [{"role": "user", "content": "OK"}]},
    timeout=15
)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:500]}")
