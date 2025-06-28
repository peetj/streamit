# Admin Scripts

Scripts for administrative tasks and user management in StreamFlow.

## Scripts

- `generate_secure_password.py`: Generate strong random passwords for test users or admin accounts
- `update_test_user_password.py`: Update the password for the test user (`test@streamflow.com`) in the database

## Usage

```bash
# Generate secure passwords
python admin/generate_secure_password.py

# Update test user password
python admin/update_test_user_password.py "NewSecurePassword123!"
```

## Security Notes

- These scripts handle sensitive operations like password management
- Always use strong passwords for production environments
- Test user passwords should be changed regularly in development
- Consider using environment variables for sensitive data in production 