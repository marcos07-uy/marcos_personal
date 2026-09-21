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

variable "domain_name" {
  description = "Public domain managed by Route 53 and attached to CloudFront. Set null to use only the default CloudFront domain."
  type        = string
  default     = null
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

variable "sudoku_access_code" {
  description = "Private shared access code for Claudia's Sudoku."
  type        = string
  sensitive   = true
}
variable "sudoku_developer_access_code" {
  description = "Optional private code that unlocks all Sudoku puzzles for the developer, using a separate progress profile."
  type        = string
  sensitive   = true
  default     = null
}
variable "sudoku_session_secret" {
  description = "Long random secret used to sign Sudoku sessions."
  type        = string
  sensitive   = true
}
variable "sudoku_timezone" {
  description = "IANA timezone used for authoritative unlock dates."
  type        = string
  default     = "America/Montevideo"
}
