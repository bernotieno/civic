# =============================================================================
# FILE: apps/documents/urls.py
# =============================================================================
from django.urls import path
from . import views

app_name = 'documents'

urlpatterns = [
    # Document Management (Government Officials)
    path('upload/', views.DocumentUploadView.as_view(), name='upload'),
    path('list/', views.DocumentListView.as_view(), name='list'),
    path('<uuid:pk>/', views.DocumentDetailView.as_view(), name='detail'),
    path('<uuid:document_id>/download/', views.download_document, name='download'),
    path('analytics/', views.document_analytics, name='analytics'),
    
    # AI Chat System (Citizens & Officials)
    path('chat/start/', views.StartChatSessionView.as_view(), name='start_chat'),
    path('chat/question/', views.ProcessChatQuestionView.as_view(), name='chat_question'),
    path('chat/<uuid:session_id>/history/', views.get_chat_history, name='chat_history'),
    path('chat/feedback/', views.submit_message_feedback, name='chat_feedback'),
    
    # Public Access (No Auth Required)
    path('public/', views.public_documents, name='public_documents'),
]