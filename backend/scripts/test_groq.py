import os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

import urllib.request, json
key = os.environ.get('GROQ_API_KEY', '')
print(f"API Key found: {'YES' if key else 'NO'}")

# Simple text-only test (fast)
data = json.dumps({
    "model": "llama-3.3-70b-versatile",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Say OK"}]
}).encode()
req = urllib.request.Request(
    'https://api.groq.com/openai/v1/chat/completions',
    data=data,
    headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        resp = json.loads(r.read())
        print("Groq Chat API: OK —", resp['choices'][0]['message']['content'])
except Exception as e:
    print(f"Groq Chat API ERROR: {e}")
