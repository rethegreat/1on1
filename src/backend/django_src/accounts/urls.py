from django.urls import path
from accounts.views import LoginView, LogoutView

urlpatterns = [
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout')
]