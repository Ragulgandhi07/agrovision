# AgroVision AI Backend & Telemetry Server

This backend powers real-time model inference for **Crop Foliar Pathology Diagnosis** and **Perimeter Wildlife Threat Detection**, as well as ESP32 multi-depth soil moisture telemetry ingestion.

---

## 1. Quick Setup & Local Execution

### Prerequisites
- Python 3.9+ installed
- Pip package manager

### Installation
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Running the Development Server
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
Once started, visit:
- **Interactive Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 2. Model Weights Integration

Place your trained model files into the `backend/weights/` folder:

1. **Wildlife Detection (YOLOv8):**
   - File: `backend/weights/yolov8n_wildlife.pt`
   - Framework: [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics)
   - Supported Classes: `Wild Boar`, `Asian Elephant`, `Spotted Deer`, `Bonnet Macaque`

2. **Crop Foliar Pathology (PyTorch / ResNet / MobileNet):**
   - File: `backend/weights/crop_pathology_resnet.pth`
   - Framework: [PyTorch](https://pytorch.org/)
   - Classes: `Tomato Early Blight`, `Potato Late Blight`, `Rice Leaf Blast`, `Corn Common Rust`, `Healthy Crops`

*Note: If no custom `.pt` or `.pth` weights are placed in `backend/weights/`, the backend automatically operates in integration-ready simulation mode.*

---

## 3. Connecting to the AgroVision Frontend

When running both locally:
1. Start the Vite React frontend:
   ```bash
   npm run dev
   # Runs on http://localhost:5173
   ```
2. Start the FastAPI backend:
   ```bash
   cd backend && uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```
3. The frontend's `AICropHealth` and `WildlifeDetection` components automatically detect `http://localhost:8000` and stream live inferences directly to the UI. If the backend is stopped, the frontend falls back seamlessly to client-side demonstration mode with full transparency.
