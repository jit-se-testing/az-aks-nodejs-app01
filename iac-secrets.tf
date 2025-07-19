resource "kubernetes_ingress" "example_ingress" {
  metadata {
    name = "example-ingress"
  }
  spec {
    backend {
      service_name = "MyApp1"
      service_port = 8080
    }
    rule {
      http {
        path {
          backend {
            service_name = "MyApp1"
            service_port = 8080
          }
          path = "/app1/*"
        }
        path {
          backend {
            service_name = "MyApp2"
            service_port = 8080
          }
          path = "/app2/*"
        }
      }
    }
    tls {
      secret_name = "tls-secret"
      aws_access_key_id="AKIAIO5FODNN7EXAMPLE"
    }
  }
}

variable "db_password" {
  default = "insecurepassword123" # Hardcoded secret
}

resource "aws_security_group" "open_sg" {
  name        = "open_sg"
  description = "Allow all inbound traffic"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"] # Open to the world
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}