# Deployment Scripts

This folder contains scripts related to deployment and production setup.

## Files

- **`setup_production.py`** - Production environment setup script that runs after Railway deployment
  - Creates admin and test users
  - Runs database migrations
  - Sets up initial data for production environment

## Usage

These scripts are typically run automatically by Railway during deployment, but can also be run manually for testing:

```bash
python scripts/deployment/setup_production.py
``` 