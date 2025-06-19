# HRM ERP Complete Setup Script for Windows
# Path: C:\Projects\hrm-erp\setup.ps1

param(
    [switch]$SkipDependencyCheck,
    [switch]$Force,
    [switch]$SkipGitInit
)

# Color functions for better output
function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Write-Step {
    param([string]$Text)
    Write-Host "`n" -NoNewline
    Write-Host ">> " -ForegroundColor Cyan -NoNewline
    Write-Host $Text -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "[OK] " -ForegroundColor Green -NoNewline
    Write-Host $Text -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $Text -ForegroundColor Red
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Main setup function
function Start-HRMSetup {
    Write-ColorText "HRM ERP System Setup for Windows" "Magenta"
    Write-ColorText "================================================" "Magenta"
    Write-ColorText "Setting up Laravel + Next.js HRM ERP System" "White"
    Write-ColorText "Path: C:\Projects\hrm-erp" "Gray"
    Write-ColorText "================================================" "Magenta"

    # Step 1: Check prerequisites
    if (-not $SkipDependencyCheck) {
        Write-Step "Checking system prerequisites..."
        
        $dependencies = @{
            "Git" = "git"
            "Docker" = "docker" 
            "Node.js" = "node"
            "NPM" = "npm"
            "PHP" = "php"
            "Composer" = "composer"
        }
        
        $missingDeps = @()
        
        foreach ($dep in $dependencies.GetEnumerator()) {
            if (Test-Command $dep.Value) {
                $version = & $dep.Value --version 2>$null | Select-Object -First 1
                Write-Success "$($dep.Key): $version"
            } else {
                Write-Error "$($dep.Key): Not found"
                $missingDeps += $dep.Key
            }
        }
        
        if ($missingDeps.Count -gt 0) {
            Write-Error "Missing dependencies: $($missingDeps -join ', ')"
            Write-ColorText "Please install missing dependencies and run setup again." "Yellow"
            return $false
        }
    }

    # Step 2: Check Docker status
    Write-Step "Checking Docker Desktop status..."
    try {
        docker info | Out-Null
        Write-Success "Docker Desktop is running"
    } catch {
        Write-Error "Docker Desktop is not running"
        Write-ColorText "Please start Docker Desktop and try again." "Yellow"
        return $false
    }

    # Step 3: Create project structure
    Write-Step "Creating project directory structure..."
    
    $directories = @(
        "backend",
        "frontend", 
        "nginx",
        "mysql/init",
        "mysql/conf",
        "scripts"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Created directory: $dir"
        } else {
            Write-ColorText "Directory exists: $dir" "Gray"
        }
    }

    # Step 4: Create Laravel project
    Write-Step "Setting up Laravel backend..."
    
    if (-not (Test-Path "backend/composer.json") -or $Force) {
        Write-ColorText "Creating new Laravel project..." "Cyan"
        
        # Remove existing backend if forcing
        if ($Force -and (Test-Path "backend")) {
            Remove-Item "backend" -Recurse -Force
            New-Item -ItemType Directory -Path "backend" -Force | Out-Null
        }
        
        # Create Laravel project
        composer create-project laravel/laravel backend --no-interaction
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Laravel project created successfully"
            
            # Navigate to backend and install additional packages
            Push-Location "backend"
            
            Write-ColorText "Installing Laravel packages..." "Cyan"
            
            # Install Sanctum for API authentication
            composer require laravel/sanctum --no-interaction
            if ($LASTEXITCODE -eq 0) { Write-Success "Laravel Sanctum installed" }
            
            # Install Spatie Laravel Permission for roles
            composer require spatie/laravel-permission --no-interaction  
            if ($LASTEXITCODE -eq 0) { Write-Success "Spatie Permission installed" }
            
            # Install Intervention Image for image processing
            composer require intervention/image --no-interaction
            if ($LASTEXITCODE -eq 0) { Write-Success "Intervention Image installed" }
            
            # Install Excel package for reports
            composer require maatwebsite/excel --no-interaction
            if ($LASTEXITCODE -eq 0) { Write-Success "Laravel Excel installed" }
            
            # Publish Sanctum configuration
            php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --force
            Write-Success "Sanctum configuration published"
            
            Pop-Location
        } else {
            Write-Error "Failed to create Laravel project"
            return $false
        }
    } else {
        Write-Success "Laravel backend already exists"
    }

    # Step 5: Create Next.js project  
    Write-Step "Setting up Next.js frontend..."
    
    if (-not (Test-Path "frontend/package.json") -or $Force) {
        Write-ColorText "Creating new Next.js project..." "Cyan"
        
        # Remove existing frontend if forcing
        if ($Force -and (Test-Path "frontend")) {
            Remove-Item "frontend" -Recurse -Force
            New-Item -ItemType Directory -Path "frontend" -Force | Out-Null
        }
        
        # Create Next.js project
        npx create-next-app@latest frontend --typescript --tailwind --eslint --src-dir --app --import-alias "@/*" --no-git
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Next.js project created successfully"
            
            # Navigate to frontend and install additional packages
            Push-Location "frontend"
            
            Write-ColorText "Installing Next.js packages..." "Cyan"
            
            # Install HTTP client and state management
            npm install axios @tanstack/react-query
            if ($LASTEXITCODE -eq 0) { Write-Success "Axios and React Query installed" }
            
            # Install form handling
            npm install react-hook-form @hookform/resolvers yup
            if ($LASTEXITCODE -eq 0) { Write-Success "React Hook Form installed" }
            
            # Install UI components
            npm install @headlessui/react @heroicons/react
            if ($LASTEXITCODE -eq 0) { Write-Success "Headless UI installed" }
            
            # Install utility libraries
            npm install date-fns lodash
            if ($LASTEXITCODE -eq 0) { Write-Success "Utility libraries installed" }
            
            # Install charting library
            npm install chart.js react-chartjs-2
            if ($LASTEXITCODE -eq 0) { Write-Success "Chart.js installed" }
            
            # Install authentication
            npm install next-auth
            if ($LASTEXITCODE -eq 0) { Write-Success "NextAuth.js installed" }
            
            # Install additional HRM-specific packages
            npm install @types/lodash lucide-react
            if ($LASTEXITCODE -eq 0) { Write-Success "Additional packages installed" }
            
            Pop-Location
        } else {
            Write-Error "Failed to create Next.js project"
            return $false
        }
    } else {
        Write-Success "Next.js frontend already exists"
    }

    # Step 6: Create environment files
    Write-Step "Creating environment configuration files..."
    
    # Laravel .env file
    $laravelEnv = @"
