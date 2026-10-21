# AWS S3 + CloudFront Deployment Guide

This project is configured for automated deployment to **Amazon S3** and **AWS CloudFront** using Infrastructure as Code and GitHub Actions.

---

## 1. Quick One-Time AWS Setup (CloudFormation)

You can provision the entire AWS infrastructure (S3 Bucket, Origin Access Control, CloudFront distribution with HTTPS, and the Next.js static routing URL rewrite function) using the provided CloudFormation template:

### Option A: Using AWS CLI
```bash
aws cloudformation deploy \
  --template-file aws/template.yaml \
  --stack-name coderef-web-production \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides ProjectName=coderef-web S3BucketName=your-bucket-name
```

### Option B: Using AWS Management Console
1. Open the [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation/).
2. Click **Create stack** -> **With new resources (standard)** (or select existing stack and click **Update**).
3. Choose **Upload a template file** and select `aws/template.yaml`.
4. Enter Stack name `coderef-web-production` and enter your desired **`S3BucketName`**.
5. Click Next through to **Submit**.
5. Once created (takes ~3 minutes), look at the **Outputs** tab:
   - `S3BucketName`: The target S3 bucket name.
   - `CloudFrontDistributionId`: The CloudFront distribution ID.
   - `CloudFrontDomainName`: Your CloudFront distribution URL (e.g. `d123456abcdef.cloudfront.net`).

---

## 2. GitHub Actions Automation (Continuous Deployment)

The workflow file [`.github/workflows/deploy-aws.yml`](../.github/workflows/deploy-aws.yml) deploys automatically on every `git push` to `master`.

### Required GitHub Secrets
In your GitHub repository, navigate to **Settings** -> **Secrets and variables** -> **Actions** and add:

| Secret Name | Value | Description |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | IAM user access key with S3 and CloudFront permissions |
| `AWS_SECRET_ACCESS_KEY` | `wJalrX...` | IAM user secret access key |
| `AWS_REGION` | `us-east-1` (or your preferred region) | AWS Region where the S3 bucket is hosted |
| `AWS_S3_BUCKET` | Output from CloudFormation (`S3BucketName`) | Target S3 bucket |
| `AWS_CLOUDFRONT_DISTRIBUTION_ID` | Output from CloudFormation (`CloudFrontDistributionId`) | For automatic cache invalidation |

---

## 3. Local Deployment (Alternative)

If you have the AWS CLI configured on your local machine, you can deploy with:

```bash
# Set your environment variables (or pass as parameters)
$env:AWS_S3_BUCKET = "your-s3-bucket-name"
$env:AWS_CLOUDFRONT_DISTRIBUTION_ID = "your-distribution-id"

# Run deployment
npm run deploy:aws
```

---

## 4. Custom Domain Setup (Optional)

To point `coderef.xyz` or `www.coderef.xyz` to your CloudFront distribution:
1. In [AWS Certificate Manager (ACM)](https://console.aws.amazon.com/acm/) in the **`us-east-1`** region, request a free SSL certificate for `coderef.xyz` and `*.coderef.xyz`.
2. Edit the CloudFront Distribution:
   - Add Alternate Domain Names (CNAMEs): `coderef.xyz`, `www.coderef.xyz`.
   - Select the ACM SSL certificate.
3. In your DNS provider (Route 53 or Cloudflare), create CNAME/Alias records pointing to the `CloudFrontDomainName`.
