#!/bin/bash

# Function to create or update a file
create_or_update_file() {
    local file_path=$1
    local content=$2
    
    if [ -f "$file_path" ]; then
        echo "Updating existing file: $file_path"
        echo "$content" > "$file_path"
    else
        echo "Creating new file: $file_path"
        mkdir -p "$(dirname "$file_path")"
        echo "$content" > "$file_path"
    fi
}

# Install Tailwind CSS and its peer dependencies
echo "Installing Tailwind CSS and its peer dependencies..."
pnpm add -D tailwindcss postcss autoprefixer

# Generate tailwind.config.js and postcss.config.js
echo "Generating Tailwind and PostCSS config files..."
npx tailwindcss init -p

# Update svelte.config.js
create_or_update_file "svelte.config.js" "$(cat << 'EOF'
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter()
  },
  preprocess: vitePreprocess()
};

export default config;
EOF
)"

# Update tailwind.config.js
create_or_update_file "tailwind.config.js" "$(cat << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {}
  },
  plugins: []
};
EOF
)"

# Create app.css
create_or_update_file "src/app.css" "$(cat << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
)"

# Create or update +layout.svelte
create_or_update_file "src/routes/+layout.svelte" "$(cat << 'EOF'
<script>
  import "../app.css";
</script>

<slot />
EOF
)"

# Update an example component to use Tailwind
create_or_update_file "src/routes/+page.svelte" "$(cat << 'EOF'
<h1 class="text-3xl font-bold underline">
  Hello world!
</h1>

<style lang="postcss">
  :global(html) {
    background-color: theme(colors.gray.100);
  }
</style>
EOF
)"

echo "Tailwind CSS has been installed and configured for your SvelteKit project!"
echo "You can now start your development server with 'pnpm run dev'"
echo "Remember to use 'lang=\"postcss\"' in your <style> tags when using Tailwind in components."