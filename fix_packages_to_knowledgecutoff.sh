#!/bin/bash

# Function to install a specific version of a package
install_package() {
    local package=$1
    local version=$2
    echo "Installing $package@$version"
    pnpm add -D "$package@$version"
}

# Uninstall all current packages
echo "Uninstalling all current packages..."
pnpm remove $(jq -r '.devDependencies + .dependencies | keys | .[]' package.json)

# Clear pnpm store to ensure clean slate
echo "Clearing pnpm store..."
pnpm store prune

# Install specific versions of devDependencies
install_package "@playwright/test" "1.28.1"
install_package "@sveltejs/adapter-auto" "2.1.0"
install_package "@sveltejs/kit" "1.20.4"
install_package "@sveltejs/vite-plugin-svelte" "2.4.2"
install_package "@types/eslint" "8.44.0"
install_package "autoprefixer" "10.4.14"
install_package "eslint" "8.45.0"
install_package "eslint-config-prettier" "8.8.0"
install_package "eslint-plugin-svelte" "2.32.2"
install_package "globals" "13.20.0"
install_package "postcss" "8.4.26"
install_package "prettier" "2.8.8"
install_package "prettier-plugin-svelte" "2.10.1"
install_package "svelte" "4.0.5"
install_package "svelte-check" "3.4.6"
install_package "tailwindcss" "3.3.3"
install_package "tslib" "2.6.0"
install_package "typescript" "5.0.4"
install_package "vite" "4.4.4"
install_package "vitest" "0.33.0"

# Install specific versions of dependencies
install_package "@types/prismjs" "1.26.0"
install_package "prismjs" "1.29.0"

# Update package.json to prevent upgrades
echo "Updating package.json to prevent upgrades"
sed -i.bak '/"devDependencies": {/,/}/s/"\^/"/g; /"dependencies": {/,/}/s/"\^/"/g' package.json

echo "Installation complete. Package versions are now locked."