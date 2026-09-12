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

### POST /api/geocodeAddress

Admin-only. Geocodes a street address (via Nominatim) — powers the "Check
address" tool in the shop add/edit forms so an admin can confirm where an
address lands before saving. Requires `Authorization: Bearer ${ADMIN_API_KEY}`.

**Body:**

- `address` (required): the street address
- `city_name`, `state_name`, `country_name` (optional): context so partial /
  international addresses resolve and same-named cities disambiguate

**Response:**

```json
{ "lat": 40.74844, "lng": -73.98566 }
```

Returns `{ "lat": null, "lng": null }` when the address can't be resolved.

### Shop address geocoding

`addShop` and `updateShop` geocode the shop's street address to `latitude` /
`longitude` on save (non-fatal: a miss leaves the shop uncoded, which the admin
shops table flags as "Not geocoded"). Explicit `latitude` / `longitude` in the
body take precedence over geocoding — the admin form's coordinate field lets an
admin paste coords (e.g. from Google Maps) when Nominatim can't resolve an
address. Backfill existing shops that predate this with
`node scripts/geocodeShops.js` (dry run) / `--fix` (write).

## Development

Run locally with Vercel CLI:

```bash
vercel dev
```

The API will be available at `http://localhost:3000/api/searchArtists?query=artist_name`
