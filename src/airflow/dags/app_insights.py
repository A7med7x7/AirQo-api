from datetime import datetime

from airflow.decorators import dag, task

from airqo_etl_utils.airflow_custom_utils import AirflowUtils


@dag(
    "App-Forecast-Insights",
    schedule="50 */2 * * *",
    default_args=AirflowUtils.dag_default_configs(),
    catchup=False,
    tags=["insights", "forecast"],
)
def app_forecast_insights():
    import pandas as pd

    @task()
    def extract_forecast_data():
        from airqo_etl_utils.app_insights_utils import (
            AirQoAppUtils,
        )

        return AirQoAppUtils.extract_forecast_data()

    @task()
    def load(forecast: pd.DataFrame):
        from airqo_etl_utils.app_insights_utils import AirQoAppUtils

        insights = AirQoAppUtils.create_insights(data=forecast)

        AirQoAppUtils.save_insights(insights_data=insights)

    forecast_data = extract_forecast_data()
    load(forecast=forecast_data)


@dag(
    "App-Historical-Daily-Insights",
    schedule="0 1 * * *",
    default_args=AirflowUtils.dag_default_configs(),
    catchup=False,
    tags=["insights", "daily"],
)
def app_historical_daily_insights():
    import pandas as pd

    @task()
    def average_insights_data(**kwargs):
        from airqo_etl_utils.app_insights_utils import AirQoAppUtils
        from airqo_etl_utils.date import DateUtils

        start_date_time, end_date_time = DateUtils.get_dag_date_time_values(
            days=3, **kwargs
        )

        hourly_insights_data = AirQoAppUtils.extract_insights(
            freq="hourly", start_date_time=start_date_time, end_date_time=end_date_time
        )

        return AirQoAppUtils.average_insights(
            frequency="daily", data=hourly_insights_data
        )

    @task()
    def load(data: pd.DataFrame):
        from airqo_etl_utils.app_insights_utils import (
            AirQoAppUtils,
        )

        insights = AirQoAppUtils.create_insights(data=data)
        AirQoAppUtils.save_insights(insights_data=insights, partition=2)

    aggregated_insights = average_insights_data()
    load(aggregated_insights)


@dag(
    "App-Realtime-Daily-Insights",
    schedule="50 */2 * * *",
    default_args=AirflowUtils.dag_default_configs(),
    catchup=False,
    tags=["insights", "daily", "realtime"],
)
def app_realtime_daily_insights():
    import pandas as pd

    @task()
    def average_insights_data():
        from airqo_etl_utils.app_insights_utils import AirQoAppUtils

        from datetime import datetime

        now = datetime.utcnow()
        start_date_time = datetime.strftime(now, "%Y-%m-%dT00:00:00Z")
        end_date_time = datetime.strftime(now, "%Y-%m-%dT23:59:59Z")

        hourly_insights_data = AirQoAppUtils.extract_insights(
            freq="hourly", start_date_time=start_date_time, end_date_time=end_date_time
        )

        return AirQoAppUtils.average_insights(
            frequency="daily", data=hourly_insights_data
        )

    @task()
    def load(data: pd.DataFrame):
        from airqo_etl_utils.app_insights_utils import (
            AirQoAppUtils,
        )

        insights = AirQoAppUtils.create_insights(data=data)
        AirQoAppUtils.save_insights(insights_data=insights)

    aggregated_insights = average_insights_data()
    load(aggregated_insights)


@dag(
    "App-Historical-Hourly-Insights",
    schedule="0 0 * * *",
    default_args=AirflowUtils.dag_default_configs(),
    catchup=False,
    tags=["insights", "hourly", "historical"],
)
def app_historical_hourly_insights():
    import pandas as pd

    @task()
    def extract_data(**kwargs):
        from airqo_etl_utils.app_insights_utils import AirQoAppUtils
        from airqo_etl_utils.date import DateUtils

        start_date_time, end_date_time = DateUtils.get_dag_date_time_values(
            days=3, **kwargs
        )

        return AirQoAppUtils.extract_hourly_data(
            start_date_time=start_date_time, end_date_time=end_date_time
        )

    @task()
    def load_hourly_insights(data: pd.DataFrame):
        from airqo_etl_utils.app_insights_utils import AirQoAppUtils

        insights = AirQoAppUtils.create_insights(data)
        AirQoAppUtils.save_insights(insights_data=insights, partition=2)

    hourly_data = extract_data()
    load_hourly_insights(hourly_data)


