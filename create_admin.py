import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'navyshop.settings')
django.setup()

from shop.models import User

# Create superuser
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@navyshop.com',
        password='admin123'
    )
    print('Superuser created!')
    print('Username: admin')
    print('Password: admin123')
else:
    print('Superuser already exists')