APP_NAME="HRM ERP System"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=hrm_database
DB_USERNAME=hrm_user
DB_PASSWORD=hrm_password

BROADCAST_DRIVER=redis
CACHE_DRIVER=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@hrm-erp.local"
MAIL_FROM_NAME="`${APP_NAME}"

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
SANCTUM_GUARD=web

# CORS Configuration  
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# File Upload Settings
MAX_FILE_SIZE=10240
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx
"@

    if (-not (Test-Path "backend/.env") -or $Force) {
        $laravelEnv | Out-File -FilePath "backend/.env" -Encoding UTF8
        Write-Success "Laravel .env file created"
    }

    # Next.js .env.local file
    $nextjsEnv = @"
# Next.js Environment Variables
NEXT_PUBLIC_APP_NAME="HRM ERP System"
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Laravel API Configuration
LARAVEL_API_URL=http://laravel-api:8000/api
LARAVEL_SANCTUM_URL=http://laravel-api:8000/sanctum/csrf-cookie

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# File Upload Settings
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx

# Development Settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
"@

    if (-not (Test-Path "frontend/.env.local") -or $Force) {
        $nextjsEnv | Out-File -FilePath "frontend/.env.local" -Encoding UTF8
        Write-Success "Next.js .env.local file created"
    }

    # Step 7: Generate Laravel app key
    Write-Step "Generating Laravel application key..."
    Push-Location "backend"
    php artisan key:generate --force
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Laravel application key generated"
    }
    Pop-Location

    # Step 8: Create management scripts
    Write-Step "Creating Docker management scripts..."
    
    # Start script
    $startScript = @'
