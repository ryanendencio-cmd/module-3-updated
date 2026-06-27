import logging
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

logger = logging.getLogger(__name__)

EVENT_MODELS = {'Product', 'Category', 'Supplier', 'StockLedger', 'Notification'}


def get_obj_name(instance):
    for attr in ['name', 'company_name', 'title', 'product_name']:
        val = getattr(instance, attr, None)
        if val:
            return str(val)
    return str(instance)


def broadcast_event(model_name, action, instance):
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            logger.warning(f'broadcast_event: channel_layer is None for {model_name} {action}')
            return
        data = {
            'model': model_name,
            'action': action,
            'id': str(instance.pk) if instance and instance.pk else None,
            'name': get_obj_name(instance) if instance else None,
            'timestamp': timezone.now().isoformat(),
        }
        async_to_sync(channel_layer.group_send)(
            'events',
            {'type': 'event_message', 'data': data},
        )
        logger.info(f'✅ broadcast_event: {model_name} {action} {data["name"] or "(no name)"}')
    except Exception as e:
        logger.error(f'❌ broadcast_event failed: {e}', exc_info=True)


# Debug: Log when signal handlers are connected
import django
@receiver(post_save, sender='api.Product')
def debug_product_save(sender, **kwargs):
    logger.info(f'DEBUG: Product save signal triggered, created={kwargs.get("created")}')


@receiver(post_save, sender='api.Product')
def model_saved(sender, **kwargs):
    name = sender.__name__
    if name in EVENT_MODELS:
        action = 'created' if kwargs.get('created') else 'updated'
        logger.info(f'⚡ Signal: {name} {action}')
        broadcast_event(name, action, kwargs.get('instance'))


@receiver(post_delete, sender='api.Product')
def model_deleted(sender, **kwargs):
    name = sender.__name__
    if name in EVENT_MODELS:
        logger.info(f'⛔ Signal: {name} deleted')
        broadcast_event(name, 'deleted', kwargs.get('instance'))
