"""Mock Supabase client for local testing without real Supabase instance."""
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime


class MockTable:
    """Mock Supabase table."""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self._data: List[Dict[str, Any]] = []
        self._query_params: Dict[str, Any] = {}
    
    def select(self, *columns, count: Optional[str] = None) -> 'MockTable':
        """Mock select operation."""
        self._query_params['columns'] = columns
        self._query_params['count'] = count
        return self
    
    def eq(self, column: str, value: Any) -> 'MockTable':
        """Mock eq filter."""
        self._query_params['eq'] = (column, value)
        return self
    
    def single(self) -> 'MockTable':
        """Mock single operation."""
        self._query_params['single'] = True
        return self
    
    def limit(self, limit: int) -> 'MockTable':
        """Mock limit operation."""
        self._query_params['limit'] = limit
        return self
    
    def insert(self, data: Dict[str, Any]) -> 'MockTable':
        """Mock insert operation."""
        self._query_params['insert'] = data
        return self
    
    def update(self, data: Dict[str, Any]) -> 'MockTable':
        """Mock update operation."""
        self._query_params['update'] = data
        return self
    
    def upsert(self, data: Dict[str, Any]) -> 'MockTable':
        """Mock upsert operation."""
        self._query_params['upsert'] = data
        return self
    
    def delete(self) -> 'MockTable':
        """Mock delete operation."""
        self._query_params['delete'] = True
        return self
    
    def execute(self) -> 'MockResponse':
        """Execute the mock query."""
        # Return mock data based on table
        if self.table_name == "users" and self._query_params.get('limit') == 0:
            # Health check query
            return MockResponse({"count": 0})
        
        # Return empty data for other queries
        return MockResponse({"data": [], "count": 0})


class MockResponse:
    """Mock Supabase response."""
    
    def __init__(self, data: Any):
        self.data = data
        self.count = data.get("count", 0) if isinstance(data, dict) else len(data)


class MockSupabaseClient:
    """Mock Supabase client for testing."""
    
    def table(self, table_name: str) -> MockTable:
        """Get a mock table."""
        return MockTable(table_name)
    
    @property
    def auth(self):
        """Mock auth object."""
        return self
    
    def sign_in_with_password(self, credentials: Dict[str, str]):
        """Mock sign in."""
        return {"user": {"id": str(uuid.uuid4())}, "session": {"access_token": "mock_token"}}