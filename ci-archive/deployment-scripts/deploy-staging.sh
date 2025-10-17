#!/bin/bash

# Carbon Intelligence - Staging Deployment Script
# This script deploys the application to AWS staging environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="carbon-intelligence-staging"
REGION="us-east-1"
ENVIRONMENT="staging"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed"
        exit 1
    fi
    
    print_success "All prerequisites are met"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure..."
    
    # Update CloudFormation parameters for staging
    cat > aws/parameters-staging.json << EOF
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "staging"
  },
  {
    "ParameterKey": "InstanceType",
    "ParameterValue": "t3.small"
  },
  {
    "ParameterKey": "DatabaseInstanceClass",
    "ParameterValue": "db.t3.small"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "staging.carbon-intelligence.example.com"
  }
]
EOF
    
    # Deploy CloudFormation stack
    if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
        print_status "Updating existing stack..."
        aws cloudformation update-stack \
            --stack-name $STACK_NAME \
            --template-body file://aws/cloudformation-template.yaml \
            --parameters file://aws/parameters-staging.json \
            --capabilities CAPABILITY_IAM \
            --region $REGION
        
        aws cloudformation wait stack-update-complete \
            --stack-name $STACK_NAME \
            --region $REGION
    else
        print_status "Creating new stack..."
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body file://aws/cloudformation-template.yaml \
            --parameters file://aws/parameters-staging.json \
            --capabilities CAPABILITY_IAM \
            --region $REGION
        
        aws cloudformation wait stack-create-complete \
            --stack-name $STACK_NAME \
            --region $REGION
    fi
    
    print_success "Infrastructure deployed successfully"
}

# Function to deploy backend
deploy_backend() {
    print_status "Deploying backend application..."
    
    # Get EC2 instance details
    INSTANCE_ID=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=carbon-intelligence-staging-backend" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text \
        --region $REGION)
    
    if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
        print_error "No EC2 instance found for staging backend"
        exit 1
    fi
    
    # Get instance public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text \
        --region $REGION)
    
    print_status "Deploying to instance: $INSTANCE_ID ($PUBLIC_IP)"
    
    # Create deployment package
    tar -czf backend-deployment.tar.gz backend/
    
    # Copy files to EC2 instance
    scp -i ~/.ssh/carbon-intelligence-key.pem -o StrictHostKeyChecking=no \
        backend-deployment.tar.gz ec2-user@$PUBLIC_IP:/tmp/
    
    # Deploy on EC2 instance
    ssh -i ~/.ssh/carbon-intelligence-key.pem -o StrictHostKeyChecking=no \
        ec2-user@$PUBLIC_IP << 'EOF'
        cd /home/ec2-user
        tar -xzf /tmp/backend-deployment.tar.gz
        cd backend
        npm install --production
        pm2 stop carbon-intelligence-backend || true
        pm2 start server.js --name "carbon-intelligence-backend"
        pm2 save
EOF
    
    print_success "Backend deployed successfully"
}

# Function to deploy frontend
deploy_frontend() {
    print_status "Deploying frontend..."
    
    # Get S3 bucket name from CloudFormation outputs
    S3_BUCKET=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
        --output text)
    
    if [ -z "$S3_BUCKET" ] || [ "$S3_BUCKET" = "None" ]; then
        print_error "S3 bucket not found in CloudFormation outputs"
        exit 1
    fi
    
    # Build React Native app for web
    npm run build:web || print_warning "Web build not configured, skipping..."
    
    # Upload static assets to S3
    if [ -d "build" ]; then
        aws s3 sync build/ s3://$S3_BUCKET/ --delete
        print_success "Frontend deployed to S3"
    else
        print_warning "No build directory found, skipping frontend deployment"
    fi
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Get load balancer DNS
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text)
    
    if [ -n "$ALB_DNS" ] && [ "$ALB_DNS" != "None" ]; then
        print_status "Testing health endpoint: http://$ALB_DNS/health"
        
        # Wait for application to start
        sleep 30
        
        if curl -f -s "http://$ALB_DNS/health" > /dev/null; then
            print_success "Health check passed"
        else
            print_warning "Health check failed - application may still be starting"
        fi
    else
        print_warning "Load balancer DNS not available"
    fi
}

# Function to display deployment summary
deployment_summary() {
    print_success "Staging deployment completed!"
    echo ""
    echo "=== DEPLOYMENT SUMMARY ==="
    echo "Environment: $ENVIRONMENT"
    echo "Stack Name: $STACK_NAME"
    echo "Region: $REGION"
    echo ""
    
    # Display CloudFormation outputs
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs' \
        --output table
}

# Main execution
main() {
    echo "=========================================="
    echo "Carbon Intelligence - Staging Deployment"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    deploy_infrastructure
    deploy_backend
    deploy_frontend
    run_health_checks
    deployment_summary
}

# Run main function
main "$@"