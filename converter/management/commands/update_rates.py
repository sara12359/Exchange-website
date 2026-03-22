from django.core.management.base import BaseCommand
from converter.services import ExchangeRateService

class Command(BaseCommand):
    help = 'Sync currencies and exchange rates from ExchangeRate-API'

    def handle(self, *args, **options):
        self.stdout.write('Starting sync...')
        
        currencies = ExchangeRateService.sync_currencies()
        if currencies:
            self.stdout.write(self.style.SUCCESS(f'Successfully synced {len(currencies)} currencies'))
        else:
            self.stdout.write(self.style.ERROR('Failed to sync currencies'))

        if ExchangeRateService.sync_rates('USD'):
            self.stdout.write(self.style.SUCCESS('Successfully synced exchange rates'))
        else:
            self.stdout.write(self.style.ERROR('Failed to sync exchange rates'))
