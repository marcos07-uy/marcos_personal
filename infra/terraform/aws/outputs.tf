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

output "site_domain_name" {
  value       = var.domain_name
  description = "Custom domain attached to CloudFront."
}

output "route53_name_servers" {
  value       = var.domain_name == null ? [] : aws_route53_zone.site[0].name_servers
  description = "Authoritative name servers to configure at the domain registrar."
}

output "acm_certificate_arn" {
  value       = var.domain_name == null ? null : aws_acm_certificate.site[0].arn
  description = "ACM certificate used by CloudFront."
}

output "sudoku_progress_table_name" { value = aws_dynamodb_table.sudoku_progress.name }
output "sudoku_rewards_bucket_name" { value = aws_s3_bucket.sudoku_rewards.id }
