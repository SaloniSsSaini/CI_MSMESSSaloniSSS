#!/bin/bash

# Carbon Intelligence - Universal Deployment Script
# This script can deploy to any environment (dev, staging, production)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [ENVIRONMENT] [ACTION]"
    echo ""
    echo "Environments:"
    echo "  dev       - Development environment"
    echo "  staging   - Staging environment"
    echo "  production - Production environment"
    echo ""
    echo "Actions:"
    echo "  deploy    - Deploy application (default)"
    echo "  update    - Update existing deployment"
    echo "  rollback  - Rollback to previous version"
    echo "  status    - Show deployment status"
    echo "  logs      - Show application logs"
    echo "  destroy   - Destroy environment"
    echo ""
    echo "Examples:"
    echo "  $0 dev deploy"
    echo "  $0 staging update"
    echo "  $0 production status"
    echo "  $0 dev logs"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if AWS is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Check Docker (for containerized deployments)
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Containerized deployments will not be available."
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All prerequisites are met"
}

# Function to get environment configuration
get_env_config() {
    local env=$1
    
    case $env in
        "dev")
            echo "carbon-intelligence-dev"
            echo "us-east-1"
            echo "t3.micro"
            echo "db.t3.micro"
            echo "dev.carbon-intelligence.example.com"
            ;;
        "staging")
            echo "carbon-intelligence-staging"
            echo "us-east-1"
            echo "t3.small"
            echo "db.t3.small"
            echo "staging.carbon-intelligence.example.com"
            ;;
        "production")
            echo "carbon-intelligence-production"
            echo "us-east-1"
            echo "t3.medium"
            echo "db.t3.medium"
            echo "carbon-intelligence.example.com"
            ;;
        *)
            print_error "Invalid environment: $env"
            exit 1
            ;;
    esac
}

# Function to create environment parameters
create_env_parameters() {
    local env=$1
    local stack_name=$2
    local region=$3
    local instance_type=$4
    local db_instance_class=$5
    local domain_name=$6
    
    print_status "Creating parameters for $env environment..."
    
    cat > "aws/parameters-${env}.json" << EOF
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "$env"
  },
  {
    "ParameterKey": "InstanceType",
    "ParameterValue": "$instance_type"
  },
  {
    "ParameterKey": "DatabaseInstanceClass",
    "ParameterValue": "$db_instance_class"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "$domain_name"
  }
]
EOF
    
    print_success "Parameters created for $env environment"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    local env=$1
    local stack_name=$2
    local region=$3
    
    print_status "Deploying infrastructure for $env environment..."
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name $stack_name --region $region &> /dev/null; then
        print_status "Updating existing stack: $stack_name"
        aws cloudformation update-stack \
            --stack-name $stack_name \
            --template-body file://aws/cloudformation-template.yaml \
            --parameters file://aws/parameters-${env}.json \
            --capabilities CAPABILITY_IAM \
            --region $region
        
        aws cloudformation wait stack-update-complete \
            --stack-name $stack_name \
            --region $region
    else
        print_status "Creating new stack: $stack_name"
        aws cloudformation create-stack \
            --stack-name $stack_name \
            --template-body file://aws/cloudformation-template.yaml \
            --parameters file://aws/parameters-${env}.json \
            --capabilities CAPABILITY_IAM \
            --region $region
        
        aws cloudformation wait stack-create-complete \
            --stack-name $stack_name \
            --region $region
    fi
    
    print_success "Infrastructure deployed successfully for $env"
}

