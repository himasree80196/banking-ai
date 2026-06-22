import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response: Response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(
            f"{request.method} {request.url.path} "
            f"status={response.status_code} "
            f"duration={process_time:.2f}ms "
            f"ip={request.client.host if request.client else 'unknown'}"
        )
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        return response
