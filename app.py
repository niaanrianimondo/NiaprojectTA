import cv2
import os
import numpy as np
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import mysql.connector
import threading

app = Flask(__name__)
CORS(app)

# ── KONEKSI MySQL ──
def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",       # sesuaikan username MySQL kamu
        password="",       # sesuaikan password MySQL kamu
        database="silat"
    )

# Pastikan folder penyimpanan data ada
if not os.path.exists('datawajah'):
    os.makedirs('datawajah')

# ── VARIABEL GLOBAL ──
status_deteksi = {"nama": "Mencari...", "kelas": "-", "confidence": 0}
frame_global = None          # frame terbaru dari kamera (untuk streaming)
kamera_aktif = False         # apakah kamera sedang berjalan
kamera_lock = threading.Lock()

# ══════════════════════════════════════════
# MJPEG STREAM — kirim frame ke browser
# ══════════════════════════════════════════
def generate_stream():
    global frame_global
    while True:
        with kamera_lock:
            frame = frame_global.copy() if frame_global is not None else None
        if frame is None:
            # Kirim frame hitam kalau kamera belum aktif
            blank = np.zeros((360, 480, 3), dtype=np.uint8)
            cv2.putText(blank, 'KAMERA TIDAK AKTIF', (80, 190),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 180, 180), 2)
            _, jpeg = cv2.imencode('.jpg', blank)
        else:
            _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

@app.route('/api/video-feed')
def video_feed():
    return Response(generate_stream(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# ── 0. AMBIL DAFTAR ATLET DARI DATABASE ──
@app.route('/api/get-atlet', methods=['GET'])
def get_atlet():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT id, nama, kelas, berat FROM atlet ORDER BY nama ASC")
        data = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ── 1. FUNGSI AMBIL FOTO WAJAH ──
@app.route('/api/take-image', methods=['POST'])
def rekam_data_wajah():
    global frame_global, kamera_aktif
    data = request.json
    nama = data.get('nama', 'Tanpa_Nama')
    kelas = data.get('kelas', 'Tanpa_Kelas')
    face_id = data.get('id', '1')

    def jalankan_kamera():
        global frame_global, kamera_aktif
        kamera_aktif = True
        cam = cv2.VideoCapture(0)
        faceDetector = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        ambilData = 1
        maxData = 30

        while True:
            retV, frame = cam.read()
            if not retV:
                break
            abuabu = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = faceDetector.detectMultiScale(abuabu, 1.3, 5)

            for (x, y, w, h) in faces:
                if ambilData <= maxData:
                    namaFile = f"datawajah/{face_id}_{nama}_{kelas}_{ambilData}.jpg"
                    cv2.imwrite(namaFile, abuabu[y:y+h, x:x+w])
                    ambilData += 1
                # Gambar kotak + counter di frame
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 255), 2)
                cv2.putText(frame, f"SAMPEL: {min(ambilData-1, maxData)}/{maxData}",
                            (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

            # Overlay info nama atlet
            cv2.putText(frame, f"REKAM: {nama.replace('-',' ')}",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 220, 255), 2)
            cv2.putText(frame, f"KELAS: {kelas.replace('-',' ')}",
                        (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 180, 180), 2)

            with kamera_lock:
                frame_global = frame.copy()

            if ambilData > maxData:
                break

        cam.release()
        kamera_aktif = False
        with kamera_lock:
            frame_global = None

    threading.Thread(target=jalankan_kamera, daemon=True).start()
    return jsonify({"status": "success", "message": f"Berhasil merekam 30 foto untuk {nama.replace('-',' ')}"})

# ── 2. FUNGSI TRAINING MODEL AI ──
@app.route('/api/training', methods=['POST'])
def training_wajah():
    path = 'datawajah'
    imagePaths = [os.path.join(path, f) for f in os.listdir(path) if f.endswith('.jpg')]
    faceSamples = []
    ids = []
    faceDetector = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    for imagePath in imagePaths:
        filename = os.path.basename(imagePath)
        parts = filename.split('_')
        if len(parts) < 4:
            continue
        face_id = int(parts[0])
        from PIL import Image
        img = Image.open(imagePath).convert('L')
        img_numpy = np.array(img, 'uint8')
        faces = faceDetector.detectMultiScale(img_numpy)
        for (x, y, w, h) in faces:
            faceSamples.append(img_numpy[y:y+h, x:x+w])
            ids.append(face_id)

    if len(faceSamples) == 0:
        return jsonify({"status": "error", "message": "Tidak ada data wajah untuk dilatih!"})

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(faceSamples, np.array(ids))
    recognizer.write('training.xml')
    return jsonify({"status": "success", "message": "Model AI berhasil dilatih!"})

# ── 3. FUNGSI LIVE ATTENDANCE ──
def proses_kamera_absensi():
    global status_deteksi, frame_global, kamera_aktif

    if not os.path.exists('training.xml'):
        return

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read('training.xml')
    faceDetector = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    mapping_atlet = {}
    for f in os.listdir('datawajah'):
        if f.endswith('.jpg'):
            parts = f.split('_')
            if len(parts) >= 3:
                mapping_atlet[int(parts[0])] = {"nama": parts[1], "kelas": parts[2]}

    kamera_aktif = True
    cam = cv2.VideoCapture(0)

    while kamera_aktif:
        retV, frame = cam.read()
        if not retV:
            break
        abuabu = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = faceDetector.detectMultiScale(abuabu, 1.3, 5)

        if len(faces) == 0:
            status_deteksi = {"nama": "Mencari...", "kelas": "-", "confidence": 0}
            cv2.putText(frame, "SCANNING...", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 180, 180), 2)

        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 148), 2)
            id_terdeteksi, conf = recognizer.predict(abuabu[y:y+h, x:x+w])

            if conf < 65 and id_terdeteksi in mapping_atlet:
                atlet = mapping_atlet[id_terdeteksi]
                match_pct = 100 - conf
                status_deteksi = {
                    "nama": atlet["nama"].replace("-", " "),
                    "kelas": atlet["kelas"],
                    "confidence": match_pct
                }
                label = f"{status_deteksi['nama']} ({match_pct:.0f}%)"
                cv2.putText(frame, label, (x, y-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 148), 2)
            else:
                status_deteksi = {"nama": "Tidak Dikenal", "kelas": "-", "confidence": 0}
                cv2.putText(frame, "Tidak Dikenal", (x, y-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        with kamera_lock:
            frame_global = frame.copy()

    cam.release()
    kamera_aktif = False
    with kamera_lock:
        frame_global = None

@app.route('/api/get-status', methods=['GET'])
def get_status():
    return jsonify(status_deteksi)

@app.route('/api/start-attendance', methods=['POST'])
def start_attendance():
    global kamera_aktif
    if not os.path.exists('training.xml'):
        return jsonify({"status": "error", "message": "File training.xml tidak ditemukan!"})
    kamera_aktif = True
    threading.Thread(target=proses_kamera_absensi, daemon=True).start()
    return jsonify({"status": "success", "message": "Kamera pendeteksi aktif!"})

@app.route('/api/stop-attendance', methods=['POST'])
def stop_attendance():
    global kamera_aktif, frame_global
    kamera_aktif = False
    with kamera_lock:
        frame_global = None
    return jsonify({"status": "success", "message": "Kamera dihentikan"})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)