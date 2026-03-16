# MindVault - AI Memory Assistant Design

## Brand Identity
- **Primary Color:** #6C5CE7 (Deep Purple - knowledge, wisdom)
- **Secondary/Accent:** #00D2D3 (Teal - clarity, insight)
- **Success:** #00B894 (Green)
- **Warning:** #FDCB6E (Amber)
- **Error:** #FF6B6B (Coral)
- **Background Light:** #FAFAFA
- **Background Dark:** #0D0D1A
- **Surface Light:** #FFFFFF
- **Surface Dark:** #1A1A2E
- **Foreground Light:** #1A1A2E
- **Foreground Dark:** #F0F0F5
- **Muted Light:** #8E8EA0
- **Muted Dark:** #6E6E82
- **Border Light:** #E8E8F0
- **Border Dark:** #2A2A40

## Screen List

### 1. Home / Dashboard (Tab 1 - "Home")
- Greeting with time-aware message ("Good morning, ...")
- Quick capture bar at top (tap to expand into full capture)
- "Recent Memories" horizontal scroll of latest captures
- "Weekly Insights" card showing AI summary preview
- "Knowledge Stats" mini cards: total memories, topics, insights
- "Trending Topics" showing most active knowledge areas

### 2. Capture Screen (Tab 2 - "Capture")
- Large, prominent capture area optimized for speed
- Input modes as horizontal pill selector:
  - Text Note (default, large text input)
  - Voice (record button with waveform visualization)
  - Image/Screenshot (camera + gallery picker)
  - Document (PDF picker)
  - Web Link (URL input with auto-fetch preview)
- Tags/topic input below capture area
- "Save & Process" button
- AI processing indicator after save

### 3. Library / Knowledge Base (Tab 3 - "Library")
- Search bar at top with natural language support
- Filter chips: All, Notes, Images, Voice, Documents, Links
- Sort: Recent, Relevance, Topic
- Memory cards in a list view showing:
  - Type icon + title
  - AI-extracted summary (2 lines)
  - Topics/tags as pills
  - Timestamp
  - Source indicator
- Pull-to-refresh

### 4. AI Assistant (Tab 4 - "Ask AI")
- Chat-style interface for natural language queries
- Suggested questions based on stored knowledge
- AI responses with source citations (linked to memories)
- "Idea Generator" section:
  - Prompt input: "Generate ideas about..."
  - AI generates ideas based on stored knowledge
  - Save ideas back to knowledge base
- Weekly summary access

### 5. Insights / Knowledge Graph (Tab 5 - "Insights")
- Interactive knowledge graph visualization (SVG-based)
  - Nodes = topics, sized by frequency
  - Edges = connections between topics
  - Tap node to see related memories
- Weekly AI Summary card:
  - New insights this week
  - Recurring themes
  - Knowledge gaps identified
  - Suggested areas to explore
- Topic breakdown chart
- Learning streak / activity heatmap

### 6. Memory Detail Screen (Modal/Stack)
- Full content display based on type
- AI-extracted information panel
- Related memories section
- Edit/delete options
- Share button
- Topic tags (editable)

## Primary Content and Functionality

### Home Screen
- **Data:** User greeting, recent memories (last 5), weekly insight preview, stats counters
- **Functionality:** Quick capture shortcut, navigate to any memory, view weekly summary

### Capture Screen
- **Data:** Input form fields, recording state, selected files
- **Functionality:** Create text notes, record voice, pick images/screenshots, pick PDFs, paste web links. All saved content is sent to server for AI processing.

### Library Screen
- **Data:** All memories with search/filter, paginated list
- **Functionality:** Full-text search, filter by type, sort, tap to view detail, pull-to-refresh

### AI Assistant Screen
- **Data:** Chat history, suggested queries, idea generation results
- **Functionality:** Natural language Q&A over knowledge base, idea generation, weekly summary view

### Insights Screen
- **Data:** Knowledge graph data, weekly summary, topic stats
- **Functionality:** Interactive graph exploration, view summaries, identify knowledge gaps

## Key User Flows

### Quick Capture Flow
1. User opens app → Home screen
2. Taps quick capture bar → Capture screen
3. Types note / records voice / picks image → Taps "Save"
4. AI processes in background → Memory appears in Library
5. User sees "Processing complete" notification

### Search & Recall Flow
1. User opens Library tab
2. Types natural language query in search bar
3. Results appear ranked by relevance
4. Taps a memory → Detail screen with full content

### AI Query Flow
1. User opens Ask AI tab
2. Types question like "What did I learn about marketing?"
3. AI retrieves relevant memories and generates structured answer
4. User can tap cited sources to view original memories

### Idea Generation Flow
1. User opens Ask AI tab → Idea Generator section
2. Types prompt: "Generate startup ideas based on my notes"
3. AI analyzes stored knowledge and generates ideas
4. User can save ideas back to knowledge base

### Weekly Summary Flow
1. User opens Insights tab
2. Views weekly AI summary card
3. Sees new insights, recurring themes, knowledge gaps
4. Taps to expand full summary

## Color Choices
- **Primary Purple (#6C5CE7):** Used for primary actions, active tab, capture button, links
- **Teal Accent (#00D2D3):** Used for AI-related elements, knowledge graph nodes, insights
- **Surface White/Dark:** Card backgrounds, input fields
- **Muted Gray:** Secondary text, timestamps, placeholders
- **Success Green:** Processing complete, saved indicators
- **Warning Amber:** Knowledge gaps, suggestions
- **Error Coral:** Delete actions, errors

## Typography
- **Headings:** System font, bold, 24-32px
- **Body:** System font, regular, 16px
- **Caption:** System font, regular, 13px
- **Monospace:** For code snippets in notes

## Interaction Patterns
- Quick capture prioritized: minimal taps to save a thought
- Bottom tab navigation with 5 tabs
- Cards with subtle shadows for depth
- Haptic feedback on save, delete, and toggle actions
- Pull-to-refresh on Library
- Skeleton loading states
