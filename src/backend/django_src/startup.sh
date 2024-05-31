#!/bin/bash

# 1. Go to the directory you want
# cd OneOnOne
sudo apt install python3.8-venv -y

# 2. Create a virtual environment
python3 -m venv venv

# 3. Activate the virtual environment
source venv/bin/activate

pip install django pillow djangorestframework djangorestframework-simplejwt django-environ django-cors-headers psycopg2

# # 4. Install Django
# python3 -m pip install Django

# # 5. Install all required packages

# 6. Run all migrations
python3 manage.py makemigrations
python3 manage.py migrate