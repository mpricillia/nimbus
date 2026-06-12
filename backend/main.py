from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import os
import joblib
import tempfile
from supabase import create_client, Client
from dotenv import load_dotenv
from pipeline import PowerFlowPipeline

load_dotenv()

app = FastAPI(title="Nimbus ML API")

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline instance
pipeline = PowerFlowPipeline()

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project-url.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-service-role-key")

supabase: Optional[Client] = None
try:
    if SUPABASE_URL != "https://your-project-url.supabase.co":
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Failed to initialize Supabase: {e}")

class DatasetRequest(BaseModel):
    filename: str = "dataset.csv"

class EDARequest(BaseModel):
    feature_x: Optional[str] = None
    feature_y: Optional[str] = None

class FeatureSelectionRequest(BaseModel):
    selected_columns: List[str]

class FeatureEngineeringRequest(BaseModel):
    transformations: List[str]

class PreprocessRequest(BaseModel):
    test_size: float = 0.2
    random_state: int = 42
    apply_log: bool = True
    scaling: str = "standard"

class TrainRequest(BaseModel):
    model_algo: str
    custom_model_name: str
    params: Optional[Dict[str, Any]] = None

class PredictRequest(BaseModel):
    custom_model_name: str
    input_data: Dict[str, Any]

@app.get("/")
def read_root():
    return {"status": "Nimbus Core Online"}

@app.post("/api/load_data")
def load_data(req: DatasetRequest):
    try:
        info = pipeline.load_dataset(req.filename)
        return {"status": "success", "info": info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/eda")
def get_eda(req: EDARequest):
    try:
        stats = pipeline.get_eda_stats(feature_x=req.feature_x, feature_y=req.feature_y)
        return {"status": "success", "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/feature_selection")
def select_features(req: FeatureSelectionRequest):
    try:
        info = pipeline.select_features(req.selected_columns)
        return {"status": "success", "info": info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/feature_engineering")
def apply_feature_engineering(req: FeatureEngineeringRequest):
    try:
        info = pipeline.apply_feature_engineering(transformations=req.transformations)
        return {"status": "success", "info": info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/preprocess")
def preprocess_data(req: PreprocessRequest):
    try:
        info = pipeline.preprocess_data(
            test_size=req.test_size,
            random_state=req.random_state,
            apply_log=req.apply_log,
            scaling=req.scaling
        )
        return {"status": "success", "info": info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/train")
def train_model(req: TrainRequest):
    try:
        if supabase:
            try:
                # Check for existing models to prevent duplication
                existing_models = supabase.storage.from_("models").list()
                for item in existing_models:
                    if item.get("name") == req.custom_model_name:
                        raise HTTPException(status_code=400, detail=f"Model name '{req.custom_model_name}' already exists. Please choose a different name.")
            except HTTPException:
                raise
            except Exception as e:
                error_msg = str(e).lower()
                if "403" in error_msg or "row-level security" in error_msg or "unauthorized" in error_msg:
                    raise HTTPException(status_code=403, detail="Supabase Storage access denied (403). Please ensure your SUPABASE_KEY in .env is the 'service_role' key, not the 'anon' public key.")
                else:
                    print(f"Warning: Could not verify existing models in Supabase: {e}")

        result = pipeline.train_model(req.model_algo, req.custom_model_name, req.params)
        
        if supabase:
            try:
                # Save locally first in a temp directory to avoid triggering uvicorn reload
                temp_dir = tempfile.gettempdir()
                model_filename = os.path.join(temp_dir, f"{req.custom_model_name}.joblib")
                joblib.dump(pipeline.models[req.custom_model_name], model_filename)
                
                # Upload to Supabase Storage
                with open(model_filename, 'rb') as f:
                    res = supabase.storage.from_("models").upload(
                        path=f"{req.custom_model_name}/{req.custom_model_name}.joblib",
                        file=f,
                        file_options={"content-type": "application/octet-stream", "upsert": "true"}
                    )
                
                # Upload metadata.json
                import json
                from datetime import datetime
                metadata = {
                    "name": req.custom_model_name,
                    "algorithm": req.model_algo,
                    "created_at": datetime.now().isoformat(),
                    "metrics": result,
                    "params": req.params
                }
                metadata_filename = os.path.join(temp_dir, f"{req.custom_model_name}_metadata.json")
                with open(metadata_filename, 'w') as f:
                    json.dump(metadata, f)
                
                with open(metadata_filename, 'rb') as f:
                    supabase.storage.from_("models").upload(
                        path=f"{req.custom_model_name}/metadata.json",
                        file=f,
                        file_options={"content-type": "application/json", "upsert": "true"}
                    )
                    
                result["storage"] = "Model and metadata saved to Supabase Storage successfully."
            except Exception as e:
                error_msg = str(e).lower()
                if "403" in error_msg or "row-level security" in error_msg or "unauthorized" in error_msg:
                    raise HTTPException(status_code=403, detail="Supabase Storage access denied (403). Please ensure your SUPABASE_KEY in .env is the 'service_role' key, not the 'anon' public key.")
                result["storage"] = f"Failed to save to Supabase: {str(e)}"
        
        return {"status": "success", "result": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/predict")
def predict(req: PredictRequest):
    try:
        pred = pipeline.predict(req.custom_model_name, req.input_data)
        return {"status": "success", "prediction": pred}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/models")
def get_models():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured.")
    try:
        import json
        folders = supabase.storage.from_("models").list()
        models_list = []
        for folder in folders:
            folder_name = folder.get("name")
            if folder_name and folder_name != ".emptyFolderPlaceholder":
                try:
                    res = supabase.storage.from_("models").download(f"{folder_name}/metadata.json")
                    metadata = json.loads(res)
                    models_list.append(metadata)
                except Exception:
                    models_list.append({
                        "name": folder_name,
                        "created_at": folder.get("created_at"),
                        "metrics": None
                    })
        return {"status": "success", "models": models_list}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/models/{model_name}")
def delete_model(model_name: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured.")
    try:
        # Delete model file
        try:
            supabase.storage.from_("models").remove([f"{model_name}/{model_name}.joblib"])
        except Exception:
            pass
        # Delete metadata file
        try:
            supabase.storage.from_("models").remove([f"{model_name}/metadata.json"])
        except Exception:
            pass
        return {"status": "success", "message": f"Model '{model_name}' deleted."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

