#!/bin/bash
# BB-Bounce Development Setup Script
# Automates local development environment setup

set -e

echo "🎮 BB-Bounce Development Setup"
echo "================================"

# Check Node.js version
echo ""
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "✅ Node.js: $NODE_VERSION"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if PostgreSQL is running
echo ""
echo "🔍 Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL CLI found"
else
    echo "⚠️  PostgreSQL not found. Install or use Docker:"
    echo "   docker run --name bb-postgres -e POSTGRES_PASSWORD=mysecret -p 5432:5432 -d postgres:16"
fi

# Setup .env if not exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env

    # Generate secret
    SECRET=$(openssl rand -hex 32)
    # Use portable sed syntax
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/development-secret-replace-in-production/$SECRET/" .env
    else
        sed -i "s/development-secret-replace-in-production/$SECRET/" .env
    fi

    echo "✅ Generated SCORE_SECRET: $SECRET"
    echo "⚠️  IMPORTANT: Add this same secret to public/index.html"
else
    echo ""
    echo "✅ .env file already exists"
fi

# Offer to start Docker PostgreSQL
echo ""
read -p "📦 Start PostgreSQL with Docker? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐳 Starting PostgreSQL container..."
    docker run --name bb-postgres \
        -e POSTGRES_PASSWORD=mysecret \
        -e POSTGRES_DB=bb_bounce \
        -p 5432:5432 \
        -d postgres:16 || echo "⚠️  Container might already exist. Run: docker start bb-postgres"

    echo "⏳ Waiting for PostgreSQL to start..."
    sleep 3
fi

# Run migrations
echo ""
read -p "🗃️  Run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Running migrations..."
    npm run db:migrate
fi

# Seed database
echo ""
read -p "🌱 Seed database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run db:seed
fi

# Summary
echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Update SCORE_SECRET in public/index.html"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Project overview"
echo "   - docs/deployment.md - Railway deployment guide"
echo ""
