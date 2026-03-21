from django.shortcuts import render
from .services import ExchangeRateService

def index(request):
    currencies = ExchangeRateService.get_supported_currencies()
    result = None
    error = None

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
                else:
                    error = "Unable to fetch conversion rate. Please try again later."
            except ValueError:
                error = "Please enter a valid amount."
        else:
            error = "All fields are required."

    context = {
        'currencies': currencies,
        'result': result,
        'error': error,
    }
    return render(request, 'converter/index.html', context)
