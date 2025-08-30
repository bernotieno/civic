# management/commands/monitor_civicai.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.projects.models import Bill, BillChunk
from apps.api.async_progress_tracker import get_all_active_processing_sessions
from celery import current_app
import json

class Command(BaseCommand):
    help = 'Monitor CivicAI Phase 2 performance and status'
    
    def add_arguments(self, parser):
        parser.add_argument('--format', choices=['json', 'table'], default='table')
        parser.add_argument('--interval', type=int, default=0, help='Monitoring interval in seconds (0 for one-time)')
    
    def handle(self, *args, **options):
        if options['interval'] > 0:
            import time
            while True:
                self.show_status(options['format'])
                time.sleep(options['interval'])
        else:
            self.show_status(options['format'])
    
    def show_status(self, format_type):
        # Bill statistics
        total_bills = Bill.objects.count()
        processing_bills = Bill.objects.filter(processing_status='processing').count()
        completed_bills = Bill.objects.filter(processing_status='completed').count()
        failed_bills = Bill.objects.filter(processing_status='failed').count()
        
        # Chunk statistics
        total_chunks = BillChunk.objects.count()
        processed_chunks = BillChunk.objects.filter(is_processed=True).count()
        
        # Active async sessions
        active_sessions = get_all_active_processing_sessions()
        
        # Celery queue status
        inspect = current_app.control.inspect()
        active_tasks = inspect.active()
        queue_lengths = {}
        
        if active_tasks:
            for worker, tasks in active_tasks.items():
                for task in tasks:
                    queue = task.get('delivery_info', {}).get('routing_key', 'unknown')
                    queue_lengths[queue] = queue_lengths.get(queue, 0) + 1
        
        stats = {
            'timestamp': timezone.now().isoformat(),
            'bills': {
                'total': total_bills,
                'processing': processing_bills,
                'completed': completed_bills,
                'failed': failed_bills
            },
            'chunks': {
                'total': total_chunks,
                'processed': processed_chunks,
                'processing_rate': (processed_chunks / total_chunks * 100) if total_chunks > 0 else 0
            },
            'async_sessions': {
                'active': len(active_sessions),
                'sessions': [
                    {
                        'bill_id': s['bill_id'],
                        'bill_title': s['bill_title'][:50],
                        'progress': s.get('progress', 0),
                        'stage': s.get('stage', 'unknown')
                    }
                    for s in active_sessions
                ]
            },
            'celery_queues': queue_lengths
        }
        
        if format_type == 'json':
            self.stdout.write(json.dumps(stats, indent=2))
        else:
            self.print_table(stats)
    
    def print_table(self, stats):
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(f"CivicAI Phase 2 Status - {stats['timestamp']}")
        self.stdout.write(f"{'='*60}")
        
        # Bills
        bills = stats['bills']
        self.stdout.write(f"\n📄 BILLS:")
        self.stdout.write(f"   Total: {bills['total']}")
        self.stdout.write(f"   Processing: {bills['processing']} ⏳")
        self.stdout.write(f"   Completed: {bills['completed']} ✅")  
        self.stdout.write(f"   Failed: {bills['failed']} ❌")
        
        # Chunks
        chunks = stats['chunks']
        self.stdout.write(f"\n🧩 CHUNKS:")
        self.stdout.write(f"   Total: {chunks['total']}")
        self.stdout.write(f"   Processed: {chunks['processed']} ({chunks['processing_rate']:.1f}%)")
        
        # Active Sessions
        sessions = stats['async_sessions']
        self.stdout.write(f"\n⚡ ASYNC SESSIONS: {sessions['active']} active")
        for session in sessions['sessions']:
            self.stdout.write(f"   📋 {session['bill_title']} - {session['progress']}% ({session['stage']})")
        
        # Queues
        queues = stats['celery_queues']
        if queues:
            self.stdout.write(f"\n📬 CELERY QUEUES:")
            for queue, count in queues.items():
                self.stdout.write(f"   {queue}: {count} tasks")
        else:
            self.stdout.write(f"\n📬 CELERY QUEUES: All queues empty ✅")
        
        self.stdout.write(f"\n{'='*60}\n")