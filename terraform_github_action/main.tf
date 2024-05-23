terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "ap-northeast-2"
}

data "aws_s3_bucket" "s3_bucket" {
  bucket = "tf-files-for-nginx-expressjs-project"
}

resource "aws_s3_bucket_website_configuration" "website_config" {
  bucket = data.aws_s3_bucket.s3_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }

}

data "aws_iam_policy_document" "policy_document" {
  statement {
    sid = "PublicReadGetObject"

    actions = [
      "s3:GetObject"
    ]

    resources = [
      "arn:aws:s3:::tf-files-for-nginx-expressjs-project/*"
    ]

    principals {
      type = "AWS"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "attach_policy_to_s3" {
  bucket = data.aws_s3_bucket.s3_bucket.id
  policy = data.aws_iam_policy_document.policy_document.json
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  bucket = data.aws_s3_bucket.s3_bucket.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}



locals {
  s3_origin_id = "S3Origin"
}

locals {
  ALB_origin_id = "ALBOrigin"
}

variable "lb_arn" {
  type    = string
  default = "arn:aws:elasticloadbalancing:ap-northeast-2:533267359186:loadbalancer/app/expressjsLB/8f25a781c4a32738"
}

variable "lb_name" {
  type    = string
  default = "expressjsLB"
}

data "aws_lb" "api_alb" {
  arn  = var.lb_arn
  name = var.lb_name
}

resource "aws_cloudfront_distribution" "s3_expressjs_distribution" {
  origin {
    domain_name              = data.aws_s3_bucket.s3_bucket.bucket_domain_name
    origin_id                = local.s3_origin_id
  }

  origin {
    domain_name              = data.aws_lb.api_alb.dns_name
    origin_id                = local.ALB_origin_id
    custom_origin_config {
      http_port = 80
      https_port =  443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols = ["SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "terraform implementation of s3 and cloudfront part of nginx_expressjs project using Github Action"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["HEAD", "GET"]
    cached_methods   = ["HEAD", "GET"]
    target_origin_id = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Cache behavior with precedence 0
  
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    cached_methods   = ["HEAD", "GET"]
    target_origin_id = local.ALB_origin_id
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]

      cookies {
        forward = "all"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
  }

  price_class = "PriceClass_200"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US", "JP", "KR"]
    }
  }

  tags = {
    Environment = "production"
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}