# tests/test_phase2_setup.py
import pytest
from django.test import TestCase, TransactionTestCase
from django.test.utils import override_settings
from unittest.mock import patch, MagicMock
from channels.testing import WebsocketCommunicator
from celery import current_app
from celery.contrib.testing.worker import start_worker

class Phase2TestCase(TransactionTestCase):
    """Base test case for Phase 2 async functionality"""
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Start test Celery worker
        current_app.loader.import_default_modules()
        cls.celery_worker = start_worker(current_app, perform_ping_check=False)
        cls.celery_worker.__enter__()
    
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls.celery_worker.__exit__(None, None, None)
    
    def setUp(self):
        super().setUp()
        # Clear Redis cache before each test
        from django.core.cache import cache
        cache.clear()