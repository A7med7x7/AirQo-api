import pandas as pd

from api.utils.dates import str_to_aqcsv_date_format
from api.utils.pollutants.pm_25 import (
    POLLUTANT_BIGQUERY_MAPPER,
    AQCSV_PARAMETER_MAPPER,
    FREQUENCY_MAPPER,
    AQCSV_UNIT_MAPPER,
    AQCSV_QC_CODE_MAPPER,
    AQCSV_DATA_STATUS_MAPPER,
    BIGQUERY_FREQUENCY_MAPPER,
)


def format_to_aqcsv_v2(data: list, pollutants: list, frequency: str) -> list:
    # Compulsory fields : site, datetime, parameter, duration, value, unit, qc, poc, data_status,
    # Optional fields : lat, lon,

    pollutant_mappers = BIGQUERY_FREQUENCY_MAPPER.get(frequency)

    dataframe = pd.DataFrame(data)
    if dataframe.empty:
        return []
    dataframe.rename(
        columns={
            "timestamp": "datetime",
            "site_latitude": "lat",
            "site_longitude": "lon",
        },
        inplace=True,
    )

    dataframe["duration"] = FREQUENCY_MAPPER[frequency]
    dataframe["poc"] = 1
    dataframe["qc"] = (
        AQCSV_QC_CODE_MAPPER["averaged"]
        if frequency != "raw"
        else AQCSV_QC_CODE_MAPPER["estimated"]
    )
    dataframe["datetime"] = dataframe["datetime"].apply(str_to_aqcsv_date_format)

    aqcsv_dataframe = pd.DataFrame([])

    for pollutant in pollutants:
        if pollutant not in pollutant_mappers.keys():
            continue

        dataframe["parameter"] = AQCSV_PARAMETER_MAPPER[pollutant]
        dataframe["unit"] = AQCSV_UNIT_MAPPER[pollutant]

        pollutant_mapping = pollutant_mappers.get(pollutant, [])
        for mapping in pollutant_mapping:

            pollutant_dataframe = dataframe[
                [
                    "datetime",
                    "lat",
                    "lon",
                    "site_id",
                    "site_name",
                    "duration",
                    "qc",
                    "parameter",
                    "unit",
                    "poc",
                    mapping,
                ]
            ]
            pollutant_dataframe.dropna(subset=[mapping], inplace=True)

            if pollutant_dataframe.empty:
                continue

            pollutant_dataframe["data_status"] = AQCSV_DATA_STATUS_MAPPER[mapping]
            pollutant_dataframe.rename(columns={mapping: "value"}, inplace=True)
            aqcsv_dataframe = aqcsv_dataframe.append(
                pollutant_dataframe, ignore_index=True
            )

    return aqcsv_dataframe.to_dict("records")


def format_to_aqcsv(data: list, pollutants: list, frequency: str) -> list:
    # Compulsory fields : site, datetime, parameter, duration, value, unit, qc, poc, data_status,
    # Optional fields : lat, lon,

    dataframe = pd.DataFrame(data)
    if dataframe.empty:
        return []
    dataframe.rename(
        columns={
            "timestamp": "datetime",
            "latitude": "lat",
            "longitude": "lon",
            "site": "site_name",
        },
        inplace=True,
    )

    dataframe["duration"] = FREQUENCY_MAPPER[frequency]
    dataframe["poc"] = 1
    dataframe["qc"] = (
        AQCSV_QC_CODE_MAPPER["averaged"]
        if frequency != "raw"
        else AQCSV_QC_CODE_MAPPER["estimated"]
    )
    dataframe["datetime"] = dataframe["datetime"].apply(str_to_aqcsv_date_format)

    aqcsv_dataframe = pd.DataFrame([])

    for pollutant in pollutants:
        if pollutant not in POLLUTANT_BIGQUERY_MAPPER.keys():
            continue

        dataframe["parameter"] = AQCSV_PARAMETER_MAPPER[pollutant]
        dataframe["unit"] = AQCSV_UNIT_MAPPER[pollutant]

        pollutant_mapping = POLLUTANT_BIGQUERY_MAPPER.get(pollutant, [])
        for mapping in pollutant_mapping:

            pollutant_dataframe = dataframe[
                [
                    "datetime",
                    "lat",
                    "lon",
                    "site_id",
                    "site_name",
                    "duration",
                    "qc",
                    "parameter",
                    "unit",
                    "poc",
                    mapping,
                ]
            ]
            pollutant_dataframe.dropna(subset=[mapping], inplace=True)

            if pollutant_dataframe.empty:
                continue

            pollutant_dataframe["data_status"] = AQCSV_DATA_STATUS_MAPPER[mapping]
            pollutant_dataframe.rename(columns={mapping: "value"}, inplace=True)
            aqcsv_dataframe = aqcsv_dataframe.append(
                pollutant_dataframe, ignore_index=True
            )

    return aqcsv_dataframe.to_dict("records")


def tenant_to_str(tenant: str) -> str:
    try:
        if tenant.lower() == "airqo":
            return "AirQo"
        elif tenant.lower() == "kcca":
            return "KCCA"
        elif tenant.lower() == "us_embassy":
            return "US Embassy"
        else:
            pass
    except Exception as ex:
        pass

    return ""


def device_category_to_str(device_category: str) -> str:
    try:
        if device_category.lower() == "bam":
            return "Reference Monitor"
        elif device_category.lower() == "lowcost":
            return "Low Cost Sensor"
        else:
            pass
    except Exception as ex:
        pass

    return ""
