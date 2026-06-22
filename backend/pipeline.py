import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from catboost import CatBoostRegressor
import joblib
import os

class PowerFlowPipeline:
    def __init__(self, data_dir="../data"):
        self.data_dir = data_dir
        self.df = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_means = {}
        self.target_col = 'electricity_consumption'

    def load_dataset(self, filename="dataset.csv"):
        # Check potential paths for the dataset (Local vs Hugging Face deployment)
        possible_paths = [
            os.path.join(self.data_dir, "train.csv"),  # Local development
            "train.csv",                               # Hugging Face root if uploaded directly
            "data/train.csv"                           # Hugging Face if uploaded inside a data folder
        ]
        
        filepath = None
        for p in possible_paths:
            if os.path.exists(p):
                filepath = p
                break
                
        if not filepath:
            raise FileNotFoundError("Dataset train.csv not found on the server. Please ensure it is uploaded.")
            
        self.df = pd.read_csv(filepath)
        
        # Get basic info
        info = {
            "rows": self.df.shape[0],
            "columns": self.df.shape[1],
            "columns_list": self.df.columns.tolist(),
            "missing_values": self.df.isnull().sum().to_dict(),
            "dtypes": self.df.dtypes.astype(str).to_dict(),
            "head": self.df.head(5).to_dict('records') # snippet for Step 1
        }
        return info

    def get_eda_stats(self, feature_x=None, feature_y=None, sample_size=1000):
        if self.df is None:
            return {}
        
        num_df = self.df.select_dtypes(include=[np.number])
        desc = num_df.describe().to_dict()
        corr = num_df.corr().to_dict()
        
        # Sampling for visualizations
        df_sampled = self.df.sample(n=min(sample_size, len(self.df)), random_state=42)
        
        scatter_data = []
        if feature_x and feature_y and feature_x in df_sampled.columns and feature_y in df_sampled.columns:
            scatter_data = df_sampled[[feature_x, feature_y]].dropna().to_dict('records')
            
        # Boxplot data (sampled)
        boxplot_data = {}
        for col in num_df.columns:
            boxplot_data[col] = df_sampled[col].dropna().tolist()

        return {
            "summary": desc,
            "correlation": corr,
            "scatter_data": scatter_data,
            "boxplot_data": boxplot_data,
            "histogram_data": boxplot_data # same raw array can be used by frontend for histogram
        }
        
    def select_features(self, selected_columns):
        if self.df is None:
            raise ValueError("Dataset not loaded.")
        
        # Keep only selected columns + target if it exists
        cols_to_keep = list(set(selected_columns + [self.target_col]))
        cols_to_keep = [c for c in cols_to_keep if c in self.df.columns]
        self.df = self.df[cols_to_keep]
        
        return {"columns": self.df.columns.tolist()}

    def apply_feature_engineering(self, transformations):
        if self.df is None:
            raise ValueError("Dataset not loaded.")
            
        if 'date_components' in transformations and 'date' in self.df.columns:
            self.df['date'] = pd.to_datetime(self.df['date'])
            self.df['year'] = self.df['date'].dt.year
            self.df['month'] = self.df['date'].dt.month
            self.df['day_of_week'] = self.df['date'].dt.dayofweek
            self.df['day_of_year'] = self.df['date'].dt.dayofyear
            self.df['is_weekend'] = self.df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
            
        if 'cyclical' in transformations and 'date' in self.df.columns:
            if 'month' not in self.df.columns:
                self.df['date'] = pd.to_datetime(self.df['date'])
                self.df['month'] = self.df['date'].dt.month
                self.df['day_of_year'] = self.df['date'].dt.dayofyear
            self.df['month_sin'] = np.sin(2 * np.pi * self.df['month'] / 12)
            self.df['month_cos'] = np.cos(2 * np.pi * self.df['month'] / 12)
            self.df['day_sin'] = np.sin(2 * np.pi * self.df['day_of_year'] / 365)
            self.df['day_cos'] = np.cos(2 * np.pi * self.df['day_of_year'] / 365)
            
        if 'pandemic' in transformations and 'date' in self.df.columns:
            if 'year' not in self.df.columns:
                self.df['date'] = pd.to_datetime(self.df['date'])
                self.df['year'] = self.df['date'].dt.year
                self.df['month'] = self.df['date'].dt.month
            self.df['is_pandemic'] = np.where((self.df['year'] == 2020) & (self.df['month'] >= 3), 1, 0)
            
        if 'hdd' in transformations and 'temperature_2m_max' in self.df.columns:
            self.df['HDD'] = (18 - self.df['temperature_2m_max']).clip(lower=0)
        
        if 'daylight' in transformations and 'sunshine_duration' in self.df.columns and 'daylight_duration' in self.df.columns:
            self.df['daylight_ratio'] = self.df['sunshine_duration'] / (self.df['daylight_duration'] + 1)
            
        return {
            "columns": self.df.columns.tolist(),
            "shape": self.df.shape
        }
        
    def preprocess_data(self, test_size=0.2, random_state=42, apply_log=True, scaling="standard"):
        if self.df is None:
            raise ValueError("Dataset not loaded.")
            
        df_proc = self.df.copy()
        
        # Handle target
        if self.target_col in df_proc.columns:
            y = df_proc[self.target_col]
            if apply_log:
                y = np.log1p(y)
            X = df_proc.drop(columns=[self.target_col])
        else:
            raise ValueError(f"Target column {self.target_col} not found.")
            
        # Drop ID and date
        cols_to_drop = [c for c in ['ID', 'date'] if c in X.columns]
        X = X.drop(columns=cols_to_drop)
        
        # Label Encoding for categorical features (like cluster_id)
        cat_cols = X.select_dtypes(include=['object', 'category']).columns
        for col in cat_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            self.encoders[col] = le
            
        # Save feature means to fill missing values during prediction
        self.feature_means = X.mean().to_dict()
            
        # Train test split
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, shuffle=False
        )
        
        # Scaling
        if scaling == "standard":
            scaler = StandardScaler()
        elif scaling == "minmax":
            scaler = MinMaxScaler()
        elif scaling == "robust":
            scaler = RobustScaler()
        else:
            scaler = None
            
        scaled_features = []
        if scaler:
            num_cols = self.X_train.select_dtypes(include=[np.number]).columns
            scaled_features = num_cols.tolist()
            self.X_train[num_cols] = scaler.fit_transform(self.X_train[num_cols])
            self.X_test[num_cols] = scaler.transform(self.X_test[num_cols])
            self.scalers['main'] = scaler
            
        return {
            "train_shape": self.X_train.shape,
            "test_shape": self.X_test.shape,
            "features": X.columns.tolist(),
            "scaled_features": scaled_features
        }
        
    def train_model(self, model_algo, custom_model_name, params=None):
        if self.X_train is None:
            raise ValueError("Data not preprocessed.")
            
        if params is None:
            params = {}
            
        if model_algo == "linear":
            model = LinearRegression(**params)
        elif model_algo == "rf":
            model = RandomForestRegressor(random_state=42, **params)
        elif model_algo == "xgb":
            model = XGBRegressor(random_state=42, **params)
        elif model_algo == "lgbm":
            model = LGBMRegressor(random_state=42, verbose=-1, **params)
        elif model_algo == "catboost":
            model = CatBoostRegressor(random_seed=42, verbose=0, **params)
        else:
            raise ValueError(f"Unknown algorithm {model_algo}")
            
        # Train
        model.fit(self.X_train, self.y_train)
        self.models[custom_model_name] = model
        
        # Evaluate
        preds = model.predict(self.X_test)
        
        mae = mean_absolute_error(self.y_test, preds)
        rmse = np.sqrt(mean_squared_error(self.y_test, preds))
        r2 = r2_score(self.y_test, preds)
        
        feature_importance = {}
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            feature_importance = dict(zip(self.X_train.columns, importances))
            
        return {
            "model_name": custom_model_name,
            "algorithm": model_algo,
            "metrics": {
                "mae": float(mae),
                "rmse": float(rmse),
                "r2": float(r2)
            },
            "feature_importance": feature_importance
        }
        
    def predict(self, custom_model_name, input_data: dict, apply_log=True):
        if custom_model_name not in self.models:
            raise ValueError(f"Model {custom_model_name} not trained.")
            
        model = self.models[custom_model_name]
        df_in = pd.DataFrame([input_data])
        
        # Add missing columns with the training mean
        for col in self.X_train.columns:
            if col not in df_in.columns:
                df_in[col] = self.feature_means.get(col, 0)
                
        # Ensure order matches
        df_in = df_in[self.X_train.columns]
        
        # Apply encoders
        for col, le in self.encoders.items():
            if col in df_in.columns:
                # Basic handling of unseen labels
                known_classes = list(le.classes_)
                df_in[col] = df_in[col].apply(lambda x: str(x) if str(x) in known_classes else known_classes[0])
                df_in[col] = le.transform(df_in[col].astype(str))
                
        # Apply scaler
        if 'main' in self.scalers:
            scaler = self.scalers['main']
            num_cols = self.X_train.select_dtypes(include=[np.number]).columns
            df_in[num_cols] = scaler.transform(df_in[num_cols])
            
        pred_val = model.predict(df_in)[0]
        
        if apply_log:
            pred_val = np.expm1(pred_val)
            
        return float(pred_val)
