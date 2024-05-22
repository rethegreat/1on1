from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from datetime import datetime

def validate_datetime_format(value):
    """
    Validate that the input value is in a specific datetime format.
    """
    # Define the desired datetime format
    datetime_format = '%Y-%m-%d %H:%M'  # Example format: YYYY-MM-DD HH:MM
    
    try:
        # Attempt to parse the value using the specified format
        string = str(value)[:]
        # Get rid of seconds and timezone
        input_value = str(value).split('+')[0][:-9]
        datetime.strptime(input_value, datetime_format)
    except ValueError:
        # If parsing fails, raise a validation error
        raise ValidationError(
            _(f'Invalid datetime format. The format should be YYYY-MM-DD HH:MM.'),
            params={'value': value},
        )