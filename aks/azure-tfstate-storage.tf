resource "azurerm_resource_group" "tfstate" {
  name     = "tfstate-rg"
  location = "westeurope"
}

resource "azurerm_storage_account" "tfstate" {
  name                     = "tfstatestorage${random_integer.suffix.result}"
  resource_group_name      = azurerm_resource_group.tfstate.name
  location                 = azurerm_resource_group.tfstate.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  allow_blob_public_access = false
}

resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.tfstate.name
  container_access_type = "private"
}

resource "random_integer" "suffix" {
  min = 10000
  max = 99999
}

output "tfstate_storage_account_name" {
  value = azurerm_storage_account.tfstate.name
}

output "tfstate_container_name" {
  value = azurerm_storage_container.tfstate.name
}

output "tfstate_resource_group_name" {
  value = azurerm_resource_group.tfstate.name
} 