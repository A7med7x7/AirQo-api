from datetime import datetime, timedelta

import gcsfs
import joblib
import mlflow
import numpy as np
import optuna
import pandas as pd
import pymongo as pm
from lightgbm import LGBMRegressor, early_stopping
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import GroupKFold
from sklearn.preprocessing import OneHotEncoder, LabelEncoder

from .config import configuration, db

project_id = configuration.GOOGLE_CLOUD_PROJECT_ID
bucket = configuration.FORECAST_MODELS_BUCKET
environment = configuration.ENVIRONMENT
additional_columns = ["site_id"]

pd.options.mode.chained_assignment = None


### This module contains utility functions for ML jobs.

class GCSUtils:
    """Utility class for saving and retrieving models from GCS"""

    # TODO: In future, save and retrieve models from mlflow instead of GCS
    @staticmethod
    def get_trained_model_from_gcs(project_name, bucket_name, source_blob_name):
        fs = gcsfs.GCSFileSystem(project=project_name)
        fs.ls(bucket_name)
        with fs.open(bucket_name + "/" + source_blob_name, "rb") as handle:
            job = joblib.load(handle)
        return job

    @staticmethod
    def upload_trained_model_to_gcs(
            trained_model, project_name, bucket_name, source_blob_name
    ):
        fs = gcsfs.GCSFileSystem(project=project_name)
        try:
            fs.rename(
                f"{bucket_name}/{source_blob_name}",
                f"{bucket_name}/{datetime.now()}-{source_blob_name}",
            )
            print("Bucket: previous model is backed up")
        except:
            print("Bucket: No file to updated")

        with fs.open(bucket_name + "/" + source_blob_name, "wb") as handle:
            job = joblib.dump(trained_model, handle)


