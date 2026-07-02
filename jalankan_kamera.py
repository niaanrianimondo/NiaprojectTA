from ultralytics import YOLO
import cv2

# Memuat model yang sudah Anda latih
model = YOLO('best.pt') 

# Membuka kamera laptop
cap = cv2.VideoCapture(0)

print("Kamera terbuka! Tekan 'q' untuk keluar.")

while cap.isOpened():
    success, frame = cap.read()
    if success:
        # Jalankan deteksi otomatis
        results = model(frame, conf=0.5) 

        # Gambar kotak deteksi pada video
        annotated_frame = results[0].plot()
        
        # Tampilkan hasil secara live
        cv2.imshow("Deteksi Wajah Niya", annotated_frame)

        # Berhenti jika menekan tombol 'q'
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    else:
        break

cap.release()
cv2.destroyAllWindows()