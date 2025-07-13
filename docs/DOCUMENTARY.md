# The Borg-Tools MVP Creation Story

*An auto-generated documentary of building a one-click CV generator for developers*

## Chapter 1: The Vision (Day 0)

I sat staring at my screen, frustrated by the endless hours spent formatting CVs. As a developer, I knew there had to be a better way. The idea hit me like lightning: what if I could build a system that automatically converts GitHub and LinkedIn profiles into professional PDFs with just one click?

The vision was clear:
- Extract developer data from GitHub/LinkedIn automatically
- Use AI to craft professional summaries
- Generate ATS-ready PDFs with a sleek "Neon Tech on Black" design
- Make it fast, beautiful, and developer-friendly

I opened my terminal and created the first directory structure. This was the beginning of Borg-Tools MVP.

## Chapter 2: Architecture Decisions (Day 1)

The architecture needed to be robust yet simple. I decided on:

**Frontend Choice: Next.js 14**
I chose Next.js 14 with App Router because I needed:
- Server-side rendering for better SEO
- Built-in API routes for seamless backend integration
- TypeScript support for type safety
- Modern React patterns with concurrent features

**Backend Choice: FastAPI**
For the backend, FastAPI was the obvious choice:
- Async/await support for handling multiple CV generations
- Automatic OpenAPI documentation
- Pydantic v2 for data validation
- Python ecosystem for AI integration

**AI Orchestration: LangGraph**
The most critical decision was using LangGraph for AI agent orchestration:
- State machine approach for complex workflows
- Multiple AI models (Claude 3 Haiku + GPT-4o)
- Reliable error handling and retry logic
- Extensible agent architecture

## Chapter 3: The Foundation (Day 2-3)

I started with the basic project structure:

```
borg-tools-mvp/
├── src/               # Next.js frontend
├── backend/           # FastAPI server
├── agents/            # LangGraph AI agents
├── tests/             # E2E and unit tests
└── docs/              # Documentation
```

The first lines of code were simple but significant - setting up the development environment that would support rapid iteration.

## Chapter 4: Authentication & Data Flow (Day 4-5)

GitHub OAuth integration was my first major challenge. I needed to:
1. Authenticate users securely
2. Fetch their GitHub profile and repositories
3. Extract meaningful developer insights
4. Store everything in Supabase

The breakthrough came when I realized I could use GitHub's GraphQL API to get exactly the data I needed in a single request, reducing API calls and improving performance.

## Chapter 5: The AI Agents (Day 6-8)

This was where the magic happened. I built five specialized agents:

**Claude Extractor Agent**
- Used Claude 3 Haiku for fast, accurate data extraction
- Parsed GitHub repositories to identify key technologies
- Extracted project descriptions and contribution patterns

**GPT Summary Agent**
- Leveraged GPT-4o for professional summary generation
- Created compelling career narratives from raw data
- Optimized prompts for ATS-friendly content

**LinkedIn Parser Agent**
- Handled LinkedIn profile parsing (when provided)
- Merged LinkedIn and GitHub data intelligently
- Resolved conflicts between data sources

**PDF Renderer Agent**
- Used React-PDF for programmatic PDF generation
- Implemented the "Neon Tech on Black" design system
- Ensured ATS compatibility and <200KB file size

**Storage Uploader Agent**
- Managed Supabase storage integration
- Generated secure 24-hour sharing links
- Handled cleanup and optimization

## Chapter 6: Design System (Day 9-10)

The visual identity was crucial. I wanted something that screamed "developer" while remaining professional:

- **Colors**: Deep black (#0d0d0d) background with electric green (#39ff14) accents
- **Typography**: Space Grotesk for headers (modern, geometric), Inter for body text (readable)
- **Layout**: Single-page PDF, clean hierarchy, plenty of white space
- **Icons**: Minimal, consistent iconography for technologies and contact info

The design needed to work both on screen and in print, passing ATS scanners while looking distinctly modern.

## Chapter 7: Performance Optimization (Day 11-12)

Speed was non-negotiable. I set aggressive targets:
- API P95 latency: <100ms
- PDF generation: <2s (hot), <30s (cold start)
- Frontend LCP: <1.2s on 3G

The optimizations included:
- Caching GitHub API responses
- Optimizing React-PDF rendering
- Using Supabase edge functions
- Implementing proper loading states

## Chapter 8: Testing & Quality (Day 13-14)

I built a comprehensive testing strategy:
- Playwright for E2E testing of the full user journey
- Vitest for fast unit tests
- Python pytest for backend API testing
- Type checking with TypeScript strict mode and mypy

Every feature needed tests before deployment. This saved me countless hours debugging later.

## Chapter 9: Security & Privacy (Day 15)

Security was paramount when handling user data:
- OAuth tokens stored securely, never logged
- API rate limiting to prevent abuse
- Input validation with Pydantic v2
- PII scrubbing in error logs
- 24-hour expiring PDF links

I implemented these from day one rather than retrofitting them later.

## Chapter 10: The Launch (Day 16)

The first successful PDF generation was magical. Watching raw GitHub data transform into a professional CV in under 10 seconds felt like witnessing the future of developer tools.

The system worked:
1. User connects GitHub → OAuth flow completes
2. AI agents extract and enhance data → Professional content generated
3. PDF renders with neon design → ATS-ready document created
4. Supabase storage → Secure sharing link provided

## Lessons Learned

1. **Start with architecture**: The LangGraph decision paid dividends in maintainability
2. **AI model selection matters**: Claude for extraction, GPT for creative writing
3. **Performance from day one**: It's harder to optimize later
4. **Test everything**: E2E tests caught integration issues early
5. **Design systems work**: Consistent visual language elevated the entire product

## What's Next

The MVP proved the concept, but the journey continues:
- Multi-page CV templates
- Integration with more data sources
- Real-time collaboration features
- Advanced customization options

This documentary captures not just what was built, but why each decision was made and how the pieces fit together. It's the story of turning a frustrating problem into an elegant solution, one commit at a time.

---

*This documentary is automatically updated as the project evolves. Each major decision and milestone is captured to preserve the reasoning and context behind the codebase.*