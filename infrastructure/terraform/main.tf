module "backend" {
  source = "./modules/backend"

  namespace = kubernetes_namespace.prod.metadata[0].name
  image_name = var.backend_image_name
  image_tag = var.backend_image_tag_stable
  replicas = var.backend_replicas
  service_type = var.backend_service_type
  secret_name = var.secret_name
  redis_url = var.redis_url
  log_level = var.backend_log_level
  app_label = "llm-backend"
  deployment_name = "llm-backend"
  service_name = "llm-backend"
  version_label = "stable"

  depends_on = [kubernetes_secret.prod]
}

module "frontend" {
  source = "./modules/frontend"

  namespace = kubernetes_namespace.prod.metadata[0].name
  image_name = var.frontend_image_name
  image_tag = var.frontend_image_tag_stable
  replicas = var.frontend_replicas
  service_type = var.frontend_service_type
  app_label = "llm-frontend"
  deployment_name = "llm-frontend"
  service_name = "llm-frontend"
  version_label = "stable"
  service_port = 3000
  target_port = 80

  depends_on = [kubernetes_secret.prod]
}

module "canary" {
  source = "./modules/canary"

  namespace = kubernetes_namespace.dev.metadata[0].name
  backend_image_name = var.backend_image_name
  backend_image_tag = var.backend_image_tag_canary
  frontend_image_name = var.frontend_image_name
  frontend_image_tag = var.frontend_image_tag_canary
  backend_replicas = var.backend_canary_replicas
  frontend_replicas = var.frontend_canary_replicas
  secret_name = var.secret_name
  redis_url = var.redis_url
  log_level = var.backend_log_level
  backend_service_port = 8000
  frontend_service_port = 80
  frontend_target_port = 80

  depends_on = [kubernetes_secret.dev]
}
