# Tattoo Artist Directory

A React and Vite-powered web app for discovering tattoo artists and shops. Built with Supabase for data management and deployed on Vercel.

## Features

- **Artist Directory**: Browse and filter tattoo artists by city, state, and country.
- **Shop Links**: View associated tattoo shops and Instagram profiles for each artist.
- **Sorting**: Easily sort artists by name, location, or shop.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Monitoring**: Sentry (error tracking & performance monitoring)

## Setup & Development

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/tattoo-artist-directory.git
   cd tattoo-artist-directory
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Variables**:

   - Create a `.env` file in the project root with the following:
     ```plaintext
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     VITE_SENTRY_DSN=your-sentry-dsn
     ```

4. **Run the app**:

   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## Release Management & Deployment

This project uses semantic versioning with automated Sentry integration and flexible deployment options.

### **Development Workflow (Automatic Builds)**

```bash
# Make changes and push - Vercel auto-builds for quick iteration
git add .
git commit -m "feat: add new artist filtering"
git push origin main
```

### **Release Workflow (Versioned Deployments)**

```bash
# Create a release and deploy to production
npm run release patch --deploy    # 0.1.0 → 0.1.1 + deploy
npm run release minor --deploy    # 0.1.0 → 0.2.0 + deploy
npm run release major --deploy    # 0.1.0 → 1.0.0 + deploy

# Or release first, deploy later
npm run release patch             # 0.1.0 → 0.1.1
# ... test locally ...
npm run deploy                   # Deploy to production
```

### **Available Commands**

```bash
# Release management
npm run release patch            # Create patch release
npm run release minor            # Create minor release
npm run release major            # Create major release

# Deployment
npm run deploy                   # Deploy to production
npm run deploy:preview          # Deploy preview

# Version management only
npm run version:patch           # Update version only
npm run version:minor           # Update version only
npm run version:major           # Update version only
```

### **What Happens During Release**

1. ✅ Version updated in `package.json`
2. ✅ Project built with new version
3. ✅ Git commit and tag created
4. ✅ Changes pushed to repository
5. ✅ Optional: Automatic Vercel deployment
6. ✅ Sentry release created for error tracking

## Sentry Integration

- **Automatic Release Tracking**: Every release creates a new Sentry release
- **Performance Monitoring**: 100% trace capture for comprehensive monitoring
- **Session Replay**: 100% session capture for debugging user issues
- **Error Correlation**: Issues automatically tagged with release versions

## Deployment

### **Automatic (Development)**

- Vercel builds on every push to `main` branch
- Good for quick iteration and testing

### **Manual (Production)**

- Use `npm run release <type> --deploy` for versioned releases
- Creates clean 1:1 mapping between releases and deployments
- Perfect Sentry integration for production monitoring

### **Environment Variables in Vercel**

Add these in Vercel's dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`

## Project Structure

```
├── src/
│   ├── components/          # React components
│   ├── services/            # API and Supabase client
│   ├── utils/               # Utilities including Sentry config
│   └── assets/              # Icons and static assets
├── scripts/
│   └── release.js           # Release management script
├── vercel.json              # Vercel configuration
└── RELEASE.md               # Detailed release documentation
```

## Troubleshooting

### **Release Issues**

- Ensure all changes are committed before running release
- Check that build completes successfully
- Verify git remote is properly configured

### **Deployment Issues**

- Check Vercel environment variables
- Ensure Sentry DSN is correct
- Verify build output in Vercel dashboard

---

For detailed release management information, see [RELEASE.md](./RELEASE.md).

Enjoy discovering and organizing talented tattoo artists!
