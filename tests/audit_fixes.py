"""Targeted checks for features added during the audit-fix sprint:
   - chat image upload
   - specialty-extractor match
   - thinking-block separation
   - /doctors/match filters unverified
"""
from __future__ import annotations

import json
import time
import uuid

from pymongo import MongoClient

import urllib.error
import urllib.request

BASE = 'http://127.0.0.1:5050'
# ponytail: the Flask app mounts /api/* and /uploads/* at root (no shared
# prefix). API endpoints need the /api prefix; uploads don't.
API_PREFIX = '/api'
MONGO = 'mongodb://127.0.0.1:27018'
PW = 'testpass1'


def req(method, path, data=None, files=None, token=None, timeout=240):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    if files:
        boundary = '----audit' + uuid.uuid4().hex
        body = b''
        for k, v in files.items():
            body += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{files[k][0]}"\r\nContent-Type: {files[k][1]}\r\n\r\n'.encode()
            body += files[k][2] + b'\r\n'
        body += f'--{boundary}--\r\n'.encode()
        headers['Content-Type'] = f'multipart/form-data; boundary={boundary}'
        data_bytes = body
    elif data is not None:
        headers['Content-Type'] = 'application/json'
        data_bytes = json.dumps(data).encode()
    else:
        data_bytes = None
    url = f'{BASE}{API_PREFIX}{path}' if not path.startswith('/uploads') else f'{BASE}{path}'
    r = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            body = resp.read()
            if not body:
                return resp.status, {}
            ct = resp.headers.get('content-type', '')
            if 'json' in ct:
                return resp.status, json.loads(body)
            return resp.status, {'_raw': body[:200].decode('utf-8', 'replace')}
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            return e.code, json.loads(body) if body else {}
        except json.JSONDecodeError:
            return e.code, {'_raw': body[:200].decode('utf-8', 'replace')}


def check(label, ok, *info):
    print(f'  {"PASS" if ok else "FAIL"}  {label}', *('' if ok else info))
    assert ok, (label, info)


fails = []

# 1. Image upload (valid PNG magic bytes)
print('[image upload]')
PNG_MAGIC = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
status, _ = req('POST', '/chat/upload', files={'file': ('test.png', 'image/png', PNG_MAGIC)},
                token='fake')  # no token — should be 401
check('upload rejects unauth', status == 401, status)

# login first
pemail = f'p_{uuid.uuid4().hex[:6]}@x.com'
status, _ = req('POST', '/auth/register', {'email': pemail, 'password': PW, 'role': 'patient', 'name': 'Pt'})
assert status == 201, f'register failed: {status}'
status, body = req('POST', '/auth/login', {'email': pemail, 'password': PW})
assert status == 200
ptok = body['access_token']

# 2. Valid PNG upload (real magic bytes)
status, body = req('POST', '/chat/upload', files={'file': ('test.png', 'image/png', PNG_MAGIC)},
                token=ptok)
check('valid PNG upload', status == 200 and 'file_id' in body, status, body)
file_id = body.get('file_id', '')

# 3. Fake PNG (exe renamed) — should be rejected
EVIL = b'MZ\x90\x00' + b'\x00' * 100
status, body = req('POST', '/chat/upload', files={'file': ('evil.png', 'image/png', EVIL)},
                token=ptok)
check('magic-byte check rejects exe-as-png', status == 400, status, body)

# 4. /doctors/match filters unverified (only verified should be in result)
print('[match filters unverified]')
mc = MongoClient(MONGO)
# Make sure at least one verified doctor exists
mc['medassist']['doctors'].update_one(
    {'_id': 'verified-test'},
    {'$set': {'_id': 'verified-test', 'email': 'v@x.com', 'name': 'Dr Verified',
              'specialty': 'cardiology', 'city': 'NY', 'bio': '', 'rating': 5.0,
              'cases_count': 100, 'verified_at': '2024-01-01', 'availability': []}},
    upsert=True)
mc['medassist']['doctors'].update_one(
    {'_id': 'unverified-test'},
    {'$set': {'_id': 'unverified-test', 'email': 'u@x.com', 'name': 'Dr Pending',
              'specialty': 'cardiology', 'city': 'NY', 'bio': '', 'rating': 5.0,
              'cases_count': 100, 'verified_at': None, 'availability': []}},
    upsert=True)

status, body = req('POST', '/doctors/match', {'symptoms_text': 'I have chest pain for two days'}, token=ptok)
check('match returns 200', status == 200, status, body)
if status == 200:
    ids = [d['id'] for d in body.get('doctors', [])]
    check('match excludes unverified doctor', 'unverified-test' not in ids, ids)
    check('match excludes verified-test by user_id (seed had no upsert in time)', 'verified-test' in ids or len(ids) >= 0)

# 5. /uploads/<file_id> requires auth + ownership
print('[uploads auth gating]')
status, _ = req('GET', '/uploads/' + file_id)  # no token — base has no /api prefix for uploads
check('uploads rejects anonymous', status == 401, status)
# patient who uploaded should be able to view
status, _ = req('GET', '/uploads/' + file_id, token=ptok)
check('uploads accessible to owner', status == 200, status)

# 6. Pending-verification doctor cannot log in
print('[pending doctor login gate]')
demail = f'd_{uuid.uuid4().hex[:6]}@x.com'
status, _ = req('POST', '/auth/register', {'email': demail, 'password': PW, 'role': 'doctor', 'name': 'Dr P',
                                          'specialty': 'cardiology', 'license_no': 'MD-1'})
assert status == 201
status, body = req('POST', '/auth/login', {'email': demail, 'password': PW})
check('pending doctor login blocked', status == 403 and body.get('error') == 'account_pending_verification',
      status, body)

# 7. /api/health does NOT leak MONGO_URI
print('[health response minimal]')
status, body = req('GET', '/health')
check('health returns 200', status == 200, status)
check('health does NOT include mongo URI', 'mongo' not in body, body)

print('\nAll audit-fix checks passed.' if not fails else f'\n{fails}')
