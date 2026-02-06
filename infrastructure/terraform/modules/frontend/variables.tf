variable "namespace" {
  type = string
}

variable "deployment_name" {
  type    = string
  default = "llm-frontend"
}

variable "service_name" {
  type    = string
  default = "llm-frontend"
}

variable "app_label" {
  type    = string
  default = "llm-frontend"
}

variable "version_label" {
  type    = string
  default = "stable"
}

variable "image_name" {
  type = string
}

variable "image_tag" {
  type = string
}

variable "replicas" {
  type    = number
  default = 2
}

variable "service_type" {
  type    = string
  default = "LoadBalancer"
}

variable "service_port" {
  type    = number
  default = 3000
}

variable "target_port" {
  type    = number
  default = 80
}
