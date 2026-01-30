import pandas as pd
from sklearn.linear_model import LogisticRegression
from sqlalchemy import select
from loguru import logger
import pickle
from pathlib import Path
from ..models import Aluno, Nota
from ..core.database import SessionLocal

MODEL_PATH = Path(__file__).resolve().parents[3] / "data" / "risk_model.pkl"

def train_risk_model():
    """
    Trains a simple logistic regression model to predict failure risk.
    Since we lack historical data, we use current data with heuristic labelling as a 'bootstrap'.
    """
    session = SessionLocal()
    try:
        # 1. Fetch Data
        stm = select(Aluno)
        alunos = session.execute(stm).scalars().all()
        
        data = []
        for aluno in alunos:
            # Aggregate grades
            total_score = 0
            low_grades_count = 0
            faltas = 0
            
            for nota in aluno.notas:
                # Use total or estimate based on trimesters
                score = float(nota.total or 0)
                if score < 60:
                    low_grades_count += 1
                total_score += score
                faltas += (nota.faltas or 0)
            
            # Heuristic Target: If > 2 low grades OR > 15 faltas -> Risk
            is_risk = 1 if (low_grades_count >= 2 or faltas > 15) else 0
            
            data.append({
                "mean_score": total_score / len(aluno.notas) if aluno.notas else 0,
                "low_grades": low_grades_count,
                "faltas": faltas,
                "target": is_risk
            })
            
        if not data:
            logger.warning("No data to train model.")
            return
            
        df = pd.DataFrame(data)
        
        # 2. Train Model
        X = df[["mean_score", "low_grades", "faltas"]]
        y = df["target"]
        
        model = LogisticRegression()
        model.fit(X, y)
        
        # 3. Save
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(model, f)
            
        logger.info(f"Risk model trained on {len(df)} records. Accuracy: {model.score(X, y):.2f}")
        
    finally:
        session.close()

def predict_risk(aluno_id: int) -> float:
    """
    Returns probability of risk (0.0 to 1.0) for a given student.
    """
    if not MODEL_PATH.exists():
        logger.info("Model not found, training new one...")
        train_risk_model()
        
    try:
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
            
        session = SessionLocal()
        aluno = session.get(Aluno, aluno_id)
        if not aluno:
            return 0.0
            
        # Extract features
        total_score = 0
        low_grades_count = 0
        faltas = 0
        for nota in aluno.notas:
            score = float(nota.total or 0)
            if score < 60:
                low_grades_count += 1
            total_score += score
            faltas += (nota.faltas or 0)
            
        features = pd.DataFrame([{
            "mean_score": total_score / len(aluno.notas) if aluno.notas else 0,
            "low_grades": low_grades_count,
            "faltas": faltas
        }])
        
        # Predict probability of class 1 (Risk)
        risk_prob = model.predict_proba(features)[0][1]
        return float(risk_prob)
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        return 0.0
    finally:
        session.close()
