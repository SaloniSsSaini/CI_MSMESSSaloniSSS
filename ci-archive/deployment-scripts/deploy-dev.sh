#!/bin/bash

# Carbon Intelligence - Development Deployment Script
# This script deploys the application to AWS development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="carbon-intelligence-dev"
REGION="us-east-1"
ENVIRONMENT="development"

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
    
    print_success "All prerequisites are met"
}

# Function to create development parameters
create_dev_parameters() {
    print_status "Creating development parameters..."
    
    cat > aws/parameters-dev.json << EOF
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "development"
  },
  {
    "ParameterKey": "InstanceType",
    "ParameterValue": "t3.micro"
  },
  {
    "ParameterKey": "DatabaseInstanceClass",
    "ParameterValue": "db.t3.micro"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "dev.carbon-intelligence.example.com"
  }
]
EOF
    
    print_success "Development parameters created"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying development infrastructure..."
    
    # Deploy CloudFormation stack
    if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
        print_status "Updating existing development stack..."
        aws cloudformation update-stack \
            --stack-name $STACK_NAME \
            --template-body file://aws/cloudformation-template.yaml \
            --parameters file://aws/parameters-dev.json \
            --capabilities CAPABILITY_IAM \
            --region $REGION
        
        aws cloudformation wait stack-update-complete \
            --stack-name $STACK_NAME \
            --region $REGION
    else
        print_status "Creating new development stack..."
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body file://aws/cloudformation-template.yaml \
            --parameters file://aws/parameters-dev.json \
            --capabilities CAPABILITY_IAM \
            --region $REGION
        
        aws cloudformation wait stack-create-complete \
            --stack-name $STACK_NAME \
            --region $REGION
    fi
    
    print_success "Development infrastructure deployed successfully"
}

# Function to deploy with Docker Compose
deploy_with_docker() {
    print_status "Deploying with Docker Compose..."
    
    # Get EC2 instance details
    INSTANCE_ID=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=carbon-intelligence-dev-backend" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text \
        --region $REGION)
    
    if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
        print_error "No EC2 instance found for development backend"
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
    tar -czf dev-deployment.tar.gz . --exclude=node_modules --exclude=.git
    
    # Copy files to EC2 instance
    scp -i ~/.ssh/carbon-intelligence-key.pem -o StrictHostKeyChecking=no \
        dev-deployment.tar.gz ec2-user@$PUBLIC_IP:/tmp/
    
    # Deploy on EC2 instance
    ssh -i ~/.ssh/carbon-intelligence-key.pem -o StrictHostKeyChecking=no \
        ec2-user@$PUBLIC_IP << 'EOF'
        cd /home/ec2-user
        tar -xzf /tmp/dev-deployment.tar.gz
        cd aws
        docker-compose down || true
        docker-compose up -d --build
EOF
    
    print_success "Development deployment completed with Docker"
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
    print_success "Development deployment completed!"
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
    echo "Carbon Intelligence - Development Deployment"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    create_dev_parameters
    deploy_infrastructure
    deploy_with_docker
    run_health_checks
    deployment_summary
}

# Run main function
main "$@"