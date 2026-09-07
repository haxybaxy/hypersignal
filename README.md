# Hypersignal

A personal news panel for spotting business ideas. Register sources (Hacker News, Reddit,
X/Twitter, LinkedIn, or any RSS/Atom feed), then read them as one combined stream or as a
split view with one scrolling panel per source. Sources are stored in your browser and can be
exported to JSON to back up or share with someone else.

## How it works

- **Sources** are feed URLs. For X, LinkedIn and Reddit, create a feed in the
  [rss.app](https://rss.app) dashboard and paste the feed URL it gives you
  (`https://rss.app/feeds/<id>.xml`). Hacker News works out of the box through
  [hnrss.org](https://hnrss.org). Any public RSS or Atom URL is accepted.
- **The API** (`apps/api`, FastAPI) is a stateless proxy: it fetches each feed server-side,
  parses it, strips HTML from summaries, and caches the result in memory for four minutes.
  It refuses URLs that resolve to private or loopback addresses, including after redirects.
- **The web app** (`apps/web`, React + TypeScript) keeps your source list and layout choice
  in `localStorage`, runs one TanStack Query per enabled source, and merges them client-side.

## Requirements

- Node 22.12+ (pnpm is provisioned through corepack)
- [uv](https://docs.astral.sh/uv/) 0.9+ (downloads Python 3.13 on first sync)
- [just](https://github.com/casey/just) for the task recipes (optional; every recipe maps
  to a `pnpm run …` script in the root `package.json`)
- Docker with Compose, only for the container setup

## Quick start

```sh
just setup      # corepack + pnpm install + uv sync
just dev        # API on http://localhost:8000, web on http://localhost:5173
```

Open http://localhost:5173. The panel starts with the Hacker News front page. Click
**Sources** to add feeds, toggle them, or import/export a sources file.

Other recipes:

```sh
just check      # lint + typecheck + tests for both apps
just lint / just typecheck / just test / just fmt
just up         # docker compose: web on http://localhost:8080, api on :8000
just down
```

API docs are served at http://localhost:8000/api/docs while the API is running.

## Sources file format

Import and export use the same JSON shape. `examples/sources.example.json` is a starting
point; replace the `REPLACE_WITH_YOUR_FEED_ID` URLs with feeds from your rss.app account.

```json
{
  "version": 1,
  "sources": [
    {
      "id": "hn-frontpage",
      "name": "Hacker News front page",
      "kind": "hackernews",
      "feedUrl": "https://hnrss.org/frontpage",
      "enabled": true
    }
  ]
}
```

- `kind` is one of `hackernews`, `reddit`, `twitter`, `linkedin`, `rss` and only affects the
  badge shown next to items.
- Importing offers **Merge** (skips feed URLs you already have) or **Replace all**.

## Configuration

Copy `.env.example` to `.env` at the repository root. The API reads `HYPERSIGNAL_*`
variables (CORS origins, cache TTL, timeouts, size limit, optional host allowlist,
User-Agent). The web app reads `VITE_API_BASE_URL`, which defaults to `/api`; both the
Vite dev server and the nginx container proxy that path to the API.

## Layout

```
apps/
  api/   FastAPI service: src/hypersignal_api (routers, services, schemas), tests/
  web/   Vite app: src/features/{sources,feeds}, src/components/ui (shadcn/ui)
examples/sources.example.json
docker-compose.yml, justfile, .env.example
```

## Security notes

The API only fetches `http(s)` URLs whose hosts resolve to public addresses, and re-checks
every redirect hop. It does not defend against DNS rebinding between the check and the
connection, which is acceptable for a personal tool running on your own machine. Set
`HYPERSIGNAL_FEED_ALLOWED_HOSTS` (for example `["rss.app","hnrss.org"]`) to restrict it
further if you expose it beyond localhost.
