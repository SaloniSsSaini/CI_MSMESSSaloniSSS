# Carbon Intelligence - CI/CD Archive

This archive contains all Continuous Integration and Continuous Deployment (CI/CD) related files from the Carbon Intelligence project. The archive is organized into logical directories for easy navigation and understanding.

## 📁 Archive Structure

```
ci-archive/
├── README.md                           # This documentation file
├── package.json                        # Frontend package configuration
├── package-lock.json                   # Frontend dependency lock file
├── jest.config.js                      # Jest testing configuration
├── tsconfig.json                       # TypeScript configuration
├── docker-compose.yml                  # Docker Compose configuration
├── backend-package.json                # Backend package configuration
├── backend-jest.config.js              # Backend Jest configuration
├── github-workflows/                   # GitHub Actions workflows
│   └── ci.yml                         # Main CI/CD pipeline
├── deployment-scripts/                 # Deployment automation scripts
│   ├── deploy-dev.sh                  # Development deployment
│   ├── deploy-production.sh           # Production deployment
│   ├── deploy-staging.sh              # Staging deployment
│   ├── deploy.sh                      # Universal deployment script
│   ├── run-tests.sh                   # Test execution script
│   ├── setup-monitoring.sh            # Monitoring setup script
│   └── quick-start.sh                 # Quick start script
├── dockerfiles/                        # Docker container definitions
│   ├── Dockerfile                     # Backend production Dockerfile
│   ├── Dockerfile.dev                 # Backend development Dockerfile
│   └── aws-backend.Dockerfile         # AWS-specific backend Dockerfile
├── build-scripts/                      # Build automation scripts
│   ├── build-apk.sh                   # Android APK build script
│   └── simple-build.sh                # Simplified build script
├── monitoring/                         # Monitoring and observability
│   ├── prometheus.yml                 # Prometheus configuration
│   └── grafana-dashboard.json         # Grafana dashboard configuration
├── aws-infrastructure/                 # AWS infrastructure as code
│   ├── cloudformation-template.yaml   # CloudFormation template
│   ├── docker-compose.yml             # AWS Docker Compose
│   └── parameters.json                # CloudFormation parameters
└── documentation/                      # CI/CD documentation
    └── (this directory for future docs)
```

## 🚀 CI/CD Pipeline Overview

### GitHub Actions Workflow (`github-workflows/ci.yml`)

The main CI/CD pipeline includes:

1. **Test & Lint Job**
   - Runs on Ubuntu latest
   - Sets up Node.js 18
   - Installs dependencies for frontend and backend
   - Executes linting checks
   - Runs comprehensive test suites:
     - Frontend unit tests
     - Backend unit tests
     - Backend integration tests
     - Backend performance tests
     - Backend security tests
   - Uploads coverage reports to Codecov

2. **Build Frontend Job**
   - Builds React Native Android APK
   - Sets up Java 11 and Android SDK
   - Creates APK artifact for distribution

3. **Build Backend Job**
   - Builds Docker image for backend
   - Creates Docker image artifact

4. **Deploy Staging Job**
   - Deploys to staging environment (develop branch)
   - Uses AWS credentials and CloudFormation
   - Executes staging deployment script

5. **Deploy Production Job**
   - Deploys to production environment (main branch)
   - Uses blue-green deployment strategy
   - Includes comprehensive monitoring setup

### Deployment Scripts

#### Universal Deployment (`deployment-scripts/deploy.sh`)
- Supports multiple environments: dev, staging, production
- Actions: deploy, update, rollback, status, logs, destroy
- Handles infrastructure provisioning via CloudFormation
- Manages application deployment to EC2 instances

#### Environment-Specific Scripts
- **`deploy-dev.sh`**: Development environment with t3.micro instances
- **`deploy-staging.sh`**: Staging environment with t3.small instances
- **`deploy-production.sh`**: Production environment with t3.medium instances and blue-green deployment

