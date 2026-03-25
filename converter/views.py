from django.shortcuts import render
from django.utils import timezone
from datetime import timedelta
import json
from .services import ExchangeRateService
from .models import ExchangeRate

def index(request):
    currencies = ExchangeRateService.get_supported_currencies()
    result = None
    common_conversions = []
    error = None

    # Get common conversions for USD if nothing is searched, or for the 'from' currency
    base_for_common = 'USD'
    
    if request.method == 'POST':
        from_curr = request.POST.get('from_currency')
        to_curr = request.POST.get('to_currency')
        amount = request.POST.get('amount')

        if from_curr and to_curr and amount:
            try:
                amount = float(amount)
                data = ExchangeRateService.convert(from_curr, to_curr, amount)
                if data:
                    result = {
                        'from_currency': from_curr,
                        'to_currency': to_curr,
                        'amount': amount,
                        'converted_amount': data['conversion_result'],
                        'rate': data['conversion_rate'],
                        'last_update': data['time_last_update_utc']
                    }
                    base_for_common = from_curr

                    # Fetch historical rates
                    today = timezone.now().date()
                    yesterday = today - timedelta(days=1)
                    last_week = today - timedelta(days=7)

                    rate_yesterday = ExchangeRateService.get_historical_rate(yesterday, from_curr, to_curr)
                    rate_last_week = ExchangeRateService.get_historical_rate(last_week, from_curr, to_curr)

                    historical_data = {
                        'yesterday': rate_yesterday,
                        'last_week': rate_last_week,
                    }

                    if rate_last_week and data['conversion_rate']:
                        change = ((float(data['conversion_rate']) - float(rate_last_week)) / float(rate_last_week)) * 100
                        historical_data['7d_change'] = change
                        historical_data['7d_change_abs'] = abs(change)
                    
                    result['historical'] = historical_data
                else:
                    error = "Unable to fetch conversion rate. Please try again later."
            except ValueError:
                error = "Please enter a valid amount."
        else:
            error = "All fields are required."

    # Fetch common target currencies
    targets = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'RWF', 'KES']
    if base_for_common in targets:
        targets.remove(base_for_common)
        targets.append('USD')

    for target in targets[:6]:
        data = ExchangeRateService.convert(base_for_common, target, 1)
        if data:
            common_conversions.append({
                'symbol': target,
                'rate': data['conversion_rate']
            })

    context = {
        'currencies': currencies,
        'result': result,
        'common_conversions': common_conversions,
        'base_for_common': base_for_common,
        'error': error,
    }
    return render(request, 'converter/index.html', context)

def currency_trend(request):
    import json
    currencies = ExchangeRateService.get_supported_currencies()
    from_curr = request.GET.get('from', 'USD')
    to_curr = request.GET.get('to', 'EUR')
    days_str = request.GET.get('days', '30')
    
    try:
        days = int(days_str)
    except ValueError:
        days = 30
    
    historical_rates = ExchangeRateService.get_historical_rates_range(from_curr, to_curr, days)
    
    # Prepare data for Chart.js
    labels = [rate['date'] for rate in historical_rates]
    values = [float(rate['rate']) for rate in historical_rates]
    
    context = {
        'currencies': currencies,
        'from_curr': from_curr,
        'to_curr': to_curr,
        'days': days,
        'historical_rates_json': json.dumps(values),
        'labels_json': json.dumps(labels),
    }
    return render(request, 'converter/trend.html', context)
