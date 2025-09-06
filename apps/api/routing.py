# apps/api/routing.py
"""
WebSocket routing for CivicAI Phase 2 real-time progress updates

This file configures WebSocket URL patterns for Django Channels.
It should be imported in your main routing configuration.
"""

from django.urls import re_path
from .websocket_handlers import BillProgressConsumer

# WebSocket URL patterns for CivicAI real-time features
websocket_urlpatterns = [
    # Bill processing progress updates
    # URL: ws://domain/ws/bills/<bill_id>/progress/
    re_path(
        r'ws/bills/(?P<bill_id>[0-9a-f-]{36})/progress/$', 
        BillProgressConsumer.as_asgi(),
        name='bill_progress_websocket'
    ),
]

# Usage in main project routing (add to your main routing.py or asgi.py):
"""
# In your main project's routing.py or asgi.py:

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.api.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
"""

# WebSocket Connection Examples for Frontend:
"""
## JavaScript WebSocket Client Examples

### Basic Connection
```javascript
const billId = 'your-bill-uuid-here';
const wsUrl = `ws://localhost:8000/ws/bills/${billId}/progress/`;
const socket = new WebSocket(wsUrl);

socket.onopen = function(event) {
    console.log('Connected to bill progress updates');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Progress update:', data);
    
    switch(data.type) {
        case 'connection_established':
            console.log('WebSocket connection established');
            break;
            
        case 'progress_update':
            updateProgressBar(data.progress);
            showMessage(data.message);
            showTimeRemaining(data.time_remaining);
            break;
            
        case 'processing_complete':
            showSuccess('Processing completed!');
            socket.close();
            break;
            
        case 'processing_failed':
            showError('Processing failed: ' + data.error);
            showRetryButton();
            break;
            
        case 'error':
            console.error('WebSocket error:', data.message);
            break;
    }
};

socket.onerror = function(error) {
    console.error('WebSocket error:', error);
    // Fallback to polling
    startPolling();
};

socket.onclose = function(event) {
    console.log('WebSocket closed:', event.code, event.reason);
};
```

### With Authentication (if required)
```javascript
const socket = new WebSocket(wsUrl, [], {
    headers: {
        'Authorization': 'Bearer ' + authToken
    }
});
```

### React Hook Example
```javascript
import { useEffect, useState } from 'react';

function useBillProgress(billId) {
    const [progress, setProgress] = useState({
        status: 'connecting',
        progress: 0,
        message: 'Connecting...'
    });
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const wsUrl = `ws://localhost:8000/ws/bills/${billId}/progress/`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setProgress(prev => ({ ...prev, status: 'connected' }));
            setSocket(ws);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'progress_update') {
                setProgress({
                    status: 'processing',
                    progress: data.progress,
                    message: data.message,
                    timeRemaining: data.time_remaining
                });
            } else if (data.type === 'processing_complete') {
                setProgress({
                    status: 'completed',
                    progress: 100,
                    message: 'Processing complete!'
                });
            } else if (data.type === 'processing_failed') {
                setProgress({
                    status: 'failed',
                    progress: 0,
                    message: data.error || 'Processing failed'
                });
            }
        };

        ws.onerror = () => {
            setProgress(prev => ({ ...prev, status: 'error' }));
        };

        return () => {
            ws.close();
        };
    }, [billId]);

    const requestStatus = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'get_status' }));
        }
    };

    const sendPing = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
        }
    };

    return { progress, requestStatus, sendPing };
}

// Usage in component:
function BillProcessingStatus({ billId }) {
    const { progress, requestStatus } = useBillProgress(billId);

    return (
        <div>
            <div>Status: {progress.status}</div>
            <div>Progress: {progress.progress}%</div>
            <div>Message: {progress.message}</div>
            {progress.timeRemaining && (
                <div>Time remaining: {Math.round(progress.timeRemaining / 60)} minutes</div>
            )}
            <button onClick={requestStatus}>Refresh Status</button>
        </div>
    );
}
```

### Polling Fallback
```javascript
class BillProgressTracker {
    constructor(billId) {
        this.billId = billId;
        this.socket = null;
        this.pollingInterval = null;
        this.onProgress = () => {};
        this.onComplete = () => {};
        this.onError = () => {};
    }

    start() {
        // Try WebSocket first
        this.connectWebSocket();
    }

    connectWebSocket() {
        const wsUrl = `ws://localhost:8000/ws/bills/${this.billId}/progress/`;
        this.socket = new WebSocket(wsUrl);

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleProgressUpdate(data);
        };

        this.socket.onerror = () => {
            console.log('WebSocket failed, falling back to polling');
            this.startPolling();
        };

        this.socket.onclose = () => {
            if (!this.pollingInterval) {
                this.startPolling();
            }
        };
    }

    startPolling() {
        this.pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/admin/bills/${this.billId}/progress/`);
                const data = await response.json();
                
                if (data.success) {
                    this.handleProgressUpdate({
                        type: 'progress_update',
                        ...data.progress
                    });

                    if (data.progress.status === 'completed') {
                        this.stop();
                        this.onComplete();
                    } else if (data.progress.status === 'failed') {
                        this.stop();
                        this.onError(data.progress.message);
                    }
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000); // Poll every 2 seconds
    }

    handleProgressUpdate(data) {
        if (data.type === 'progress_update') {
            this.onProgress({
                progress: data.progress,
                message: data.message,
                stage: data.stage,
                timeRemaining: data.time_remaining
            });
        } else if (data.type === 'processing_complete') {
            this.stop();
            this.onComplete();
        } else if (data.type === 'processing_failed') {
            this.stop();
            this.onError(data.error || 'Processing failed');
        }
    }

    stop() {
        if (this.socket) {
            this.socket.close();
        }
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    }
}

// Usage:
const tracker = new BillProgressTracker(billId);

tracker.onProgress = (progress) => {
    updateProgressBar(progress.progress);
    showMessage(progress.message);
};

tracker.onComplete = () => {
    showSuccess('Processing completed!');
    refreshBillsList();
};

tracker.onError = (error) => {
    showError('Processing failed: ' + error);
    showRetryButton();
};

tracker.start();
```

## WebSocket Message Types

### From Server to Client:

1. **connection_established**: Sent when WebSocket connection is established
2. **progress_update**: Regular progress updates during processing
3. **processing_complete**: Sent when processing completes successfully  
4. **processing_failed**: Sent when processing fails
5. **status_response**: Response to client status requests
6. **pong**: Response to client ping (keepalive)
7. **error**: Error messages

### From Client to Server:

1. **get_status**: Request current processing status
2. **ping**: Keepalive ping to maintain connection

## Error Handling

- Connection failures automatically trigger polling fallback
- Invalid messages are handled gracefully with error responses
- Malformed JSON is rejected with error message
- Authentication errors (if implemented) close connection
- Server errors are logged and reported to client

## Performance Considerations

- Each WebSocket connection consumes minimal server resources
- Messages are JSON-encoded for efficiency
- Connections are automatically cleaned up on disconnect
- Polling fallback reduces server load when WebSocket unavailable
- Progress updates are throttled to avoid overwhelming clients

## Security Notes

- WebSocket connections can be protected with authentication middleware
- Bill IDs are validated to prevent access to unauthorized bills
- Rate limiting can be applied to prevent abuse
- Input validation prevents injection attacks
"""