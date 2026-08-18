from flask import Flask, jsonify, request
import json
import os
import re
from datetime import datetime, timezone

app = Flask(__name__)

# Always resolve the database next to this Python file. This avoids Render working-directory issues.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_FILE = os.path.join(BASE_DIR, "database.json")

# Defensive test signatures. These only identify suspicious input; they do not execute it.
ATTACK_PATTERNS = {
    "xss": [
        r"<script\b",
        r"on(?:error|load|click|submit)\s*=",
        r"javascript:\s*",
        r"<img\b[^>]*onerror\s*=",
        r"<svg\b[^>]*onload\s*=",
        r"\b(?:alert|prompt|confirm)\s*\(",
        r"document\.(?:cookie|location|write)\b",
    ],
    "sqli": [
        r"\bunion\s+(?:all\s+)?select\b",
        r"\bselect\b.+\bfrom\b",
        r"\b(?:or|and)\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+",
        r"(?:--|/\*|\*/|#)\s*$",
    ],
    "path_traversal": [
        r"\.\./",
        r"\.\.\\",
        r"%2e%2e(?:%2f|/)",
        r"/etc/(?:passwd|shadow)\b",
    ],
    "command_injection": [
        r"(?:;|&&|\|\|)\s*(?:curl|wget|bash|sh|nc|powershell)\b",
        r"\b(?:system|exec|shell_exec|passthru)\s*\(",
    ],
    "ssti": [
        r"\{\{[^}]+\}\}",
        r"\$\{[^}]+\}",
        r"\{%[^%]+%\}",
    ],
    "ssrf": [
        r"https?://(?:127\.0\.0\.1|localhost|0\.0\.0\.0)",
        r"https?://169\.254\.169\.254",
    ],
}


def load_database():
    try:
        with open(DATABASE_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"attack_categories": {}, "worked": {}}


def save_database(data):
    tmp_file = DATABASE_FILE + ".tmp"
    with open(tmp_file, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)
    os.replace(tmp_file, DATABASE_FILE)


def detect_attacks(value):
    detected = []
    text = str(value)
    for category, patterns in ATTACK_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE | re.DOTALL):
                detected.append(category)
                break
    return detected


def collect_request_input():
    parts = [request.full_path, request.get_data(as_text=True)[:100000]]
    parts.extend(str(v) for v in request.args.values())
    parts.extend(str(v) for v in request.form.values())
    try:
        body = request.get_json(silent=True)
        if body is not None:
            parts.append(json.dumps(body))
    except Exception:
        pass
    return "\n".join(parts)


def record_detection(categories):
    data = load_database()
    attack_categories = data.setdefault("attack_categories", {})
    worked = data.setdefault("worked", {})
    now = datetime.now(timezone.utc).isoformat()
    attacker_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown").split(",")[0].strip()
    endpoint = request.path

    for category in categories:
        bucket = attack_categories.setdefault(category, {})
        numeric_keys = [int(k) for k in bucket.keys() if str(k).isdigit()]
        next_key = str(max(numeric_keys, default=0) + 1)
        bucket[next_key] = {
            "Attack_On_Endpoint": endpoint,
            "Attack_Time": now,
            "Attacker_Ip": attacker_ip,
            "Reason": f"ATTACK_DETECTED: {category}",
            "Source": "live-waf-test",
        }

        worked_keys = [int(k) for k in worked.keys() if str(k).isdigit()]
        work_key = str(max(worked_keys, default=0) + 1)
        worked[work_key] = {
            "Block_At_Time": now,
            "Blocked_Ip": attacker_ip,
            "Reason_For_Block": f"{category.upper()} attack detected",
            "Endpoint": endpoint,
            "Source": "live-waf-test",
        }

    save_database(data)
    return attacker_ip, now


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response


@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "service": "FIREWALL WAF API",
        "test_endpoint": "/waf-test",
        "database_endpoint": "/database.json",
    })


@app.route("/waf-test", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def waf_test():
    """Safe defensive testing endpoint. Suspicious input is recorded, never executed."""
    if request.method == "OPTIONS":
        return ("", 204)

    payload = collect_request_input()
    categories = detect_attacks(payload)

    if categories:
        attacker_ip, timestamp = record_detection(categories)
        return jsonify({
            "status": "BLOCKED",
            "detected": True,
            "attack_categories": categories,
            "endpoint": request.path,
            "timestamp": timestamp,
            "attacker_ip": attacker_ip,
            "message": "Suspicious input detected and recorded. Payload was not executed.",
            "dashboard": "/database.json",
        }), 403

    return jsonify({
        "status": "ALLOWED",
        "detected": False,
        "endpoint": request.path,
        "message": "No configured attack signature matched this request.",
    }), 200


@app.route("/database.json", methods=["GET"])
def get_database_json():
    try:
        with open(DATABASE_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
