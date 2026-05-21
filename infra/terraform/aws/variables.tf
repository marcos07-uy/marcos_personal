variable "aws_region" {
  description = "AWS region for the S3 bucket and IAM resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used in resource naming."
  type        = string
  default     = "marcos-personal"
}

variable "github_repository" {
  description = "GitHub repository in owner/name format."
  type        = string
  default     = "marcos07-uy/marcos_personal"
}

variable "github_branch" {
  description = "Git branch allowed to deploy."
  type        = string
  default     = "main"
}

variable "bucket_name_override" {
  description = "Optional explicit S3 bucket name. Leave null to derive one from project, account, and region."
  type        = string
  default     = null
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "force_destroy" {
  description = "Whether Terraform may delete a non-empty bucket during destroy."
  type        = bool
  default     = false
}

variable "domain_aliases" {
  description = "Optional custom domain aliases for CloudFront."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 for custom domains. Leave null to use the default CloudFront certificate."
  type        = string
  default     = null

  validation {
    condition     = length(var.domain_aliases) == 0 || var.acm_certificate_arn != null
    error_message = "acm_certificate_arn must be set when domain_aliases are provided."
  }
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub OIDC provider ARN. Leave null to create one in this stack."
  type        = string
  default     = null
}

variable "permissions_boundary_arn" {
  description = "Optional IAM permissions boundary for the GitHub deploy role."
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional tags applied to resources."
  type        = map(string)
  default     = {}
}
