from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    if request.method == "OPTIONS":
        response.status_code = 204
    return response

@app.route('/database.json', methods=['GET'])
def get_database_json():
    file_path = os.path.join(os.getcwd(), 'database.json')
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    cert_path = "cer.crt"
    key_path = "pri.key"
    app.run(
        host="0.0.0.0",
        port=5000,
        ssl_context=(cert_path, key_path),
        debug=True
    )
