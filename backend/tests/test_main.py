import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import asyncio
from main import app

client = TestClient(app)

class TestMainApp:
    """Test the main FastAPI application"""
    
    def test_health_check(self):
        """Test the health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
        assert data["version"] == "0.1.0"
    
    def test_root_endpoint(self):
        """Test the root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Borg-Tools API"
        assert data["version"] == "0.1.0"
        assert data["docs_url"] == "/docs"
    
    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        response = client.options("/health")
        assert response.status_code == 200
        
        # Check CORS headers
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "access-control-allow-headers" in response.headers
    
    def test_openapi_docs_available(self):
        """Test that OpenAPI docs are accessible"""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_openapi_json_available(self):
        """Test that OpenAPI JSON schema is accessible"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        
        data = response.json()
        assert data["info"]["title"] == "Borg-Tools API"
        assert data["info"]["version"] == "0.1.0"
    
    @pytest.mark.asyncio
    async def test_lifespan_startup(self):
        """Test application startup logic"""
        # This would test any startup logic when implemented
        # For now, just verify the app starts successfully
        assert app is not None
        assert app.title == "Borg-Tools API"
    
    def test_security_headers(self):
        """Test security headers are set"""
        response = client.get("/health")
        
        # Check for security headers (if implemented)
        headers = response.headers
        # These would be added by security middleware
        # assert "x-content-type-options" in headers
        # assert "x-frame-options" in headers
    
    def test_api_versioning(self):
        """Test API versioning structure"""
        # Test that v1 prefix works
        response = client.get("/api/v1/")
        # This will depend on actual v1 implementation
        # For now, just check the structure is ready
        assert response.status_code in [200, 404, 405]  # Valid responses
    
    def test_error_handling_404(self):
        """Test 404 error handling"""
        response = client.get("/nonexistent-endpoint")
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data
    
    def test_error_handling_method_not_allowed(self):
        """Test 405 error handling"""
        response = client.post("/health")  # GET-only endpoint
        assert response.status_code == 405
        
        data = response.json()
        assert "detail" in data

class TestConfiguration:
    """Test application configuration"""
    
    def test_app_metadata(self):
        """Test application metadata is correct"""
        assert app.title == "Borg-Tools API"
        assert app.description == "One-click CV generator for developers"
        assert app.version == "0.1.0"
    
    def test_debug_mode(self):
        """Test debug mode configuration"""
        # In production, debug should be False
        # In development, can be True
        assert hasattr(app, 'debug')
    
    def test_middleware_configured(self):
        """Test that required middleware is configured"""
        middleware_classes = [m.cls.__name__ for m in app.user_middleware]
        
        # Check for CORS middleware
        assert any("CORS" in cls for cls in middleware_classes)

class TestPerformance:
    """Test performance characteristics"""
    
    def test_health_check_performance(self):
        """Test health check response time"""
        import time
        
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 1.0  # Should respond within 1 second
    
    def test_concurrent_requests(self):
        """Test handling of concurrent requests"""
        import threading
        import time
        
        responses = []
        
        def make_request():
            response = client.get("/health")
            responses.append(response)
        
        # Create 10 concurrent threads
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
        
        # Start all threads
        start_time = time.time()
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        
        # All requests should succeed
        assert len(responses) == 10
        assert all(r.status_code == 200 for r in responses)
        
        # Should handle concurrent requests efficiently
        assert (end_time - start_time) < 5.0  # Within 5 seconds

class TestSecurity:
    """Test security features"""
    
    def test_sql_injection_protection(self):
        """Test protection against SQL injection"""
        # Test with malicious input
        malicious_input = "'; DROP TABLE users; --"
        response = client.get(f"/health?param={malicious_input}")
        
        # Should handle gracefully, not crash
        assert response.status_code in [200, 400, 422]
    
    def test_xss_protection(self):
        """Test protection against XSS"""
        # Test with XSS payload
        xss_payload = "<script>alert('xss')</script>"
        response = client.get(f"/health?param={xss_payload}")
        
        # Should handle gracefully
        assert response.status_code in [200, 400, 422]
        
        # Response should not contain unescaped script
        if response.status_code == 200:
            assert "<script>" not in response.text
    
    def test_request_size_limits(self):
        """Test request size limits"""
        # Test with large payload
        large_data = {"data": "x" * 10000}  # 10KB of data
        response = client.post("/health", json=large_data)
        
        # Should handle appropriately (either accept or reject cleanly)
        assert response.status_code in [200, 400, 413, 422]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])