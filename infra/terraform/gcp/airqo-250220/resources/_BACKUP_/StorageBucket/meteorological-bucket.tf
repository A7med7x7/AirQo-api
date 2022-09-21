resource "google_storage_bucket" "meteorological_bucket" {
  force_destroy            = false
  location                 = "US"
  name                     = "meteorological_bucket"
  project                  = "airqo-250220"
  storage_class            = "STANDARD"
}
# terraform import google_storage_bucket.meteorological_bucket meteorological_bucket
