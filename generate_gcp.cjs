const fs = require('fs');
const path = require('path');

const files = {
  'Dockerfile': `
# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
# Copy custom Nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built static assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
`,

  'nginx.conf': `
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression for faster asset delivery
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA Routing: Fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \\.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
        expires 6M;
        access_log off;
        add_header Cache-Control "public";
    }
}
`,

  'cloudbuild.yaml': `
steps:
  # Step 1: Build the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/smart-warehouse', '.']
    
  # Step 2: Push the image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/smart-warehouse']
    
  # Step 3: Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'smart-warehouse'
      - '--image'
      - 'gcr.io/$PROJECT_ID/smart-warehouse'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--port'
      - '8080'

images:
  - 'gcr.io/$PROJECT_ID/smart-warehouse'
`,

  'deploy.md': `
# Google Cloud Deployment Guide

To deploy the **Smart Warehouse** application to Google Cloud Run, follow these instructions. 

## Prerequisites
1. Ensure you have the [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed.
2. Authenticate and set your project:
   \`\`\`bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   \`\`\`
3. Enable required APIs:
   \`\`\`bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com
   \`\`\`

## Option 1: Direct Deployment (Source to Cloud Run)
Google Cloud Run can automatically build the \`Dockerfile\` and deploy it in a single command using Cloud Build under the hood:

\`\`\`bash
gcloud run deploy smart-warehouse \\
  --source . \\
  --region us-central1 \\
  --allow-unauthenticated \\
  --port 8080
\`\`\`

## Option 2: CI/CD Pipeline (Cloud Build)
If you prefer a structured pipeline, you can trigger the included \`cloudbuild.yaml\` file. This builds the Docker image, pushes it to GCR, and deploys it to Cloud Run.

\`\`\`bash
gcloud builds submit --config cloudbuild.yaml .
\`\`\`

Once deployment is complete, Google Cloud will provide a public \`https://*.run.app\` URL where your Smart Warehouse application is hosted!
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\\n');
}
console.log('GCP Infrastructure files generated successfully.');
