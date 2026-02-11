# Carbon Intelligence Platform Architecture Diagrams

This document provides detailed architecture views for the Carbon Intelligence platform using Mermaid diagrams. It reflects the current implementation across web, mobile, backend services, AI orchestration, and persistence layers.

## 1) System Context Diagram

```mermaid
flowchart LR
  MSME["MSME User"]
  Admin["Platform Admin"]
  Bank["Bank Partner"]
  Regulator["Compliance / Regulator"]

  Web["Web App (React + TypeScript)"]
  Mobile["Mobile App (React Native)"]
  API["Backend API (Node.js + Express)"]

  MSME -->|dashboard, upload, analytics| Web
  MSME -->|mobile actions, SMS/email analysis| Mobile
  Admin -->|oversight, moderation, controls| Web
  Bank -->|green-loan integration APIs| API
  Regulator -->|compliance and reporting expectations| API

  Web -->|HTTPS / REST| API
  Mobile -->|HTTPS / REST| API
```

## 2) Container Architecture Diagram

```mermaid
flowchart TB
  subgraph Clients["Client Layer"]
    Web["Web Frontend\nsrc/App.tsx + components"]
    Mobile["Mobile Frontend\nmobile/src/screens"]
  end

  subgraph APIPlane["API and Orchestration Layer"]
    APIGateway["Express API Server\nbackend/src/server.js"]
    Routes["Route Modules\nauth, msme, carbon, documents,\nai-agents, orchestration-manager,\nai-workflows, reporting, trading"]
    Orchestrator["MSME Emissions Orchestration Service\nmsmeEmissionsOrchestrationService.js"]
    AIService["AI Agent Service\naiAgentService.js"]
    EventBus["Orchestration Event Bus\norchestrationManagerEventService.js"]
    DocProc["Document Processing Service\ndocumentProcessingService.js"]
    Extraction["AI Data Extraction Service\naiDataExtractionService.js"]
  end

  subgraph DataLayer["Data and Storage Layer"]
    Mongo["MongoDB\nMSME, Transaction, Document,\nCarbonAssessment, AIAgent,\nAITask, AIWorkflow, AIExecution,\nCarbonCredits, CarbonTrading"]
    Uploads["File Storage\n/uploads, /processed"]
  end

  subgraph Ext["External Integrations"]
    IMAP["Email Providers (IMAP)\nemailIngestionAgent.js"]
    MSG91["MSG91 SMS Gateway\nmsg91Client.js"]
  end

  Web --> APIGateway
  Mobile --> APIGateway
  APIGateway --> Routes
  Routes --> Orchestrator
  Routes --> AIService
  Routes --> EventBus
  Routes --> DocProc
  DocProc --> Extraction

  Orchestrator --> AIService
  EventBus --> AIService
  EventBus --> Orchestrator

  Routes --> Mongo
  Orchestrator --> Mongo
  AIService --> Mongo
  DocProc --> Mongo
  DocProc --> Uploads

  Routes --> IMAP
  Routes --> MSG91
```

## 3) Backend Component Diagram (AI and Orchestration Core)

```mermaid
flowchart LR
  subgraph API["API Endpoints"]
    A1["/api/ai-agents/*"]
    A2["/api/orchestration-manager/*"]
    A3["/api/ai-workflows/*"]
    A4["/api/multi-agent-workflows/*"]
  end

  subgraph Services["Core Services"]
    S1["aiAgentService\n- task queue\n- workflow executor\n- parallel/sequential/consensus"]
    S2["msmeEmissionsOrchestrationService\n- staged orchestration\n- context enrichment\n- parallel insight agents"]
    S3["orchestrationManagerEventService\n- event logging\n- event-based workflow triggers"]
    S4["agent registry + handlers\nservices/agents/registry.js"]
  end

  subgraph Models["Core Models"]
    M1["AIAgent"]
    M2["AITask"]
    M3["AIWorkflow"]
    M4["AIExecution"]
  end

  A1 --> S1
  A1 --> S2
  A2 --> S3
  A3 --> S1
  A4 --> S1

  S2 --> S1
  S3 --> S1
  S1 --> S4

  S1 --> M1
  S1 --> M2
  S1 --> M3
  S1 --> M4
  S3 --> M3
```

## 4) Workflow Diagram: End-to-End MSME Emissions Orchestration

