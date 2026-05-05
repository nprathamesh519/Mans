from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import pickle
import os
import base64
from numpy.linalg import norm
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": [
        "https://mans-oarw.vercel.app",
        "http://localhost:5173"
    ]}},
    supports_credentials=True
)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
    
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE')
    return response

EMBED_PATH = os.path.join(os.path.dirname(__file__), "embeddings", "data.pkl")
os.makedirs(os.path.dirname(EMBED_PATH), exist_ok=True)

# ── Lazy load models (saves memory on startup) ────────────────────────────────
_detector = None
_embedder = None

def get_detector():
    global _detector
    if _detector is None:
        print("Loading MTCNN...", flush=True)
        from mtcnn import MTCNN
        _detector = MTCNN()
        print("MTCNN loaded", flush=True)
    return _detector

def get_embedder():
    global _embedder
    if _embedder is None:
        print("Loading FaceNet...", flush=True)
        from keras_facenet import FaceNet
        _embedder = FaceNet()
        print("FaceNet loaded", flush=True)
    return _embedder

# ── DB helpers ────────────────────────────────────────────────────────────────
def load_db():
    if os.path.exists(EMBED_PATH):
        with open(EMBED_PATH, "rb") as f:
            return pickle.load(f)
    return {}, {}

def save_db(database, relations):
    with open(EMBED_PATH, "wb") as f:
        pickle.dump((database, relations), f)

def cosine_similarity(a, b):
    return np.dot(a, b) / (norm(a) * norm(b))

def base64_to_rgb(b64_string):
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_bytes = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

def extract_embedding(rgb_image):
    results = get_detector().detect_faces(rgb_image)
    if not results:
        return None
    x, y, w, h = results[0]["box"]
    x, y = abs(x), abs(y)
    face = rgb_image[y:y+h, x:x+w]
    if face.size == 0:
        return None
    face = cv2.resize(face, (160, 160))
    face = np.expand_dims(face, axis=0)
    return get_embedder().embeddings(face)[0]


# ── GET /health ───────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ── POST /register ────────────────────────────────────────────────────────────
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    name      = data.get("name", "").strip()
    relation  = data.get("relation", "").strip()
    image_b64 = data.get("image", "")

    if not name or not image_b64:
        return jsonify({"success": False, "message": "name and image are required"}), 400

    try:
        rgb = base64_to_rgb(image_b64)
        emb = extract_embedding(rgb)
        if emb is None:
            return jsonify({"success": False, "message": "No face detected in the image"}), 400

        database, relations = load_db()
        if name in database:
            database[name] = (database[name] + emb) / 2
        else:
            database[name] = emb
        relations[name] = relation
        save_db(database, relations)
        return jsonify({"success": True, "message": f"{name} registered successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ── POST /recognize ───────────────────────────────────────────────────────────
@app.route("/recognize", methods=["POST"])
def recognize():
    data = request.json
    image_b64 = data.get("image", "")

    if not image_b64:
        return jsonify({"success": False, "message": "image is required"}), 400

    try:
        rgb = base64_to_rgb(image_b64)
        emb = extract_embedding(rgb)
        if emb is None:
            return jsonify({"success": True, "name": "Unknown", "relation": "", "score": 0})

        database, relations = load_db()
        if not database:
            return jsonify({"success": True, "name": "Unknown", "relation": "", "score": 0})

        best_name  = "Unknown"
        best_score = 0.5

        for db_name, db_emb in database.items():
            score = cosine_similarity(emb, db_emb)
            if score > best_score:
                best_score = score
                best_name  = db_name

        relation = relations.get(best_name, "") if best_name != "Unknown" else ""
        return jsonify({
            "success": True,
            "name": best_name,
            "relation": relation,
            "score": float(best_score)
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ── POST /sync ────────────────────────────────────────────────────────────────
@app.route("/sync", methods=["POST"])
def sync():
    data = request.json
    faces = data.get("faces", [])
    if not faces:
        return jsonify({"success": False, "message": "No faces provided"}), 400

    database, relations = {}, {}
    results = []

    for face in faces:
        name      = face.get("name", "").strip()
        relation  = face.get("relation", "").strip()
        image_b64 = face.get("image", "")
        if not name or not image_b64:
            continue
        try:
            rgb = base64_to_rgb(image_b64)
            emb = extract_embedding(rgb)
            if emb is None:
                results.append({"name": name, "status": "no face detected"})
                continue
            database[name] = emb
            relations[name] = relation
            results.append({"name": name, "status": "registered"})
        except Exception as e:
            results.append({"name": name, "status": str(e)})

    save_db(database, relations)
    return jsonify({"success": True, "results": results})
@app.route('/<path:path>', methods=["OPTIONS"])
def options_handler(path):
    return '', 200

# ── Start ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    print(f"Starting on port {port}", flush=True)
    app.run(host="0.0.0.0", port=port, debug=False)
