resource "kubernetes_deployment" "this" {
  metadata {
    name      = var.deployment_name
    namespace = var.namespace
    labels = {
      app     = var.app_label
      version = var.version_label
    }
  }

  spec {
    replicas = var.replicas

    strategy {
      type = "RollingUpdate"
      rolling_update {
        max_surge       = 1
        max_unavailable = 1
      }
    }

    selector {
      match_labels = {
        app     = var.app_label
        version = var.version_label
      }
    }

    template {
      metadata {
        labels = {
          app     = var.app_label
          version = var.version_label
        }
        annotations = {
          "prometheus.io/scrape" = "true"
          "prometheus.io/port"   = "8000"
          "prometheus.io/path"   = "/metrics"
        }
      }

      spec {
        termination_grace_period_seconds = 30

        container {
          name = var.app_label
          image             = "${var.image_name}:${var.image_tag}"
          image_pull_policy = "IfNotPresent"

          port {
            container_port = 8000
          }

          liveness_probe {
            http_get {
              path = "/health"
              port = 8000
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            timeout_seconds       = 5
            failure_threshold     = 3
          }

          readiness_probe {
            http_get {
              path = "/ready"
              port = 8000
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
              memory = "128Mi"
              cpu    = "100m"
            }
            limits = {
              memory = "512Mi"
              cpu    = "500m"
            }
          }

          env {
            name = "OPENAI_API_KEY"
            value_from {
              secret_key_ref {
                name = var.secret_name
                key  = "OPENAI_API_KEY"
              }
            }
          }

          env {
            name = "MONGO_URI"
            value_from {
              secret_key_ref {
                name = var.secret_name
                key  = "MONGO_URI"
              }
            }
          }

          env {
            name = "MONGO_DB"
            value_from {
              secret_key_ref {
                name = var.secret_name
                key  = "MONGO_DB"
              }
            }
          }

          env {
            name  = "REDIS_URL"
            value = var.redis_url
          }

          env {
            name  = "LOG_LEVEL"
            value = var.log_level
          }
        }
      }
    }
  }
}
