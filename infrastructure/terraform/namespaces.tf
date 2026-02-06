resource "kubernetes_namespace" "dev" {
  metadata {
    name = var.namespace_dev
  }
}

resource "kubernetes_namespace" "prod" {
  metadata {
    name = var.namespace_prod
  }
}
