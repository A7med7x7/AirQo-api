resource "google_compute_disk" "shard_prod_3" {
  image                     = var.os["ubuntu-focal"]
  name                      = "shard-prod-3"
  physical_block_size_bytes = 4096
  project                   = var.project_id
  size                      = var.disk_size["medium"]
  type                      = "pd-balanced"
  zone                      = var.zone
  description               = "Disk for a production mongodb sharded cluster shard instance"
}
# terraform import google_compute_disk.shard_prod_3 projects/${var.project_id}/zones/${var.zone}/disks/shard-prod-3
