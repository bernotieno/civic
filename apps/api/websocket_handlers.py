# apps/api/websocket_handlers.py
import json
import logging
from typing import Dict, Optional
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone

logger = logging.getLogger(__name__)


class BillProgressConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time bill processing progress updates
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        try:
            # Get bill ID from URL route
            self.bill_id = self.scope['url_route']['kwargs']['bill_id']
            self.group_name = f'bill_progress_{self.bill_id}'
            
            # Join bill progress group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            # Accept the connection
            await self.accept()
            
            # Send initial connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'bill_id': self.bill_id,
                'message': 'Connected to bill progress updates',
                'timestamp': timezone.now().isoformat()
            }))
            
            # Send current progress if available
            from .async_progress_tracker import get_bill_processing_status
            try:
                status = get_bill_processing_status(self.bill_id)
                await self.send(text_data=json.dumps({
                    'type': 'progress_update',
                    'bill_id': self.bill_id,
                    **status,
                    'timestamp': timezone.now().isoformat()
                }))
            except Exception as e:
                logger.warning(f"Could not send initial progress for bill {self.bill_id}: {str(e)}")
            
            logger.info(f"WebSocket connected for bill {self.bill_id}")
            
        except Exception as e:
            logger.error(f"WebSocket connection failed: {str(e)}")
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            # Leave bill progress group
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            
            logger.info(f"WebSocket disconnected for bill {self.bill_id} (code: {close_code})")
            
        except Exception as e:
            logger.error(f"WebSocket disconnect error: {str(e)}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', '')
            
            if message_type == 'get_status':
                # Client requesting current status
                from .async_progress_tracker import get_bill_processing_status
                try:
                    status = get_bill_processing_status(self.bill_id)
                    await self.send(text_data=json.dumps({
                        'type': 'status_response',
                        'bill_id': self.bill_id,
                        **status,
                        'timestamp': timezone.now().isoformat()
                    }))
                except Exception as e:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': f'Failed to get status: {str(e)}',
                        'timestamp': timezone.now().isoformat()
                    }))
            
            elif message_type == 'ping':
                # Keepalive ping
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': timezone.now().isoformat()
                }))
            
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}',
                    'timestamp': timezone.now().isoformat()
                }))
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format',
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            logger.error(f"WebSocket receive error: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal error processing message',
                'timestamp': timezone.now().isoformat()
            }))
    
    async def progress_update(self, event):
        """Handle progress update broadcast from group"""
        try:
            # Send progress update to WebSocket
            await self.send(text_data=json.dumps({
                'type': 'progress_update',
                'bill_id': self.bill_id,
                **event['progress_data'],
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            logger.error(f"Failed to send progress update: {str(e)}")
    
    async def processing_complete(self, event):
        """Handle processing completion broadcast"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'processing_complete',
                'bill_id': self.bill_id,
                **event['completion_data'],
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            logger.error(f"Failed to send completion update: {str(e)}")
    
    async def processing_failed(self, event):
        """Handle processing failure broadcast"""
        try:
            await self.send(text_data=json.dumps({
                'type': 'processing_failed',
                'bill_id': self.bill_id,
                **event['failure_data'],
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            logger.error(f"Failed to send failure update: {str(e)}")


# Helper functions for broadcasting (can be called from tasks and views)

def setup_bill_progress_channel(bill_id: str) -> str:
    """
    Setup WebSocket channel for bill processing progress
    Args:
        bill_id: Bill UUID string
    Returns:
        str: Channel name for WebSocket connection
    """
    return f'bill_progress_{bill_id}'


def broadcast_bill_progress(bill_id: str, progress_data: Dict) -> None:
    """
    Broadcast progress update via WebSocket
    Args:
        bill_id: Bill UUID string
        progress_data: {
            'progress': int,
            'message': str,
            'stage': str,
            'time_remaining': int
        }
    """
    try:
        channel_layer = get_channel_layer()
        group_name = setup_bill_progress_channel(bill_id)
        
        # Broadcast to all connections in the group
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'progress_update',
                'progress_data': progress_data
            }
        )
        
        logger.debug(f"Broadcast progress for bill {bill_id}: {progress_data.get('progress', 0)}%")
        
    except Exception as e:
        logger.error(f"Failed to broadcast progress for bill {bill_id}: {str(e)}")


def broadcast_processing_complete(bill_id: str, completion_data: Dict) -> None:
    """
    Broadcast processing completion via WebSocket
    Args:
        bill_id: Bill UUID string
        completion_data: Completion information
    """
    try:
        channel_layer = get_channel_layer()
        group_name = setup_bill_progress_channel(bill_id)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'processing_complete',
                'completion_data': completion_data
            }
        )
        
        logger.info(f"Broadcast completion for bill {bill_id}")
        
    except Exception as e:
        logger.error(f"Failed to broadcast completion for bill {bill_id}: {str(e)}")


def broadcast_processing_failed(bill_id: str, failure_data: Dict) -> None:
    """
    Broadcast processing failure via WebSocket
    Args:
        bill_id: Bill UUID string
        failure_data: Failure information
    """
    try:
        channel_layer = get_channel_layer()
        group_name = setup_bill_progress_channel(bill_id)
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'processing_failed',
                'failure_data': failure_data
            }
        )
        
        logger.warning(f"Broadcast failure for bill {bill_id}")
        
    except Exception as e:
        logger.error(f"Failed to broadcast failure for bill {bill_id}: {str(e)}")


def close_bill_progress_channel(bill_id: str) -> None:
    """
    Close WebSocket channel when processing complete
    Args:
        bill_id: Bill UUID string
    """
    try:
        # Send final completion message
        broadcast_processing_complete(bill_id, {
            'final': True,
            'message': 'Processing completed, channel closing'
        })
        
        logger.info(f"Closed progress channel for bill {bill_id}")
        
    except Exception as e:
        logger.error(f"Failed to close progress channel for bill {bill_id}: {str(e)}")


# Utility functions for non-WebSocket progress updates (polling fallback)

def get_progress_for_polling(bill_id: str) -> Dict:
    """
    Get current progress for polling clients (fallback when WebSocket unavailable)
    Args:
        bill_id: Bill UUID string
    Returns:
        dict: Current progress data formatted for polling
    """
    try:
        from .async_progress_tracker import get_bill_processing_status
        
        status = get_bill_processing_status(bill_id)
        
        return {
            'success': True,
            'bill_id': bill_id,
            'timestamp': timezone.now().isoformat(),
            **status
        }
        
    except Exception as e:
        logger.error(f"Failed to get polling progress for bill {bill_id}: {str(e)}")
        return {
            'success': False,
            'bill_id': bill_id,
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }


def check_websocket_support() -> bool:
    """
    Check if WebSocket support is available
    Returns:
        bool: True if WebSocket/Channels is properly configured
    """
    try:
        channel_layer = get_channel_layer()
        return channel_layer is not None
    except Exception:
        return False


# WebSocket connection management

class BillProgressManager:
    """
    Manager for bill progress WebSocket connections
    """
    
    @staticmethod
    def get_active_connections(bill_id: str) -> int:
        """
        Get number of active WebSocket connections for a bill
        Args:
            bill_id: Bill UUID string
        Returns:
            int: Number of active connections
        """
        try:
            channel_layer = get_channel_layer()
            group_name = setup_bill_progress_channel(bill_id)
            
            # Note: Django Channels doesn't provide a direct way to count group members
            # This is a placeholder for more advanced connection tracking
            return 0  # Would need Redis/database tracking for accurate count
            
        except Exception as e:
            logger.error(f"Failed to get connection count for bill {bill_id}: {str(e)}")
            return 0
    
    @staticmethod
    def disconnect_all(bill_id: str) -> None:
        """
        Disconnect all WebSocket connections for a bill
        Args:
            bill_id: Bill UUID string
        """
        try:
            channel_layer = get_channel_layer()
            group_name = setup_bill_progress_channel(bill_id)
            
            # Send disconnect message to all connections
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'disconnect'
                }
            )
            
            logger.info(f"Disconnected all WebSocket connections for bill {bill_id}")
            
        except Exception as e:
            logger.error(f"Failed to disconnect connections for bill {bill_id}: {str(e)}")


# Export key functions for use in other modules
__all__ = [
    'BillProgressConsumer',
    'setup_bill_progress_channel',
    'broadcast_bill_progress',
    'broadcast_processing_complete',
    'broadcast_processing_failed',
    'close_bill_progress_channel',
    'get_progress_for_polling',
    'check_websocket_support',
    'BillProgressManager'
]