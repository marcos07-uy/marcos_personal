resource "aws_sesv2_email_identity" "sudoku_notifications" {
  email_identity = var.sudoku_notification_email
}

locals {
  sudoku_unlock_notifications = {
    "01" = "cron(0 3 30 9 ? 2026)"
    "02" = "cron(0 3 2 10 ? 2026)"
    "03" = "cron(0 3 5 10 ? 2026)"
    "04" = "cron(0 3 7 10 ? 2026)"
    "05" = "cron(0 3 10 10 ? 2026)"
    "06" = "cron(0 3 16 10 ? 2026)"
  }
}

resource "aws_cloudwatch_event_rule" "sudoku_unlock_notification" {
  for_each            = local.sudoku_unlock_notifications
  name                = "${var.project_name}-sudoku-unlock-${each.key}"
  description         = "Send the Sudoku ${each.key} unlock notification."
  schedule_expression = each.value
}

resource "aws_cloudwatch_event_target" "sudoku_unlock_notification" {
  for_each  = local.sudoku_unlock_notifications
  rule      = aws_cloudwatch_event_rule.sudoku_unlock_notification[each.key].name
  target_id = "sudoku-${each.key}"
  arn       = aws_lambda_function.sudoku.arn
  input     = jsonencode({ type = "sudoku-unlock-notification", puzzleId = each.key })
}

resource "aws_lambda_permission" "sudoku_unlock_notification" {
  for_each      = local.sudoku_unlock_notifications
  statement_id  = "AllowEventBridgeUnlock${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sudoku.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.sudoku_unlock_notification[each.key].arn
}
