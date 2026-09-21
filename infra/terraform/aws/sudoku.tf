data "archive_file" "sudoku_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/lambda"
  output_path = "${path.module}/.build/sudoku-api.zip"
}

resource "aws_dynamodb_table" "sudoku_progress" {
  name         = "${var.project_name}-sudoku-progress"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "puzzleId"
  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "puzzleId"
    type = "S"
  }
  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_s3_bucket" "sudoku_rewards" {
  bucket = "${local.site_bucket_name}-sudoku-rewards"
}
resource "aws_s3_bucket_public_access_block" "sudoku_rewards" {
  bucket                  = aws_s3_bucket.sudoku_rewards.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "sudoku_rewards" {
  bucket = aws_s3_bucket.sudoku_rewards.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
resource "aws_s3_bucket_versioning" "sudoku_rewards" {
  bucket = aws_s3_bucket.sudoku_rewards.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_iam_role" "sudoku_lambda" {
  name               = "${var.project_name}-sudoku-api"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole" }] })
}
resource "aws_iam_role_policy" "sudoku_lambda" {
  name = "runtime"
  role = aws_iam_role.sudoku_lambda.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"], Resource = "arn:aws:logs:*:*:*" },
    { Effect = "Allow", Action = ["dynamodb:GetItem", "dynamodb:PutItem"], Resource = aws_dynamodb_table.sudoku_progress.arn },
    { Effect = "Allow", Action = ["s3:GetObject"], Resource = "${aws_s3_bucket.sudoku_rewards.arn}/*" }
  ] })
}
resource "aws_lambda_function" "sudoku" {
  function_name    = "${var.project_name}-sudoku-api"
  role             = aws_iam_role.sudoku_lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  timeout          = 10
  memory_size      = 256
  filename         = data.archive_file.sudoku_lambda.output_path
  source_code_hash = data.archive_file.sudoku_lambda.output_base64sha256
  environment { variables = { PROGRESS_TABLE = aws_dynamodb_table.sudoku_progress.name, REWARDS_BUCKET = aws_s3_bucket.sudoku_rewards.bucket, ACCESS_CODE = var.sudoku_access_code, DEVELOPER_ACCESS_CODE = coalesce(var.sudoku_developer_access_code, ""), SESSION_SECRET = var.sudoku_session_secret, UNLOCK_TIMEZONE = var.sudoku_timezone, ALLOWED_ORIGIN = var.domain_name == null ? "*" : "https://${var.domain_name}" } }
}
resource "aws_apigatewayv2_api" "sudoku" {
  name          = "${var.project_name}-sudoku"
  protocol_type = "HTTP"
}
resource "aws_apigatewayv2_integration" "sudoku" {
  api_id                 = aws_apigatewayv2_api.sudoku.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.sudoku.invoke_arn
  payload_format_version = "2.0"
}
resource "aws_apigatewayv2_route" "sudoku" {
  api_id    = aws_apigatewayv2_api.sudoku.id
  route_key = "ANY /api/sudoku/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.sudoku.id}"
}
resource "aws_apigatewayv2_route" "sudoku_root" {
  api_id    = aws_apigatewayv2_api.sudoku.id
  route_key = "ANY /api/sudoku"
  target    = "integrations/${aws_apigatewayv2_integration.sudoku.id}"
}
resource "aws_apigatewayv2_stage" "sudoku" {
  api_id      = aws_apigatewayv2_api.sudoku.id
  name        = "$default"
  auto_deploy = true
}
resource "aws_lambda_permission" "sudoku" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sudoku.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.sudoku.execution_arn}/*/*"
}
