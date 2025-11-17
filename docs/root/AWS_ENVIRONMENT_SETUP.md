# AWS Environment Dependency & Deployment Guide

This guide explains how to provision the AWS infrastructure, install runtime dependencies, configure environment variables (including MongoDB, backend, frontend, web, and mobile settings), run tests, and deploy every Carbon Intelligence component. Follow the steps sequentially when preparing a new developer or lower environment.

---

## 1. Component Scope & Architecture

| Layer | Path | AWS Target | Notes |
| --- | --- | --- | --- |
| MongoDB | external | Amazon DocumentDB, MongoDB Atlas, or self-managed on EC2 | Primary data store shared by backend + analytics jobs |
| Backend API | `backend/` | Amazon Linux 2023 EC2 (t3.medium+) behind an ALB | Node.js/Express server exposing REST + AI workflows |
| Web Frontend | repo root (`src/`) | S3 static hosting fronted by CloudFront | React + TypeScript SPA |
| Mobile App | `mobile/` | EAS/Expo build or local Android build farm | React Native app that consumes backend API |
| CI / Scripts | `ci-archive/` | CodeBuild + CodePipeline (optional) | Contains reusable scripts used by automation |

---

## 2. Workstation & AWS Prerequisites

1. **AWS access**
   - Create a least-privilege IAM user/role with permissions for EC2, VPC, IAM PassRole, CloudFormation, S3, CloudFront, ACM, Route53, CloudWatch, Systems Manager, Secrets Manager, and CodeBuild/CodeDeploy.
   - Configure the CLI: `aws configure sso` *or* `aws configure` (supply access key/secret).
   - Verify identity: `aws sts get-caller-identity`.

2. **Local tooling**
   ```bash
   # macOS/Linux
   brew install awscli jq git watchman
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs build-essential
   npm install -g npm@10.2.5 yarn pm2
   ```

3. **Shared configuration repositories**
   - Clone `/workspace` (this repo) and keep in sync with `origin/cursor/setup-aws-environment-and-deployment-guide-0518`.
   - Ensure Git LFS is available if the project later stores binaries: `git lfs install`.

4. **Credential storage**
   - Standardize on **AWS Systems Manager Parameter Store** path: `/carbon-intel/<env>/<service>/<key>`.
   - Use **AWS Secrets Manager** for sensitive strings (JWT secret, MSG91 keys, signing keys).

---

## 3. Bootstrap AWS Networking & Shared Resources

1. **VPC + Subnets**
   - Create a VPC (e.g., `10.20.0.0/16`) with at least two public subnets and two private subnets across different AZs.
   - Associate Internet Gateway + routing rules for public subnets; route private subnets through NAT if required.

2. **Security Groups**
   - `carbon-backend-sg`: Allow inbound `80/443` (ALB), `5000` (admin/testing), `27017` (MongoDB) from bastion/VPC only, SSH (22) from office VPN.
   - `mongo-sg`: Restrict `27017` to backend SG and bastion.

3. **Parameter Store / Secrets Manager**
   ```bash
   aws ssm put-parameter --name "/carbon-intel/dev/backend/MONGODB_URI" \
     --type "SecureString" --value "mongodb://<user>:<pass>@mongo.dev.internal:27017/carbon-intelligence"
   ```

4. **S3 Buckets**
   - `carbon-intel-artifacts-<account>` – stores CodeBuild artifacts + mobile bundles.
   - `carbon-intel-web-<env>` – hosts React build output (enable versioning + default encryption).

5. **Observability**
   - Create CloudWatch log groups: `/carbon-intel/backend`, `/carbon-intel/mobile-builds`.
   - Enable X-Ray or AWS Distro for OpenTelemetry if tracing is required later.

---

## 4. MongoDB Installation & Configuration

### Option A – Managed (DocumentDB or Atlas)
1. Provision a DocumentDB cluster (minimum `db.t3.medium`, 10 GB storage).
2. Place cluster in private subnets with the `mongo-sg`.
3. Create an admin user and store credentials in Secrets Manager (`carbon-intel/dev/mongodb`).
4. Build a connection string similar to:
   ```
   mongodb://carbon_admin:${MONGO_PASSWORD}@docdb-cluster.cluster-codszx123.us-east-1.docdb.amazonaws.com:27017/carbon-intelligence?replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
   ```

### Option B – Self-Managed MongoDB on Amazon Linux 2023

```bash
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo <<'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF

sudo yum install -y mongodb-org
sudo systemctl enable --now mongod
sudo sed -i "s/bindIp: 127.0.0.1/bindIp: 0.0.0.0/" /etc/mongod.conf
sudo systemctl restart mongod
```

Create admin + application users:
```bash
mongosh
use admin
db.createUser({ user: "carbon_admin", pwd: "<STRONG_PASSWORD>", roles: [ { role: "root", db: "admin" } ] })
use carbon-intelligence
db.createUser({ user: "carbon_app", pwd: "<STRONG_PASSWORD>", roles: [ { role: "readWrite", db: "carbon-intelligence" } ] })
```

