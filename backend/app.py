"""
AgroVision Backend - AI Inference & Telemetry Server
Built with FastAPI, PyTorch, and Ultralytics YOLOv8.
Provides REST endpoints for Crop Foliar Disease Classification and Wildlife Object Detection.
"""

import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import io
from PIL import Image

# Initialize FastAPI Application
app = FastAPI(
    title="AgroVision AI & Telemetry Backend",
    description="Inference API for Crop Leaf Pathology and Wildlife Intrusion Monitoring",
    version="1.0.0"
)

# Enable CORS for local Vite development (port 5173) and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths for Model Weights
MODEL_DIR = os.getenv("MODEL_DIR", os.path.join(os.path.dirname(__file__), "weights"))
YOLO_WEIGHTS_PATH = os.path.join(MODEL_DIR, "yolov8n_wildlife.pt")
CROP_MODEL_PATH = os.path.join(MODEL_DIR, "crop_pathology_resnet.pth")

# Optional PyTorch / Ultralytics Model Loaders
yolo_model = None
crop_model = None

try:
    from ultralytics import YOLO
    if os.path.exists(YOLO_WEIGHTS_PATH):
        yolo_model = YOLO(YOLO_WEIGHTS_PATH)
        print(f"[INFO] Loaded YOLOv8 Wildlife Model from {YOLO_WEIGHTS_PATH}")
    else:
        # Fallback to general yolov8n if custom wildlife weights are not yet trained
        print(f"[NOTICE] Custom wildlife weights not found at {YOLO_WEIGHTS_PATH}. Ready to load pretrained yolov8n.pt.")
except Exception as e:
    print(f"[NOTICE] Ultralytics YOLO not initialized: {e}")

try:
    import torch
    import torchvision.transforms as transforms
    if os.path.exists(CROP_MODEL_PATH):
        # Load PyTorch checkpoint
        crop_model = torch.load(CROP_MODEL_PATH, map_location=torch.device('cpu'))
        crop_model.eval()
        print(f"[INFO] Loaded Crop Pathology Model from {CROP_MODEL_PATH}")
    else:
        print(f"[NOTICE] Custom crop pathology weights not found at {CROP_MODEL_PATH}.")
except Exception as e:
    print(f"[NOTICE] PyTorch crop classifier not initialized: {e}")


@app.get("/api/health")
def health_check():
    """Health check endpoint to test server status and model loading readiness."""
    return {
        "status": "online",
        "service": "AgroVision AI Backend",
        "models": {
            "yolo_wildlife_loaded": yolo_model is not None,
            "crop_pathology_loaded": crop_model is not None
        },
        "weights_directory": MODEL_DIR
    }


