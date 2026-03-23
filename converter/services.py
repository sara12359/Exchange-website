import requests
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Currency, ExchangeRate

class ExchangeRateService:
    BASE_URL = f"https://v6.exchangerate-api.com/v6/{settings.EXCHANGE_RATE_API_KEY}"

    @staticmethod
    def sync_currencies():
        """Fetch supported currencies from API and update Currency model."""
        url = f"{ExchangeRateService.BASE_URL}/codes"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            if data.get('result') == 'success':
                codes = data.get('supported_codes', [])
                for code, name in codes:
                    Currency.objects.update_or_create(code=code, defaults={'name': name})
                return codes
            return []
        except requests.RequestException:
            return []

    @staticmethod
    def sync_rates(base_currency='USD'):
        """Fetch all rates for base_currency and update ExchangeRate model."""
        url = f"{ExchangeRateService.BASE_URL}/latest/{base_currency}"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            if data.get('result') == 'success':
                rates = data.get('conversion_rates', {})
                last_update_unix = data.get('time_last_update_unix')
                last_update_api = timezone.make_aware(datetime.fromtimestamp(last_update_unix)) if last_update_unix else timezone.now()
                
                for target_code, rate in rates.items():
                    ExchangeRate.objects.update_or_create(
                        base_currency=base_currency,
                        target_currency=target_code,
                        defaults={
                            'rate': rate,
                            'last_updated_api': last_update_api
                        }
                    )
                return True
            return False
        except requests.RequestException:
            return False

    @staticmethod
    def get_supported_currencies():
        currencies = Currency.objects.all().order_by('code')
        if not currencies.exists():
            codes = ExchangeRateService.sync_currencies()
            return codes
        return [[c.code, c.name] for c in currencies]

    @staticmethod
    def convert(from_currency, to_currency, amount):
        try:
            # We use USD as the central base to convert between any two currencies
            # formula: (amount / from_rate_to_usd) * to_rate_to_usd
            # But our DB stores rates relative to USD (base_currency='USD')
            
            usd_to_from = ExchangeRate.objects.get(base_currency='USD', target_currency=from_currency).rate
            usd_to_to = ExchangeRate.objects.get(base_currency='USD', target_currency=to_currency).rate
            
            # 1 USD = usd_to_from FROM
            # 1 USD = usd_to_to TO
            # FROM / usd_to_from = TO / usd_to_to
            # TO = FROM * (usd_to_to / usd_to_from)
            
            rate = usd_to_to / usd_to_from
            conversion_result = float(amount) * float(rate)
            
            last_update = ExchangeRate.objects.filter(base_currency='USD', target_currency=to_currency).first().last_updated_api
            
            return {
                'conversion_result': conversion_result,
                'conversion_rate': rate,
                'time_last_update_utc': last_update
            }
        except ExchangeRate.DoesNotExist:
            # Fallback to API if not in DB
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

    @staticmethod
    def get_historical_rate(date_obj, base_currency, target_currency):
        """Fetch historical rate for a specific date using Fawaz Ahmed's API."""
        date_str = date_obj.strftime('%Y-%m-%d')
        # Handle cases where the data might not be available yet for today or very recent
        # The API path uses the date in the subdomain/path usually
        # But this specific CDN version uses @date in the version part
        url = f"https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date_str}/v1/currencies/{base_currency.lower()}.json"
        
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            data = response.json()
            rate = data.get(base_currency.lower(), {}).get(target_currency.lower())
            return rate
        except requests.RequestException:
            # Fallback if specific date is not found or error
            return None