# Function to deploy application
deploy_application() {
    local env=$1
    local stack_name=$2
    local region=$3
    
    print_status "Deploying application for $env environment..."
    
    # Get EC2 instance details
    INSTANCE_ID=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=carbon-intelligence-${env}-backend" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text \
        --region $region)
    
    if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
        print_error "No EC2 instance found for $env backend"
        exit 1
    fi
    
    # Get instance public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text \
        --region $region)
    
    print_status "Deploying to instance: $INSTANCE_ID ($PUBLIC_IP)"
    
    # Create deployment package
    tar -czf ${env}-deployment.tar.gz backend/ --exclude=node_modules
    
    # Copy files to EC2 instance
    scp -i ~/.ssh/carbon-intelligence-key.pem -o StrictHostKeyChecking=no \
        ${env}-deployment.tar.gz ec2-user@$PUBLIC_IP:/tmp/
    
    # Deploy on EC2 instance
    ssh -i ~/.ssh/carbon-intelligence-key.pem -o StrictHostKeyChecking=no \
        ec2-user@$PUBLIC_IP << 'EOF'
        cd /home/ec2-user
        tar -xzf /tmp/*-deployment.tar.gz
        cd backend
        npm install --production
        pm2 stop carbon-intelligence-backend || true
        pm2 start server.js --name "carbon-intelligence-backend"
        pm2 save
EOF
    
    print_success "Application deployed successfully for $env"
}

# Function to show deployment status
show_status() {
    local env=$1
    local stack_name=$2
    local region=$3
    
    print_status "Showing status for $env environment..."
    
    # Show CloudFormation stack status
    aws cloudformation describe-stacks \
        --stack-name $stack_name \
        --region $region \
        --query 'Stacks[0].{StackStatus:StackStatus,CreationTime:CreationTime,LastUpdatedTime:LastUpdatedTime}' \
        --output table
    
    # Show stack outputs
    echo ""
    print_status "Stack Outputs:"
    aws cloudformation describe-stacks \
        --stack-name $stack_name \
        --region $region \
        --query 'Stacks[0].Outputs' \
        --output table
}

# Function to show logs
show_logs() {
    local env=$1
    local region=$2
    
    print_status "Showing logs for $env environment..."
    
    # Get EC2 instance details
    INSTANCE_ID=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=carbon-intelligence-${env}-backend" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text \
        --region $region)
    
    if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
        print_error "No EC2 instance found for $env backend"
        exit 1
    fi
    
    # Get instance public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text \
        --region $region)
    
    # Show PM2 logs
    ssh -i ~/.ssh/carbon-intelligence-key.pem -o StrictHostKeyChecking=no \
        ec2-user@$PUBLIC_IP "pm2 logs carbon-intelligence-backend --lines 50"
}

# Function to rollback deployment
rollback_deployment() {
    local env=$1
    local stack_name=$2
    local region=$3
    
    print_warning "Rolling back $env environment..."
    
    # Get previous stack events to find the last successful update
    aws cloudformation describe-stack-events \
        --stack-name $stack_name \
        --region $region \
        --query 'StackEvents[?ResourceStatus==`UPDATE_COMPLETE`].[Timestamp,ResourceStatus]' \
        --output table
    
    print_warning "Please manually rollback using AWS Console or specify a specific change set"
}

# Function to destroy environment
destroy_environment() {
    local env=$1
    local stack_name=$2
    local region=$3
    
    print_warning "This will destroy the $env environment. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Destroying $env environment..."
        aws cloudformation delete-stack --stack-name $stack_name --region $region
        print_success "Environment destruction initiated"
    else
        print_status "Destruction cancelled"
    fi
}

# Main function
main() {
    local env=${1:-}
    local action=${2:-deploy}
    
    # Validate inputs
    if [ -z "$env" ]; then
        show_usage
        exit 1
    fi
    
    # Get environment configuration
    read -r stack_name region instance_type db_instance_class domain_name <<< $(get_env_config $env)
    
    echo "=========================================="
    echo "Carbon Intelligence - $env Environment"
    echo "=========================================="
    echo "Stack Name: $stack_name"
    echo "Region: $region"
    echo "Action: $action"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Execute action
    case $action in
        "deploy")
            create_env_parameters $env $stack_name $region $instance_type $db_instance_class $domain_name
            deploy_infrastructure $env $stack_name $region
            deploy_application $env $stack_name $region
            show_status $env $stack_name $region
            ;;
        "update")
            create_env_parameters $env $stack_name $region $instance_type $db_instance_class $domain_name
            deploy_infrastructure $env $stack_name $region
            deploy_application $env $stack_name $region
            show_status $env $stack_name $region
            ;;
        "status")
            show_status $env $stack_name $region
            ;;
        "logs")
            show_logs $env $region
            ;;
        "rollback")
            rollback_deployment $env $stack_name $region
            ;;
        "destroy")
            destroy_environment $env $stack_name $region
            ;;
        *)
            print_error "Invalid action: $action"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"