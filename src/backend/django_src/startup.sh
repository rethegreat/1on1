#!/bin/bash

# 1. Go to the directory you want
# cd OneOnOne

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
source venv/bin/activate

# 4. Install Django
python -m pip install Django

# 5. Install all required packages
pip install django pillow djangorestframework djangorestframework-simplejwt

# 6. Run all migrations
python manage.py migrate