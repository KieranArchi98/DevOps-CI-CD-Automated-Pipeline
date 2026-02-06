variable "kubeconfig_path" {
  type        = string
  description = "Path to the local kubeconfig file"
  default     = "~/.kube/config"
}

variable "namespace_dev" {
  type        = string
  description = "Kubernetes namespace for canary/dev"
  default     = "llm-dev"
}

variable "namespace_prod" {
  type        = string
  description = "Kubernetes namespace for stable/prod"
  default     = "llm-prod"
}

variable "secret_name" {
  type        = string
  description = "Name of the Kubernetes secret containing app credentials"
  default     = "app-secrets"
}

variable "openai_api_key" {
  type        = string
  description = "OpenAI API key"
  sensitive   = true
}

variable "mongo_uri" {
  type        = string
  description = "MongoDB connection string"
  sensitive   = true
}

variable "mongo_db" {
  type        = string
  description = "MongoDB database name"
  sensitive   = true
}

variable "backend_image_name" {
  type        = string
  description = "Backend image name"
  default     = "genesis-backend"
}

variable "frontend_image_name" {
  type        = string
  description = "Frontend image name"
  default     = "genesis-frontend"
}

variable "backend_image_tag_stable" {
  type        = string
  description = "Backend stable tag"
  default     = "stable"
}

variable "frontend_image_tag_stable" {
  type        = string
  description = "Frontend stable tag"
  default     = "stable"
}

variable "backend_image_tag_canary" {
  type        = string
  description = "Backend canary tag"
  default     = "canary"
}

variable "frontend_image_tag_canary" {
  type        = string
  description = "Frontend canary tag"
  default     = "canary"
}

variable "backend_replicas" {
  type        = number
  description = "Stable backend replica count"
  default     = 2
}

variable "frontend_replicas" {
  type        = number
  description = "Stable frontend replica count"
  default     = 2
}

variable "backend_canary_replicas" {
  type        = number
  description = "Canary backend replica count"
  default     = 1
}

variable "frontend_canary_replicas" {
  type        = number
  description = "Canary frontend replica count"
  default     = 1
}

variable "backend_service_type" {
  type        = string
  description = "Stable backend service type"
  default     = "ClusterIP"
}

variable "frontend_service_type" {
  type        = string
  description = "Stable frontend service type"
  default     = "LoadBalancer"
}

variable "redis_url" {
  type        = string
  description = "Redis connection URL"
  default     = "redis://redis:6379/0"
}

variable "backend_log_level" {
  type        = string
  description = "Backend log level"
  default     = "INFO"
}