class BaseMlUtils:
    """Base Utility class for ML related tasks"""

    # TODO: need to review this, may need to make better abstractions

    @staticmethod
    def preprocess_data(data, data_frequency, job_type):
        required_columns = {
            "device_id",
            "pm2_5",
            "timestamp",
        }
        if not required_columns.issubset(data.columns):
            missing_columns = required_columns.difference(data.columns)
            raise ValueError(
                f"Provided dataframe missing necessary columns: {', '.join(missing_columns)}"
            )
        try:
            data["timestamp"] = pd.to_datetime(data["timestamp"])
        except ValueError as e:
            raise ValueError(
                "datetime conversion error, please provide timestamp in valid format"
            )
        group_columns = (
            ["device_id"] + additional_columns
            if job_type == "prediction"
            else ["device_id"]
        )
        data["pm2_5"] = data.groupby(group_columns)["pm2_5"].transform(
            lambda x: x.interpolate(method="linear", limit_direction="both")
        )
        if data_frequency == "daily":
            data = (
                data.groupby(group_columns)
                .resample("D", on="timestamp")
                .mean(numeric_only=True)
            )
            data.reset_index(inplace=True)
        data["pm2_5"] = data.groupby(group_columns)["pm2_5"].transform(
            lambda x: x.interpolate(method="linear", limit_direction="both")
        )
        data = data.dropna(subset=["pm2_5"])
        return data

    @staticmethod
    def get_lag_and_roll_features(df, target_col, freq):
        if df.empty:
            raise ValueError("Empty dataframe provided")

        if (
                target_col not in df.columns
                or "timestamp" not in df.columns
                or "device_id" not in df.columns
        ):
            raise ValueError("Required columns missing")

        df["timestamp"] = pd.to_datetime(df["timestamp"])

        df1 = df.copy()  # use copy to prevent terminal warning
        if freq == "daily":
            shifts = [1, 2, 3, 7]
            for s in shifts:
                df1[f"pm2_5_last_{s}_day"] = df1.groupby(["device_id"])[
                    target_col
                ].shift(s)
            shifts = [2, 3, 7]
            functions = ["mean", "std", "max", "min"]
            for s in shifts:
                for f in functions:
                    df1[f"pm2_5_{f}_{s}_day"] = (
                        df1.groupby(["device_id"])[target_col]
                        .shift(1)
                        .rolling(s)
                        .agg(f)
                    )
        elif freq == "hourly":
            shifts = [1, 2, 6, 12]
            for s in shifts:
                df1[f"pm2_5_last_{s}_hour"] = df1.groupby(["device_id"])[
                    target_col
                ].shift(s)
            shifts = [3, 6, 12, 24]
            functions = ["mean", "std", "median", "skew"]
            for s in shifts:
                for f in functions:
                    df1[f"pm2_5_{f}_{s}_hour"] = (
                        df1.groupby(["device_id"])[target_col]
                        .shift(1)
                        .rolling(s)
                        .agg(f)
                    )
        else:
            raise ValueError("Invalid frequency")
        return df1

    @staticmethod
    def get_time_features(df, freq):
        if df.empty:
            raise ValueError("Empty dataframe provided")

        if "timestamp" not in df.columns:
            raise ValueError("Required columns missing")

        df["timestamp"] = pd.to_datetime(df["timestamp"])

        if freq not in ["daily", "hourly"]:
            raise ValueError("Invalid frequency")

        df1 = df.copy()
        attributes = ["year", "month", "day", "dayofweek"]
        if freq == "hourly":
            attributes.append("hour")

        for a in attributes:
            df1[a] = df1["timestamp"].dt.__getattribute__(a)

        df1["week"] = df1["timestamp"].dt.isocalendar().week

        return df1

    @staticmethod
    def get_cyclic_features(df, freq):
        df1 = BaseMlUtils.get_time_features(df, freq)

        attributes = ["year", "month", "day", "dayofweek"]
        max_vals = [2023, 12, 30, 7]
        if freq == "hourly":
            attributes.append("hour")
            max_vals.append(23)

        for a, m in zip(attributes, max_vals):
            df1[a + "_sin"] = np.sin(2 * np.pi * df1[a] / m)
            df1[a + "_cos"] = np.cos(2 * np.pi * df1[a] / m)

        df1["week_sin"] = np.sin(2 * np.pi * df1["week"] / 52)
        df1["week_cos"] = np.cos(2 * np.pi * df1["week"] / 52)

        df1.drop(columns=attributes + ["week"], inplace=True)

        return df1

    @staticmethod
    def get_location_features(df):
        if df.empty:
            raise ValueError("Empty dataframe provided")

        for column_name in ["timestamp", "latitude", "longitude"]:
            if column_name not in df.columns:
                raise ValueError(f"{column_name} column is missing")

        df["timestamp"] = pd.to_datetime(df["timestamp"])

        df["x_cord"] = np.cos(df["latitude"]) * np.cos(df["longitude"])
        df["y_cord"] = np.cos(df["latitude"]) * np.sin(df["longitude"])
        df["z_cord"] = np.sin(df["latitude"])

        return df

    #     df_tmp = get_lag_features(df_tmp, target_column, data_frequency)
    #     df_tmp = get_time_and_cyclic_features(df_tmp, data_frequency)
    #     df_tmp = get_location_cord(df_tmp)
    #     if job_type == "train":
    #         df_tmp = DecodingUtils.encode_categorical_training_features(
    #             df_tmp, data_frequency
    #         )
    #     elif job_type == "predict":
    #         df_tmp = DecodingUtils.decode_categorical_features_pred(
    #             df_tmp, data_frequency
    #         )
    #         df_tmp.dropna(
    #             subset=["device_id", "site_id", "device_category"], inplace=True
    #         )  # only 1 row, not sure why
    #
    #         df_tmp["device_id"] = df_tmp["device_id"].astype(int)
    #         df_tmp["site_id"] = df_tmp["site_id"].astype(int)
    #         df_tmp["device_category"] = df_tmp["device_category"].astype(int)
    #
    #     return df_tmp


