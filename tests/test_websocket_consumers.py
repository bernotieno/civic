# tests/test_websocket_consumers.py
import pytest
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from apps.api.websocket_handlers import BillProgressConsumer
from apps.projects.models import Bill
import json

@pytest.mark.asyncio
class TestBillProgressConsumer:
    
    async def test_websocket_connection(self):
        """Test WebSocket connection establishment"""
        # Create test bill
        bill = await database_sync_to_async(Bill.objects.create)(
            title="Test Bill",
            description="Test Description",
            sponsor="Test Sponsor"
        )
        
        # Test WebSocket connection
        communicator = WebsocketCommunicator(
            BillProgressConsumer.as_asgi(),
            f"/ws/bills/{bill.id}/progress/"
        )
        
        connected, _ = await communicator.connect()
        assert connected
        
        # Should receive connection confirmation
        response = await communicator.receive_json_from()
        assert response['type'] == 'connection_established'
        assert response['bill_id'] == str(bill.id)
        
        await communicator.disconnect()
    
    async def test_websocket_progress_broadcast(self):
        """Test progress update broadcasting"""
        bill = await database_sync_to_async(Bill.objects.create)(
            title="Test Bill",
            description="Test Description", 
            sponsor="Test Sponsor"
        )
        
        communicator = WebsocketCommunicator(
            BillProgressConsumer.as_asgi(),
            f"/ws/bills/{bill.id}/progress/"
        )
        
        connected, _ = await communicator.connect()
        assert connected
        
        # Skip connection message
        await communicator.receive_json_from()
        
        # Test broadcasting
        from apps.api.websocket_handlers import broadcast_bill_progress
        await database_sync_to_async(broadcast_bill_progress)(
            str(bill.id),
            {
                'stage': 'processing',
                'progress': 50,
                'message': 'Test progress update',
                'time_remaining': 120
            }
        )
        
        # Should receive progress update
        response = await communicator.receive_json_from()
        assert response['type'] == 'progress_update'
        assert response['progress'] == 50
        assert response['message'] == 'Test progress update'
        
        await communicator.disconnect()
    
    async def test_websocket_client_messages(self):
        """Test client message handling"""
        bill = await database_sync_to_async(Bill.objects.create)(
            title="Test Bill",
            description="Test Description",
            sponsor="Test Sponsor"
        )
        
        communicator = WebsocketCommunicator(
            BillProgressConsumer.as_asgi(),
            f"/ws/bills/{bill.id}/progress/"
        )
        
        connected, _ = await communicator.connect()
        assert connected
        
        # Skip connection message
        await communicator.receive_json_from()
        
        # Test ping/pong
        await communicator.send_json_to({'type': 'ping'})
        response = await communicator.receive_json_from()
        assert response['type'] == 'pong'
        
        # Test status request
        await communicator.send_json_to({'type': 'get_status'})
        response = await communicator.receive_json_from()
        assert response['type'] == 'status_response'
        
        await communicator.disconnect()