# Project Scratchpad: Prediction Markets Intelligence Dashboard

## Background and Motivation

**Product Name:** Prediction Markets Intelligence Dashboard (Working name: "scope")

**Product Vision:**
Give traders a real-time edge in prediction markets by surfacing:
- New market creation alerts
- Key market metrics (end date, liquidity, volume, chart, links)
- Whale trades and insider signals
- Cross-platform arbitrage opportunities (Polymarket vs Kalshi)
- AI-generated market context summaries

Deliver these insights via a web dashboard and Telegram-native notifications.

**Problem Statement:**
Polymarket creates new markets rapidly. Traders lose time:
- Finding new markets early
- Assessing market quality
- Tracking whales / insiders
- Manually checking prices across platforms

This product reduces information latency and organizes intelligence into actionable modules.

**Color Palette:**
- Primary Red: #8B3A3A (muted brick red)
- Black: #000000
- Design: Clean geometric design with strong contrast

## Key Challenges and Analysis

1. **Real-Time Data Integration:** WebSocket connections for live updates, fallback polling
2. **Multi-Platform API Integration:** Polymarket CLOB API, Kalshi API, potential news APIs
3. **AI Context Generation:** Market summaries with caching strategy
4. **Performance:** Handle 1k+ trades/min without UI freeze, <2s page loads
5. **Complex Filtering/Sorting:** Multiple filter combinations across modules
6. **Telegram Bot Integration:** Real-time notifications, user preferences
7. **Database Architecture:** Postgres for persistent data, Redis for real-time feeds
8. **Arbitrage Calculation:** Cross-platform price matching and spread calculation

## High-level Task Breakdown

### Phase 1: Project Foundation & Infrastructure
**Task 1.1: Project Structure & Tech Stack Setup**
- Success Criteria:
  - Next.js 16 with App Router configured
  - TypeScript, Tailwind CSS v3
  - Folder structure: app/, components/, lib/, types/, hooks/, utils/
  - Development environment running

**Task 1.2: Database & Backend Setup**
- Success Criteria:
  - Postgres database schema designed (markets, trades, alerts, users)
  - Redis configured for real-time feeds
  - Database connection utilities created
  - Migration system set up

**Task 1.3: API Integration Foundation**
- Success Criteria:
  - Polymarket CLOB client configured
  - Kalshi API client structure (if available)
  - API error handling and retry logic
  - Rate limiting implemented

**Task 1.4: Real-Time Infrastructure**
- Success Criteria:
  - WebSocket server setup (Next.js API routes or separate service)
  - Polling fallback mechanism
  - Connection status management
  - Message deduplication logic

### Phase 2: Core UI Components & Layout
**Task 2.1: Navigation & Layout System**
- Success Criteria:
  - Header with navigation: Markets, Alerts, Whales, Arbitrage, Roadmap
  - Responsive mobile menu
  - Layout wrapper component
  - Active route highlighting

**Task 2.2: Landing Page / Home**
- Success Criteria:
  - Hero section with value proposition
  - Feature highlights
  - CTA links: Telegram bot, Telegram channel, X, GitHub, GitBook
  - Responsive design
  - All CTAs open in new tabs

**Task 2.3: Shared UI Components**
- Success Criteria:
  - Loading states/spinners
  - Error states
  - Modal component (for Market Context)
  - Table component (for Whale Tracker)
  - Filter/Sort controls component
  - Connection status indicator

### Phase 3: Markets Explorer Module
**Task 3.1: Markets List Display**
- Success Criteria:
  - Market cards/list with: title, end date, liquidity, volume, link
  - Pagination / "Load more" functionality
  - Initial load <2 seconds (cached)
  - Responsive grid layout

**Task 3.2: Markets Filtering & Sorting**
- Success Criteria:
  - Sort by: volume, newest, ending soon
  - Category filters: all, politics, sports, crypto, finance, tech, culture, geopolitics, other
  - Filter updates results in <500ms
  - Filter state persists in URL params

**Task 3.3: Market Context Modal**
- Success Criteria:
  - Modal opens from market card
  - Shows "Loading context..." state
  - Displays AI-generated summary (3-8 bullet points or 2-3 paragraphs)
  - Includes: "What this market is about", "Key dates", "Key factors"
  - Optional related links
  - Cached after first generation

### Phase 4: New Market Alerts Module
**Task 4.1: Real-Time Alert Feed**
- Success Criteria:
  - Shows markets from past 3 days
  - Real-time connection status indicator
  - "Sound on" toggle (persists in localStorage)
  - "Alerts today" count
  - New markets appear within <10s (WebSocket) or <60s (polling)

