# AKS Infrastructure with Terraform and GitHub Actions

This directory contains Terraform configurations for provisioning Azure Kubernetes Service (AKS) clusters with automated backend management and GitHub Actions workflows.

## 📁 Directory Structure

```
aks/
├── backend-bootstrap/          # Backend resources for Terraform state
│   ├── main.tf                # Backend infrastructure (RG, Storage, Container)
│   └── terraform.tfvars       # Backend configuration values
├── aks-public.tf              # Main AKS cluster configuration
├── backend.tf                 # Terraform backend configuration
├── terraform.tfvars           # AKS cluster variables
├── azure-tfstate-storage.tf   # Legacy backend configuration (deprecated)
├── start-terraform-init.sh    # Local initialization script
└── README.md                  # This file
```

## 🏗️ Terraform Configuration

### Backend Bootstrap (`backend-bootstrap/`)

**Purpose:** Creates the infrastructure needed to store Terraform state remotely.

**Resources:**
- Azure Resource Group
- Azure Storage Account
- Azure Blob Container

**Variables:**
- `resource_group_name`: Name of the resource group for state storage
- `location`: Azure region (default: "westeurope")
- `storage_account_name`: Name of the storage account
- `container_name`: Name of the blob container

### AKS Cluster (`aks-public.tf`)

**Purpose:** Provisions the AKS cluster with networking and security.

**Resources:**
- Azure Resource Group
- Network Security Group (allows port 3000)
- AKS Cluster with Standard Load Balancer
- Public IP Address

**Variables:**
- `resource_group_name`: Name of the resource group
- `location`: Azure region (default: "West Europe")
- `cluster_name`: Name of the AKS cluster
- `dns_prefix`: DNS prefix for the cluster
- `node_count`: Number of nodes (default: 1)
- `vm_size`: VM size for nodes (default: "Standard_DS2_v2")
- `public_ip_name`: Name of the public IP resource

**Outputs:**
- `kube_config`: Kubernetes configuration (sensitive)
- `aks_cluster_name`: Name of the created cluster
- `resource_group_name`: Name of the resource group
- `aks_public_ip`: Public IP address for external access

## 🚀 GitHub Actions Workflows

### 1. Bootstrap Backend Workflow

**File:** `.github/workflows/bootstrap-backend.yml`

**Purpose:** One-time setup of backend resources for Terraform state storage.

**Triggers:**
- Manual workflow dispatch only

**Inputs:**
- `action`: "apply" or "destroy"
- `confirm_destroy`: Type "YES" to confirm destroy action

**Usage:**
1. Go to GitHub Actions → Bootstrap Terraform Backend
2. Click "Run workflow"
3. Choose action:
   - **Apply:** Creates backend resources
   - **Destroy:** Removes backend resources (requires "YES" confirmation)

**Outputs:**
- Resource group, storage account, and container names
- Copy these values to GitHub secrets for the AKS workflow

### 2. AKS On-Demand Pipeline

**File:** `.github/workflows/aks-on-demand.yml`

**Purpose:** Manages AKS cluster lifecycle (create, update, destroy).

**Triggers:**
- Push to `main` branch (auto-apply)
- Manual workflow dispatch

**Inputs:**
- `action`: "apply" or "destroy"

**Usage:**
1. **Automatic:** Push to `main` branch triggers apply
2. **Manual:** Go to Actions → AKS On-Demand Pipeline → Run workflow

**Steps:**
1. Azure authentication
2. Create `terraform.tfvars` from GitHub secrets
3. Terraform init with remote backend
4. Terraform plan
5. Terraform apply/destroy
6. Output kubeconfig and public IP
7. Get AKS credentials for kubectl access

## 🔧 Setup Instructions

### Prerequisites

1. **Azure Subscription:** Active Azure subscription
2. **Azure CLI:** Installed and authenticated locally
3. **GitHub Repository:** With Actions enabled

### Step 1: Create Azure Service Principal

```bash
# Get your subscription ID
SUBSCRIPTION_ID=$(az account show --query id --output tsv)

# Create service principal with SDK auth format
az ad sp create-for-rbac --name "jit-se-testing-aks-sp" --role contributor --scopes /subscriptions/$SUBSCRIPTION_ID --sdk-auth
```

### Step 2: Set GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions:

| Secret Name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | Complete JSON output from service principal creation |
| `TFSTATE_RESOURCE_GROUP` | "jit-se-testing-aks-tfstate-rg" |
| `TFSTATE_STORAGE_ACCOUNT` | "jitsetestingakstfstaterg" |
| `TFSTATE_CONTAINER` | "tfstate" |

### Step 3: Bootstrap Backend

1. Go to GitHub Actions → Bootstrap Terraform Backend
2. Click "Run workflow"
3. Choose "apply" action
4. Wait for completion
5. Copy the output values and update GitHub secrets if needed

### Step 4: Deploy AKS Cluster

1. **Automatic:** Push to `main` branch
2. **Manual:** Go to Actions → AKS On-Demand Pipeline → Run workflow
3. Choose "apply" action
4. Wait for AKS cluster creation

### Step 5: Access Your Cluster

After successful deployment:

```bash
# Get cluster credentials
az aks get-credentials --resource-group jit-se-testing-aks-rg --name jit-se-testing-aks01 --overwrite-existing

# Deploy your application
kubectl apply -f manifests/

# Check service and get public IP
kubectl get service -o wide
```

## 🔒 Security Features

- **Network Security Group:** Only allows port 3000 inbound
- **System-Assigned Identity:** AKS uses managed identity
- **Standard Load Balancer:** Production-ready networking
- **Static Public IP:** Predictable external access

## 🧹 Cleanup

### Destroy AKS Cluster
1. Go to Actions → AKS On-Demand Pipeline
2. Run workflow with "destroy" action

### Destroy Backend Resources
1. Go to Actions → Bootstrap Terraform Backend
2. Run workflow with "destroy" action
3. Type "YES" in confirmation field

## 📝 Notes

- **Backend Resources:** Only need to be created once
- **AKS Cluster:** Can be created/destroyed as needed
- **Public IP:** Automatically allocated by Azure
- **Port 3000:** Configured for Node.js application access
- **State Management:** All state stored remotely in Azure Storage

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors:**
   - Verify `AZURE_CREDENTIALS` secret is correct
   - Check service principal permissions

2. **Backend Errors:**
   - Ensure backend resources exist before running AKS workflow
   - Verify storage account and container names

3. **Network Issues:**
   - Check NSG rules allow port 3000
   - Verify LoadBalancer service configuration

### Debug Commands

```bash
# Check Azure authentication
az account show

# List resource groups
az group list

# Check AKS cluster status
az aks show --resource-group jit-se-testing-aks-rg --name jit-se-testing-aks01

# Get cluster credentials
az aks get-credentials --resource-group jit-se-testing-aks-rg --name jit-se-testing-aks01
``` 