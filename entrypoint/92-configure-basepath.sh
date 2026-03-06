#!/bin/sh
APP_BASE_PATH="${APP_BASE_PATH:-/kubevirt-manager}"

echo "[92-configure-basepath] Using APP_BASE_PATH: ${APP_BASE_PATH}"

# Copy original html to writable emptyDir mount
cp -r /usr/share/nginx/html.original/. /usr/share/nginx/html/

# Patch base href
sed -i "s|<base href=\"/\">|<base href=\"${APP_BASE_PATH}/\">|g" \
    /usr/share/nginx/html/index.html

# Patch nginx config
cp /etc/nginx/conf.d.templates/gzip.conf /etc/nginx/conf.d/gzip.conf
envsubst '${APP_BASE_PATH}' \
    < /etc/nginx/conf.d.templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf

echo "[92-configure-basepath] Done."