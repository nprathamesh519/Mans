from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import pickle
import os
import base64
from mtcnn import MTCNN
from keras_facenet import FaceNet
from numpy.linalg import norm

app = Flask(__name__)
CORS(app)

EMBED_PATH = os.path.join(os.path.dirname(__file__), "embeddings", "data.pkl")
os.makedirs(os.path.dirname(EMBED_PATH), exist_ok=True)

detector = MTCNN()
embedder = FaceNet()

# ── Load existing embeddings ──────────────────────────────────────────────────
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
    # Strip data URI prefix if present
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_bytes = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)

def extract_embedding(rgb_image):
    results = detector.detect_faces(rgb_image)
    if not results:
        return None
    x, y, w, h = results[0]["box"]
    x, y = abs(x), abs(y)
    face = rgb_image[y:y+h, x:x+w]
    if face.size == 0:
        return None
    face = cv2.resize(face, (160, 160))
    face = np.expand_dims(face, axis=0)
    return embedder.embeddings(face)[0]


# ── POST /register ────────────────────────────────────────────────────────────
# Called when caretaker adds a face photo
# Body: { name, relation, image (base64) }
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    name     = data.get("name", "").strip()
    relation = data.get("relation", "").strip()
    image_b64 = data.get("image", "")

    if not name or not image_b64:
        return jsonify({"success": False, "message": "name and image are required"}), 400

    try:
        rgb = base64_to_rgb(image_b64)
        emb = extract_embedding(rgb)

        if emb is None:
            return jsonify({"success": False, "message": "No face detected in the image"}), 400

        database, relations = load_db()

        # Average with existing embedding if person already registered
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
# Called when patient opens camera and scans a face
# Body: { image (base64) }
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
        best_score = 0.5  # threshold — same as Python module

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


# ── POST /sync ───────────────────────────────────────────────────────────────
# Re-registers all faces from Firestore in one call
# Body: { faces: [{ name, relation, image (base64) }] }
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


# ── GET /health ───────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    port = int(os.environ.get("PORT", 10000))
    print(f"Face Recognition API running on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
