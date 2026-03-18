# Project TODO

- [x] Theme configuration (brand colors, dark/light mode)
- [x] Tab navigation setup (Home, Capture, Library, Ask AI, Insights)
- [x] Icon mappings for all tabs
- [x] Database schema (memories table with types, content, AI extractions)
- [x] Backend tRPC routes for CRUD operations on memories
- [x] Backend AI processing route (extract text, summarize, identify topics)
- [x] Backend natural language query route
- [x] Backend weekly summary generation route
- [x] Backend idea generation route
- [x] File upload to S3 storage (images, audio, PDFs)
- [x] Voice transcription integration
- [x] Home screen with greeting, recent memories, stats, quick capture
- [x] Capture screen with text, voice, image, document, web link modes
- [x] Library screen with search, filters, and memory list
- [x] Memory detail screen
- [x] AI Assistant screen with chat-style Q&A
- [x] Idea generation feature
- [x] Weekly summary display
- [x] Knowledge graph visualization
- [x] Insights dashboard with topic stats
- [x] App logo and branding
- [x] Unit tests for backend logic

## Phase 2 - Major Feature Expansion

- [x] Guest mode (use app without sign-in, local storage)
- [x] Onboarding flow (welcome screens highlighting key features)
- [x] Subscription model (Basic free tier + Pro tier with pricing)
- [x] Subscription gate for premium features
- [x] Enhanced dashboard with document counts, themes, dates, engagement stats
- [x] Folder system for organizing memories
- [x] Folder-specific AI analysis
- [x] Favorites/Pinned feature for memories
- [x] User guide tab (top corner reference)
- [x] Tutorial/quick-guide tips for first-time users on each tab
- [x] Document scanning (contracts, prescriptions, blood reports, etc.)
- [x] Scan/upload DOCX, presentations, websites/URLs
- [x] AI document analysis with plain-language summaries
- [x] Memory sharing/export via system share sheet
- [x] Push notification reminders (subscription-gated)
- [x] Weekly AI summary with insights, themes, and knowledge gaps
- [x] Report generation from uploaded documents (via AI analyze)
- [x] Market research feature based on attached documents (via AI analyze)
- [x] New icon mappings for all new features
- [x] Comprehensive unit tests for all new features (48 tests passing)

## Phase 3 - Tag Filtering, Focus Mode, Export, and UI Redesign

- [x] Tag-based filtering system (custom user tags beyond AI topics)
- [x] Tag creation, editing, and deletion
- [x] Tag assignment to memories
- [x] Cross-folder tag search
- [x] Tag filter in Library screen
- [x] Focus Mode timer with folder pairing
- [x] Focus Mode session tracking (what was captured during session)
- [x] Focus Mode UI with countdown timer
- [x] Data export/backup as ZIP of markdown files
- [x] Full knowledge base export
- [x] Aurora green + gold accent theme redesign
- [x] Custom backgrounds for each page (thinking/brain/AI concept)
- [x] NanoBanana image-based slides for UI showcase

## Phase 4 - Translucent UI, Enhanced Onboarding, Smart Features

- [x] Copy NanoBanana HD images into app assets for backgrounds
- [x] Build translucent background component with blur overlay
- [x] Apply translucent backgrounds to Home screen
- [x] Apply translucent backgrounds to Capture screen
- [x] Apply translucent backgrounds to Library screen
- [x] Apply translucent backgrounds to Ask AI screen
- [x] Apply translucent backgrounds to Insights screen
- [x] Apply translucent backgrounds to Onboarding screen
- [x] Apply translucent backgrounds to all modal/detail screens
- [x] Revamp onboarding with subscription upsell step
- [x] Enhanced tutorial tips for first-time users on all screens
- [x] User guide button at top-right corner on all screens
- [x] Smart reminders - AI detects action items in notes
- [x] Smart reminders - auto-create reminder notifications
- [x] Collaborative folders - share folders with others
- [x] Collaborative folders - role-based access (viewer/editor)
- [x] Daily Digest home widget - surface relevant memory each morning
- [x] Daily Digest - based on user's recent focus areas
- [x] Unit tests for all new features (95 tests passing)

