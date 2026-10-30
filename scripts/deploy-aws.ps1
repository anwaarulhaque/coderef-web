<#
.SYNOPSIS
  Builds and deploys CodeRef to AWS S3 and invalidates CloudFront cache.

.DESCRIPTION
  Requires AWS CLI to be installed and configured (`aws configure`), or environment
  variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION to be set.

.PARAMETER Bucket
  The target S3 bucket name (or set $env:AWS_S3_BUCKET).

.PARAMETER DistributionId
  The CloudFront Distribution ID (or set $env:AWS_CLOUDFRONT_DISTRIBUTION_ID).
#>

param(
  [string]$Bucket = $env:AWS_S3_BUCKET,
  [string]$DistributionId = $env:AWS_CLOUDFRONT_DISTRIBUTION_ID,
  [string]$Region = $(if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" })
)

$ErrorActionPreference = "Stop"

if (-not $Bucket) {
  Write-Error "Please specify -Bucket or set the AWS_S3_BUCKET environment variable."
}

Write-Host "==> 1. Building Next.js static export..." -ForegroundColor Cyan
npm run build

if (-not (Test-Path "out")) {
  Write-Error "Build output directory 'out' was not found."
}

Write-Host "==> 2. Syncing hashed static assets (_next/static) with 1-year immutable cache..." -ForegroundColor Cyan
if (Test-Path "out\_next\static") {
  aws s3 sync "out\_next\static" "s3://$Bucket/_next/static" `
    --cache-control "public, max-age=31536000, immutable" `
    --region $Region
}

Write-Host "==> 3. Syncing remaining files (HTML, XML, JSON) with short cache..." -ForegroundColor Cyan
aws s3 sync "out" "s3://$Bucket" `
  --delete `
  --cache-control "public, max-age=0, must-revalidate" `
  --region $Region

if ($DistributionId) {
  Write-Host "==> 4. Invalidating CloudFront cache for distribution $DistributionId..." -ForegroundColor Cyan
  aws cloudfront create-invalidation `
    --distribution-id $DistributionId `
    --paths "/*"
  Write-Host "==> Deployment and cache invalidation completed successfully!" -ForegroundColor Green
} else {
  Write-Host "==> Deployment to S3 completed (CloudFront invalidation skipped: no Distribution ID provided)." -ForegroundColor Yellow
}
