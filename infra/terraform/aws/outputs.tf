output "site_bucket_name" {
  value       = aws_s3_bucket.site.id
  description = "Private S3 bucket that stores the generated site."
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.site.id
  description = "CloudFront distribution ID for cache invalidations."
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.site.domain_name
  description = "Default CloudFront domain name."
}

output "github_actions_role_arn" {
  value       = aws_iam_role.github_actions_deploy.arn
  description = "IAM role assumed by GitHub Actions through OIDC."
}
