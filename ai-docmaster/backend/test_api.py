"""Quick API smoke test — run with: venv\Scripts\python test_api.py"""
import urllib.request, json, sys

BASE = "http://localhost:8000/api"

def get(path, token=None):
    req = urllib.request.Request(f"{BASE}{path}")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    r = urllib.request.urlopen(req, timeout=10)
    return json.loads(r.read())

def post(path, data, token=None):
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    r = urllib.request.urlopen(req, timeout=10)
    return json.loads(r.read())

errors = []

def check(label, result, key=None, expected=None):
    if isinstance(result, dict) and "error" in result:
        print(f"  FAIL  {label}: {result['error']}")
        errors.append(label)
        return result
    val = result.get(key) if key else result
    status = "PASS"
    if expected and val != expected:
        status = "FAIL"
        errors.append(label)
    print(f"  {status}  {label}: {val}")
    return result

print("\n======= AI DocMaster API Smoke Test =======\n")

# 1. Health
r = get("/health")
check("Health", r, "status", "ok")

# 2. Admin login
r = post("/auth/login", {"email": "admin@aidocmaster.com", "password": "admin123!"})
check("Admin login", r, "role", "admin")
admin_tok = r.get("access_token", "")

# 3. Citizen login
r = post("/auth/login", {"email": "rajesh@example.com", "password": "citizen123!"})
check("Citizen login", r, "role", "citizen")
cit_tok = r.get("access_token", "")

# 4. Advocate login
r = post("/auth/login", {"email": "suresh.adv@example.com", "password": "advocate123!"})
check("Advocate login", r, "role", "advocate")

# 5. Admin stats
r = get("/admin/stats", admin_tok)
print(f"  INFO  Admin stats: users={r.get('total_users')} advocates={r.get('total_advocates')} cases={r.get('total_cases')}")

# 6. Advocates list
r = get("/advocates", cit_tok)
print(f"  INFO  Advocates returned: {len(r) if isinstance(r, list) else 'N/A'}")

# 7. AI Case Classification
r = post("/ai/classify", {"description": "My neighbour illegally occupied my ancestral land and constructed a compound wall"}, cit_tok)
check("AI Classify - category", r, "category", "Property Dispute")
check("AI Classify - confidence", {"confidence": r.get("confidence", 0) > 0}, "confidence", True)

# 8. Document checklist
r = post("/ai/document-checklist", {"category": "Property Dispute"}, cit_tok)
print(f"  INFO  Doc checklist mandatory items: {len(r.get('mandatory_documents', []))}")

# 9. Cases list (citizen)
r = get("/cases", cit_tok)
print(f"  INFO  Citizen cases: {len(r) if isinstance(r, list) else 'N/A'}")

# 10. Notifications
r = get("/notifications", cit_tok)
print(f"  INFO  Notifications: {len(r) if isinstance(r, list) else 'N/A'}")

print("\n============================================")
if errors:
    print(f"  {len(errors)} FAILURE(S): {', '.join(errors)}")
    sys.exit(1)
else:
    print("  ALL TESTS PASSED!")
print("============================================\n")
