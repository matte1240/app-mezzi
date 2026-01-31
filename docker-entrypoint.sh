#!/bin/sh
set -e

echo "🚀 Starting application entrypoint..."

# Fix permissions if running as root
if [ "$(id -u)" = "0" ]; then
    echo "🔧 Fixing permissions for volumes..."
    mkdir -p /app/public/uploads /app/logs /app/backups/database
    chown -R nextjs:nodejs /app/public/uploads /app/logs /app/backups
    
    # Re-execute script as nextjs user
    echo "🔄 Switching to nextjs user..."
    exec su-exec nextjs "$0" "$@"
fi

echo "📂 Current directory content:"
ls -la /app

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
# We run directly to stdout/stderr so we can see logs in real-time. 
# Complex auto-rollback logic is removed to ensure visibility of errors.
if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully."
else
    echo "❌ Prisma migrations failed!"
    # We don't exit here to allow debugging, or we can exit if stricter.
    # Usually provided we want to fail deploy if migration fails:
    exit 1
fi

# Execute the main command passed to the entrypoint
echo "🚀 Starting application: $@"
exec "$@"
