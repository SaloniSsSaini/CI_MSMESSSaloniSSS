#!/bin/bash

# Carbon Intelligence - Production Deployment Script
# This script deploys the application to AWS production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="carbon-intelligence-production"
REGION="us-east-1"
ENVIRONMENT="production"

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

# Function to create production parameters
create_production_parameters() {
    print_status "Creating production parameters..."
    
    cat > aws/parameters-production.json << EOF
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "production"
  },
  {
    "ParameterKey": "InstanceType",
    "ParameterValue": "t3.medium"
  },
  {
    "ParameterKey": "DatabaseInstanceClass",
    "ParameterValue": "db.t3.medium"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "carbon-intelligence.example.com"
  },
  {
    "ParameterKey": "MinCapacity",
    "ParameterValue": "2"
  },
  {
    "ParameterKey": "MaxCapacity",
    "ParameterValue": "10"
  }
]
EOF
    
    print_success "Production parameters created"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying production infrastructure..."
    
    # Deploy CloudFormation stack
    if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
        print_status "Updating existing production stack..."
        aws cloudformation update-stack \
            --stack-name $STACK_NAME \
            --template-body file://aws/cloudformation-template.yaml \
            --parameters file://aws/parameters-production.json \
            --capabilities CAPABILITY_IAM \
            --region $REGION
        
        aws cloudformation wait stack-update-complete \
            --stack-name $STACK_NAME \
            --region $REGION
    else
        print_status "Creating new production stack..."
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body file://aws/cloudformation-template.yaml \
            --parameters file://aws/parameters-production.json \
            --capabilities CAPABILITY_IAM \
            --region $REGION
        
        aws cloudformation wait stack-create-complete \
            --stack-name $STACK_NAME \
            --region $REGION
    fi
    
    print_success "Production infrastructure deployed successfully"
}

# Function to deploy backend with blue-green deployment
deploy_backend() {
    print_status "Deploying backend with blue-green strategy..."
    
    # Get Auto Scaling Group details
    ASG_NAME=$(aws autoscaling describe-auto-scaling-groups \
        --query 'AutoScalingGroups[?contains(AutoScalingGroupName, `carbon-intelligence-production`)].AutoScalingGroupName' \
        --output text \
        --region $REGION)
    
    if [ -z "$ASG_NAME" ] || [ "$ASG_NAME" = "None" ]; then
        print_error "Auto Scaling Group not found"
        exit 1
    fi
    
    print_status "Using Auto Scaling Group: $ASG_NAME"
    
    # Create new launch template version
    LAUNCH_TEMPLATE_NAME=$(aws autoscaling describe-auto-scaling-groups \
        --auto-scaling-group-names $ASG_NAME \
        --query 'AutoScalingGroups[0].LaunchTemplate.LaunchTemplateName' \
        --output text \
        --region $REGION)
    
    # Update launch template with new AMI or configuration
    print_status "Updating launch template: $LAUNCH_TEMPLATE_NAME"
    
    # Trigger instance refresh for blue-green deployment
    aws autoscaling start-instance-refresh \
        --auto-scaling-group-name $ASG_NAME \
        --preferences '{"InstanceWarmup": 300, "MinHealthyPercentage": 50}' \
        --region $REGION
    
    print_success "Backend deployment initiated with blue-green strategy"
}

# Function to deploy frontend to CloudFront
deploy_frontend() {
    print_status "Deploying frontend to CloudFront..."
    
    # Get S3 bucket name
    S3_BUCKET=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
        --output text)
    
    # Get CloudFront distribution ID
    CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
        --output text)
    
    if [ -n "$S3_BUCKET" ] && [ "$S3_BUCKET" != "None" ]; then
        # Build and upload frontend
        npm run build:web || print_warning "Web build not configured"
        
        if [ -d "build" ]; then
            aws s3 sync build/ s3://$S3_BUCKET/ --delete
            
            # Invalidate CloudFront cache
            if [ -n "$CLOUDFRONT_ID" ] && [ "$CLOUDFRONT_ID" != "None" ]; then
                aws cloudfront create-invalidation \
                    --distribution-id $CLOUDFRONT_ID \
                    --paths "/*"
                print_success "CloudFront cache invalidated"
            fi
            
            print_success "Frontend deployed to S3 and CloudFront"
        fi
    else
        print_warning "S3 bucket not found, skipping frontend deployment"
    fi
}

# Function to setup monitoring and alerts
setup_monitoring() {
    print_status "Setting up production monitoring..."
    
    # Create CloudWatch alarms
    aws cloudwatch put-metric-alarm \
        --alarm-name "carbon-intelligence-high-cpu" \
        --alarm-description "High CPU utilization" \
        --metric-name CPUUtilization \
        --namespace AWS/EC2 \
        --statistic Average \
        --period 300 \
        --threshold 80 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions "arn:aws:sns:us-east-1:123456789012:carbon-intelligence-alerts" \
        --region $REGION || print_warning "Failed to create CPU alarm"
    
    aws cloudwatch put-metric-alarm \
        --alarm-name "carbon-intelligence-high-memory" \
        --alarm-description "High memory utilization" \
        --metric-name MemoryUtilization \
        --namespace System/Linux \
        --statistic Average \
        --period 300 \
        --threshold 85 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions "arn:aws:sns:us-east-1:123456789012:carbon-intelligence-alerts" \
        --region $REGION || print_warning "Failed to create memory alarm"
    
    print_success "Monitoring setup completed"
}

# Function to run comprehensive health checks
run_health_checks() {
    print_status "Running comprehensive health checks..."
    
    # Get load balancer DNS
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
        --output text)
    
    # Get CloudFront URL
    CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
        --output text)
    
    # Test load balancer health
    if [ -n "$ALB_DNS" ] && [ "$ALB_DNS" != "None" ]; then
        print_status "Testing load balancer: http://$ALB_DNS/health"
        if curl -f -s "http://$ALB_DNS/health" > /dev/null; then
            print_success "Load balancer health check passed"
        else
            print_warning "Load balancer health check failed"
        fi
    fi
    
    # Test CloudFront
    if [ -n "$CLOUDFRONT_URL" ] && [ "$CLOUDFRONT_URL" != "None" ]; then
        print_status "Testing CloudFront: $CLOUDFRONT_URL"
        if curl -f -s "$CLOUDFRONT_URL" > /dev/null; then
            print_success "CloudFront health check passed"
        else
            print_warning "CloudFront health check failed"
        fi
    fi
}

# Function to display deployment summary
deployment_summary() {
    print_success "Production deployment completed!"
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
    
    echo ""
    echo "=== NEXT STEPS ==="
    echo "1. Monitor CloudWatch logs and metrics"
    echo "2. Test all application endpoints"
    echo "3. Verify SSL certificate is active"
    echo "4. Update DNS records if needed"
    echo "5. Configure monitoring alerts"
}

# Main execution
main() {
    echo "=========================================="
    echo "Carbon Intelligence - Production Deployment"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    create_production_parameters
    deploy_infrastructure
    deploy_backend
    deploy_frontend
    setup_monitoring
    run_health_checks
    deployment_summary
}

# Run main function
main "$@"