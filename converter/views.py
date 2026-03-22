from django.shortcuts import render
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
