from locust import HttpUser, task, between

class WebsiteUser(HttpUser):
    wait_time = between(1, 5)

    @task(3)
    def view_health(self):
        self.client.get("/health")

    @task(1)
    def trigger_analysis(self):
        # Simulate triggering the new async task
        # Note: In a real scenario, we might need auth headers here
        self.client.post("/api/analyze", params={"text": "simulating heavy load on the system"})

    @task(5)
    def view_frontend(self):
        # Hitting frontend Nginx proxy or frontend service directly
        self.client.get("/")
