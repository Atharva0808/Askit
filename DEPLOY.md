# 🚀 Deploying Askit with Docker & AWS

This project is now configured for high-performance Dockerized deployment using `output: "standalone"`.

## 📦 How to build Docker Image

```bash
docker build -t askit-app .
```

### 🚢 Run Locally via Docker

```bash
docker-compose up
```

---

## ☁️ Deploying to AWS (Recommended: App Runner)

AWS App Runner is the easiest way to deploy a Dockerized Next.js app with zero infrastructure management.

### Step 1: Push Image to AWS ECR (Elastic Container Registry)

1. Create a repository in **ECR Console** named `askit`.
2. Authenticate your local Docker to AWS:
   ```bash
   aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
   ```
3. Tag and push your image:
   ```bash
   docker tag askit-app:latest your-account-id.dkr.ecr.your-region.amazonaws.com/askit:latest
   docker push your-account-id.dkr.ecr.your-region.amazonaws.com/askit:latest
   ```

### Step 2: Create AWS App Runner Service

1. Go to **AWS App Runner** in the AWS Console.
2. Select **Container Registry** -> **ECR**.
3. Point to your `askit:latest` image.
4. Set the **Service Settings**:
   *   **Port:** `3000`
   *   **Runtime Environment Variables:** Use your values from `.env.local` (e.g., `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc.).
5. Click **Create Service**. AWS will automatically provide a public URL!

---

## 🛠️ Performance Tuning (Advanced: ECS + Fargate)

If you need a more granular control over your clusters:
1. Use **Elastic Container Service (ECS)** with a **Fargate** launch type.
2. Set up an **Application Load Balancer (ALB)** to handle your traffic and SSL certificates.

---

## 💡 Important: After Deployment

Once you have your AWS Public URL (e.g., `https://xyz.aws-region.awsapprunner.com`):
*   **Supabase Dashboard:** Add this URL to your **Site URL** and **Additional Redirect URLs**.
*   **Google Cloud Console:** Add this URL to your **Authorised JavaScript origins**.
