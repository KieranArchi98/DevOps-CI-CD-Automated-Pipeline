resource "kubernetes_secret" "dev" {
  metadata {
    name = var.secret_name
    namespace = kubernetes_namespace.dev.metadata[0].name
  }

  type = "Opaque"

  string_data = {
    OPENAI_API_KEY = var.openai_api_key
    MONGO_URI = var.mongo_uri
    MONGO_DB = var.mongo_db
  }
}

resource "kubernetes_secret" "prod" {
  metadata {
    name = var.secret_name
    namespace = kubernetes_namespace.prod.metadata[0].name
  }

  type = "Opaque"

  string_data = {
    OPENAI_API_KEY = var.openai_api_key
    MONGO_URI = var.mongo_uri
    MONGO_DB = var.mongo_db
  }
}
