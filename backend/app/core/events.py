"""
In-process domain event bus for module decoupling.
Allows modules to publish and subscribe to events without direct dependencies.
"""
from typing import Dict, List, Callable, Any
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

# Event registry: {event_name: [handler_fn1, handler_fn2, ...]}
_event_handlers: Dict[str, List[Callable]] = defaultdict(list)


def subscribe(event_name: str):
    """
    Decorator to subscribe a handler function to an event.

    Usage:
        @subscribe("FeedbackCreated")
        def on_feedback_created(payload: dict):
            # Handle event
            pass
    """

    def decorator(handler: Callable):
        _event_handlers[event_name].append(handler)
        logger.info(f"Subscribed {handler.__name__} to event: {event_name}")
        return handler

    return decorator


def publish(event_name: str, payload: Dict[str, Any]):
    """
    Publish an event with a payload.
    All subscribed handlers will be called synchronously.

    Args:
        event_name: Name of the event (e.g., "FeedbackCreated")
        payload: Event data as a dictionary

    Example:
        publish("FeedbackCreated", {
            "feedback_id": 123,
            "user_id": 456,
            "title": "Fix the bug"
        })
    """
    handlers = _event_handlers.get(event_name, [])

    if not handlers:
        logger.debug(f"No handlers for event: {event_name}")
        return

    logger.info(f"Publishing event: {event_name} to {len(handlers)} handler(s)")

    for handler in handlers:
        try:
            handler(payload)
        except Exception as e:
            logger.error(f"Error in handler {handler.__name__} for event {event_name}: {e}")
            # Continue executing other handlers even if one fails


def clear_handlers():
    """Clear all event handlers. Useful for testing."""
    _event_handlers.clear()


def get_handlers(event_name: str) -> List[Callable]:
    """Get all handlers for a specific event. Useful for testing."""
    return _event_handlers.get(event_name, [])
