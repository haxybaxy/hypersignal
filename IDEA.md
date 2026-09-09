# Adjusted RSS — idea

## The idea

A personal, opinionated RSS reader for tech news. It subscribes to the obvious
sources that already publish feeds (Hacker News, Reddit, TechCrunch, etc.) plus
the ones that don't natively (Twitter/X, LinkedIn) via bridges. On top of the raw
firehose it does one thing: **adjusts** the stream — dedupes the same story
across sources, ranks by what I actually care about, and collapses noise — so I
open one list instead of ten tabs. Start dead simple: pull the feeds, show a
merged reverse-chron list, iterate on the "adjusting" from there.

## Wishlist of channels

### Native RSS (easy)
- Hacker News — `https://hnrss.org/frontpage` (or `/newest`, `/best`)
  - Useful for: early technical and startup conversations before they become mainstream tech news.
- Lobsters — `https://lobste.rs/rss`
  - Useful for: higher-signal engineering links, systems/programming discussion, and developer taste-making.
- Reddit — any subreddit exposes `.rss`, for example `https://www.reddit.com/r/technology/.rss`
  - Useful for: messy but valuable demand signals, user pain, tool recommendations, backlash, and niche communities.
- TechCrunch — `https://techcrunch.com/feed/`
  - Useful for: startup launches, fundraising, acquisitions, layoffs, founder narratives, and VC-facing market movement.
- The Verge — `https://www.theverge.com/rss/index.xml`
  - Useful for: consumer tech, platforms, gadgets, creator economy, media, AI policy, and how technology lands culturally.
- Ars Technica — `https://feeds.arstechnica.com/arstechnica/index`
  - Useful for: deeper technical reporting on software, hardware, science, security, infrastructure, and regulation.
- Techmeme — `https://www.techmeme.com/feed.xml`
  - Useful for: the meta-front page of tech news; good for seeing which story is actually dominating the day.
- Product Hunt — `https://www.producthunt.com/feed`
  - Useful for: new product launches, packaging ideas, indie/SaaS trends, and category saturation.
- GitHub Trending — via a bridge (e.g. RSSHub `/github/trending/daily`)
  - Useful for: developer tools, AI repos, infra libraries, and open-source projects gaining momentum.
- Substack newsletters — every one exposes `/feed` (Stratechery, Pragmatic Engineer, etc.)
  - Useful for: slower analysis, market structure, engineering management, strategy, and second-order implications.
- ArXiv (cs.AI / cs.LG) — `http://export.arxiv.org/rss/cs.AI`
  - Useful for: research ideas before they become products, especially AI capabilities, tooling, and model techniques.
- Y Combinator — `https://www.ycombinator.com/blog/feed`
  - Useful for: startup advice, YC company patterns, founder-market framing, and early-stage operating lessons.
- a16z — `https://a16z.com/feed/`
  - Useful for: VC theses, market maps, platform shifts, crypto/AI/infra narratives, and investable categories.
- First Round Review — `https://review.firstround.com/feed.xml`
  - Useful for: tactical startup operating advice from founders and functional leaders.
- Lenny's Newsletter — `https://www.lennysnewsletter.com/feed`
  - Useful for: product/growth playbooks, B2B SaaS patterns, marketplace lessons, and GTM ideas.
- Not Boring — `https://www.notboring.co/feed`
  - Useful for: startup strategy, tech markets, company analysis, and ambitious thesis-driven ideas.
- Ben Evans — `https://www.ben-evans.com/benedictevans?format=rss`
  - Useful for: compact strategic analysis of consumer tech, platforms, AI, regulation, and market structure.
- Simon Willison — `https://simonwillison.net/atom/everything/`
  - Useful for: practical AI/software tooling signals from someone actively testing what works.
- The Information — `https://www.theinformation.com/feed`
  - Useful for: company-level reporting on big tech, AI labs, startups, funding, and internal strategy shifts.
- Crunchbase News — `https://news.crunchbase.com/feed/`
  - Useful for: funding trends, startup sectors, private-market activity, and which categories are attracting capital.
- CB Insights Research — `https://www.cbinsights.com/research/feed/`
  - Useful for: market maps, emerging categories, corporate strategy, and investor-facing trend analysis.

### Reddit subreddits worth tracking
- `r/startups` — useful for: founder problems, validation questions, fundraising anxiety, and repeated early-stage pain points.
- `r/SaaS` — useful for: small B2B product ideas, pricing experiments, acquisition channels, and founder-built tools.
- `r/Entrepreneur` — useful for: broad business ideas, low-end service businesses, distribution hacks, and customer discovery.
- `r/smallbusiness` — useful for: operational pain in real businesses; good for boring but monetizable software ideas.
- `r/programming` — useful for: developer sentiment, languages/frameworks, and recurring tool complaints.
- `r/webdev` — useful for: frontend/backend workflow pain, hosting issues, and practical tool demand.
- `r/devops` — useful for: infra, observability, deployment, Kubernetes, CI/CD, and reliability pain points.
- `r/selfhosted` — useful for: privacy, open-source alternatives, home-lab demand, and products people wish existed.
- `r/MachineLearning` — useful for: serious ML research discussion and practitioner reaction to new papers.
- `r/LocalLLaMA` — useful for: open model usage, agent/tooling experiments, hardware constraints, and AI builder demand.
- `r/artificial` — useful for: broad AI news and mainstream enthusiasm/fear; noisier, but good for sentiment.
- `r/cybersecurity` — useful for: security incidents, practitioner pain, tooling gaps, and compliance-adjacent ideas.
- `r/productmanagement` — useful for: product org pain, roadmap/process issues, and workflow problems inside tech companies.
- `r/sales` — useful for: GTM pain, CRM complaints, outbound workflows, and sales-tech startup ideas.
- `r/marketing` — useful for: customer acquisition, attribution, content, ad platform changes, and marketing-tech needs.
- `r/investing` — useful for: market sentiment and retail reaction, but treat it as noisy context rather than advice.
- `r/stocks` — useful for: public-company narratives, sector hype, and how retail investors interpret tech earnings.

### Extra categories to consider
- Company engineering blogs — Netflix, Cloudflare, Stripe, Uber, Airbnb, Meta, OpenAI, Anthropic, Shopify, and GitHub.
  - Useful for: real production problems, architecture patterns, infra constraints, and ideas for developer tools.
- Changelog / devtool podcasts with feeds — Changelog, Software Engineering Daily, Latent Space, Practical AI.
  - Useful for: repeated founder/operator interviews and early signals in developer tooling and AI.
- SEC filings and earnings-call transcripts for public tech companies.
  - Useful for: market language, budget priorities, capex shifts, AI spend, cloud margins, and enterprise demand.
- Job boards and hiring pages.
  - Useful for: inferring what companies are building, which skills are hot, and where teams have unsolved internal needs.
- App marketplaces and review feeds.
  - Useful for: complaints, feature gaps, pricing anger, and categories where incumbents disappoint users.

### No native RSS (needs a bridge)
- Twitter / X — accounts + search terms, via Nitter / RSSHub / RSS.app
- LinkedIn — profiles / company pages / hashtags, via RSSHub or a paid bridge
- YouTube channels — `https://www.youtube.com/feeds/videos.xml?channel_id=...`