**Hardening**
- Limit inbound traffic to backend SG only.
- Enable disk encryption (EBS) and daily snapshots.
- Configure CloudWatch alarms for CPU, storage, and replication lag.

---

## 5. Backend API Dependency & Deployment Steps (`backend/`)

### 5.1 Install OS-Level Dependencies (EC2)
```bash
sudo dnf update -y
sudo dnf install -y git gcc-c++ make python3
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm alias default 20
npm install -g npm@10.5.0 pm2
```

### 5.2 Fetch Code & Install Packages
```bash
sudo mkdir -p /opt/carbon-intel && sudo chown $USER /opt/carbon-intel
cd /opt/carbon-intel
git clone https://github.com/<org>/carbon-intelligence.git .
cd backend
npm ci
```

### 5.3 Environment Variables

Create `/opt/carbon-intel/backend/.env` (or pull from Parameter Store via `aws ssm get-parameters --with-decryption`).

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | Optional | `5000` | Express listen port. Fronted by Nginx/ALB. |
| `NODE_ENV` | Yes | `development` | `development`, `production`, or `test`. Controls logging + error surfaces. |
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/carbon-intelligence` | Connection string to MongoDB/DocumentDB. |
| `FRONTEND_URL` | Yes | `http://localhost:3000` | Allowed CORS origin(s), comma-separated. |
| `JWT_SECRET` | Yes | `your-secret-key` | Secret used by auth routes + middleware. Rotate via Secrets Manager. |
| `LOG_LEVEL` | Optional | `info` | Winston logger level. |
| `MSG91_AUTH_KEY` | Optional | – | SMS provider auth key. Required for production SMS. |
| `MSG91_SENDER_ID` | Optional | – | Alphanumeric sender ID. |
| `MSG91_ROUTE` | Optional | `4` | MSG91 route (transactional=4). |
| `MSG91_API_BASE_URL` | Optional | `https://control.msg91.com/api` | Override for regional endpoints. |
| `MSG91_API_VERSION` | Optional | `v5` | API version. |
| `MSG91_UNICODE` | Optional | `0` | Set to `1` to send unicode SMS. |
| `MSG91_SHORT_URL` | Optional | `false` | Enable MSG91 link shortening. |
| `MSG91_COUNTRY_CODE` | Optional | `91` | Default country code for SMS recipients. |
| `MSG91_NOTIFICATIONS_ENABLED` | Optional | `true` | Master switch for MSME SMS notifications. |

### 5.4 Database Seeding (Optional but Helpful for Testing)
```bash
node src/scripts/seedBanks.js
node src/scripts/seedCarbonOffsets.js
node src/scripts/initializeAIAgents.js
```
These scripts assume `MONGODB_URI` points at a writable database.

### 5.5 Tests & Quality Gates
```bash
npm run lint
npm test
NODE_ENV=test MONGODB_URI="mongodb://localhost:27017/carbon_intelligence_test" npm test -- src/tests/carbonCredits.test.js
```

### 5.6 Process Manager & Reverse Proxy
```bash
pm2 start src/server.js --name carbon-backend --env production
pm2 save
pm2 startup systemd -u $USER --hp $HOME
```