Write-Host "Starting HRM ERP Services..." -ForegroundColor Green
Write-Host "Building and starting containers..." -ForegroundColor Cyan

docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "   Frontend (Next.js):  http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend API:         http://localhost:8000/api" -ForegroundColor White  
    Write-Host "   phpMyAdmin:          http://localhost:8080" -ForegroundColor White
    Write-Host "   Mailhog:             http://localhost:8025" -ForegroundColor White
    Write-Host "   Full App (Nginx):    http://localhost" -ForegroundColor White
    Write-Host ""
    Write-Host "Check status:" -ForegroundColor Cyan
    Write-Host "   docker-compose ps" -ForegroundColor Gray
} else {
    Write-Host "Failed to start services" -ForegroundColor Red
    Write-Host "Run 'docker-compose logs' to see errors" -ForegroundColor Yellow
}
'@
    $startScript | Out-File -FilePath "scripts/start.ps1" -Encoding UTF8

    # Stop script
    $stopScript = @'
Write-Host "Stopping HRM ERP Services..." -ForegroundColor Yellow
docker-compose down
Write-Host "Services stopped successfully!" -ForegroundColor Green
'@
    $stopScript | Out-File -FilePath "scripts/stop.ps1" -Encoding UTF8

    # Logs script
    $logsScript = @'
param([string]$Service = "")

if ($Service) {
    Write-Host "Viewing logs for service: $Service" -ForegroundColor Cyan
    docker-compose logs -f $Service
} else {
    Write-Host "Viewing all service logs..." -ForegroundColor Cyan
    docker-compose logs -f
}
'@
    $logsScript | Out-File -FilePath "scripts/logs.ps1" -Encoding UTF8

    # Rebuild script
    $rebuildScript = @'
Write-Host "Rebuilding HRM ERP Services..." -ForegroundColor Yellow
Write-Host "Stopping existing containers..." -ForegroundColor Cyan
docker-compose down

Write-Host "Removing old images..." -ForegroundColor Cyan
docker-compose build --no-cache

Write-Host "Starting fresh containers..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "Services rebuilt and restarted!" -ForegroundColor Green
'@
    $rebuildScript | Out-File -FilePath "scripts/rebuild.ps1" -Encoding UTF8

    # Reset script
    $resetScript = @'
Write-Host "Resetting HRM ERP System..." -ForegroundColor Red
Write-Host "WARNING: This will remove all data!" -ForegroundColor Yellow

