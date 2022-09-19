import numpy as np
import pandas as pd

from airqo_etl_utils.constants import Tenant
from airqo_etl_utils.utils import Utils


class DataValidationUtils:
    @staticmethod
    def format_data_types(
        data: pd.DataFrame,
        floats: list = None,
        integers: list = None,
        timestamps: list = None,
    ) -> pd.DataFrame:

        floats = [] if floats is None else floats
        integers = [] if integers is None else integers
        timestamps = [] if timestamps is None else timestamps

        data[floats] = data[floats].apply(pd.to_numeric, errors="coerce")
        data[timestamps] = data[timestamps].apply(pd.to_datetime, errors="coerce")

        # formatting integers
        if integers:
            null_data = data[data[integers].isnull().all(axis=1)]
            not_null_data = data[data[integers].notnull().all(axis=1)]
            if not not_null_data.empty:
                not_null_data[integers] = not_null_data[integers].apply(np.int64)
            data = pd.concat([null_data, not_null_data], ignore_index=True)

        return data

    @staticmethod
    def get_valid_value(value, name):

        if (name == "pm2_5" or name == "pm10") and (value < 1 or value > 1000):
            return None
        elif name == "latitude" and (value < -90 or value > 90):
            return None
        elif name == "longitude" and (value < -180 or value > 180):
            return None
        elif name == "battery" and (value < 2.7 or value > 5):
            return None
        elif name == "no2" and (value < 0 or value > 2049):
            return None
        elif (name == "altitude" or name == "hdop") and value <= 0:
            return None
        elif name == "satellites" and (value <= 0 or value > 50):
            return None
        elif (name == "temperature") and (value <= 0 or value > 45):
            return None
        elif (name == "humidity") and (value <= 0 or value > 99):
            return None
        elif name == "pressure" and (value < 30 or value > 110):
            return None
        else:
            pass

        return value

    @staticmethod
    def remove_outliers(data: pd.DataFrame) -> pd.DataFrame:
        float_columns = {
            "battery",
            "hdop",
            "altitude",
            "satellites",
            "pm2_5",
            "pm2_5_pi",
            "pm10",
            "pm10_pi",
            "s1_pm2_5",
            "s2_pm2_5",
            "s1_pm10",
            "s2_pm10",
            "no2",
            "no2_raw_value",
            "pm1",
            "pm1_pi",
            "pm1_raw_value",
            "temperature",
            "external_temperature",
            "filter_temperature",
            "device_temperature",
            "latitude",
            "longitude",
            "humidity",
            "device_humidity",
            "filter_humidity",
            "external_humidity",
            "pressure",
            "barometric_pressure",
            "wind_speed",
            "wind_direction",
            "speed",
            "realtime_conc",
            "hourly_conc",
            "short_time_conc",
            "air_flow",
        }

        integer_columns = {
            "status",
        }

        timestamp_columns = {
            "timestamp",
        }

        float_columns = list(float_columns & set(data.columns))
        integer_columns = list(integer_columns & set(data.columns))
        timestamp_columns = list(timestamp_columns & set(data.columns))

        data = DataValidationUtils.format_data_types(
            data=data,
            floats=float_columns,
            integers=integer_columns,
            timestamps=timestamp_columns,
        )

        for col in float_columns:
            name = col
            if name in [
                "pm2_5",
                "s1_pm2_5",
                "s2_pm2_5",
                "pm2_5_pi",
                "pm2_5_raw_value",
                "pm2_5_calibrated_value",
            ]:
                name = "pm2_5"
            elif name in [
                "pm10",
                "s1_pm10",
                "s2_pm10",
                "pm10_pi",
                "pm10_raw_value",
                "pm10_calibrated_value",
            ]:
                name = "pm10"
            elif name in ["device_humidity", "humidity", "external_humidity"]:
                name = "humidity"
            elif col in ["device_temperature", "temperature", "external_temperature"]:
                name = "temperature"
            elif name in ["no2", "no2_raw_value"]:
                name = "no2"
            elif name in ["pm1", "pm1_raw_value", "pm1_pi"]:
                name = "pm1"

            data[col] = data[col].apply(
                lambda x: DataValidationUtils.get_valid_value(x, name)
            )

        return data

    @staticmethod
    def process_for_big_query(
        dataframe: pd.DataFrame, table: str, tenant: Tenant
    ) -> pd.DataFrame:
        from airqo_etl_utils.bigquery_api import BigQueryApi

        columns = BigQueryApi().get_columns(table)
        if tenant != Tenant.ALL:
            dataframe.loc[:, "tenant"] = str(tenant)
        dataframe = Utils.populate_missing_columns(data=dataframe, cols=columns)
        return dataframe[columns]
