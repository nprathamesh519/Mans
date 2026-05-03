import cv2
import numpy as np
import pickle
import pyttsx3
import time
from mtcnn import MTCNN
from keras_facenet import FaceNet
from numpy.linalg import norm

detector = MTCNN()
embedder = FaceNet()

with open("embeddings/data.pkl", "rb") as f:
    database, relations = pickle.load(f)

engine = pyttsx3.init()
engine.setProperty('rate', 150)

def speak(text):
    engine.say(text)
    engine.runAndWait()

def cosine_similarity(a, b):
    return np.dot(a, b) / (norm(a) * norm(b))

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

last_spoken = ""
last_time = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = detector.detect_faces(rgb)

    for res in results:
        x, y, w, h = res['box']
        x, y = abs(x), abs(y)

        face = rgb[y:y+h, x:x+w]
        if face.size == 0:
            continue

        face = cv2.resize(face, (160,160))
        face = np.expand_dims(face, axis=0)

        emb = embedder.embeddings(face)[0]

        name = "Unknown"
        best_score = 0.5

        for db_name, db_emb in database.items():
            score = cosine_similarity(emb, db_emb)
            if score > best_score:
                best_score = score
                name = db_name

        cv2.rectangle(frame, (x,y), (x+w,y+h), (0,255,0), 2)
        cv2.putText(frame, name, (x,y-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

        now = time.time()

        # Unknown detection
        if name == "Unknown":
            if now - last_time > 5:
                speak("Unknown person detected")
                last_time = now

        # Known detection
        else:
            if name != last_spoken or now - last_time > 10:
                relation = relations.get(name, "")
                speak(f"{name}. {relation}")
                last_spoken = name
                last_time = now

    cv2.imshow("Lucidia Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