$confirm = Read-Host "Are you sure? Type 'yes' to continue"
if ($confirm -eq "yes") {
    Write-Host "Stopping containers..." -ForegroundColor Cyan
    docker-compose down -v
    
    Write-Host "Removing volumes..." -ForegroundColor Cyan
    docker volume prune -f
    
    Write-Host "Removing images..." -ForegroundColor Cyan
    docker-compose build --no-cache
    
    Write-Host "System reset complete!" -ForegroundColor Green
} else {
    Write-Host "Reset cancelled" -ForegroundColor Yellow
}
'@
    $resetScript | Out-File -FilePath "scripts/reset.ps1" -Encoding UTF8

    Write-Success "Management scripts created in scripts/ directory"

    # Step 9: Create VS Code workspace
    Write-Step "Creating VS Code workspace configuration..."
    
    $workspace = @{
        folders = @(
            @{ name = "Docker Config"; path = "." }
            @{ name = "Backend (Laravel)"; path = "./backend" }
            @{ name = "Frontend (Next.js)"; path = "./frontend" }
        )
        settings = @{
            "php.validate.executablePath" = "php"
            "intelephense.files.maxSize" = 5000000
            "editor.formatOnSave" = $true
            "editor.defaultFormatter" = "esbenp.prettier-vscode"
            "[php]" = @{ 
                "editor.defaultFormatter" = "bmewburn.vscode-intelephense-client"
                "editor.tabSize" = 4
            }
            "[javascript]" = @{ "editor.tabSize" = 2 }
            "[typescript]" = @{ "editor.tabSize" = 2 }
            "[json]" = @{ "editor.tabSize" = 2 }
            "docker.dockerPath" = "docker"
            "files.watcherExclude" = @{
                "**/node_modules/**" = $true
                "**/vendor/**" = $true
                "**/.git/**" = $true
            }
        }
        extensions = @{
            recommendations = @(
                "bmewburn.vscode-intelephense-client",
                "ryannaddy.laravel-artisan",
                "bradlc.vscode-tailwindcss", 
                "esbenp.prettier-vscode",
                "ms-azuretools.vscode-docker",
                "ms-vscode-remote.remote-containers",
                "eamodio.gitlens",
                "PKief.material-icon-theme",
                "ms-vscode.vscode-typescript-next"
            )
        }
    }

    $workspace | ConvertTo-Json -Depth 10 | Out-File -FilePath "hrm-erp.code-workspace" -Encoding UTF8
    Write-Success "VS Code workspace file created"

    # Step 10: Initialize Git repository
    if (-not $SkipGitInit) {
        Write-Step "Initializing Git repository..."
        
        if (-not (Test-Path ".git")) {
            git init
            
            # Create .gitignore
            $gitignore = @"
# Dependencies
node_modules/
vendor/

# Environment files
.env
.env.local
.env.production

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Build outputs
.next/
dist/
build/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Cache directories
.cache/
.parcel-cache/

# Docker
.docker/

# Laravel specific
bootstrap/cache/
storage/app/
storage/framework/cache/
storage/framework/sessions/
storage/framework/views/
storage/logs/

# Next.js specific
.next/
out/

# Database
*.sqlite
*.db
"@
            $gitignore | Out-File -FilePath ".gitignore" -Encoding UTF8
            
            git add .gitignore
            git commit -m "Initial commit: HRM ERP project setup"
            
            Write-Success "Git repository initialized"
        } else {
            Write-Success "Git repository already exists"
        }
    }

    # Final success message
    Write-ColorText "" "White"
    Write-ColorText "HRM ERP Setup Complete!" "Green"
    Write-ColorText "================================" "Green"
    
    Write-ColorText "" "White"
    Write-ColorText "Project Structure Created:" "Cyan"
    Write-ColorText "   backend/          (Laravel API)" "White"
    Write-ColorText "   frontend/         (Next.js App)" "White"
    Write-ColorText "   nginx/            (Reverse Proxy)" "White"
    Write-ColorText "   mysql/            (Database Config)" "White"
    Write-ColorText "   scripts/          (Management Scripts)" "White"
    Write-ColorText "   docker-compose.yml" "White"
    
    Write-ColorText "" "White"
    Write-ColorText "Next Steps:" "Cyan"
    Write-ColorText "   1. Run: .\scripts\start.ps1" "White"
    Write-ColorText "   2. Open: code hrm-erp.code-workspace" "White"
    Write-ColorText "   3. Visit: http://localhost:3000" "White"
    
    Write-ColorText "" "White"
    Write-ColorText "Available Commands:" "Cyan" 
    Write-ColorText "   .\scripts\start.ps1    # Start all services" "White"
    Write-ColorText "   .\scripts\stop.ps1     # Stop all services" "White"
    Write-ColorText "   .\scripts\logs.ps1     # View logs" "White"
    Write-ColorText "   .\scripts\rebuild.ps1  # Rebuild containers" "White"
    Write-ColorText "   .\scripts\reset.ps1    # Reset everything" "White"
    
    return $true
}

# Run the setup
try {
    $result = Start-HRMSetup
    if ($result) {
        Write-ColorText "" "White"
        Write-ColorText "Setup completed successfully!" "Green"
        exit 0
    } else {
        Write-ColorText "" "White"
        Write-ColorText "Setup failed!" "Red"
        exit 1
    }
} catch {
    Write-Error "Setup failed with error: $($_.Exception.Message)"
    exit 1
}