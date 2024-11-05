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
     ```

4. **Run the app**:

   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## Deployment

1. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in Vercel’s dashboard.
2. Connect your GitHub repository to Vercel and deploy.

---

Enjoy discovering and organizing talented tattoo artists!