@app.post("/api/predict-crop")
async def predict_crop_disease(file: UploadFile = File(...)):
    """
    Analyzes an uploaded leaf image for foliar disease symptoms.
    Returns: Crop type, Predicted Condition, Confidence score, Symptoms, and Agronomic Guidance.
    """
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload JPEG, PNG, or WebP.")

    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot decode image file.")

    # If PyTorch model is loaded, execute actual tensor inference
    if crop_model:
        # Standard torchvision preprocessing
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        tensor = transform(img).unsqueeze(0)
        with torch.no_grad():
            outputs = crop_model(tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            top_prob, top_idx = torch.topk(probabilities, 1)

        confidence_pct = f"{(top_prob.item() * 100):.1f}%"
        predicted_idx = top_idx.item()
        
        disease_database = {
            0: {
                "crop": "Tomato",
                "disease": "Early Blight (Alternaria solani)",
                "severity": "Moderate",
                "symptoms": "Dark brown concentric target rings on older foliage with chlorotic halos.",
                "prevention": "Rotate crops and apply drip irrigation at root zones to keep foliage dry.",
                "treatmentAdvice": "Apply organic Trichoderma harzianum or consult extension officer for copper fungicide spray."
            },
            1: {
                "crop": "Potato",
                "disease": "Late Blight (Phytophthora infestans)",
                "severity": "High",
                "symptoms": "Water-soaked dark lesions on leaf tips with white fungal sporulation.",
                "prevention": "Plant certified seed tubers and ensure rapid foliage drying.",
                "treatmentAdvice": "Ensure furrow drainage. Consult extension agronomist for copper hydroxide spray."
            },
            2: {
                "crop": "Paddy / Rice",
                "disease": "Rice Leaf Blast (Magnaporthe oryzae)",
                "severity": "High",
                "symptoms": "Spindle-shaped lesions with gray centers and reddish-brown borders.",
                "prevention": "Avoid excess nitrogen fertilizer. Seed treatment with Pseudomonas fluorescens.",
                "treatmentAdvice": "Apply bio-control formulation Pseudomonas fluorescens @ 2.5 kg/ha."
            },
            3: {
                "crop": "Maize / Corn",
                "disease": "Common Rust (Puccinia sorghi)",
                "severity": "Moderate",
                "symptoms": "Circular to elongate golden-brown to cinnamon-brown pustules on leaves.",
                "prevention": "Select rust-resistant hybrid cultivars and plant early.",
                "treatmentAdvice": "Maintain optimal potassium nutrition and consult for bio-spray."
            },
            4: {
                "crop": "Field Crop",
                "disease": "Healthy Foliage (No Pathogen Detected)",
                "severity": "None",
                "symptoms": "Uniform healthy green canopy with balanced chlorophyll.",
                "prevention": "Maintain balanced fertilization and regular field scouting.",
                "treatmentAdvice": "No chemical or bio-fungicide required."
            }
        }
        
        matched = disease_database.get(predicted_idx, disease_database[0]).copy()
        matched["confidence"] = confidence_pct
        return matched

    # No custom model loaded — return 503 so frontend uses transparent in-browser inference
    raise HTTPException(
        status_code=503,
        detail="Crop disease custom model not loaded in backend/weights/. Frontend will use client-side MobileNet inference."
    )


@app.post("/api/predict-wildlife")
async def predict_wildlife(file: UploadFile = File(...)):
    """
    Detects wildlife (Wild Boar, Elephant, Deer, Monkey) in an uploaded image or captured video frame.
    Returns: Common species name, Confidence, Threat priority, and Harmless deterrent advice.
    """
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload JPEG, PNG, or WebP.")

    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot decode image file.")

    # If YOLOv8 is loaded, execute actual object detection
    if yolo_model:
        results = yolo_model(img)
        detections = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                class_name = yolo_model.names.get(cls_id, "Animal")
                detections.append({
                    "class": class_name,
                    "confidence": f"{(conf * 100):.1f}%",
                    "bbox": [float(x) for x in box.xyxy[0].tolist()]
                })

        if detections:
            primary = detections[0]
            return {
                "commonName": primary["class"],
                "scientificName": "Identified Specimen",
                "defaultConfidence": primary["confidence"],
                "threatLevel": "Medium",
                "typicalHabit": "Perimeter intrusion detected near crop boundary.",
                "safetyGuidance": "Maintain safe distance. Use non-lethal acoustic deterrent.",
                "allDetections": detections
            }

    # No real model loaded — return 503 so the frontend falls through to TF.js COCO-SSD inference
    raise HTTPException(
        status_code=503,
        detail="Wildlife detection model not loaded. Frontend will use in-browser COCO-SSD inference."
    )


@app.get("/api/sensor-telemetry")
def get_sensor_telemetry():
    """
    Returns live or simulated soil moisture telemetry across depths (10cm, 30cm, 60cm).
    Ready for ingestion by ESP32 microcontrollers over HTTP POST or LoRaWAN gateways.
    """
    return {
        "gateway_status": "Online",
        "protocol": "LoRaWAN EU868 / IN865",
        "telemetry": {
            "soilMoisture10cm": 44,
            "soilMoisture30cm": 48,
            "soilMoisture60cm": 56,
            "soilTemperature": 26.5,
            "waterReserve": 82,
            "flowRateLpm": 14.2
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
