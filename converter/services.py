import requests
from django.conf import settings

class ExchangeRateService:
    BASE_URL = f"https://v6.exchangerate-api.com/v6/{settings.EXCHANGE_RATE_API_KEY}"

    @staticmethod
    def get_supported_currencies():
        url = f"{ExchangeRateService.BASE_URL}/codes"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            if data.get('result') == 'success':
                return data.get('supported_codes', [])
            return []
        except requests.RequestException:
            return []

    @staticmethod
    def convert(from_currency, to_currency, amount):
        url = f"{ExchangeRateService.BASE_URL}/pair/{from_currency}/{to_currency}/{amount}"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            if data.get('result') == 'success':
                return {
                    'conversion_result': data.get('conversion_result'),
                    'conversion_rate': data.get('conversion_rate'),
                    'time_last_update_utc': data.get('time_last_update_utc')
                }
            return None
        except requests.RequestException:
            return None
