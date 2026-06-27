# GitHub Pages Deployment

This version is configured for GitHub Pages static hosting.

## What works on GitHub Pages

- Public landing page
- CSS/Tailwind styling
- Animations and frontend demo modal
- Static pages such as `/login`, `/admin`, `/tv`, and `/onboarding` showing demo-mode notices

## What cannot run on GitHub Pages

GitHub Pages only serves static files, so server features cannot run there:

- Next.js API routes
- Supabase server authentication/cookies
- Server Actions
- TV pairing backend
- ToyyibPay payment callbacks
- Deepgram/OpenAI/Anthropic API routes
- Middleware

The original server-based files were moved to `server-disabled-for-github-pages/` so the static export can build successfully.

For the full SaaS/backend version, deploy to Vercel instead.

## How to deploy

1. Push this project to GitHub.
2. Go to your GitHub repository.
3. Open **Settings > Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Go to the **Actions** tab.
6. Run or wait for **Deploy Next.js static site to GitHub Pages**.
7. Your site will be available at:

```text
https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/
```

Example:

```text
https://harith10-debug.github.io/MasjidOS/
```

The repository name is detected automatically in GitHub Actions, so the CSS and `_next` assets should load correctly under `/MasjidOS/` or whatever your repository is named.
