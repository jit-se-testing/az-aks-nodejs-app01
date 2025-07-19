terraform {
  backend "azurerm" {
    resource_group_name  = "your-tfstate-rg"
    storage_account_name = "yourtfstateacct"
    container_name       = "tfstate"
    key                  = "aks-public.terraform.tfstate"
  }
}

variable "tfstate_resource_group_name" {
  description = "Resource group for the remote state storage account"
  type        = string
}

variable "tfstate_storage_account_name" {
  description = "Storage account for remote state"
  type        = string
}

variable "tfstate_container_name" {
  description = "Blob container for remote state"
  type        = string
} 