Example Nginx block (proxying ALB -> instance):
```nginx
server {
    listen 80;
    server_name api.dev.carbon-intel.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.7 Logs & Monitoring
- Ship `/opt/carbon-intel/backend/logs/*.log` to CloudWatch using the CloudWatch Agent.
- Add alarms for 5xx response count, CPU utilization, and PM2 restarts.

---

## 6. React Web Application (`src/` at repo root)

### 6.1 Dependency Installation
```bash
cd /workspace
nvm use 20
npm ci
```

### 6.2 Environment Variables

Create `.env.production` and `.env.development` at repo root:

```
REACT_APP_API_URL=https://api.dev.carbon-intel.com/api
```

The React build can also read `NODE_ENV` automatically from the build command.

### 6.3 Build & Test
```bash
npm run lint
npm test -- --watch=false
npm run build      # outputs to /workspace/build
```

### 6.4 Deploy to AWS
1. **Upload build artifacts**
   ```bash
   aws s3 sync build/ s3://carbon-intel-web-dev --delete
   ```
2. **Invalidate CloudFront cache**
   ```bash
   aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
   ```
3. **Route53 record** – point `app.dev.carbon-intel.com` (CNAME) to the CloudFront distribution.

---

## 7. Web Hosting Stack (S3 + CloudFront)

1. Create an S3 bucket (`carbon-intel-web-<env>`) with **Block Public Access** disabled (only for static site hosting) or keep private and serve via CloudFront Origin Access Control (recommended).
2. Issue an ACM certificate in `us-east-1` for `app.<env>.carbon-intel.com`.
3. Create a CloudFront distribution:
   - Origin: the S3 bucket.
   - Behaviors: redirect HTTP → HTTPS, enable compression.
   - Default root object: `index.html`.
   - Error responses: 403/404 → `/index.html` (SPA routing).
4. Configure WAF (optional) to shield from common attacks.
5. Tie the distribution to Route53 and enable logging to `s3://carbon-intel-logs`.

---

## 8. Mobile Application (`mobile/`)

### 8.1 Install Build Dependencies

On a Linux build host (or macOS for iOS builds):
```bash
sudo apt-get update
sudo apt-get install -y git curl unzip openjdk-17-jdk watchman
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g expo-cli eas-cli
```

Android tooling:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

Install project dependencies:
```bash
cd /workspace/mobile
npm ci
```

### 8.2 Mobile Environment Variables

The mobile app reads its API endpoint from `mobile/src/services/apiService.ts`. To avoid hard-coding, expose the URL via Expo public env variables:

1. Create `mobile/app.config.js` (if it does not exist yet):
   ```javascript
   import 'dotenv/config';

   export default {
     expo: {
       name: "CarbonIntelligence",
       slug: "carbon-intelligence",
       version: "1.0.0",
       extra: {
         apiUrl: process.env.EXPO_PUBLIC_API_URL
       }
     }
   };
   ```
2. Update `mobile/src/services/apiService.ts`:
   ```ts
   import Constants from 'expo-constants';
   const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:5000/api';
   ```
3. Provide `.env` values (consumed by Expo at build time):
   ```
   EXPO_PUBLIC_API_URL=https://api.dev.carbon-intel.com/api
   ```

If you prefer not to change code, manually edit the `API_BASE_URL` constant before building the release.

### 8.3 Running Tests & Builds
```bash
# Jest/unit tests
cd /workspace/mobile
npm test -- --watch=false

# Local debug build (requires Android SDK + emulator/device)
npx expo run:android

# CI-friendly APK build
cd /workspace
ANDROID_HOME=/opt/android-sdk ./build-apk.sh
```

### 8.4 Distributing the App
1. Upload the generated APK/AAB to S3 (`carbon-intel-mobile-builds`).
2. (Optional) Use **EAS Build** with profiles that pull `EXPO_PUBLIC_API_URL` from Secrets Manager.
3. Share via AWS Device Farm or internal app store.

---

## 9. Test Suites & Verification Matrix

| Scope | Command | Notes |
| --- | --- | --- |
| Backend unit/integration | `cd backend && npm test` | Uses Jest + supertest; requires local MongoDB (`MONGODB_URI`) for integration specs. |
| Backend lint | `cd backend && npm run lint` | Enforces ESLint + prettier config. |
| Web unit tests | `npm test -- --watch=false` | Runs CRA/Jest tests defined under `src/__tests__`. |
| Web build verification | `npm run build` | Fails CI if TypeScript errors exist. |
| Mobile unit tests | `cd mobile && npm test -- --watch=false` | Uses Jest configuration in `mobile/jest.config.js`. |
| Mobile E2E (optional) | Use Detox/Appium (not yet scripted) | Plan future coverage. |

Automate these commands inside CodeBuild or GitHub Actions before each deployment.

---

## 10. Deployment Workflow (Developer Scope)

1. **Commit & Push**
   - Follow feature branch naming (`cursor/<feature>`). Push to GitHub.

2. **CI Build (CodeBuild / GitHub Actions)**
   - Backend stage:
     - `npm ci`
     - `npm test`
     - `npm run lint`
     - Package artifact (`backend.zip`) including `src`, `package.json`, `package-lock.json`.
   - Web stage:
     - `npm ci`
     - `npm run build`
     - Sync `build/` to artifact bucket.
   - Mobile stage (optional nightly):
     - `npm ci`
     - `npm test`
     - `./build-apk.sh`
     - Upload APK + checksum to S3.

3. **Deployment**
   - Backend: CodeDeploy/Ansible copies artifact to `/opt/carbon-intel/backend`, runs `npm ci --production`, restarts PM2.
   - Web: `aws s3 sync` + CloudFront invalidation.
   - Mobile: Publish APK/internal build notes.

4. **Post-Deployment**
   - Run smoke tests against `https://api.<env>.carbon-intel.com/health`.
   - Validate MongoDB connectivity + migration scripts.
   - Update runbooks and notify stakeholders.

---

## 11. Troubleshooting & Validation Tips

- **MongoDB connection failures** – verify `mongo --host <host> --username carbon_app` from backend host; ensure SG rules allow traffic on `27017`.
- **CORS errors** – confirm `FRONTEND_URL` includes the deployed CloudFront domain and PM2 restart picked up the new env file.
- **Mobile build failures** – check `ANDROID_HOME`, ensure Java 17 is active, and delete stale Gradle caches (`rm -rf ~/.gradle/caches`).
- **CloudFront stale assets** – always invalidate `/*` after uploading a new React build or enable versioned file names via the build pipeline.
- **Secrets drift** – rotate `JWT_SECRET` and MSG91 keys via Secrets Manager and redeploy the backend to pick up new values.

Following the steps above gives every developer a repeatable, AWS-aligned process to install dependencies, configure each application tier, provision MongoDB, run tests, and deploy the Carbon Intelligence platform with confidence.
