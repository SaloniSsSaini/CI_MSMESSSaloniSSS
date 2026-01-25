# Multi-Agent System Documentation

## Overview

The Carbon Intelligence platform now includes a comprehensive multi-agent system that enables coordinated AI agent operations across both backend and frontend applications. This system allows for parallel execution, sequential processing, and consensus building among multiple AI agents.

## Architecture

### Backend Components

#### 1. Enhanced AI Agent Service (`backend/src/services/aiAgentService.js`)

**Key Features:**
- Multi-agent orchestration and coordination
- Parallel and sequential execution modes
- Consensus building mechanisms
- Agent load balancing
- Real-time performance monitoring
- Inter-agent communication protocols

**New Methods:**
- `executeMultiAgentWorkflow()` - Execute workflows with multiple agents
- `executeMultiAgentWorkflowSteps()` - Process workflow steps with coordination
- `executeParallelCoordination()` - Run agents in parallel
- `executeSequentialCoordination()` - Run agents sequentially with data passing
- `executeConsensusCoordination()` - Build consensus from multiple agent outputs
- `getMultiAgentStatus()` - Get real-time system status
- `balanceAgentLoad()` - Redistribute tasks for optimal performance

#### 2. Orchestration Manager (`backend/src/services/msmeEmissionsOrchestrationService.js`)

**Key Responsibilities:**
- Coordinates multi-AI agent execution based on MSME profiles and operational context
- Tracks known parameters (resources, water, fuel, waste, chemicals, air, materials)
- Enriches sector models with granular transaction type context
- Extracts dynamic parameter signals from transaction messages
- Applies sector/location carbon weightages in emission calculations
- Captures unknown parameter placeholders derived from transactions and behavior signals
- Provides government policy update placeholders to align compliance agents
- Invokes the data privacy agent before downstream processing

#### 3. Orchestration Manager Event Bus (`backend/src/services/orchestrationManagerEventService.js`)

**Key Responsibilities:**
- Receives event signals from transactions, monitoring, and optimization services
- Triggers event-based workflows using AIWorkflow event triggers
- Logs orchestration manager events for frontend visibility
- Exposes orchestration trigger and event emission endpoints

#### 4. Multi-Agent API Endpoints (`backend/src/routes/ai-agents.js`)

**New Endpoints:**
- `POST /api/ai-agents/multi-agent-workflow` - Execute multi-agent workflows
- `GET /api/ai-agents/multi-agent-status` - Get system status
- `POST /api/ai-agents/coordinate-agents` - Coordinate multiple agents
- `POST /api/ai-agents/balance-load` - Balance agent load
- `GET /api/ai-agents/coordination/:coordinationId` - Get coordination results
- `GET /api/ai-agents/dashboard-metrics` - Get dashboard metrics

#### Orchestration Manager Endpoints (`backend/src/routes/orchestration-manager.js`)
- `POST /api/orchestration-manager/trigger` - Trigger orchestration manager run
- `POST /api/orchestration-manager/workflow/trigger` - Trigger workflow execution
- `POST /api/orchestration-manager/emit-event` - Emit event into orchestration bus
- `GET /api/orchestration-manager/events` - Fetch recent event log
- `GET /api/orchestration-manager/status` - Status and multi-agent summary

#### 5. Multi-Agent Workflow Management (`backend/src/routes/multi-agent-workflows.js`)

**Endpoints:**
- `POST /api/multi-agent-workflows` - Create workflows
- `GET /api/multi-agent-workflows` - List workflows
- `GET /api/multi-agent-workflows/:id` - Get workflow details
- `POST /api/multi-agent-workflows/:id/execute` - Execute workflow
- `GET /api/multi-agent-workflows/:id/executions` - Get executions
- `POST /api/multi-agent-workflows/templates` - Create from templates

### Frontend Components

#### 1. Multi-Agent Management (`src/components/MultiAgentManagement.tsx`)

**Features:**
- Real-time agent status monitoring
- Agent coordination interface
- Load balancing controls
- Performance metrics display
- Task execution monitoring
- Orchestration manager triggers and event emission

**Key Capabilities:**
- Select multiple agents for coordination
- Choose coordination modes (parallel, sequential, consensus)
- Monitor real-time performance
- View coordination results
- Balance system load
- Trigger orchestration runs and workflow events

#### 2. Multi-Agent Dashboard (`src/components/MultiAgentDashboard.tsx`)

**Features:**
- Real-time system metrics
- Performance charts and graphs
- Agent activity monitoring
- System load visualization
- Auto-refresh capabilities

**Visualizations:**
- System performance over time
- Agent type distribution
- Task completion metrics
- Response time trends
- Active agent activities

## Coordination Modes

### 1. Parallel Execution
- Agents run simultaneously
- Independent task processing
- Fastest execution time
- Best for independent tasks

### 2. Sequential Execution
- Agents run one after another
- Output from one agent feeds into the next
- Data flow between agents
- Best for dependent tasks

