from ultralytics import YOLO
import cv2

# Memuat model 'best.pt' yang harus ada di folder yang sama
model = YOLO('best.pt') 

# Membuka kamera laptop (index 0)
cap = cv2.VideoCapture(0)

print("Kamera sedang dibuka... Tekan 'Q' untuk berhenti.")

while cap.isOpened():
    success, frame = cap.read()
    if success:
        # Proses deteksi wajah
        results = model(frame, conf=0.5) 

        # Gambar kotak hasil deteksi
        annotated_frame = results[0].plot()
        
        # Tampilkan jendela video live
        cv2.imshow("Deteksi Wajah Niya - YOLOv8", annotated_frame)

        # Keluar jika menekan tombol 'q'
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    else:
        print("Gagal membaca kamera.")
        break

cap.release()
cv2.destroyAllWindows()