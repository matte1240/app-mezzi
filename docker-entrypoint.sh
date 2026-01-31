#!/bin/sh
set -e

echo "🚀 Starting application entrypoint..."

# Fix permissions if running as root
if [ "$(id -u)" = "0" ]; then
    echo "🔧 Setting up storage..."
    
    # Define single storage source
    STORAGE_DIR="/app/storage"
    mkdir -p "$STORAGE_DIR/uploads" "$STORAGE_DIR/backups" "$STORAGE_DIR/logs"

    # Helper to link directories to storage
    link_storage() {
        APP_PATH="$1"
        STORAGE_PATH="$2"
        
        # If path exists and is a real directory (not symlink), replace with link
        if [ -d "$APP_PATH" ] && [ ! -L "$APP_PATH" ]; then
            echo "   Moving existing contents of $APP_PATH to $STORAGE_PATH"
            cp -r "$APP_PATH/." "$STORAGE_PATH/" 2>/dev/null || true
            rm -rf "$APP_PATH"
        fi

        if [ ! -e "$APP_PATH" ]; then
             mkdir -p "$(dirname "$APP_PATH")"
             ln -s "$STORAGE_PATH" "$APP_PATH"
             echo "🔗 Linked $APP_PATH -> $STORAGE_PATH"
        fi
    }

    link_storage "/app/public/uploads" "$STORAGE_DIR/uploads"
    link_storage "/app/backups" "$STORAGE_DIR/backups"
    link_storage "/app/logs" "$STORAGE_DIR/logs"

    echo "🔧 Fixing permissions for storage..."
    chown -R nextjs:nodejs "$STORAGE_DIR"
    
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