@dag(
    "App-Realtime-Hourly-Insights",
    schedule="30 * * * *",
    default_args=AirflowUtils.dag_default_configs(),
    catchup=False,
    tags=["insights", "hourly"],
)
def app_realtime_hourly_insights():
    import pandas as pd

    @task()
    def update_latest_hourly_data():
        from airqo_etl_utils.app_insights_utils import AirQoAppUtils
        from airqo_etl_utils.constants import Tenant
        from airqo_etl_utils.date import DateUtils

        start_date_time, end_date_time = DateUtils.get_dag_date_time_values(hours=2)

        latest_hourly_data = AirQoAppUtils.extract_bigquery_latest_hourly_data(
            start_date_time=start_date_time, end_date_time=end_date_time
        )

        return AirQoAppUtils.update_latest_hourly_data(
            bigquery_latest_hourly_data=latest_hourly_data, tenant=Tenant.ALL
        )

    @task()
    def extract_hourly_insights():
        from airqo_etl_utils.app_insights_utils import AirQoAppUtils
        from airqo_etl_utils.date import DateUtils

        start_date_time, end_date_time = DateUtils.get_dag_date_time_values(hours=2)

        return AirQoAppUtils.extract_hourly_data(
            start_date_time=start_date_time, end_date_time=end_date_time
        )

    @task()
    def load_hourly_insights(data: pd.DataFrame):
        from airqo_etl_utils.app_insights_utils import AirQoAppUtils

        insights = AirQoAppUtils.create_insights(data)
        AirQoAppUtils.save_insights(insights_data=insights)

    hourly_data = extract_hourly_insights()
    load_hourly_insights(hourly_data)
    update_latest_hourly_data()


@dag(
    "App-Insights-cleanup",
    schedule="@daily",
    default_args=AirflowUtils.dag_default_configs(),
    catchup=False,
    tags=["insights", "empty"],
)
def app_insights_cleanup():
    import pandas as pd

    from airqo_etl_utils.date import (
        date_to_str_days,
        first_day_of_week,
        last_day_of_week,
        first_day_of_month,
        last_day_of_month,
    )

    start_date_time = date_to_str_days(
        first_day_of_week(first_day_of_month(date_time=datetime.now()))
    )
    end_date_time = date_to_str_days(
        last_day_of_week(last_day_of_month(date_time=datetime.now()))
    )

    @task()
    def create_empty_insights():

        from airqo_etl_utils.app_insights_utils import AirQoAppUtils

        return AirQoAppUtils.create_empty_insights(
            start_date_time=start_date_time, end_date_time=end_date_time
        )

    @task()
    def query_insights_data():
        from airqo_etl_utils.app_insights_utils import AirQoAppUtils

        return AirQoAppUtils.extract_insights(
            start_date_time=start_date_time,
            end_date_time=end_date_time,
            all_data=True,
            freq="",
        )

    @task()
    def filter_insights(
        empty_insights_data: pd.DataFrame, available_insights_data: pd.DataFrame
    ):

        insights_data = pd.concat(
            [empty_insights_data, available_insights_data], ignore_index=True
        ).drop_duplicates(keep=False, subset=["siteId", "time", "frequency"])

        return insights_data

    @task()
    def load(insights_data: pd.DataFrame):

        from airqo_etl_utils.app_insights_utils import AirQoAppUtils

        AirQoAppUtils.save_insights(insights_data=insights_data, partition=2)

    empty_insights = create_empty_insights()
    available_insights = query_insights_data()
    filtered_insights = filter_insights(
        empty_insights_data=empty_insights, available_insights_data=available_insights
    )
    load(insights_data=filtered_insights)


app_forecast_insights()
app_historical_daily_insights()
app_historical_hourly_insights()
app_realtime_daily_insights()
app_realtime_hourly_insights()
app_insights_cleanup()
