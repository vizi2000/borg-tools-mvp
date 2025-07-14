#!/bin/bash

# Setup database script for Borg-Tools MVP
# This script applies the database migrations to Supabase

echo "🔧 Setting up Supabase database..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "brew install supabase/tap/supabase"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it with your Supabase credentials."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE" ]; then
    echo "❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE"
    exit 1
fi

echo "📋 Running database migrations..."

# For now, we'll provide instructions for manual setup
# In production, you'd use Supabase CLI or migrations API

echo ""
echo "To set up your database, follow these steps:"
echo ""
echo "1. Go to your Supabase project dashboard"
echo "2. Navigate to the SQL Editor"
echo "3. Copy and paste the contents of: supabase/migrations/20250113_initial_schema.sql"
echo "4. Run the SQL query"
echo ""
echo "Alternatively, you can use the Supabase CLI:"
echo "supabase db push --db-url $SUPABASE_URL"
echo ""
echo "✅ Database setup instructions complete!"