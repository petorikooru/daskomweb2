#!/bin/sh
set -e

if [ ! -d /app/vendor ]; then
    composer install --optimize-autoloader;
fi

# Set permissions for Laravel directories
chown -R www-data:www-data /app/storage /app/bootstrap/cache
chmod -R 775 /app/storage /app/bootstrap/cache

mkdir -p /var/log/supervisor/

exec "$@"