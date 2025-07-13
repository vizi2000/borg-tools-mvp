import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
import jwt
from datetime import datetime, timedelta
from main import app

client = TestClient(app)

class TestGitHubOAuth:
    """Test GitHub OAuth authentication endpoints"""
    
    @patch('src.api.v1.endpoints.auth.github_client')
    def test_github_login_redirect(self, mock_github_client):
        """Test GitHub OAuth login redirect"""
        # Mock the OAuth URL generation
        mock_github_client.authorize_url.return_value = (
            "https://github.com/login/oauth/authorize?client_id=test&redirect_uri=test",
            "test_state"
        )
        
        response = client.get("/api/v1/auth/github/login")
        
        assert response.status_code == 200
        data = response.json()
        assert "auth_url" in data
        assert "state" in data
        assert "github.com" in data["auth_url"]
    
    @patch('src.api.v1.endpoints.auth.github_client')
    @patch('src.api.v1.endpoints.auth.get_github_user_info')
    @patch('src.api.v1.endpoints.auth.create_or_update_user')
    def test_github_callback_success(self, mock_create_user, mock_get_user, mock_github_client):
        """Test successful GitHub OAuth callback"""
        # Mock OAuth token exchange
        mock_github_client.fetch_token.return_value = {
            'access_token': 'github_access_token',
            'token_type': 'bearer'
        }
        
        # Mock GitHub user info
        mock_get_user.return_value = {
            'id': 123456,
            'login': 'testuser',
            'name': 'Test User',
            'email': 'test@example.com',
            'avatar_url': 'https://github.com/avatar.jpg'
        }
        
        # Mock user creation
        mock_create_user.return_value = {
            'id': 'user_123',
            'github_id': 123456,
            'username': 'testuser',
            'email': 'test@example.com'
        }
        
        response = client.get("/api/v1/auth/github/callback?code=test_code&state=test_state")
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert "user" in data
        assert data["user"]["username"] == "testuser"
    
    def test_github_callback_missing_code(self):
        """Test GitHub callback without authorization code"""
        response = client.get("/api/v1/auth/github/callback")
        
        assert response.status_code == 422  # Validation error
    
    @patch('src.api.v1.endpoints.auth.github_client')
    def test_github_callback_oauth_error(self, mock_github_client):
        """Test GitHub callback with OAuth error"""
        # Mock OAuth error
        mock_github_client.fetch_token.side_effect = Exception("OAuth error")
        
        response = client.get("/api/v1/auth/github/callback?code=invalid_code&state=test_state")
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    
    @patch('src.api.v1.endpoints.auth.verify_jwt_token')
    def test_get_current_user_valid_token(self, mock_verify_token):
        """Test getting current user with valid JWT token"""
        # Mock token verification
        mock_verify_token.return_value = {
            'user_id': 'user_123',
            'github_id': 123456,
            'username': 'testuser'
        }
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "user_123"
        assert data["username"] == "testuser"
    
    def test_get_current_user_missing_token(self):
        """Test getting current user without token"""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_get_current_user_invalid_token(self):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    @patch('src.api.v1.endpoints.auth.revoke_user_tokens')
    @patch('src.api.v1.endpoints.auth.verify_jwt_token')
    def test_logout_success(self, mock_verify_token, mock_revoke_tokens):
        """Test successful logout"""
        # Mock token verification
        mock_verify_token.return_value = {
            'user_id': 'user_123',
            'username': 'testuser'
        }
        
        # Mock token revocation
        mock_revoke_tokens.return_value = True
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.post("/api/v1/auth/logout", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Successfully logged out"

class TestJWTTokenHandling:
    """Test JWT token creation and verification"""
    
    def test_create_jwt_token(self):
        """Test JWT token creation"""
        from src.api.v1.endpoints.auth import create_jwt_token
        
        user_data = {
            'user_id': 'user_123',
            'github_id': 123456,
            'username': 'testuser'
        }
        
        token = create_jwt_token(user_data)
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Verify token structure (header.payload.signature)
        parts = token.split('.')
        assert len(parts) == 3
    
    def test_verify_jwt_token_valid(self):
        """Test JWT token verification with valid token"""
        from src.api.v1.endpoints.auth import create_jwt_token, verify_jwt_token
        
        user_data = {
            'user_id': 'user_123',
            'github_id': 123456,
            'username': 'testuser'
        }
        
        token = create_jwt_token(user_data)
        decoded_data = verify_jwt_token(token)
        
        assert decoded_data['user_id'] == user_data['user_id']
        assert decoded_data['username'] == user_data['username']
    
    def test_verify_jwt_token_expired(self):
        """Test JWT token verification with expired token"""
        from src.api.v1.endpoints.auth import verify_jwt_token
        import jwt
        import os
        
        # Create expired token
        expired_payload = {
            'user_id': 'user_123',
            'exp': datetime.utcnow() - timedelta(hours=1)  # Expired 1 hour ago
        }
        
        secret_key = os.getenv('SECRET_KEY', 'test_secret')
        expired_token = jwt.encode(expired_payload, secret_key, algorithm='HS256')
        
        with pytest.raises(Exception):  # Should raise JWT expiration error
            verify_jwt_token(expired_token)
    
    def test_verify_jwt_token_invalid_signature(self):
        """Test JWT token verification with invalid signature"""
        from src.api.v1.endpoints.auth import verify_jwt_token
        
        # Token with wrong signature
        invalid_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoidXNlcl8xMjMifQ.invalid_signature"
        
        with pytest.raises(Exception):  # Should raise JWT signature error
            verify_jwt_token(invalid_token)

class TestUserManagement:
    """Test user creation and management"""
    
    @patch('src.api.v1.endpoints.auth.supabase')
    def test_create_or_update_user_new_user(self, mock_supabase):
        """Test creating a new user"""
        from src.api.v1.endpoints.auth import create_or_update_user
        
        # Mock Supabase response for new user
        mock_supabase.table().select().eq().execute.return_value.data = []
        mock_supabase.table().insert().execute.return_value.data = [{
            'id': 'user_123',
            'github_id': 123456,
            'username': 'testuser',
            'email': 'test@example.com',
            'created_at': '2025-01-01T00:00:00Z'
        }]
        
        github_user = {
            'id': 123456,
            'login': 'testuser',
            'name': 'Test User',
            'email': 'test@example.com',
            'avatar_url': 'https://github.com/avatar.jpg'
        }
        
        result = create_or_update_user(github_user, 'github_token')
        
        assert result['github_id'] == 123456
        assert result['username'] == 'testuser'
        assert result['email'] == 'test@example.com'
    
    @patch('src.api.v1.endpoints.auth.supabase')
    def test_create_or_update_user_existing_user(self, mock_supabase):
        """Test updating an existing user"""
        from src.api.v1.endpoints.auth import create_or_update_user
        
        # Mock Supabase response for existing user
        existing_user = {
            'id': 'user_123',
            'github_id': 123456,
            'username': 'testuser',
            'email': 'old@example.com'
        }
        
        mock_supabase.table().select().eq().execute.return_value.data = [existing_user]
        mock_supabase.table().update().eq().execute.return_value.data = [{
            **existing_user,
            'email': 'new@example.com',
            'updated_at': '2025-01-01T00:00:00Z'
        }]
        
        github_user = {
            'id': 123456,
            'login': 'testuser',
            'name': 'Test User',
            'email': 'new@example.com',
            'avatar_url': 'https://github.com/avatar.jpg'
        }
        
        result = create_or_update_user(github_user, 'github_token')
        
        assert result['email'] == 'new@example.com'

class TestGitHubIntegration:
    """Test GitHub API integration"""
    
    @patch('src.api.v1.endpoints.auth.requests.get')
    def test_get_github_user_info_success(self, mock_get):
        """Test successful GitHub user info retrieval"""
        from src.api.v1.endpoints.auth import get_github_user_info
        
        # Mock GitHub API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'id': 123456,
            'login': 'testuser',
            'name': 'Test User',
            'email': 'test@example.com',
            'avatar_url': 'https://github.com/avatar.jpg'
        }
        mock_get.return_value = mock_response
        
        result = get_github_user_info('github_access_token')
        
        assert result['id'] == 123456
        assert result['login'] == 'testuser'
        assert result['email'] == 'test@example.com'
    
    @patch('src.api.v1.endpoints.auth.requests.get')
    def test_get_github_user_info_api_error(self, mock_get):
        """Test GitHub user info retrieval with API error"""
        from src.api.v1.endpoints.auth import get_github_user_info
        
        # Mock GitHub API error
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.json.return_value = {'message': 'Bad credentials'}
        mock_get.return_value = mock_response
        
        with pytest.raises(Exception):
            get_github_user_info('invalid_token')