```mermaid
flowchart TD
  Start([Start orchestration request])
  Input["Input:\nmsmeId/msmeData + transactions\n(+ optional documents, overrides)"]
  Validate{"Valid input?"}
  Context["Build base context\nbusiness domain, industry,\nknown parameters, policy placeholders"]
  Bootstrap["Run orchestration agent\nstage: bootstrap"]
  Docs["Resolve and analyze documents\n(document_analyzer)"]
  Privacy["Run data_privacy agent\n(PII minimization/redaction)"]
  Dynamic["Extract dynamic parameters\nfrom privacy-safe transactions"]
  Profile["Run profilers:\nsector_profiler + process_machinery_profiler"]
  Core["Core analysis:\ndata_processor -> carbon_analyzer"]
  Plan["Build orchestration plan\n(mode, parallel agents, outputs)"]

  subgraph ParallelInsights["Parallel Insight Agents"]
    P1["anomaly_detector"]
    P2["trend_analyzer"]
    P3["compliance_monitor"]
    P4["optimization_advisor"]
  end

  Post["Post processing:\nrecommendation_engine + report_generator"]
  Summary["Compile emissions summary,\ninteractions, warnings,\ncommunication state"]
  Done([Return orchestration response])
  Fail([Return validation/error response])

  Start --> Input --> Validate
  Validate -->|No| Fail
  Validate -->|Yes| Context --> Bootstrap --> Docs --> Privacy --> Dynamic --> Profile --> Core --> Plan
  Plan --> P1
  Plan --> P2
  Plan --> P3
  Plan --> P4
  P1 --> Post
  P2 --> Post
  P3 --> Post
  P4 --> Post
  Post --> Summary --> Done
```

## 5) Sequence Diagram: `/api/ai-agents/orchestrate-msme-emissions`

```mermaid
sequenceDiagram
  autonumber
  participant Client as Web/Mobile Client
  participant API as ai-agents Route
  participant Orch as Orchestration Service
  participant AIS as AI Agent Service
  participant DB as MongoDB
  participant Bus as Orchestration Event Service

  Client->>API: POST /api/ai-agents/orchestrate-msme-emissions
  API->>Orch: orchestrateEmissions(payload)
  Orch->>DB: Load MSME profile and documents
  Orch->>AIS: document_analyzer + data_privacy
  Orch->>AIS: sector_profiler + process_machinery_profiler
  Orch->>AIS: data_processor -> carbon_analyzer
  par Parallel insight agents
    Orch->>AIS: anomaly_detector
    Orch->>AIS: trend_analyzer
    Orch->>AIS: compliance_monitor
    Orch->>AIS: optimization_advisor
  end
  Orch->>AIS: recommendation_engine + report_generator
  Orch-->>API: orchestration result
  API->>Bus: emit orchestration.msme_emissions.completed
  API-->>Client: success + orchestration payload
```

## 6) Workflow Diagram: Document Intelligence Pipeline

```mermaid
flowchart TD
  U["User uploads PDF\n/api/documents/upload"] --> SaveMeta["Create Document record\nstatus=uploaded"]
  SaveMeta --> Async["Async processing kickoff\nsetImmediate"]
  Async --> Parse["Parse PDF text + extract entities\n(amount, date, vendor, category)"]
  Parse --> Validate["Validate extracted fields"]
  Validate --> Dup{"Duplicate detected?"}
  Dup -->|Yes| MarkDup["Mark document duplicate\nstatus=duplicate"]
  Dup -->|No| Calc["Calculate carbon footprint\nand document-level analysis"]
  Calc --> Persist["Persist extracted data,\ncarbon metrics, processing result\nstatus=processed"]
  Persist --> Txn["Create transaction(s)\nfrom document"]
  Txn --> Assess["Update rolling carbon assessment"]
  Txn --> Event["Emit event:\ntransactions.document_processed"]
  MarkDup --> End([Complete])
  Event --> End
  Assess --> End
```

## 7) Workflow Diagram: Event-Driven Orchestration and Workflow Triggering

```mermaid
flowchart LR
  Source["Event Source\n(api, monitoring, document processing,\nmanual emit-event)"]
  Receive["orchestrationManagerEventService\nrecordEvent(status=received)"]
  Match{"Any active event-based\nAIWorkflow matches event type?"}
  HasMsme{"MSME ID resolvable\nfrom payload?"}
  Trigger["Execute matched workflows\nvia aiAgentService.executeMultiAgentWorkflow"]
  Update["Update event log\nstatus=processed/completed/failed/skipped"]
  Expose["Expose events/status via\n/api/orchestration-manager/events\n/api/orchestration-manager/status"]

  Source --> Receive --> Match
  Match -->|No| Update --> Expose
  Match -->|Yes| HasMsme
  HasMsme -->|No| Update
  HasMsme -->|Yes| Trigger --> Update --> Expose
```

## 8) Use-Case Diagram (Platform Capabilities)

