# Tattoo Directory API

This folder contains the MCP (Model Context Protocol) server implementation for the tattoo directory project.

## Setup

1. Install dependencies:

   ```bash
   cd api
   npm install
   ```

2. Set up environment variables:

   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key

3. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

## Available Endpoints

### GET /api/searchArtists

Search for tattoo artists by name.

**Query Parameters:**

- `query` (required): Artist name to search for

**Response:**

```json
{
  "results": [
    {
      "id": "string",
      "name": "string",
      "insta": "string",
      "location": "string"
    }
  ],
  "count": number,
  "query": "string"
}
```

## Development

Run locally with Vercel CLI:

```bash
vercel dev
```

The API will be available at `http://localhost:3000/api/searchArtists?query=artist_name`