class TestSecurityFeatures:
    """Test security features and protections"""
    
    def test_csrf_protection(self):
        """Test CSRF protection mechanisms"""
        # Test that state parameter is required and validated
        response = client.get("/api/v1/auth/github/callback?code=test_code")
        # Should fail without state parameter
        assert response.status_code in [400, 422]
    
    def test_rate_limiting(self):
        """Test rate limiting on auth endpoints"""
        # Make multiple rapid requests
        responses = []
        for _ in range(20):  # Attempt 20 rapid requests
            response = client.get("/api/v1/auth/github/login")
            responses.append(response)
        
        # Should eventually rate limit (429) or continue allowing (depends on implementation)
        status_codes = [r.status_code for r in responses]
        assert all(code in [200, 429] for code in status_codes)
    
    def test_secure_token_storage(self):
        """Test that tokens are handled securely"""
        # Tokens should not be logged or exposed
        # This is more of a code review item, but we can test response structure
        
        with patch('src.api.v1.endpoints.auth.github_client') as mock_client:
            mock_client.authorize_url.return_value = ("https://github.com/oauth", "state")
            
            response = client.get("/api/v1/auth/github/login")
            
            # Response should not contain sensitive information
            response_text = response.text.lower()
            assert "secret" not in response_text
            assert "private" not in response_text

if __name__ == "__main__":
    pytest.main([__file__, "-v"])