# Database Setup Guide - Borg-Tools MVP

This guide explains how to set up the Supabase database for the Borg-Tools MVP project.

## 📋 Overview

The database integration includes:
- ✅ Supabase PostgreSQL database
- ✅ User management with GitHub OAuth data
- ✅ CV generation tracking
- ✅ Auth session management
- ✅ Usage statistics
- ✅ Repository pattern with type-safe models

## 🗄️ Database Schema

### Tables Created

1. **users** - User profiles from GitHub OAuth
2. **cv_generations** - CV creation jobs and results
3. **auth_sessions** - Session management
4. **usage_stats** - API usage tracking

### Key Features

- **UUID Primary Keys** - For security and performance
- **Row Level Security (RLS)** - Data isolation per user
- **Automatic Timestamps** - created_at, updated_at triggers
- **JSONB Storage** - For flexible data like GitHub API responses
- **Expiration Management** - Automatic cleanup of old data

## 🚀 Setup Instructions

### 1. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys
3. Update your `.env` file:

```bash
# Supabase Backend (Service Role Key - KEEP SECRET)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key

# Supabase Frontend (Public/Anon Key - Safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Run Database Migrations

#### Option A: Manual Setup (Recommended for MVP)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250113_initial_schema.sql`
4. Paste and execute the SQL

#### Option B: Automated Setup (Future)

```bash
# Make the setup script executable
chmod +x scripts/setup-database.sh

# Run the setup script
./scripts/setup-database.sh
```

### 3. Verify Setup

Test the database connection:

```bash
# Start the backend service
docker-compose up backend

# Check logs for successful initialization
docker-compose logs backend | grep -i database
```

Expected output:
```
✅ Database connection successful
✅ Database initialized successfully
```

## 🏗️ Architecture

### Backend Integration

```
FastAPI Backend
├── Models (Pydantic) - Type-safe data models
├── Repositories - Database access layer
├── Services - Business logic layer
└── API Endpoints - HTTP interface
```

### Key Components

1. **Database Models** (`src/models/database.py`)
   - UserDB, UserCreate, UserUpdate
   - CVGenerationDB, CVGenerationCreate, CVGenerationUpdate
   - AuthSessionDB, AuthSessionCreate

2. **Repositories** (`src/repositories/`)
   - UserRepository - User CRUD operations
   - CVGenerationRepository - CV tracking
   - AuthSessionRepository - Session management

3. **Services** (`src/services/`)
   - UserService - Business logic for user operations

4. **Supabase Client** (`src/core/supabase.py`)
   - Singleton client for database connections
   - Error handling and logging

### Authentication Flow

```
GitHub OAuth → FastAPI Auth → Supabase User Creation → JWT Token
    ↓
Session Storage → User Profile → CV Generation Tracking
```

## 📊 Data Flow Examples

### User Registration/Login

1. User clicks "Sign in with GitHub"
2. GitHub OAuth redirects to callback
3. Backend exchanges code for GitHub user data
4. **NEW**: User created/updated in Supabase `users` table
5. **NEW**: Auth session created in `auth_sessions` table
6. JWT token issued with database user ID

### CV Generation

1. User requests CV generation
2. **NEW**: Record created in `cv_generations` table with status "pending"
3. AI agents process GitHub data
4. **NEW**: Status updated to "processing" → "completed"
5. **NEW**: PDF URL and expiration time stored
6. **NEW**: Usage tracked in `usage_stats` table

### User Profile

1. JWT token verified
2. **NEW**: User data fetched from `users` table
3. **NEW**: Statistics calculated from `cv_generations`
4. **NEW**: Usage limits checked against `usage_stats`

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- CV generations are user-scoped
CREATE POLICY "Users can view own CVs" ON cv_generations
    FOR SELECT USING (auth.uid() = user_id);
```

### Data Protection

- **Service Role Key** - Backend only, never exposed to frontend
- **Anonymous Key** - Frontend safe, respects RLS policies
- **JWT Integration** - Tokens include database user ID
- **Automatic Cleanup** - Expired sessions and old data removed

## 🧪 Testing

### Database Connection Test

```python
# Test database connectivity
from src.core.database import check_database_connection

success = await check_database_connection()
assert success == True
```

### User Operations Test

```python
# Test user creation
from src.repositories import UserRepository
from src.models.database import UserCreate

user_repo = UserRepository()
user_data = UserCreate(
    github_id=12345,
    github_username="testuser",
    email="test@example.com"
)

user = await user_repo.create(user_data)
assert user.github_username == "testuser"
```

## 📈 Performance Considerations

### Indexes Created

```sql
-- Fast user lookups
CREATE INDEX idx_users_github_id ON users(github_id);

-- CV generation queries
CREATE INDEX idx_cv_generations_user_id ON cv_generations(user_id);
CREATE INDEX idx_cv_generations_created_at ON cv_generations(created_at DESC);

-- Session management
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);
```

### Query Optimization

- **Pagination** - All list queries support limits
- **Filtering** - Index-backed WHERE clauses
- **Caching** - Supabase client connection pooling

## 🔧 Maintenance

### Regular Tasks

1. **Cleanup Expired Sessions**
   ```python
   from src.core.database import cleanup_expired_sessions
   await cleanup_expired_sessions()
   ```

2. **Monitor Usage Stats**
   ```sql
   SELECT COUNT(*) as total_users FROM users;
   SELECT COUNT(*) as total_cvs FROM cv_generations;
   ```

3. **Check Database Health**
   ```bash
   docker-compose exec backend python -c "
   import asyncio
   from src.core.database import check_database_connection
   print(asyncio.run(check_database_connection()))
   "
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check SUPABASE_URL and SUPABASE_SERVICE_ROLE in .env
   - Verify network connectivity to Supabase
   - Check Supabase project status

2. **RLS Policy Errors**
   - Ensure JWT tokens include correct user ID
   - Verify auth.uid() matches database user ID
   - Check policy definitions

3. **Migration Errors**
   - Ensure extensions are enabled (uuid-ossp)
   - Check for conflicting table names
   - Verify user permissions

### Debug Commands

```bash
# Check environment variables
docker-compose exec backend env | grep SUPABASE

# Test database connection
docker-compose exec backend python -c "
from src.core.supabase import get_supabase
client = get_supabase()
result = client.table('users').select('count', count='exact').limit(0).execute()
print('Connection successful:', result.count is not None)
"

# View recent logs
docker-compose logs backend | grep -i "database\|supabase"
```

## ✅ Verification Checklist

After setup, verify:

- [ ] Supabase project created and configured
- [ ] Environment variables set correctly
- [ ] Database schema applied successfully
- [ ] Backend starts without database errors
- [ ] User registration creates database records
- [ ] JWT tokens include database user ID
- [ ] User profile endpoints return data
- [ ] RLS policies protect user data
- [ ] Session cleanup runs successfully

## 📚 Next Steps

With database integration complete, the next phase is:

1. **GitHub Data Integration** (T86-T88)
   - Enhanced GitHub API client
   - Repository data fetching
   - User profile analysis

2. **CV Generation Pipeline**
   - Database-backed job tracking
   - Status updates and progress
   - PDF storage and expiration

3. **Advanced Features**
   - Usage analytics and reporting
   - Subscription management
   - Performance monitoring

---

**Database integration completed ✅**  
*Ready for GitHub data integration and CV generation pipeline*