class ForecastUtils(BaseMlUtils):
    @staticmethod
    def train_and_save_forecast_models(training_data, frequency):
        """
        Perform the actual training for hourly data
        """
        training_data.dropna(subset=["device_id"], inplace=True)
        training_data["timestamp"] = pd.to_datetime(training_data["timestamp"])
        features = [
            c
            for c in training_data.columns
            if c not in ["timestamp", "pm2_5", "latitude", "longitude", "device_id"]
        ]
        print(features)

        target_col = "pm2_5"
        train_data = validation_data = test_data = pd.DataFrame()
        for device in training_data["device_id"].unique():
            device_df = training_data[training_data["device_id"] == device]
            months = device_df["timestamp"].dt.month.unique()
            train_months = months[:8]
            val_months = months[8:9]
            test_months = months[9:]

            train_df = device_df[device_df["timestamp"].dt.month.isin(train_months)]
            val_df = device_df[device_df["timestamp"].dt.month.isin(val_months)]
            test_df = device_df[device_df["timestamp"].dt.month.isin(test_months)]

            train_data = pd.concat([train_data, train_df])
            validation_data = pd.concat([validation_data, val_df])
            test_data = pd.concat([test_data, test_df])

        train_data.drop(columns=["timestamp", "device_id"], axis=1, inplace=True)
        validation_data.drop(columns=["timestamp", "device_id"], axis=1, inplace=True)
        test_data.drop(columns=["timestamp", "device_id"], axis=1, inplace=True)

        train_target, validation_target, test_target = (
            train_data[target_col],
            validation_data[target_col],
            test_data[target_col],
        )

        sampler = optuna.samplers.TPESampler()
        pruner = optuna.pruners.SuccessiveHalvingPruner(
            min_resource=10, reduction_factor=2, min_early_stopping_rate=0
        )
        study = optuna.create_study(
            direction="minimize", study_name="LGBM", sampler=sampler, pruner=pruner
        )

        def objective(trial):
            param_grid = {
                "colsample_bytree": trial.suggest_float("colsample_bytree", 0.1, 1),
                "reg_alpha": trial.suggest_float("reg_alpha", 0, 10),
                "reg_lambda": trial.suggest_float("reg_lambda", 0, 10),
                "n_estimators": trial.suggest_categorical("n_estimators", [50]),
                "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3),
                "num_leaves": trial.suggest_int("num_leaves", 20, 50),
                "max_depth": trial.suggest_int("max_depth", 4, 7),
            }
            score = 0
            for step in range(4):
                lgb_reg = LGBMRegressor(
                    objective="regression",
                    random_state=42,
                    **param_grid,
                    verbosity=2,
                )
                lgb_reg.fit(
                    train_data[features],
                    train_target,
                    eval_set=[(test_data[features], test_target)],
                    eval_metric="rmse",
                    callbacks=[early_stopping(stopping_rounds=150)],
                )

                val_preds = lgb_reg.predict(validation_data[features])
                score = mean_squared_error(validation_target, val_preds)
                if trial.should_prune():
                    raise optuna.TrialPruned()

            return score

        study.optimize(objective, n_trials=15)

        mlflow.set_tracking_uri(configuration.MLFLOW_TRACKING_URI)
        mlflow.set_experiment(f"{frequency}_forecast_model_{environment}")
        registered_model_name = f"{frequency}_forecast_model_{environment}"

        mlflow.lightgbm.autolog(
            registered_model_name=registered_model_name, log_datasets=False
        )
        with mlflow.start_run():
            best_params = study.best_params
            print(f"Best params are {best_params}")
            clf = LGBMRegressor(
                n_estimators=best_params["n_estimators"],
                learning_rate=best_params["learning_rate"],
                colsample_bytree=best_params["colsample_bytree"],
                reg_alpha=best_params["reg_alpha"],
                reg_lambda=best_params["reg_lambda"],
                max_depth=best_params["max_depth"],
                random_state=42,
                verbosity=2,
            )

            clf.fit(
                train_data[features],
                train_target,
                eval_set=[(test_data[features], test_target)],
                eval_metric="rmse",
                callbacks=[early_stopping(stopping_rounds=150)],
            )

            GCSUtils.upload_trained_model_to_gcs(
                clf, project_id, bucket, f"{frequency}_forecast_model.pkl"
            )

        # def create_error_df(data, target, preds):
        #     error_df = pd.DataFrame(
        #         {
        #             "actual_values": target,
        #             "predicted_values": preds,
        #         }
        #     )
        #     error_df["errors"] = (
        #         error_df["predicted_values"] - error_df["actual_values"]
        #     )
        #     error_df = pd.concat([error_df, data], axis=1)
        #     error_df.drop(["actual_values", "pm2_5"], axis=1, inplace=True)
        #     error_df.rename(columns={"predicted_values": "pm2_5"}, inplace=True)
        #
        #     return error_df
        #
        # error_df1 = create_error_df(
        #     train_data, train_target, clf.predict(train_data[features])
        # )
        # error_df2 = create_error_df(
        #     test_data, test_target, clf.predict(test_data[features])
        # )
        #
        # error_features1 = [c for c in error_df1.columns if c not in ["errors"]]
        # error_features2 = [c for c in error_df2.columns if c not in ["errors"]]
        #
        # error_target1 = error_df1["errors"]
        # error_target2 = error_df2["errors"]
        #
        # error_clf = LGBMRegressor(
        #     n_estimators=31,
        #     colsample_bytree=1,
        #     learning_rate=0.1,
        #     metric="rmse",
        #     max_depth=5,
        #     random_state=42,
        #     verbosity=2,
        # )
        #
        # error_clf.fit(
        #     error_df1[error_features1],
        #     error_target1,
        #     eval_set=[(error_df2[error_features2], error_target2)],
        #     categorical_feature=["device_id", "site_id", "device_category"],
        #     callbacks=[early_stopping(stopping_rounds=150)],
        # )
        #
        # GCSUtils.upload_trained_model_to_gcs(
        #     error_clf, project_id, bucket, f"{frequency}_error_model.pkl"
        # )

    # TODO: quantile regression approach
    # alphas = [0.025, 0.975]
    # models = []
    # names = [
    #     f"{frequency}_lower_quantile_model",
    #     f"{frequency}_upper_quantile_model",
    # ]
    #
    # for alpha in alphas:
    #     clf = LGBMRegressor(
    #         n_estimators=best_params["n_estimators"],
    #         learning_rate=best_params["learning_rate"],
    #         colsample_bytree=best_params["colsample_bytree"],
    #         reg_alpha=best_params["reg_alpha"],
    #         reg_lambda=best_params["reg_lambda"],
    #         max_depth=best_params["max_depth"],
    #         random_state=42,
    #         verbosity=2,
    #         objective="quantile",
    #         alpha=alpha,
    #         metric="quantile",
    #     )
    #     clf.fit(
    #         train_data[features],
    #         train_target,
    #         eval_set=[(test_data[features], test_target)],
    #         categorical_feature=["device_id", "site_id", "device_category"],
    #     )
    #     models.append(clf)
    # for n, m in zip(names, models):
    #     upload_trained_model_to_gcs(m, project_id, bucket, f"{n}.pkl")

    @staticmethod
    def generate_forecasts(data, project_name, bucket_name, frequency):
        data = data.dropna(subset=["device_id"])
        data["timestamp"] = pd.to_datetime(data["timestamp"])
        data.columns = data.columns.str.strip()

        # data["margin_of_error"] = data["adjusted_forecast"] = 0

        def get_forecasts(
                df_tmp,
                forecast_model,
                frequency,
                horizon,
        ):
            """This method generates forecasts for a given device dataframe basing on horizon provided"""
            for i in range(int(horizon)):
                df_tmp = pd.concat([df_tmp, df_tmp.iloc[-1:]], ignore_index=True)
                df_tmp_no_ts = df_tmp.drop(
                    columns=["timestamp", "device_id", "site_id"], axis=1, inplace=False
                )
                # daily frequency
                if frequency == "daily":
                    df_tmp.tail(1)["timestamp"] += timedelta(days=1)
                    shifts1 = [1, 2, 3, 7]
                    for s in shifts1:
                        df_tmp[f"pm2_5_last_{s}_day"] = df_tmp.shift(s, axis=0)["pm2_5"]
                    # rolling features
                    shifts2 = [2, 3, 7]
                    functions = ["mean", "std", "max", "min"]
                    for s in shifts2:
                        for f in functions:
                            df_tmp[f"pm2_5_{f}_{s}_day"] = (
                                df_tmp_no_ts.shift(1, axis=0).rolling(s).agg(f)
                            )["pm2_5"]

                elif frequency == "hourly":
                    df_tmp.iloc[-1, df_tmp.columns.get_loc("timestamp")] = df_tmp.iloc[
                                                                               -2, df_tmp.columns.get_loc("timestamp")
                                                                           ] + pd.Timedelta(hours=1)

                    # lag features
                    shifts1 = [1, 2, 6, 12]
                    for s in shifts1:
                        df_tmp[f"pm2_5_last_{s}_hour"] = df_tmp.shift(s, axis=0)[
                            "pm2_5"
                        ]

                    # rolling features
                    shifts2 = [3, 6, 12, 24]
                    functions = ["mean", "std", "median", "skew"]
                    for s in shifts2:
                        for f in functions:
                            df_tmp[f"pm2_5_{f}_{s}_hour"] = (
                                df_tmp_no_ts.shift(1, axis=0).rolling(s).agg(f)
                            )["pm2_5"]

                attributes = ["year", "month", "day", "dayofweek"]
                max_vals = [2023, 12, 30, 7]
                if frequency == "hourly":
                    attributes.append("hour")
                    max_vals.append(23)
                for a, m in zip(attributes, max_vals):
                    df_tmp.tail(1)[f"{a}_sin"] = np.sin(
                        2
                        * np.pi
                        * df_tmp.tail(1)["timestamp"].dt.__getattribute__(a)
                        / m
                    )
                    df_tmp.tail(1)[f"{a}_cos"] = np.cos(
                        2
                        * np.pi
                        * df_tmp.tail(1)["timestamp"].dt.__getattribute__(a)
                        / m
                    )
                df_tmp.tail(1)["week_sin"] = np.sin(
                    2 * np.pi * df_tmp.tail(1)["timestamp"].dt.isocalendar().week / 52
                )
                df_tmp.tail(1)["week_cos"] = np.cos(
                    2 * np.pi * df_tmp.tail(1)["timestamp"].dt.isocalendar().week / 52
                )

                excluded_columns = [
                    "device_id",
                    "site_id",
                    "pm2_5",
                    "timestamp",
                    "latitude",
                    "longitude",
                    # "margin_of_error",
                    # "adjusted_forecast",
                ]
                # excluded_columns_2 = [
                #     "timestamp",
                #     "margin_of_error",
                #     "adjusted_forecast",
                # ]
                df_tmp.loc[df_tmp.index[-1], "pm2_5"] = forecast_model.predict(
                    df_tmp.drop(excluded_columns, axis=1).tail(1).values.reshape(1, -1)
                )
                # df_tmp.loc[df_tmp.index[-1], "margin_of_error"] = error_model.predict(
                #     df_tmp.drop(excluded_columns_2, axis=1)
                #     .tail(1)
                #     .values.reshape(1, -1)
                # )
                # df_tmp.loc[df_tmp.index[-1], "adjusted_forecast"] = (
                #     df_tmp.loc[df_tmp.index[-1], "pm2_5"]
                #     + df_tmp.loc[df_tmp.index[-1], "margin_of_error"]
                # )

            return df_tmp.iloc[-int(horizon):, :]

        forecasts = pd.DataFrame()
        forecast_model = GCSUtils.get_trained_model_from_gcs(
            project_name, bucket_name, f"{frequency}_forecast_model.pkl"
        )
        # error_model = GCSUtils.get_trained_model_from_gcs(
        #     project_name, bucket_name, f"{frequency}_error_model.pkl"
        # )

        df_tmp = data.copy()
        for device in df_tmp["device_id"].unique():
            test_copy = df_tmp[df_tmp["device_id"] == device]
            horizon = (
                configuration.HOURLY_FORECAST_HORIZON
                if frequency == "hourly"
                else configuration.DAILY_FORECAST_HORIZON
            )
            device_forecasts = get_forecasts(
                test_copy,
                forecast_model,
                frequency,
                horizon,
            )

            forecasts = pd.concat([forecasts, device_forecasts], ignore_index=True)

        forecasts["pm2_5"] = forecasts["pm2_5"].astype(float)
        # forecasts["margin_of_error"] = forecasts["margin_of_error"].astype(float)

        return forecasts[
            [
                "device_id",
                "site_id",
                "timestamp",
                "pm2_5",
                # "margin_of_error",
                # "adjusted_forecast",
            ]
        ]

    @staticmethod
    def save_forecasts_to_mongo(data, frequency):
        device_ids = data["device_id"].unique()
        created_at = pd.to_datetime(datetime.now()).isoformat()

        forecast_results = []
        for i in device_ids:
            doc = {
                "device_id": i,
                "created_at": created_at,
                "site_id": data[data["device_id"] == i]["site_id"].unique()[0],
                "pm2_5": data[data["device_id"] == i]["pm2_5"].tolist(),
                "timestamp": data[data["device_id"] == i]["timestamp"].tolist(),
            }
            forecast_results.append(doc)

        if frequency == "hourly":
            collection = db.hourly_forecasts_1
        elif frequency == "daily":
            collection = db.daily_forecasts_1
        else:
            raise ValueError("Invalid frequency argument")

        for doc in forecast_results:
            try:
                filter_query = {
                    "device_id": doc["device_id"],
                    "site_id": doc["site_id"],
                }
                update_query = {
                    "$set": {
                        "pm2_5": doc["pm2_5"],
                        "timestamp": doc["timestamp"],
                        "created_at": doc["created_at"],
                    }
                }
                collection.update_one(filter_query, update_query, upsert=True)
            except Exception as e:
                print(
                    f"Failed to update forecast for device {doc['device_id']}: {str(e)}"
                )


