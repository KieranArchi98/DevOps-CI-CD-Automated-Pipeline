resource "kubernetes_secret" "dev" {
  metadata {
    name      = var.secret_name
    namespace = kubernetes_namespace.dev.metadata[0].name
  }

  type = "Opaque"

  data = {
    OPENAI_API_KEY = base64encode(var.openai_api_key)
    MONGO_URI      = base64encode(var.mongo_uri)
    MONGO_DB       = base64encode(var.mongo_db)
  }
}

resource "kubernetes_secret" "prod" {
  metadata {
    name      = var.secret_name
    namespace = kubernetes_namespace.prod.metadata[0].name
  }

  type = "Opaque"

  data = {
    OPENAI_API_KEY = base64encode(var.openai_api_key)
    MONGO_URI      = base64encode(var.mongo_uri)
    MONGO_DB       = base64encode(var.mongo_db)
  }
}