### 3. Consensus Building
- All agents process the same input
- Results are aggregated and consensus is built
- Highest accuracy and reliability
- Best for critical decisions

## Workflow Templates

### 1. Carbon Analysis Workflow
**Steps:**
1. Data Processing
2. Carbon Calculation
3. Anomaly Detection
4. Recommendation Generation

**Coordination:** Hybrid (some steps parallel, some sequential)

### 2. Sustainability Assessment Workflow
**Steps:**
1. Data Collection
2. Carbon Analysis + Compliance Check (parallel)
3. Trend Analysis
4. Optimization Advice
5. Report Generation

**Coordination:** Hybrid with complex dependencies

## Usage Examples

### Backend API Usage

```javascript
// Coordinate multiple agents
const response = await axios.post('/api/ai-agents/coordinate-agents', {
  agentIds: ['agent1', 'agent2', 'agent3'],
  taskType: 'carbon_analysis',
  coordinationMode: 'parallel',
  input: { transactions: [...] }
});

// Execute multi-agent workflow
const workflow = await axios.post('/api/multi-agent-workflows/123/execute', {
  msmeId: 'msme123',
  triggerData: { source: 'manual' }
});

// Get system status
const status = await axios.get('/api/ai-agents/multi-agent-status');
```

### Frontend Component Usage

```tsx
// Multi-Agent Management
<MultiAgentManagement />

// Multi-Agent Dashboard
<MultiAgentDashboard />

// Navigation
<Route path="/multi-agent-management" element={<MultiAgentManagement />} />
<Route path="/multi-agent-dashboard" element={<MultiAgentDashboard />} />
```

## Performance Monitoring

### Real-time Metrics
- Active agents count
- Processing tasks count
- System load percentage
- Average response time
- Success/failure rates

### Historical Data
- Performance trends over time
- Agent utilization patterns
- Task completion rates
- Error analysis

## Configuration

### Agent Configuration
```javascript
{
  name: "Carbon Analyzer Agent",
  type: "carbon_analyzer",
  capabilities: ["carbon_calculation", "emission_analysis"],
  configuration: {
    maxConcurrentTasks: 5,
    timeout: 30000,
    retryAttempts: 3
  },
  performance: {
    tasksCompleted: 0,
    successRate: 100,
    averageResponseTime: 0
  }
}
```

### Workflow Configuration
```javascript
{
  name: "Carbon Analysis Workflow",
  type: "multi_agent",
  coordination: {
    mode: "hybrid",
    parallelGroups: [
      ["data_processing"],
      ["carbon_calculation"],
      ["anomaly_detection", "recommendation_generation"]
    ]
  },
  steps: [
    {
      stepId: "data_processing",
      taskType: "data_processing",
      dependencies: []
    }
  ]
}
```

## Error Handling

### Agent Failures
- Automatic retry mechanisms
- Fallback to alternative agents
- Graceful degradation
- Error reporting and logging

### Coordination Failures
- Partial result recovery
- Rollback mechanisms
- Error isolation
- Detailed error reporting

## Security Considerations

### Access Control
- Role-based permissions
- Agent access restrictions
- Workflow execution limits
- Audit logging

### Data Protection
- Encrypted inter-agent communication
- Secure data passing
- Privacy-preserving coordination
- Data privacy agent for redaction and policy context
- Compliance with data regulations

## Scalability

### Horizontal Scaling
- Multiple agent instances
- Load distribution
- Auto-scaling based on demand
- Resource optimization

### Performance Optimization
- Task queuing and prioritization
- Intelligent agent selection
- Caching mechanisms
- Resource pooling

## Monitoring and Alerting

### Real-time Alerts
- Agent failures
- Performance degradation
- System overload
- Coordination errors

### Logging
- Comprehensive audit trails
- Performance metrics
- Error tracking
- Usage analytics

## Future Enhancements

### Planned Features
- Machine learning-based agent selection
- Dynamic workflow optimization
- Advanced consensus algorithms
- Cross-platform agent coordination
- AI-powered load balancing

### Integration Opportunities
- External AI services
- Cloud-based agent hosting
- Third-party workflow engines
- Enterprise system integration

## Troubleshooting

### Common Issues
1. **Agent Coordination Failures**
   - Check agent availability
   - Verify input data format
   - Review coordination mode settings

2. **Performance Issues**
   - Monitor system load
   - Check agent capacity
   - Review task distribution

3. **Workflow Execution Errors**
   - Validate workflow configuration
   - Check step dependencies
   - Review agent assignments

### Debug Tools
- Real-time monitoring dashboard
- Detailed execution logs
- Performance analytics
- Error tracking system

## Conclusion

The multi-agent system provides a robust, scalable, and flexible platform for coordinating AI agents across the Carbon Intelligence ecosystem. It enables complex workflows, real-time monitoring, and intelligent coordination while maintaining high performance and reliability.

The system is designed to grow with the platform's needs and can be easily extended with new agent types, coordination modes, and workflow templates as requirements evolve.
