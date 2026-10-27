# SignBridge AI Service — Real-Time Sign Language Recognition

> **Module AI & WebSocket Server**: Cung cấp khả năng nhận diện cử chỉ ngôn ngữ ký hiệu (ASL) thời gian thực cho ứng dụng di động SignBridge thông qua mô hình BiLSTM kết hợp MediaPipe Holistic.

---

## 1. Tổng quan Kiến trúc

```text
[Mobile Client (React Native)]
        │
        │ Base64 JPEG frames via WebSocket (10-15 FPS)
        ▼
[FastAPI WebSocket Server (server.py)]
        │
        ├── MediaPipe Holistic -> Trích xuất 126 tọa độ khớp tay (21 landmarks x 2 hands x 3)
        ├── Motion Gating -> Lọc cử động rác / trạng thái nghỉ
        ├── Sequence Normalization -> Chuẩn hóa chuỗi 30 khung hình
        ├── BiLSTM Neural Network (PyTorch) -> Dự đoán nhãn từ vựng
        └── Sentence Builder -> Ghép từ thành câu và làm mượt kết quả
        │
        ▼ Real-time JSON { pred_word, confidence, sentence }
[Mobile Client UI Update]
```

## 2. Cấu trúc thư mục

```text
ai-service/
├── data/
│   └── processed/
│       └── SignDetect_50/     # Landmark dataset (train / val)
├── models/
│   └── best_bilstm.pth        # Checkpoint trọng số mô hình PyTorch (BiLSTM)
├── src/
│   ├── config.py              # Tham số mô hình (Window size: 30, Features: 126)
│   ├── model.py               # Kiến trúc mạng BiLSTM 2 chiều
│   ├── dataset.py             # Data loader & batching
│   ├── extract_landmarks.py   # MediaPipe feature extractor
│   ├── inference.py           # Engine suy luận thời gian thực
│   ├── sentence_builder.py    # Xử lý ghép câu & lọc nhiễu
│   ├── utils.py               # Chuẩn hóa tọa độ landmarks
│   ├── train.py               # Script huấn luyện lại mô hình
│   └── server.py              # FastAPI WebSocket server
├── requirements.txt           # Thư viện phụ thuộc
└── README.md                  # Tài liệu hướng dẫn
```

## 3. Cài đặt & Khởi chạy

### Yêu cầu tiên quyết
- Python 3.9 - 3.11
- CUDA toolkit (tùy chọn, tự động dùng CPU nếu không có GPU)

### Cài đặt môi trường
```bash
cd ai-service
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### Khởi chạy Server
```bash
python src/server.py
```
Mặc định server sẽ lắng nghe tại: `http://0.0.0.0:8000`

## 4. WebSocket Endpoints

- **`ws://<server-ip>:8000/ws/predict`**: Endpoint nhận diện cử chỉ tự do và ghép câu liên tục cho màn hình Translation (`TranslationScreen`).
- **`ws://<server-ip>:8000/ws/practice`**: Endpoint kiểm tra cử chỉ theo mục tiêu bài học cho màn hình Luyện tập (`PracticeScreen`).
- **`GET /`**: Health-check kiểm tra tình trạng tải mô hình và danh sách nhãn.
