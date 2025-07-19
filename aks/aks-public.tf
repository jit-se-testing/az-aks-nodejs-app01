provider "azurerm" {
  features {}
}

variable "resource_group_name" {}
variable "location" { default = "West Europe" }
variable "cluster_name" {}
variable "dns_prefix" {}
variable "node_count" { default = 1 }
variable "vm_size" { default = "Standard_DS2_v2" }
variable "public_ip_name" {}

resource "azurerm_resource_group" "aks_rg" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_network_security_group" "aks_nsg" {
  name                = "${var.cluster_name}-nsg"
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name

  security_rule {
    name                       = "AllowPort3000"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.cluster_name
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  dns_prefix          = var.dns_prefix

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = var.vm_size
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "azure"
    load_balancer_sku = "standard"
    outbound_type = "loadBalancer"
  }
}

resource "azurerm_public_ip" "aks_public_ip" {
  name                = var.public_ip_name
  location            = azurerm_resource_group.aks_rg.location
  resource_group_name = azurerm_resource_group.aks_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

output "kube_config" {
  value     = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive = true
}

output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.aks.name
  description = "Name of the AKS cluster"
}

output "resource_group_name" {
  value = azurerm_resource_group.aks_rg.name
  description = "Name of the resource group"
}

output "aks_public_ip" {
  value = azurerm_public_ip.aks_public_ip.ip_address
  description = "Public IP address of the AKS cluster"
} 