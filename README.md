# marcos_personal

Personal website built with Hugo and deployed to AWS as a fully serverless static site:

- `Hugo` generates the site
- `S3` stores the generated files privately
- `CloudFront` serves the site globally
- `GitHub Actions` builds and deploys with `GitHub OIDC`, without long-lived AWS keys

## Repository Layout

```text
.
|-- .github/workflows/deploy.yml
|-- assets/
|-- content/
|-- infra/terraform/aws/
|-- layouts/
|-- static/
`-- hugo.toml
```

## Site Sections

The initial site includes:

- `/resume/` for your resume
- `/blog/` for posts

## Local Development

Prerequisite: install Hugo Extended locally.

```bash
hugo server -D
```

Build the production site:

```bash
hugo --minify
```

## AWS Infrastructure

Terraform lives under [infra/terraform/aws](/home/marcos/repos/marcos_personal/infra/terraform/aws).

It provisions:

- a private S3 bucket for site artifacts
- CloudFront with Origin Access Control
- a CloudFront Function to support Hugo clean URLs
- an IAM OIDC provider for GitHub Actions, unless you point Terraform at an existing one
- a least-privilege IAM role restricted to this repository and branch

### Security Model

The GitHub deploy role uses:

- `sts:AssumeRoleWithWebIdentity` via GitHub OIDC
- trust restricted to `repo:marcos07-uy/marcos_personal:ref:refs/heads/main`
- access restricted to one S3 bucket and one CloudFront distribution
- no static AWS access keys stored in GitHub

### Terraform Usage

```bash
cd infra/terraform/aws
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt
terraform validate
terraform plan
```

After `apply`, note these outputs:

- `site_bucket_name`
- `cloudfront_distribution_id`
- `cloudfront_domain_name`
- `github_actions_role_arn`

## GitHub Actions Setup

Set these GitHub repository variables:

- `AWS_REGION`
- `AWS_DEPLOY_ROLE_ARN`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`

The workflow in [.github/workflows/deploy.yml](/home/marcos/repos/marcos_personal/.github/workflows/deploy.yml) will:

1. build the site with Hugo
2. assume the AWS role through OIDC
3. sync `public/` to S3
4. invalidate CloudFront

## Custom Domain

The Terraform stack supports custom aliases if you provide:

- `domain_aliases`
- `acm_certificate_arn`

The ACM certificate for CloudFront must exist in `us-east-1`.
