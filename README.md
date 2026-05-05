# DYD-Agent

## Important: Using Bolt Preview

**DO NOT open localhost manually. Always click the Bolt "Open Preview" button.**

The Vite dev server runs inside the Bolt container and is only accessible through the Bolt preview URL (e.g., `https://xxxxx.bolt.new`). All navigation within the app uses relative paths and works correctly inside the Bolt preview environment.

### How to Access the Application:
1. Click the **"Open Preview"** button in Bolt
2. The preview will open at the Bolt-generated URL
3. All routes (e.g., `/cv-upload`, `/cv-analysis/:id`, `/dashboard`) work within this preview URL

### Do NOT:
- Try to open `http://localhost:5173` or any port manually
- Use localhost URLs in bookmarks
- Share localhost URLs (share the Bolt preview URL instead)