**Task 4.2: Alerts Controls**
- Success Criteria:
  - Same sorting as Markets page
  - Category filter (includes "uncategorized")
  - Sound toggle functionality
  - Auto-reconnect on socket drop

**Task 4.3: Alert Notifications**
- Success Criteria:
  - Audio notification on new market (if sound enabled)
  - Visual highlight for new items
  - Deduplication prevents repeat alerts

### Phase 5: Whale Tracker Module
**Task 5.1: Whale Feed Display**
- Success Criteria:
  - Real-time "live updates" indicator
  - Aggregated metrics: whale trades count, volume, buy/sell volume, percentages
  - Stats update when filters change
  - Handles 1k+ trades/min without UI freeze

**Task 5.2: Whale Filters**
- Success Criteria:
  - Trade type: all, buys only, sells only
  - Minimum trade size dropdown (default: $5K+)
  - Category filter: all, politics, sports, crypto, finance, tech, culture
  - Insider Mode toggle with heuristic logic

**Task 5.3: Whale Table**
- Success Criteria:
  - Columns: trader, market, shares, investment, price, side, time
  - Clickable market/trader links (optional)
  - Real-time updates without full page refresh
  - Sortable columns

**Task 5.4: Insider Detection Logic**
- Success Criteria:
  - Heuristic: account age < X days AND total traded > Y threshold AND top percentile
  - Returns boolean is_insider_like
  - Visual indicator for insider-like trades

### Phase 6: Arbitrage Scanner Module
**Task 6.1: Arbitrage Display**
- Success Criteria:
  - Connection status indicator
  - Stats: opportunities found, average spread, best spread, last updated
  - Updates every 30-60 seconds (MVP)
  - Shows positive spreads (profitable) and negative spreads

**Task 6.2: Arbitrage Filters**
- Success Criteria:
  - Category filters: all, sports, politics/crypto, nfl, nba, nhl, mlb, cfb, cbb
  - Filter updates results

**Task 6.3: Arbitrage Logic & Display**
- Success Criteria:
  - Identifies same event across Polymarket and Kalshi
  - Calculates spread after fees
  - Fee assumptions documented and adjustable
  - Disclaimer text displayed

**Task 6.4: Arbitrage UX Content**
- Success Criteria:
  - "How arbitrage works" explanation
  - Risk disclaimer text
  - Clear profit/loss indicators

### Phase 7: Roadmap Page
**Task 7.1: Roadmap Content**
- Success Criteria:
  - Phase 1 (completed): Telegram bot, channel, AI context, watchlist, keyword filtering, token launch
  - Phase 2 (in progress): X agent, Chrome extension, landing page/docs, spam filtering
  - Phase 3 (upcoming): Leaderboard, discussions, portfolio tracking, Discord integration, staking
  - Phase 4 (future): AI predictions, automated trading, premium subscription, API access
  - Visual timeline/roadmap display

### Phase 8: Cross-Cutting Features
**Task 8.1: AI Market Context Generation**
- Success Criteria:
  - API endpoint for context generation
  - Caching strategy (Postgres)
  - Output format: 3-8 bullet points or 2-3 paragraphs
  - Includes: what market is about, key dates, key factors
  - Optional related links (news, Wikipedia)

**Task 8.2: Telegram Bot Integration (Backend)**
- Success Criteria:
  - Bot sends messages for: new markets, watchlist price changes, whale trades (optional)
  - Commands: /start, /help, config commands
  - Deep links to dashboard
  - User preference storage

**Task 8.3: Performance Optimization**
- Success Criteria:
  - Markets page: <2s initial load
  - Alerts page: <1s update render
  - Whale page: handles 1k trades/min
  - Code splitting and lazy loading
  - Image optimization

**Task 8.4: Security & Compliance**
- Success Criteria:
  - API keys never shipped to client
  - Rate limiting on public endpoints
  - Abuse prevention
  - Risk disclaimers in UI
  - Arbitrage disclaimer text

## Project Status Board

- [ ] **Phase 1: Project Foundation & Infrastructure**
  - [ ] Task 1.1: Project Structure & Tech Stack Setup
  - [ ] Task 1.2: Database & Backend Setup
  - [ ] Task 1.3: API Integration Foundation
  - [ ] Task 1.4: Real-Time Infrastructure
- [ ] **Phase 2: Core UI Components & Layout**
  - [ ] Task 2.1: Navigation & Layout System
  - [ ] Task 2.2: Landing Page / Home
  - [ ] Task 2.3: Shared UI Components
