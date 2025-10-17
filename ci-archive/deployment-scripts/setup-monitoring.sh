#!/bin/bash

# Carbon Intelligence - Monitoring Setup Script
# This script sets up comprehensive monitoring for the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-1"
SNS_TOPIC_NAME="carbon-intelligence-alerts"

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

# Function to create SNS topic for alerts
create_sns_topic() {
    print_status "Creating SNS topic for alerts..."
    
    # Create SNS topic
    TOPIC_ARN=$(aws sns create-topic \
        --name $SNS_TOPIC_NAME \
        --region $REGION \
        --query 'TopicArn' \
        --output text)
    
    print_success "SNS topic created: $TOPIC_ARN"
    
    # Subscribe to email notifications (replace with your email)
    read -p "Enter email address for alerts: " EMAIL
    if [ -n "$EMAIL" ]; then
        aws sns subscribe \
            --topic-arn $TOPIC_ARN \
            --protocol email \
            --notification-endpoint $EMAIL \
            --region $REGION
        
        print_success "Email subscription created for $EMAIL"
        print_warning "Please check your email and confirm the subscription"
    fi
}

# Function to create CloudWatch alarms
create_cloudwatch_alarms() {
    print_status "Creating CloudWatch alarms..."
    
    # Get SNS topic ARN
    TOPIC_ARN=$(aws sns list-topics \
        --query "Topics[?contains(TopicArn, '$SNS_TOPIC_NAME')].TopicArn" \
        --output text \
        --region $REGION)
    
    if [ -z "$TOPIC_ARN" ]; then
        print_error "SNS topic not found. Please run setup-monitoring.sh first."
        exit 1
    fi
    
    # High CPU alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "carbon-intelligence-high-cpu" \
        --alarm-description "High CPU utilization for Carbon Intelligence" \
        --metric-name CPUUtilization \
        --namespace AWS/EC2 \
        --statistic Average \
        --period 300 \
        --threshold 80 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $TOPIC_ARN \
        --region $REGION
    
    # High memory alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "carbon-intelligence-high-memory" \
        --alarm-description "High memory utilization for Carbon Intelligence" \
        --metric-name MemoryUtilization \
        --namespace System/Linux \
        --statistic Average \
        --period 300 \
        --threshold 85 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $TOPIC_ARN \
        --region $REGION
    
    # Application error alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "carbon-intelligence-errors" \
        --alarm-description "High error rate for Carbon Intelligence" \
        --metric-name ErrorCount \
        --namespace CarbonIntelligence/Backend \
        --statistic Sum \
        --period 300 \
        --threshold 10 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 1 \
        --alarm-actions $TOPIC_ARN \
        --region $REGION
    
    # Database connection alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "carbon-intelligence-db-connections" \
        --alarm-description "High database connection count" \
        --metric-name DatabaseConnections \
        --namespace CarbonIntelligence/Backend \
        --statistic Average \
        --period 300 \
        --threshold 80 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $TOPIC_ARN \
        --region $REGION
    
    print_success "CloudWatch alarms created successfully"
}

# Function to setup log groups
setup_log_groups() {
    print_status "Setting up CloudWatch log groups..."
    
    # Create log groups
    aws logs create-log-group \
        --log-group-name "/aws/ec2/carbon-intelligence-backend" \
        --region $REGION || print_warning "Log group may already exist"
    
    aws logs create-log-group \
        --log-group-name "/aws/ec2/carbon-intelligence-frontend" \
        --region $REGION || print_warning "Log group may already exist"
    
    # Set retention policy (30 days)
    aws logs put-retention-policy \
        --log-group-name "/aws/ec2/carbon-intelligence-backend" \
        --retention-in-days 30 \
        --region $REGION
    
    aws logs put-retention-policy \
        --log-group-name "/aws/ec2/carbon-intelligence-frontend" \
        --retention-in-days 30 \
        --region $REGION
    
    print_success "Log groups configured successfully"
}

