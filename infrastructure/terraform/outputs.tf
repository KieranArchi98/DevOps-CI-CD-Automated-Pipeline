output "namespaces" {
  value = {
    dev = kubernetes_namespace.dev.metadata[0].name
    prod = kubernetes_namespace.prod.metadata[0].name
  }
}

output "stable_services" {
  value = {
    backend = module.backend.service_name
    frontend = module.frontend.service_name
  }
}

output "canary_services" {
  value = {
    backend = module.canary.backend_service_name
    frontend = module.canary.frontend_service_name
  }
}
