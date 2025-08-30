# utils/metrics.py
from django.utils import timezone
from django.core.cache import cache
from apps.projects.models import Bill
import time
import json

class CivicAIMetrics:
    """Collect and track performance metrics for Phase 2"""
    
    @staticmethod
    def record_processing_time(bill_id: str, processing_time: float):
        """Record bill processing time"""
        key = f"processing_times_{timezone.now().strftime('%Y%m%d')}"
        times = cache.get(key, [])
        times.append({
            'bill_id': bill_id,
            'processing_time': processing_time,
            'timestamp': timezone.now().isoformat()
        })
        cache.set(key, times, timeout=86400)  # Keep for 24 hours
    
    @staticmethod
    def record_websocket_connection(bill_id: str, connected: bool):
        """Record WebSocket connection events"""
        key = f"websocket_connections_{timezone.now().strftime('%Y%m%d')}"
        connections = cache.get(key, [])
        connections.append({
            'bill_id': bill_id,
            'connected': connected,
            'timestamp': timezone.now().isoformat()
        })
        cache.set(key, connections, timeout=86400)
    
    @staticmethod
    def get_daily_metrics():
        """Get metrics for today"""
        today = timezone.now().strftime('%Y%m%d')
        
        processing_times = cache.get(f"processing_times_{today}", [])
        websocket_connections = cache.get(f"websocket_connections_{today}", [])
        
        # Calculate averages
        avg_processing_time = 0
        if processing_times:
            avg_processing_time = sum(p['processing_time'] for p in processing_times) / len(processing_times)
        
        # WebSocket connection success rate
        total_connections = len(websocket_connections)
        successful_connections = len([c for c in websocket_connections if c['connected']])
        connection_success_rate = (successful_connections / total_connections * 100) if total_connections > 0 else 0
        
        return {
            'date': today,
            'processing': {
                'total_bills_processed': len(processing_times),
                'average_processing_time': avg_processing_time,
                'processing_times': processing_times[-10:]  # Last 10 for details
            },
            'websocket': {
                'total_connections': total_connections,
                'successful_connections': successful_connections,
                'success_rate': connection_success_rate
            }
        }
    
    @staticmethod
    def export_metrics():
        """Export metrics to file"""
        metrics = CivicAIMetrics.get_daily_metrics()
        
        filename = f"civicai_metrics_{timezone.now().strftime('%Y%m%d')}.json"
        with open(filename, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        return filename