- [ ] **Phase 3: Markets Explorer Module**
  - [ ] Task 3.1: Markets List Display
  - [ ] Task 3.2: Markets Filtering & Sorting
  - [ ] Task 3.3: Market Context Modal
- [ ] **Phase 4: New Market Alerts Module**
  - [ ] Task 4.1: Real-Time Alert Feed
  - [ ] Task 4.2: Alerts Controls
  - [ ] Task 4.3: Alert Notifications
- [ ] **Phase 5: Whale Tracker Module**
  - [ ] Task 5.1: Whale Feed Display
  - [ ] Task 5.2: Whale Filters
  - [ ] Task 5.3: Whale Table
  - [ ] Task 5.4: Insider Detection Logic
- [ ] **Phase 6: Arbitrage Scanner Module**
  - [ ] Task 6.1: Arbitrage Display
  - [ ] Task 6.2: Arbitrage Filters
  - [ ] Task 6.3: Arbitrage Logic & Display
  - [ ] Task 6.4: Arbitrage UX Content
- [ ] **Phase 7: Roadmap Page**
  - [ ] Task 7.1: Roadmap Content
- [ ] **Phase 8: Cross-Cutting Features**
  - [ ] Task 8.1: AI Market Context Generation
  - [ ] Task 8.2: Telegram Bot Integration (Backend)
  - [ ] Task 8.3: Performance Optimization
  - [ ] Task 8.4: Security & Compliance

## Current Status / Progress Tracking

**Current Phase:** Phase 3 Complete - Markets Explorer Module Done + CLOB Integration Enhanced

**Last Updated:** CLOB integration improved for live markets and search functionality

**Completed Tasks:**
- ✅ Task 1.1: Project structure created with all module routes
- ✅ Task 2.1: Navigation & Layout System
- ✅ Task 2.2: Landing Page updated
- ✅ Task 3.1: Markets List Display
  - Market cards with key metrics (end date, liquidity, volume, category)
  - Responsive grid layout
  - Loading and error states
  - Direct links to Polymarket
  - Entire card is clickable to navigate to Polymarket
- ✅ Task 3.2: Markets Filtering & Sorting
  - Category filter (all, politics, sports, crypto, finance, tech, culture, geopolitics, other)
  - Sort by: volume, newest, ending soon
  - Filter updates in <500ms
  - Results count display
  - **Search functionality implemented** - searches across question, slug, and category
  - **Live market updates** - refreshes every 60 seconds
- ✅ Task 3.3: Market Context Modal
  - Modal component with loading state
  - API endpoint structure for context generation
  - Placeholder for AI-generated summaries
  - Ready for AI integration
- ✅ **CLOB Integration Enhanced**
  - Fetches up to 500 live markets from Polymarket CLOB API
  - Filters for active, non-archived markets
  - Calculates market metrics (liquidity, volume, yes price) from token data
  - Real-time market data integration
  - Search works across market questions, slugs, and categories

**Shared Components Created:**
- LoadingSpinner
- MarketCard
- FilterSortControls
- MarketContextModal
- Layout wrapper

**API Updates:**
- Markets API route with caching
- Market Context API route (placeholder for AI)
- Category inference from market data

**Notes:**
- This is a complete rebuild with new comprehensive requirements
- Project will be built incrementally, one module at a time
- Starting with Phase 1: Foundation, then Phase 2: Core UI, then modules sequentially
- Tech stack: Next.js 16, TypeScript, Tailwind CSS, Postgres, Redis
- Real-time features require WebSocket infrastructure
- AI context generation will need API integration (OpenAI/Anthropic or similar)

## Executor's Feedback or Assistance Requests

_This section will be updated by the Executor as work progresses._

## Lessons

_This section will be updated with learnings and solutions discovered during implementation._

- **CLOB API Integration:** The Polymarket CLOB client returns markets in a `PaginationPayload` structure with a `data` array. Always access `response.data` to get the markets array.
- **Market Filtering:** Some markets may have `active: true` but `closed: true`. Filter for `active === true && archived === false` to show relevant markets.
- **Price Calculation:** Token prices in CLOB API are typically stored as decimals (0-1). Convert to percentage by multiplying by 100 if the value is <= 1.
- **Search Implementation:** Search should work across multiple fields (question, slug, category) for better user experience. Use `.toLowerCase()` for case-insensitive matching.
- **Performance:** Fetching order books for many markets is slow. Use token prices for initial display, and only fetch order books when needed for specific markets.
- **Real-time Updates:** Implement auto-refresh with `setInterval` in `useEffect` with proper cleanup to avoid memory leaks.
