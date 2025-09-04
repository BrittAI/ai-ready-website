# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Ready Website is a Next.js application that analyzes websites for AI readiness and LLM compatibility. It uses Firecrawl for web scraping and provides detailed scoring across multiple metrics like content readability, metadata quality, semantic HTML, and accessibility.

## Development Commands

- **Development server**: `npm run dev` (runs on http://localhost:3000)
- **Build**: `npm run build`
- **Production server**: `npm run start`
- **Lint**: `npm run lint`

## Environment Setup

Required environment variables in `.env.local`:
```bash
OPENAI_API_KEY=your_openai_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

## Architecture

### Core Technologies
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** with custom design system
- **Framer Motion** for animations
- **Firecrawl SDK** (@mendable/firecrawl-js) for web scraping
- **Radix UI** components for accessibility
- **PIXI.js** for canvas animations

### Component Architecture

Components follow a strict hierarchy defined in `.cursor/rules/`:

```
components/
├── ui/              # Raw, unstyled base components
│   ├── shadcn/      # ShadCN UI components
│   └── magic/       # Special effect components
├── shared/          # Reusable components (used in 2+ places)
│   ├── buttons/     # Fire-themed buttons
│   ├── effects/     # Flame effects and animations  
│   ├── header/      # Navigation components
│   └── layout/      # Layout utilities
└── app/             # Page-specific components
    └── (home)/      # Home page sections
        └── sections/ # Major page sections
```

### Design System

The application uses a **fire-inspired design system**:

- **Colors**: Heat scale from `heat-4` to `heat-200` (CSS custom properties)
- **Typography**: SuisseIntl font with predefined classes (`.title-h1` to `.label-x-small`)
- **Animations**: Fire flicker effects, glows, and smooth transitions
- **UI Patterns**: Rounded corners (`rounded-12`), orange glows, scale effects on interaction

### Key API Routes

- `/api/ai-readiness` - Main analysis endpoint that:
  - Scrapes website content using Firecrawl
  - Analyzes HTML structure, readability, metadata
  - Checks robots.txt, sitemap.xml, llms.txt files
  - Returns weighted scoring with recommendations

- `/api/check-config` - Validates environment configuration
- `/api/ai-analysis` - Enhanced AI analysis using OpenAI
- `/api/check-llms` - Specialized LLMs.txt validation

### Analysis Scoring

The AI readiness score uses weighted categories:
- **Content Quality** (High weight): Readability (1.5x), Heading structure (1.4x), Metadata (1.2x)
- **Technical SEO** (Medium weight): Robots.txt (0.9x), Sitemap (0.8x)
- **Modern Standards** (Standard weight): Semantic HTML (1.0x), Accessibility (0.9x)
- **AI-Specific** (Low weight): LLMs.txt (0.3x)

### State Management

Uses React state with controlled components. Key state patterns:
- URL input validation with error handling
- Analysis phases with loading states
- Results display with animated transitions
- Real-time scoring visualization

### Styling Guidelines

1. **Import order**: `styles/main.css` globally, component-specific styles in `/styles/components/`
2. **Color usage**: Use CSS custom properties (`var(--heat-100)`) over Tailwind color classes
3. **Typography**: Use predefined classes (`.body-large`, `.title-h2`) instead of Tailwind text utilities
4. **Animations**: Framer Motion for page transitions, CSS for hover effects

## File Organization

- **Styles**: Modular CSS in `/styles/` with design system tokens
- **Utilities**: Helper functions in `/utils/`
- **Hooks**: Custom React hooks in `/hooks/`
- **Types**: Component prop interfaces defined inline or in context files
- **Assets**: Images and static files in `/public/`

## Development Notes

- Component styles should follow the fire theme (orange/heat colors, rounded corners, glow effects)
- All new shared components must be used in 2+ locations
- Use TypeScript interfaces for all props
- Follow the existing import patterns shown in cursor rules
- Maintain the semantic HTML structure for accessibility and AI compatibility