resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "llm-frontend-canary"
    namespace = var.namespace
    labels = {
      app     = "llm-frontend"
      version = "canary"
    }
  }

  spec {
    replicas = var.frontend_replicas

    strategy {
      type = "RollingUpdate"
      rolling_update {
        max_surge       = 1
        max_unavailable = 1
      }
    }

    selector {
      match_labels = {
        app     = "llm-frontend"
        version = "canary"
      }
    }

    template {
      metadata {
        labels = {
          app     = "llm-frontend"
          version = "canary"
        }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port" = "80"
          "prometheus.io/path" = "/metrics"
        }
      }

      spec {
        termination_grace_period_seconds = 30

        container {
          name = "llm-frontend"
          image = "${var.frontend_image_name}:${var.frontend_image_tag}"
          image_pull_policy = "IfNotPresent"

          port {
            container_port = 80
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = 80
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = 80
            }
            initial_delay_seconds = 5
            period_seconds        = 5
            timeout_seconds       = 3
            failure_threshold     = 3
          }

          lifecycle {
            pre_stop {
              exec {
                command = ["/bin/sh", "-c", "sleep 5"]
              }
            }
          }

          resources {
            requests = {
              memory = "64Mi"
              cpu    = "50m"
            }
            limits = {
              memory = "256Mi"
              cpu    = "200m"
            }
          }

          env {
            name  = "NODE_ENV"
            value = "production"
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "llm-frontend-canary-svc"
    namespace = var.namespace
  }

  spec {
    selector = {
      app     = "llm-frontend"
      version = "canary"
    }

    port {
      protocol    = "TCP"
      port        = var.frontend_service_port
      target_port = var.frontend_target_port
    }

    type = "ClusterIP"
  }
}

output "frontend_service_name" {
  value = kubernetes_service.frontend.metadata[0].name
}
