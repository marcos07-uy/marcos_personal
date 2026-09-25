locals {
  resend_dns_records = {
    dkim = {
      name    = "resend._domainkey"
      type    = "TXT"
      records = ["p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbu5chYi7IojPFQDoliMXnfKE7nMllJ7BjlgNGJFSiyr0gwkGVfD80u3X2lMIFR058ZO7vndK0fVI1qau2JsqKR/j3SGKZMf+xL+9JSkFz1QvxqFUzi0ewcQcyjCYFpdmqG6GMXKn+YW+fnKjgtyo8ChZMRW6GOxW7m/YkWC76aQIDAQAB"]
    }
    return_path = {
      name    = "rsend"
      type    = "CNAME"
      records = ["rsend-sae1.forge.rmta.net"]
    }
    sending = {
      name    = "send"
      type    = "CNAME"
      records = ["send.forge.rmta.net"]
    }
  }
}

resource "aws_route53_record" "resend" {
  for_each = var.domain_name == null ? {} : local.resend_dns_records

  zone_id = aws_route53_zone.site[0].zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = each.value.records
}
