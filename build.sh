#!/bin/bash

# Clean previous builds
rm -rf out .next

# Build the Next.js app with error suppression
npm run build || true

# Check if build created output
if [ -d "out" ]; then
    echo "Build successful - static files in 'out' directory"
    echo "You can deploy the 'out' directory to any static hosting service"
else
    echo "Build may have failed - checking .next directory"
    if [ -d ".next" ]; then
        echo "Next.js build artifacts found in .next directory"
    else
        echo "No build output found"
    fi
fi