## Phase 5 - Spectacular Mobile UI Skill
- [x] Update theme to cinematic dark (#0A0E1A) + gold (#FFD700) palette
- [x] Create ScreenBackground component with animated drift and golden vignette
- [x] Create GoldenButton component (primary/secondary/outline variants)
- [x] Create GoldenText component (hero/title/subtitle/label variants)
- [x] Upload NanoBanana images as S3 URLs for ScreenBackground
- [x] Create TransitionProvider context for golden light-burst transitions
- [x] Create GoldenTransitionOverlay animated component
- [x] Wire transitions to tab switches (sparkle) and navigation (burst/sweep)
- [x] Create tooltip store with AsyncStorage persistence
- [x] Create TooltipBubble component with golden styling
- [x] Add contextual tooltips to all major interactive elements
- [x] Revamp onboarding to 5-slide cinematic flow with subscription upsell
- [x] Revamp Home screen with ScreenBackground + golden theme
- [x] Revamp Capture screen with ScreenBackground + golden theme
- [x] Revamp Library screen with ScreenBackground + golden theme
- [x] Revamp Ask AI screen with ScreenBackground + golden theme
- [x] Revamp Insights screen with ScreenBackground + golden theme
- [x] Revamp all detail/modal screens with ScreenBackground + golden theme
- [x] Update tab bar to transparent dark with golden accents
- [x] Wire guest mode exit with welcome tour option
- [x] Test all transitions, tooltips, and backgrounds (95 tests passing)

## Phase 6 - Tab-Specific NanoBanana Backgrounds
- [x] Generate Home tab background (dashboard/brain hub concept)
- [x] Generate Capture tab background (input/creation concept)
- [x] Generate Library tab background (archive/knowledge vault concept)
- [x] Generate Ask AI tab background (conversation/neural query concept)
- [x] Generate Insights tab background (analytics/graph visualization concept)
- [x] Optimize and upload all 5 images to S3
- [x] Update constants/images.ts with new tab-specific URLs
- [x] Apply new backgrounds to each tab screen

## Phase 7 - Login Fix, Parallax, Contrast
- [x] Fix login error in app preview
- [x] Add parallax scrolling effect to CinematicScreen backgrounds
- [x] Increase text box and card contrast for better readability (95 tests passing)

## Phase 8 - Strategic Features from Viral Analysis

### Prompt 1 - OCR + Semantic Search
- [x] Visual indicator when search results come from image OCR
- [x] Semantic search badge/label in search results showing meaning-based matches

### Prompt 2 - AI Vault Chat + Summaries (ALREADY BUILT)
- [x] AI chat interface querying saved content (Ask AI tab)
- [x] Auto-summary on document save (processMemory)
- [x] Pro-only paywall for AI features

### Prompt 3 - Daily Digest + "On This Day"
- [x] Daily Digest widget with resurfaced items (DailyDigest component)
- [x] "On This Day" section showing saves from same date in previous months
- [x] AI-generated "theme of the week" in Daily Digest
- [x] Pro-only gate for Daily Digest

### Prompt 4 - 3-Tier Subscription (Free/Pro/Teams)
- [x] Free tier (50 saves/month, basic search, limited AI)
- [x] Pro tier (unlimited saves, semantic search, AI chat, OCR, daily digest)
- [x] Teams tier ($24.99/user/month, shared vaults, admin controls, API access, SSO)
- [x] Upgrade prompt with clear value message when free users hit limits
- [x] Track which features triggered upgrade prompt (analytics dashboard)

### Prompt 5 - Viral Sharing Mechanics
- [x] Export AI insights/summaries as shareable branded insight cards (5 themes)
- [x] One-tap share via system share sheet (Twitter/X, LinkedIn, etc.)
- [x] "Shared via MindVault" branding toggle on shared cards
- [x] Referral system with code generation and email invites
- [x] Referral dashboard showing count, status, and rewards earned
- [x] Upgrade analytics dashboard with conversion tracking
- [x] Teams management screen with member/vault CRUD
- [x] 40 new unit tests for all 7 features (all passing)
