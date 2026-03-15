#!/bin/bash
set -e

echo "=== Setting up CRMPlus on server ==="

# 1. Set postgres password
echo "--- Setting postgres password ---"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# 2. Verify crmplus database exists
echo "--- Checking crmplus database ---"
sudo -u postgres psql -c "SELECT datname FROM pg_database WHERE datname='crmplus';"

# 3. Configure pg_hba.conf to allow md5 auth for localhost
echo "--- Configuring PostgreSQL authentication ---"
PG_HBA=$(sudo -u postgres psql -t -c "SHOW hba_file;" | tr -d ' ')
echo "pg_hba.conf location: $PG_HBA"

# Ensure md5 auth for local connections (backup first)
sudo cp "$PG_HBA" "${PG_HBA}.bak"
# Check if already has md5 for local IPv4
if sudo grep -q "host.*all.*all.*127.0.0.1/32.*md5" "$PG_HBA"; then
    echo "md5 auth already configured"
else
    echo "host all all 127.0.0.1/32 md5" | sudo tee -a "$PG_HBA"
    sudo systemctl restart postgresql
    echo "PostgreSQL restarted with md5 auth"
fi

# 4. Test database connection
echo "--- Testing database connection ---"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d crmplus -c "SELECT 1 as test;"

# 5. Build the Next.js app
echo "--- Building Next.js application ---"
cd ~/crmplus
npm run build

# 6. Install PM2 if needed
echo "--- Setting up PM2 ---"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# 7. Stop existing instance if running
pm2 delete crmplus 2>/dev/null || true

# 8. Start with PM2
echo "--- Starting application with PM2 ---"
pm2 start npm --name "crmplus" -- run start -- -p 3010
pm2 save

echo ""
echo "=== Deployment complete! ==="
echo "Application should be running at http://203.194.114.152:3010"
pm2 status
