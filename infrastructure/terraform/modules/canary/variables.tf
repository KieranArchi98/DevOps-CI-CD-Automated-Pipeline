variable "namespace" {
  type = string
}

variable "backend_image_name" {
  type = string
}

variable "backend_image_tag" {
  type = string
}

variable "frontend_image_name" {
  type = string
}

variable "frontend_image_tag" {
  type = string
}

variable "backend_replicas" {
  type = number
  default = 1
}

variable "frontend_replicas" {
  type = number
  default = 1
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

variable "backend_service_port" {
  type = number
  default = 8000
}

variable "frontend_service_port" {
  type = number
  default = 80
}

variable "frontend_target_port" {
  type = number
  default = 80
}
