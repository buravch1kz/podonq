#!/bin/bash

# Create build directory
mkdir -p build

# Copy files
cp index.html build/
cp styles.css build/
cp app.js build/

# Create manifest.json for Telegram Mini App
cat > build/manifest.json << EOL
{
    "name": "Dingyun Zhang Store",
    "short_name": "DZ Store",
    "description": "Online clothing store with crypto and SBP payments",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#000000",
    "icons": [
        {
            "src": "icon.png",
            "sizes": "192x192",
            "type": "image/png"
        }
    ]
}
EOL

echo "Build completed! Files are in the build directory." 