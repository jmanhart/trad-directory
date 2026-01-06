# Magic Link Authentication Setup

## File Tree

```
src/
├── lib/
│   └── supabaseClient.ts          # Supabase client singleton
├── contexts/
│   └── AuthContext.tsx            # Auth provider with React context
├── components/
│   ├── auth/
│   │   ├── LoginPage.tsx          # Magic link login form
│   │   ├── LoginPage.module.css
│   │   ├── RequireAuth.tsx        # Protected route wrapper
│   │   └── AuthCallback.tsx       # Handles OAuth callback
│   └── pages/
│       ├── SavedPage.tsx          # Example protected page
│       └── SavedPage.module.css
migrations/
└── create_saved_artists_table.sql  # Database table for saved artists
```

## Setup Instructions

### 1. Supabase Dashboard Configuration

Go to your Supabase project → **Authentication** → **URL Configuration**

#### Site URL
- **Local dev**: `http://localhost:5173`
- **Production**: `https://yourdomain.com`

#### Redirect URLs (add both)
- `http://localhost:5173/auth/callback`
- `https://yourdomain.com/auth/callback` (for production)

#### Gotchas
- Magic links work in SPAs, but you need the callback route (`/auth/callback`)
- The redirect URL must match exactly (including protocol and port)
- For local dev, use `http://localhost:5173` (not `http://127.0.0.1:5173`)

### 2. Database Setup

Run the migration in Supabase SQL Editor:

```sql
-- See: migrations/create_saved_artists_table.sql
```

This creates:
- `saved_artists` table with RLS policies
- Users can only read/write their own saved artists

### 3. Environment Variables

Ensure these are in your `.env`:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Update Imports (if needed)

If you have existing code importing from `src/services/supabaseClient.ts`, update to:
```ts
import { supabase } from "../lib/supabaseClient";
```

## Usage

### Protected Routes

Wrap any route that requires auth:

```tsx
<Route
  path="/saved"
  element={
    <RequireAuth>
      <SavedPage />
    </RequireAuth>
  }
/>
```

### Using Auth in Components

```tsx
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { user, signOut } = useAuth();
  
  if (user) {
    return <button onClick={signOut}>Sign Out</button>;
  }
}
```

### Save Artist Example

```tsx
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

function ArtistCard({ artistId }) {
  const { user } = useAuth();
  
  const toggleSave = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("saved_artists")
      .insert({ user_id: user.id, artist_id: artistId });
  };
}
```

## How It Works

1. User visits protected route → redirected to `/login`
2. User enters email → magic link sent
3. User clicks link in email → redirected to `/auth/callback`
4. Supabase handles token exchange → user authenticated
5. `AuthCallback` redirects to original destination (or `/saved`)

## Testing Locally

1. Start dev server: `npm run dev`
2. Visit `http://localhost:5173/saved` (should redirect to login)
3. Enter email, check inbox
4. Click magic link → should redirect back to `/saved`

