# HR App Next.js Backend - Quick Start

Write-Host "🚀 HR App Next.js Backend Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js found" -ForegroundColor Green
Write-Host ""

# Check PostgreSQL
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
Write-Host "⚠️  Ensure PostgreSQL is running and accessible" -ForegroundColor Yellow
Write-Host "   Default: postgresql://postgres:postgres@localhost:5432/hr_app" -ForegroundColor Gray
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Check .env file
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env and configure your DATABASE_URL" -ForegroundColor Yellow
    Write-Host ""
    
    $continue = Read-Host "Have you configured the .env file? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Please configure .env and run this script again." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}
Write-Host ""

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migrations. Check your DATABASE_URL in .env" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migrations complete" -ForegroundColor Green
Write-Host ""

# Seed database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npm run prisma:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database seeded" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📧 Test Users:" -ForegroundColor Cyan
Write-Host "  SUPERADMIN: superadmin@company.com / password123" -ForegroundColor Gray
Write-Host "  ADMIN:      admin@company.com / password123" -ForegroundColor Gray
Write-Host "  HR:         hr@company.com / password123" -ForegroundColor Gray
Write-Host "  EMPLOYEE:   john.doe@company.com / password123" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Start the development server:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "📍 API will be available at:" -ForegroundColor Cyan
Write-Host "   http://localhost:8000/api/v1" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   README.md - Setup and usage guide" -ForegroundColor Gray
Write-Host "   MIGRATION.md - Migration from FastAPI" -ForegroundColor Gray
Write-Host ""
