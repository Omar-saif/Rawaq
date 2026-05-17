import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'navyshop.settings')
django.setup()

from shop.models import Category

categories = [
    {'name': 'Beauty', 'slug': 'beauty', 'description': 'Beauty and personal care products'},
    {'name': 'Books', 'slug': 'books', 'description': 'Books and literature'},
    {'name': 'Toys', 'slug': 'toys', 'description': 'Toys and games'},
    {'name': 'Food', 'slug': 'food', 'description': 'Food and beverages'},
]

for c in categories:
    Category.objects.get_or_create(slug=c['slug'], defaults=c)
    print(f'Added: {c["name"]}')