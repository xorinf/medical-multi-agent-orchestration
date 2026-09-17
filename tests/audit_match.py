"""Tight audit — only the suspect paths + a self-check on match."""
import json, time, uuid
import urllib.request, urllib.error
BASE = 'http://127.0.0.1:5050/api'

def req(method, path, data=None, token=None, timeout=180):
    h = {'Content-Type':'application/json'}
    if token: h['Authorization'] = f'Bearer {token}'
    r = urllib.request.Request(f'{BASE}{path}',
        data=json.dumps(data).encode() if data else None,
        headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def check(label, cond, *info):
    print(f'  {"PASS" if cond else "FAIL"}  {label}', *('' if cond else info))
    assert cond

pemail = f'pat_{uuid.uuid4().hex[:6]}@x.com'
ppw = 'testpass1'
check('register patient', req('POST','/auth/register',{'email':pemail,'password':ppw,'role':'patient','name':'Pat'})[0] == 201)
ptok = req('POST','/auth/login',{'email':pemail,'password':ppw})[1]['access_token']
print('  patient token len:', len(ptok))

# 4 match calls in a row with different symptoms
for symptoms, expected in [
    ('I have chest pain and shortness of breath', 'cardiology'),
    ('New mole on my arm with irregular borders', 'dermatology'),
    ('Severe headache and blurred vision for 2 days', 'neurology'),
    ('My knee hurts when I walk up stairs', 'orthopedics'),
]:
    t0 = time.time()
    code, body = req('POST','/doctors/match',{'symptoms_text': symptoms}, token=ptok)
    elapsed = time.time() - t0
    ok = code == 200 and body.get('specialty') == expected
    check(f'match [{elapsed:.0f}s]: "{symptoms[:40]}…" → {body.get("specialty")}', ok, body.get('specialty'), expected)

# Refresh with proper cookie handling (this was the JSONDecodeError bug)
import http.cookiejar
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
code, body = req('POST','/auth/login',{'email':pemail,'password':ppw})
# Manually attach the refresh cookie from the response
login_resp = urllib.request.urlopen(urllib.request.Request(
    f'{BASE}/auth/login',
    data=json.dumps({'email':pemail,'password':ppw}).encode(),
    headers={'Content-Type':'application/json'}, method='POST'))
import re
cookies = login_resp.headers.get('Set-Cookie', '')
print('  login Set-Cookie present:', 'rt=' in cookies)
r2 = urllib.request.Request(f'{BASE}/auth/refresh', headers={'Cookie': cookies.split(';',1)[0]}, method='POST')
with urllib.request.urlopen(r2, timeout=30) as resp:
    body = json.loads(resp.read())
check('refresh with cookie', 'access_token' in body, body)

print('\nALL CHECKS PASS')
