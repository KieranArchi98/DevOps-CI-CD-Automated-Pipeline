resource "kubernetes_service" "this" {
  metadata {
    name      = var.service_name
    namespace = var.namespace
  }

  spec {
    selector = {
      app     = var.app_label
      version = var.version_label
    }

    port {
      protocol    = "TCP"
      port        = var.service_port
      target_port = var.target_port
    }

    type = var.service_type
  }
}

output "service_name" {
  value = kubernetes_service.this.metadata[0].name
}