# Function to create custom metrics
create_custom_metrics() {
    print_status "Creating custom metrics..."
    
    # Create custom metric for application health
    aws cloudwatch put-metric-data \
        --namespace "CarbonIntelligence/Backend" \
        --metric-data MetricName=ApplicationHealth,Value=1,Unit=Count \
        --region $REGION
    
    # Create custom metric for active users
    aws cloudwatch put-metric-data \
        --namespace "CarbonIntelligence/Backend" \
        --metric-data MetricName=ActiveUsers,Value=0,Unit=Count \
        --region $REGION
    
    # Create custom metric for API response time
    aws cloudwatch put-metric-data \
        --namespace "CarbonIntelligence/Backend" \
        --metric-data MetricName=ApiResponseTime,Value=0,Unit=Milliseconds \
        --region $REGION
    
    print_success "Custom metrics created successfully"
}

# Function to setup Prometheus and Grafana
setup_prometheus_grafana() {
    print_status "Setting up Prometheus and Grafana..."
    
    # Create Prometheus configuration
    cat > aws/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "carbon-intelligence-rules.yml"

scrape_configs:
  - job_name: 'carbon-intelligence-backend'
    static_configs:
      - targets: ['carbon-backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'mongodb-exporter'
    static_configs:
      - targets: ['mongodb-exporter:9216']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
EOF

    # Create Grafana dashboard configuration
    cat > aws/monitoring/grafana-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Carbon Intelligence Monitoring",
    "tags": ["carbon-intelligence"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          }
        ]
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - ((node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100)",
            "legendFormat": "Memory Usage %"
          }
        ]
      },
      {
        "id": 3,
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

    print_success "Prometheus and Grafana configuration created"
}

# Function to create monitoring dashboard
create_monitoring_dashboard() {
    print_status "Creating monitoring dashboard..."
    
    # Create a simple HTML dashboard
    cat > aws/monitoring/dashboard.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carbon Intelligence - Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .status { padding: 5px 10px; border-radius: 3px; color: white; }
        .healthy { background-color: #4CAF50; }
        .warning { background-color: #FF9800; }
        .error { background-color: #F44336; }
    </style>
</head>
<body>
    <h1>Carbon Intelligence - Monitoring Dashboard</h1>
    
    <div class="metric">
        <h3>Application Status</h3>
        <span id="app-status" class="status">Checking...</span>
    </div>
    
    <div class="metric">
        <h3>Database Status</h3>
        <span id="db-status" class="status">Checking...</span>
    </div>
    
    <div class="metric">
        <h3>API Response Time</h3>
        <span id="api-time">Loading...</span>
    </div>
    
    <div class="metric">
        <h3>Active Users</h3>
        <span id="active-users">Loading...</span>
    </div>
    
    <script>
        // Simple monitoring script
        function checkStatus() {
            fetch('/health')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('app-status').textContent = 'Healthy';
                    document.getElementById('app-status').className = 'status healthy';
                })
                .catch(error => {
                    document.getElementById('app-status').textContent = 'Error';
                    document.getElementById('app-status').className = 'status error';
                });
        }
        
        // Check status every 30 seconds
        setInterval(checkStatus, 30000);
        checkStatus();
    </script>
</body>
</html>
EOF

    print_success "Monitoring dashboard created"
}

# Function to display monitoring summary
monitoring_summary() {
    print_success "Monitoring setup completed!"
    echo ""
    echo "=== MONITORING SUMMARY ==="
    echo "SNS Topic: $SNS_TOPIC_NAME"
    echo "Region: $REGION"
    echo ""
    echo "=== SERVICES ==="
    echo "CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups"
    echo "CloudWatch Alarms: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:"
    echo "Prometheus: http://your-domain:9090"
    echo "Grafana: http://your-domain:3001"
    echo ""
    echo "=== NEXT STEPS ==="
    echo "1. Confirm SNS email subscription"
    echo "2. Configure Grafana data sources"
    echo "3. Import dashboard configurations"
    echo "4. Set up additional alerting rules"
    echo "5. Test monitoring endpoints"
}

# Main execution
main() {
    echo "=========================================="
    echo "Carbon Intelligence - Monitoring Setup"
    echo "=========================================="
    echo ""
    
    create_sns_topic
    create_cloudwatch_alarms
    setup_log_groups
    create_custom_metrics
    setup_prometheus_grafana
    create_monitoring_dashboard
    monitoring_summary
}

# Run main function
main "$@"