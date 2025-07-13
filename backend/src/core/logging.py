"""
Logging configuration for the application.
"""

import logging
import sys
from typing import Dict, Any

import structlog


def setup_logging() -> None:
    """Setup structured logging for the application."""
    
    # Configure stdlib logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


def log_api_request(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: str = None,
    **kwargs: Any
) -> None:
    """Log an API request with structured data."""
    logger = get_logger("api")
    logger.info(
        "API request",
        method=method,
        path=path,
        status_code=status_code,
        duration_ms=duration_ms,
        user_id=user_id,
        **kwargs
    )


def log_cv_generation(
    user_id: str,
    github_username: str,
    template: str,
    status: str,
    duration_ms: float = None,
    error: str = None,
    **kwargs: Any
) -> None:
    """Log CV generation events."""
    logger = get_logger("cv_generation")
    logger.info(
        "CV generation",
        user_id=user_id,
        github_username=github_username,
        template=template,
        status=status,
        duration_ms=duration_ms,
        error=error,
        **kwargs
    )