class FaultDetectionUtils(BaseMlUtils):
    @staticmethod
    def flag_rule_based_faults(df: pd.DataFrame) -> pd.DataFrame:
        """
        Flags rule-based faults such as correlation and missing data
        Inputs:
            df: pandas dataframe
        Outputs:
            pandas dataframe
        """

        if not isinstance(df, pd.DataFrame):
            raise ValueError("Input must be a dataframe")

        required_columns = ["device_id", "s1_pm2_5", "s2_pm2_5"]
        if not set(required_columns).issubset(set(df.columns.to_list())):
            raise ValueError(
                f"Input must have the following columns: {required_columns}"
            )

        result = pd.DataFrame(
            columns=[
                "device_id",
                "correlation_fault",
                "correlation_value",
                "missing_data_fault",
            ]
        )
        for device in df["device_id"].unique():
            device_df = df[df["device_id"] == device]
            corr = device_df["s1_pm2_5"].corr(device_df["s2_pm2_5"])
            correlation_fault = 1 if corr < 0.9 else 0
            missing_data_fault = 0
            for col in ["s1_pm2_5", "s2_pm2_5"]:
                null_series = device_df[col].isna()
                if (null_series.rolling(window=60).sum() >= 60).any():
                    missing_data_fault = 1
                    break

            temp = pd.DataFrame(
                {
                    "device_id": [device],
                    "correlation_fault": [correlation_fault],
                    "correlation_value": [corr],
                    "missing_data_fault": [missing_data_fault],
                }
            )
            result = pd.concat([result, temp], ignore_index=True)
        result = result[
            (result["correlation_fault"] == 1) | (result["missing_data_fault"] == 1)
            ]
        return result

    @staticmethod
    def flag_pattern_based_faults(df: pd.DataFrame) -> pd.DataFrame:
        """
        Flags pattern-based faults such as high variance, constant values, etc"""
        from sklearn.ensemble import IsolationForest

        if not isinstance(df, pd.DataFrame):
            raise ValueError("Input must be a dataframe")

        df["timestamp"] = pd.to_datetime(df["timestamp"])
        columns_to_ignore = ["device_id", "timestamp"]
        df.dropna(inplace=True)

        isolation_forest = IsolationForest(contamination=0.37)
        isolation_forest.fit(df.drop(columns=columns_to_ignore))

        df["anomaly_value"] = isolation_forest.predict(
            df.drop(columns=columns_to_ignore)
        )

        return df

    @staticmethod
    def process_faulty_devices_percentage(df: pd.DataFrame):
        """Process faulty devices dataframe and save to MongoDB"""

        anomaly_percentage = pd.DataFrame(
            (
                    df[df["anomaly_value"] == -1].groupby("device_id").size()
                    / df.groupby("device_id").size()
            )
            * 100,
            columns=["anomaly_percentage"],
        )

        return anomaly_percentage[
            anomaly_percentage["anomaly_percentage"] > 45
            ].reset_index(level=0)

    @staticmethod
    def process_faulty_devices_fault_sequence(df: pd.DataFrame):
        df["group"] = (df["anomaly_value"] != df["anomaly_value"].shift(1)).cumsum()
        df["anomaly_sequence_length"] = (
                df[df["anomaly_value"] == -1].groupby(["device_id", "group"]).cumcount() + 1
        )
        df["anomaly_sequence_length"].fillna(0, inplace=True)
        device_max_anomaly_sequence = (
            df.groupby("device_id")["anomaly_sequence_length"].max().reset_index()
        )
        faulty_devices_df = device_max_anomaly_sequence[
            device_max_anomaly_sequence["anomaly_sequence_length"] >= 80
            ]
        faulty_devices_df.columns = ["device_id", "fault_count"]

        return faulty_devices_df

    @staticmethod
    def save_faulty_devices(*dataframes):
        """Save or update faulty devices to MongoDB"""
        dataframes = list(dataframes)
        merged_df = dataframes[0]
        for df in dataframes[1:]:
            merged_df = merged_df.merge(df, on="device_id", how="outer")
        merged_df = merged_df.fillna(0)
        merged_df["created_at"] = datetime.now().isoformat(timespec="seconds")
        with pm.MongoClient(configuration.MONGO_URI) as client:
            db = client[configuration.MONGO_DATABASE_NAME]
            records = merged_df.to_dict("records")
            bulk_ops = [
                pm.UpdateOne(
                    {"device_id": record["device_id"]},
                    {"$set": record},
                    upsert=True,
                )
                for record in records
            ]

            try:
                db.faulty_devices_1.bulk_write(bulk_ops)
            except Exception as e:
                print(f"Error saving faulty devices to MongoDB: {e}")

            print("Faulty devices saved/updated to MongoDB")


