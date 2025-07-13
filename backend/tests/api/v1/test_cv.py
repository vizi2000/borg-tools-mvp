import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
import asyncio
from main import app

client = TestClient(app)

class TestCVGeneration:
    """Test CV generation endpoints"""
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_user_by_id')
    def test_generate_cv_unauthorized(self, mock_get_user, mock_verify_token):
        """Test CV generation without authentication"""
        response = client.post("/api/v1/cv/generate")
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_user_by_id')
    @patch('src.api.v1.endpoints.cv.background_cv_generation')
    def test_generate_cv_success(self, mock_background_task, mock_get_user, mock_verify_token):
        """Test successful CV generation initiation"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        mock_get_user.return_value = {
            'id': 'user_123',
            'github_id': 123456,
            'username': 'testuser',
            'github_token': 'github_token'
        }
        
        # Mock background task
        mock_background_task.return_value = None
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.post("/api/v1/cv/generate", headers=headers)
        
        assert response.status_code == 202  # Accepted for processing
        data = response.json()
        assert "job_id" in data
        assert data["status"] == "processing"
        assert "estimated_completion" in data
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_user_by_id')
    def test_generate_cv_user_not_found(self, mock_get_user, mock_verify_token):
        """Test CV generation with invalid user"""
        # Mock authentication but user doesn't exist
        mock_verify_token.return_value = {'user_id': 'nonexistent_user'}
        mock_get_user.return_value = None
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.post("/api/v1/cv/generate", headers=headers)
        
        assert response.status_code == 404
        data = response.json()
        assert "User not found" in data["detail"]
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_cv_job')
    def test_get_cv_status_success(self, mock_get_job, mock_verify_token):
        """Test successful CV generation status check"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        
        # Mock job status
        mock_get_job.return_value = {
            'id': 'job_123',
            'user_id': 'user_123',
            'status': 'completed',
            'progress': 100,
            'result_url': 'https://storage.supabase.com/cv/123.pdf',
            'created_at': '2025-01-01T00:00:00Z',
            'completed_at': '2025-01-01T00:01:30Z'
        }
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.get("/api/v1/cv/job_123/status", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["progress"] == 100
        assert data["result_url"] is not None
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_cv_job')
    def test_get_cv_status_processing(self, mock_get_job, mock_verify_token):
        """Test CV generation status check while processing"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        
        # Mock job in progress
        mock_get_job.return_value = {
            'id': 'job_123',
            'user_id': 'user_123',
            'status': 'processing',
            'progress': 65,
            'current_step': 'generating_summaries',
            'result_url': None,
            'created_at': '2025-01-01T00:00:00Z'
        }
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.get("/api/v1/cv/job_123/status", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processing"
        assert data["progress"] == 65
        assert data["current_step"] == "generating_summaries"
        assert data["result_url"] is None
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_cv_job')
    def test_get_cv_status_failed(self, mock_get_job, mock_verify_token):
        """Test CV generation status check for failed job"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        
        # Mock failed job
        mock_get_job.return_value = {
            'id': 'job_123',
            'user_id': 'user_123',
            'status': 'failed',
            'progress': 30,
            'error_message': 'GitHub API rate limit exceeded',
            'failed_at': '2025-01-01T00:00:45Z'
        }
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.get("/api/v1/cv/job_123/status", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "failed"
        assert data["error_message"] == "GitHub API rate limit exceeded"
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_cv_job')
    def test_get_cv_status_unauthorized_job(self, mock_get_job, mock_verify_token):
        """Test accessing CV status for job belonging to different user"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        
        # Mock job belonging to different user
        mock_get_job.return_value = {
            'id': 'job_123',
            'user_id': 'different_user',  # Different user
            'status': 'completed'
        }
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.get("/api/v1/cv/job_123/status", headers=headers)
        
        assert response.status_code == 403
        data = response.json()
        assert "Access denied" in data["detail"]
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_user_cv_history')
    def test_get_cv_history(self, mock_get_history, mock_verify_token):
        """Test getting user's CV generation history"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        
        # Mock CV history
        mock_get_history.return_value = [
            {
                'id': 'job_123',
                'status': 'completed',
                'created_at': '2025-01-01T00:00:00Z',
                'completed_at': '2025-01-01T00:01:30Z',
                'result_url': 'https://storage.supabase.com/cv/123.pdf'
            },
            {
                'id': 'job_122',
                'status': 'failed',
                'created_at': '2024-12-31T23:00:00Z',
                'error_message': 'GitHub API error'
            }
        ]
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.get("/api/v1/cv/history", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["history"]) == 2
        assert data["history"][0]["status"] == "completed"
        assert data["history"][1]["status"] == "failed"

class TestCVGenerationWithOptions:
    """Test CV generation with various options"""
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_user_by_id')
    @patch('src.api.v1.endpoints.cv.background_cv_generation')
    def test_generate_cv_with_custom_options(self, mock_background_task, mock_get_user, mock_verify_token):
        """Test CV generation with custom options"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        mock_get_user.return_value = {
            'id': 'user_123',
            'github_token': 'github_token'
        }
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        custom_options = {
            "include_private_repos": False,
            "max_projects": 3,
            "target_role": "Senior Software Engineer",
            "theme": "neon-tech",
            "include_linkedin": True,
            "linkedin_url": "https://linkedin.com/in/testuser"
        }
        
        response = client.post("/api/v1/cv/generate", 
                             headers=headers, 
                             json=custom_options)
        
        assert response.status_code == 202
        
        # Verify background task was called with custom options
        mock_background_task.assert_called_once()
        call_args = mock_background_task.call_args[0]
        assert call_args[1] == custom_options  # Second argument should be options
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_user_by_id')
    def test_generate_cv_invalid_options(self, mock_get_user, mock_verify_token):
        """Test CV generation with invalid options"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        mock_get_user.return_value = {'id': 'user_123'}
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        invalid_options = {
            "max_projects": -1,  # Invalid: negative number
            "target_role": "",   # Invalid: empty string
            "theme": "invalid_theme"  # Invalid theme
        }
        
        response = client.post("/api/v1/cv/generate", 
                             headers=headers, 
                             json=invalid_options)
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

class TestBackgroundCVGeneration:
    """Test background CV generation process"""
    
    @patch('src.api.v1.endpoints.cv.fetch_github_data')
    @patch('src.api.v1.endpoints.cv.run_langgraph_pipeline')
    @patch('src.api.v1.endpoints.cv.update_job_status')
    async def test_background_cv_generation_success(self, mock_update_status, mock_pipeline, mock_fetch_github):
        """Test successful background CV generation"""
        from src.api.v1.endpoints.cv import background_cv_generation
        
        # Mock GitHub data fetching
        mock_fetch_github.return_value = {
            'user': {'login': 'testuser', 'name': 'Test User'},
            'repositories': [
                {'name': 'awesome-project', 'language': 'Python', 'stargazers_count': 100}
            ]
        }
        
        # Mock LangGraph pipeline
        mock_pipeline.return_value = {
            'status': 'completed',
            'pdf_url': 'https://storage.supabase.com/cv/123.pdf',
            'file_size': 150000
        }
        
        user_data = {'id': 'user_123', 'github_token': 'github_token'}
        options = {'max_projects': 5}
        job_id = 'job_123'
        
        # Run background task
        await background_cv_generation(user_data, options, job_id)
        
        # Verify status updates were called
        assert mock_update_status.call_count >= 2  # At least start and completion
        
        # Verify final status is success
        final_call = mock_update_status.call_args_list[-1]
        assert 'completed' in str(final_call)
    
    @patch('src.api.v1.endpoints.cv.fetch_github_data')
    @patch('src.api.v1.endpoints.cv.update_job_status')
    async def test_background_cv_generation_github_error(self, mock_update_status, mock_fetch_github):
        """Test background CV generation with GitHub API error"""
        from src.api.v1.endpoints.cv import background_cv_generation
        
        # Mock GitHub API error
        mock_fetch_github.side_effect = Exception("GitHub API rate limit exceeded")
        
        user_data = {'id': 'user_123', 'github_token': 'invalid_token'}
        options = {}
        job_id = 'job_123'
        
        # Run background task
        await background_cv_generation(user_data, options, job_id)
        
        # Verify error status was set
        error_calls = [call for call in mock_update_status.call_args_list 
                      if 'failed' in str(call) or 'error' in str(call)]
        assert len(error_calls) > 0

class TestRateLimiting:
    """Test rate limiting for CV generation"""
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_user_by_id')
    @patch('src.api.v1.endpoints.cv.check_user_rate_limit')
    def test_cv_generation_rate_limit_exceeded(self, mock_check_limit, mock_get_user, mock_verify_token):
        """Test CV generation when rate limit is exceeded"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        mock_get_user.return_value = {'id': 'user_123'}
        
        # Mock rate limit exceeded
        mock_check_limit.return_value = {
            'allowed': False,
            'limit': 5,
            'remaining': 0,
            'reset_time': '2025-01-01T01:00:00Z'
        }
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.post("/api/v1/cv/generate", headers=headers)
        
        assert response.status_code == 429  # Too Many Requests
        data = response.json()
        assert "rate limit" in data["detail"].lower()
        assert "reset_time" in data
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_user_by_id')
    @patch('src.api.v1.endpoints.cv.check_user_rate_limit')
    @patch('src.api.v1.endpoints.cv.background_cv_generation')
    def test_cv_generation_within_rate_limit(self, mock_background_task, mock_check_limit, mock_get_user, mock_verify_token):
        """Test CV generation within rate limit"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        mock_get_user.return_value = {'id': 'user_123'}
        
        # Mock rate limit OK
        mock_check_limit.return_value = {
            'allowed': True,
            'limit': 5,
            'remaining': 3,
            'reset_time': '2025-01-01T01:00:00Z'
        }
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.post("/api/v1/cv/generate", headers=headers)
        
        assert response.status_code == 202  # Accepted
        data = response.json()
        assert "job_id" in data

class TestCVDownload:
    """Test CV download functionality"""
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_cv_job')
    @patch('src.api.v1.endpoints.cv.get_pdf_from_storage')
    def test_download_cv_success(self, mock_get_pdf, mock_get_job, mock_verify_token):
        """Test successful CV download"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        
        # Mock completed job
        mock_get_job.return_value = {
            'id': 'job_123',
            'user_id': 'user_123',
            'status': 'completed',
            'result_url': 'https://storage.supabase.com/cv/123.pdf'
        }
        
        # Mock PDF content
        mock_get_pdf.return_value = b'%PDF-1.4 fake pdf content'
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.get("/api/v1/cv/job_123/download", headers=headers)
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "attachment" in response.headers["content-disposition"]
    
    @patch('src.api.v1.endpoints.cv.verify_jwt_token')
    @patch('src.api.v1.endpoints.cv.get_cv_job')
    def test_download_cv_not_ready(self, mock_get_job, mock_verify_token):
        """Test downloading CV that's not ready yet"""
        # Mock authentication
        mock_verify_token.return_value = {'user_id': 'user_123'}
        
        # Mock processing job
        mock_get_job.return_value = {
            'id': 'job_123',
            'user_id': 'user_123',
            'status': 'processing',
            'result_url': None
        }
        
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = client.get("/api/v1/cv/job_123/download", headers=headers)
        
        assert response.status_code == 409  # Conflict - not ready
        data = response.json()
        assert "not ready" in data["detail"].lower()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])