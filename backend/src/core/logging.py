"""
Logging configuration for the application.
"""

import logging
import sys
from typing import Dict, Any


def setup_logging() -> None:
    """Setup structured logging for the application."""
    
    # Configure stdlib logging
    logging.basicConfig(
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance."""
    return logging.getLogger(name)


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