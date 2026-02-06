variable "namespace" {
  type = string
}

variable "deployment_name" {
  type = string
  default = "llm-backend"
}

variable "service_name" {
  type = string
  default = "llm-backend"
}

variable "app_label" {
  type = string
  default = "llm-backend"
}

variable "version_label" {
  type = string
  default = "stable"
}

variable "image_name" {
  type = string
}

variable "image_tag" {
  type = string
}

variable "replicas" {
  type = number
  default = 2
}

variable "service_type" {
  type = string
  default = "ClusterIP"
}

variable "secret_name" {
  type = string
}

variable "redis_url" {
  type = string
  default = "redis://redis:6379/0"
}

variable "log_level" {
  type = string
  default = "INFO"
}
