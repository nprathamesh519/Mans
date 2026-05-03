import os
import sys
import cv2
import numpy as np
import pickle
from mtcnn import MTCNN
from keras_facenet import FaceNet

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

detector = MTCNN()
embedder = FaceNet()

DATASET_DIR = "dataset"
EMBED_DIR = "embeddings"
os.makedirs(EMBED_DIR, exist_ok=True)

database = {}
relations = {}

for person in os.listdir(DATASET_DIR):
    person_path = os.path.join(DATASET_DIR, person)

    if not os.path.isdir(person_path):
        continue

    print(f"\n📁 Processing: {person}")

    name = person
    relation = ""
    embeddings = []

    # read info.txt
    info_path = os.path.join(person_path, "info.txt")
    if os.path.exists(info_path):
        with open(info_path, "r") as f:
            for line in f:
                if line.startswith("Name:"):
                    name = line.split(":")[1].strip()
                elif line.startswith("Relation:"):
                    relation = line.split(":")[1].strip()

    for file in os.listdir(person_path):
        if file.lower().endswith((".jpg", ".jpeg", ".png")):

            img_path = os.path.join(person_path, file)
            img = cv2.imread(img_path)

            if img is None:
                print("❌ Cannot read:", file)
                continue
            else:
                print("✅ Loaded:", file)

            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = detector.detect_faces(rgb)

            if not results:
                print("⚠️ No face detected:", file)
                continue

            x, y, w, h = results[0]['box']
            x, y = abs(x), abs(y)

            face = rgb[y:y+h, x:x+w]

            if face.size == 0:
                print("⚠️ Face crop failed:", file)
                continue

            face = cv2.resize(face, (160, 160))
            face = np.expand_dims(face, axis=0)

            emb = embedder.embeddings(face)[0]
            embeddings.append(emb)
            print("✔ Face encoded")

    if embeddings:
        database[name] = np.mean(embeddings, axis=0)
        relations[name] = relation
        print(f"✅ {name} registered")
    else:
        print(f"❌ No usable images for {person}")

with open("embeddings/data.pkl", "wb") as f:
    pickle.dump((database, relations), f)

print("\n🎉 Embeddings & relations saved successfully!")
