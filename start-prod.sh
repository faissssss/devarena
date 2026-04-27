#!/bin/bash

# Start DevArena in production mode (single server)

echo "Building frontend..."
cd frontend && npm run build

if [ $? -ne 0 ]; then
    echo "Frontend build failed!"
    exit 1
fi

echo ""
echo "Starting production server..."
cd ../backend
NODE_ENV=production node src/server.js
