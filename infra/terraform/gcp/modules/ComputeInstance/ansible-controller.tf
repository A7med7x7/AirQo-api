resource "google_compute_instance" "ansible_controller" {
  boot_disk {
    auto_delete = true
    source = "ansible-controller"
  }

  machine_type = "e2-small"

  metadata = {
    startup-script = "sudo ufw allow ssh"
  }

  name = "ansible-controller"

  network_interface {
    access_config {
      network_tier = "PREMIUM"
    }

    network            = "default"
  }

  project = var.project-id

  reservation_affinity {
    type = "ANY_RESERVATION"
  }

  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
    provisioning_model  = "STANDARD"
  }

  service_account {
    email  = "${var.project-number}-compute@developer.gserviceaccount.com"
    scopes = ["https://www.googleapis.com/auth/devstorage.read_only", "https://www.googleapis.com/auth/logging.write", "https://www.googleapis.com/auth/monitoring.write", "https://www.googleapis.com/auth/service.management.readonly", "https://www.googleapis.com/auth/servicecontrol", "https://www.googleapis.com/auth/trace.append"]
  }

  tags = ["http-server", "https-server"]
  zone = var.zone
}
# terraform import google_compute_instance.ansible_controller projects/${var.project-id}/zones/us-central1-a/instances/ansible-controller
