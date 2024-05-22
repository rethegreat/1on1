from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

from accounts.views import LoginView, LogoutView, RegisterView, ProfileView, ContactsListView, AddContactView, \
    RemoveContactView

urlpatterns = [
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('api/contacts/list/', ContactsListView.as_view(), name='contacts_list'),
    path('api/contacts/add/', AddContactView.as_view(), name='contact_add'),
    path('api/contacts/remove/', RemoveContactView.as_view(), name='contact_remove')
]