class SatelliteUtils(BaseMlUtils):
    @staticmethod
    def encode(data: pd.DataFrame, encoder: str = 'LabelEncoder') -> pd.DataFrame:
        """
        applies encoding for the city and country features

        Keyword arguments:
        data --  the data frame to apply the transformation on
        encoder --  the type of encoding to apply (default: 'LabelEncoder')
        Return: returns a dataframe after applying the encoding
        """

        if not 'city' in data.columns:
            raise ValueError('data frame does not contain city or country column')

        if encoder == 'LabelEncoder':
            le = LabelEncoder()
            for column in ['city']:
                data[column] = le.fit_transform(data[column])
        elif encoder == 'OneHotEncoder':
            ohe = OneHotEncoder(sparse=False)
            for column in ['city']:
                encoded_data = ohe.fit_transform(data[[column]])
                encoded_columns = [f"{column}_{i}" for i in range(encoded_data.shape[1])]
                encoded_df = pd.DataFrame(encoded_data, columns=encoded_columns)
                data = pd.concat([data, encoded_df], axis=1)
                data = data.drop(column, axis=1)
        else:
            raise ValueError("Invalid encoder. Please choose 'LabelEncoder' or 'OneHotEncoder'.")

        return data

    @staticmethod
    def lag_features(data: pd.DataFrame, frequency: str, target_col: str) -> pd.DataFrame:
        """appends lags to specific feature in the data frame.

        Keyword arguments:

            data -- the dataframe to apply the transformation on.

            frequency -- (hourly/daily) weather the lag is applied per hours or per days.

            target_col -- the column to apply the transformation on.

        Return: returns a dataframe after applying the transformation
        """

        if frequency == "hourly":
            shifts = [1, 2, 6, 12]
            time_unit = "hour"
        elif frequency == "daily":
            shifts = [1, 2, 3, 7]
            time_unit = "day"
        else:
            raise ValueError('freq must be daily or hourly')
        for s in shifts:
            data[f"pm2_5_last_{s}_{time_unit}"] = data.groupby(["city"])[target_col].shift(s)
        return data

    @staticmethod
    def train_satellite_model(data):
        data['year'] = data['timestamp'].dt.year
        min_year = data['year'].min()

        train_data = pd.DataFrame()
        test_data = pd.DataFrame()

        for site in data["site_id"].unique():
            site_df = data[data["site_id"] == site]

            train_df = site_df[site_df['year'].isin([min_year, min_year + 1, min_year + 2, min_year + 3])]
            test_df = site_df[site_df['year'].isin([min_year + 4, min_year + 5])]

            train_data = pd.concat([train_data, train_df])
            test_data = pd.concat([test_data, test_df])

        # Drop unnecessary columns
        columns_to_drop = ["timestamp", "device_id", "year"]
        train_data.drop(columns=columns_to_drop, axis=1, inplace=True)
        test_data.drop(columns=columns_to_drop, axis=1, inplace=True)

        model = LGBMRegressor(random_state=42, n_estimators=200, max_depth=10, objective='mse')
        n_splits = 4
        cv = GroupKFold(n_splits=n_splits)
        groups = train_data['city']
        def validate(trainset, testset, t, origin):
            with mlflow.start_run():
                model.fit(trainset.drop(columns=t), trainset[t])
                pred = model.predict(np.array(testset.drop(columns=t)))
                print('std: ', testset[t].std())

                # to validate the post processing
                origin['pm_5'] = pred
                origin['date'] = pd.to_datetime(origin['date'])
                origin['date_day'] = origin['date'].dt.dayofyear
                pred = origin['date_day'].map(origin[['date_day', 'pm_5']].groupby('date_day')['pm_5'].mean())
                # --------------------------------------------------------------------------------------------
                stds.append(testset[t].std())
                score = mean_squared_error(pred, testset[t], squared=False)
                print('score:', score)
                mlflow.log_metric("rmse", score)
                mlflow.sklearn.log_model(model, "model")

                return score

        stds = []
        rmse = []

        for v_train, v_test in cv.split(train.drop(columns='pm2_5'), train['pm2_5'], groups=groups):
            train_v, test_v = train.iloc[v_train], train.iloc[v_test]
            origin = train_set.iloc[v_test]
            rmse.append(validate(train_v, test_v, 'pm2_5', origin))