```mermaid
flowchart LR
  MSME["MSME User"]
  Admin["Platform Admin"]
  Bank["Bank Partner"]
  System["Orchestration Operator / Integrator"]

  UC1["Register and manage MSME profile"]
  UC2["Upload and manage documents"]
  UC3["Ingest SMS/email sustainability signals"]
  UC4["Run carbon assessment and view dashboard"]
  UC5["Run AI orchestration workflows"]
  UC6["View recommendations and reports"]
  UC7["Trade/retire carbon credits"]
  UC8["Apply for green loans"]
  UC9["Manage privacy settings and data requests"]
  UC10["Monitor agents, events, and load balancing"]
  UC11["Review spam/duplicate transactions and admin stats"]
  UC12["Consume loan and credit market data"]

  MSME --> UC1
  MSME --> UC2
  MSME --> UC3
  MSME --> UC4
  MSME --> UC5
  MSME --> UC6
  MSME --> UC7
  MSME --> UC8
  MSME --> UC9

  Admin --> UC10
  Admin --> UC11

  Bank --> UC12
  Bank --> UC8

  System --> UC5
  System --> UC10
```

## 9) Data Model Relationship Diagram (Core Domains)

```mermaid
erDiagram
  USER ||--o| MSME : owns
  MSME ||--o{ TRANSACTION : generates
  MSME ||--o{ DOCUMENT : uploads
  MSME ||--o{ CARBON_ASSESSMENT : has
  MSME ||--o{ AI_TASK : receives
  MSME ||--o{ AI_EXECUTION : runs
  MSME ||--|| CARBON_TRADING : holds
  MSME ||--|| MSME_CARBON_CREDITS : allocated

  AI_AGENT ||--o{ AI_TASK : executes
  AI_WORKFLOW ||--o{ AI_EXECUTION : instantiates
  AI_EXECUTION ||--o{ AI_TASK : materializes

  CARBON_CREDITS_POOL ||--o{ MSME_CARBON_CREDITS : distributes_to
  CARBON_CREDITS_POOL ||--o{ CARBON_CREDIT_TRANSACTION : records
  MSME ||--o{ CARBON_CREDIT_TRANSACTION : buyer_or_seller
```

## 10) Deployment Topology Diagram

```mermaid
flowchart TB
  subgraph UserEdge["User Edge"]
    Browser["Web Browser"]
    MobileApp["Mobile App"]
  end

  subgraph AppTier["Application Tier"]
    NodeAPI["Node.js/Express API\nbackend/src/server.js"]
  end

  subgraph ComputeTier["Service Tier (in-process services)"]
    AISvc["AI Agent Service"]
    OrchSvc["Orchestration Service"]
    DocSvc["Document Processing"]
    EventSvc["Event Bus / Monitoring Hooks"]
  end

  subgraph DataTier["Data Tier"]
    MongoDB["MongoDB"]
    FileStore["File System Storage\nuploads + processed"]
  end

  subgraph External["External Providers"]
    EmailProv["IMAP Email Providers"]
    SMSProv["MSG91"]
  end

  Browser -->|HTTPS| NodeAPI
  MobileApp -->|HTTPS| NodeAPI

  NodeAPI --> AISvc
  NodeAPI --> OrchSvc
  NodeAPI --> DocSvc
  NodeAPI --> EventSvc

  NodeAPI --> MongoDB
  AISvc --> MongoDB
  OrchSvc --> MongoDB
  DocSvc --> MongoDB
  DocSvc --> FileStore

  NodeAPI --> EmailProv
  NodeAPI --> SMSProv
```

## 11) AI Task Lifecycle (State Diagram)

```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> InProgress: picked by processor
  InProgress --> Completed: success
  InProgress --> Failed: exception or timeout
  Pending --> Cancelled: cancelled by workflow/user
  Failed --> Pending: retry policy
  Completed --> [*]
  Cancelled --> [*]
```

## 12) Observability and Control Feedback Loop

```mermaid
flowchart LR
  Metrics["Runtime Metrics\n(task throughput, response time,\nagent performance, event log)"]
  Dash["MultiAgentDashboard /\nMultiAgentManagement UI"]
  Control["Control Actions\ncoordinate-agents,\nbalance-load,\ntrigger workflow/orchestration"]
  Runtime["AI Runtime\nagents + workflows + queues"]

  Runtime --> Metrics --> Dash --> Control --> Runtime
```

## Notes

- API aggregation entrypoint: `backend/src/server.js`
- Core orchestration engine: `backend/src/services/msmeEmissionsOrchestrationService.js`
- Multi-agent execution engine: `backend/src/services/aiAgentService.js`
- Event bus and event-driven workflows: `backend/src/services/orchestrationManagerEventService.js`
- Document processing pipeline: `backend/src/services/documentProcessingService.js`
- Frontend orchestration console: `src/components/MultiAgentManagement.tsx`

