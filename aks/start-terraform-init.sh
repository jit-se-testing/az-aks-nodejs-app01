#!/bin/bash
# Usage: ./start-terraform-init.sh <resource_group> <storage_account> <container> <key>
# Example: ./start-terraform-init.sh tfstate-rg tfstatestorage12345 tfstate aks-public.terraform.tfstate

RESOURCE_GROUP=${1:-tfstate-rg}
STORAGE_ACCOUNT=${2:-changeme}
CONTAINER=${3:-tfstate}
KEY=${4:-aks-public.terraform.tfstate}

terraform init \
  -backend-config="resource_group_name=$RESOURCE_GROUP" \
  -backend-config="storage_account_name=$STORAGE_ACCOUNT" \
  -backend-config="container_name=$CONTAINER" \
  -backend-config="key=$KEY" 