#### Utility Scripts
- **`run-tests.sh`**: Comprehensive test runner for all test suites
- **`setup-monitoring.sh`**: Sets up CloudWatch alarms, SNS topics, and monitoring dashboards
- **`quick-start.sh`**: Interactive script for easy project setup and deployment

### Docker Configuration

#### Backend Dockerfiles
- **`Dockerfile`**: Production-optimized with security best practices
- **`Dockerfile.dev`**: Development environment with dev dependencies
- **`aws-backend.Dockerfile`**: AWS-specific configuration

#### Build Scripts
- **`build-apk.sh`**: Complete Android APK build process
- **`simple-build.sh`**: Simplified build for testing purposes

### Monitoring & Observability

#### Prometheus Configuration
- Scrapes backend metrics
- Monitors Node.js and MongoDB exporters
- Configures alerting rules

#### Grafana Dashboard
- Pre-configured dashboard for Carbon Intelligence
- Monitors CPU, memory, API response times
- Real-time application health visualization

#### CloudWatch Integration
- Custom metrics for application health
- Alarms for CPU, memory, errors, and database connections
- SNS notifications for alerting

## 🔧 Configuration Files

### Package Management
- **`package.json`**: Frontend dependencies and scripts
- **`backend-package.json`**: Backend dependencies and scripts
- **`package-lock.json`**: Dependency version lock

### Testing Configuration
- **`jest.config.js`**: Frontend Jest configuration
- **`backend-jest.config.js`**: Backend Jest configuration
- **`tsconfig.json`**: TypeScript compiler options

### Container Orchestration
- **`docker-compose.yml`**: Local development environment
- **`aws-infrastructure/docker-compose.yml`**: AWS deployment configuration

## 🏗️ Infrastructure as Code

### CloudFormation Template
- Complete AWS infrastructure definition
- EC2 instances with Auto Scaling Groups
- RDS database with Multi-AZ deployment
- Application Load Balancer
- S3 bucket for static assets
- CloudFront distribution
- VPC with public and private subnets
- Security groups and IAM roles

### Environment Parameters
- **Development**: t3.micro instances, single AZ
- **Staging**: t3.small instances, single AZ
- **Production**: t3.medium instances, Multi-AZ with blue-green deployment

## 📊 Key Features

### Security
- Non-root user in Docker containers
- Health checks for all services
- Encrypted data transmission
- IAM roles with least privilege
- Security groups with minimal access

### Scalability
- Auto Scaling Groups for backend
- Load balancer for traffic distribution
- CloudFront for global content delivery
- Multi-AZ database deployment

### Monitoring
- Comprehensive logging with CloudWatch
- Custom metrics for application health
- Automated alerting via SNS
- Prometheus and Grafana for detailed metrics

### Testing
- Unit tests for frontend and backend
- Integration tests for API endpoints
- Performance tests for load testing
- Security tests for vulnerability scanning
- Linting and type checking

## 🚀 Usage

### Local Development
```bash
# Start local environment
docker-compose up -d

# Run tests
./scripts/run-tests.sh

# Quick start
./scripts/quick-start.sh
```

### Deployment
```bash
# Deploy to development
./scripts/deploy.sh dev deploy

# Deploy to staging
./scripts/deploy.sh staging deploy

# Deploy to production
./scripts/deploy.sh production deploy
```

### Monitoring
```bash
# Setup monitoring
./scripts/setup-monitoring.sh

# Check status
./scripts/deploy.sh production status

# View logs
./scripts/deploy.sh production logs
```

## 📝 Notes

- All scripts include comprehensive error handling and colored output
- Environment-specific configurations are managed via CloudFormation parameters
- The CI/CD pipeline supports both manual and automatic deployments
- All sensitive information is managed via GitHub Secrets and AWS Parameter Store
- The archive preserves the complete CI/CD setup for future reference or migration

## 🔄 Maintenance

This archive should be updated whenever:
- New CI/CD workflows are added
- Deployment scripts are modified
- Infrastructure configurations change
- Monitoring setups are updated
- Build processes are enhanced

---

*This archive was created on $(date) and contains the complete CI/CD infrastructure for the Carbon Intelligence project.*