# Google Cloud Deployment Guide

To deploy the **Smart Warehouse** application to Google Cloud Run, follow these instructions. 

## Prerequisites
1. Ensure you have the [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed.
2. Authenticate and set your project:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. Enable required APIs:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com
   ```

## Option 1: Direct Deployment (Source to Cloud Run)
Google Cloud Run can automatically build the `Dockerfile` and deploy it in a single command using Cloud Build under the hood:

```bash
gcloud run deploy smart-warehouse \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

## Option 2: CI/CD Pipeline (Cloud Build)
If you prefer a structured pipeline, you can trigger the included `cloudbuild.yaml` file. This builds the Docker image, pushes it to GCR, and deploys it to Cloud Run.

```bash
gcloud builds submit --config cloudbuild.yaml .
```

Once deployment is complete, Google Cloud will provide a public `https://*.run.app` URL where your Smart Warehouse application is hosted!\n