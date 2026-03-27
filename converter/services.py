import requests
import concurrent.futures
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Currency, ExchangeRate

CURRENCY_TO_COUNTRY = {
    'USD': 'us', 'EUR': 'eu', 'GBP': 'gb', 'JPY': 'jp', 'CAD': 'ca', 'AUD': 'au',
    'CHF': 'ch', 'CNY': 'cn', 'SEK': 'se', 'NZD': 'nz', 'INR': 'in', 'BRL': 'br',
    'RUB': 'ru', 'KRW': 'kr', 'SGD': 'sg', 'ZAR': 'za', 'TRY': 'tr', 'MXN': 'mx',
    'IDR': 'id', 'MYR': 'my', 'PHP': 'ph', 'THB': 'th', 'CZK': 'cz', 'PLN': 'pl',
    'HUF': 'hu', 'RON': 'ro', 'DKK': 'dk', 'ILS': 'il', 'AED': 'ae', 'SAR': 'sa',
    'RWF': 'rw', 'KES': 'ke', 'UGX': 'ug', 'TZS': 'tz', 'GHS': 'gh', 'NGN': 'ng',
    'EGP': 'eg', 'MAD': 'ma', 'HKD': 'hk', 'TWD': 'tw', 'NOK': 'no', 'CLP': 'cl',
    'COP': 'co', 'PEN': 'pe', 'ARS': 'ar', 'PKR': 'pk', 'VND': 'vn', 'UAH': 'ua',
}

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
            return [[code, name, CURRENCY_TO_COUNTRY.get(code, code[:2].lower())] for code, name in codes]
        return [[c.code, c.name, CURRENCY_TO_COUNTRY.get(c.code, c.code[:2].lower())] for c in currencies]

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

    @staticmethod
    def get_historical_rates_range(base_currency, target_currency, days=7):
        """Fetch historical rates for a range of days."""
        today = timezone.now().date()
        
        def fetch_rate(i):
            date_obj = today - timedelta(days=i)
            rate = ExchangeRateService.get_historical_rate(date_obj, base_currency, target_currency)
            if rate:
                return {
                    'date': date_obj.strftime('%Y-%m-%d'),
                    'rate': rate
                }
            return None

        rates = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(days, 30)) as executor:
            # Map returns results in the original order (i=0, i=1, ... i=days-1)
            results = executor.map(fetch_rate, range(days))
            for res in results:
                if res:
                    rates.append(res)
                    
        return rates[::-1] # Return in chronological order
