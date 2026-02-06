resource "kubernetes_service" "this" {
  metadata {
    name = var.service_name
    namespace = var.namespace
  }

  spec {
    selector = {
      app = var.app_label
      version = var.version_label
    }

    port {
      protocol = "TCP"
      port = 8000
      target_port = 8000
    }

    type = var.service_type
  }
}

output "service_name" {
  value = kubernetes_service.this.metadata[0].name
}
