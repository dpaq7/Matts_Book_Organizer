# Book Organizer Frontend

A modern, responsive SvelteKit frontend for Matt's Book Organizer.

## Features

🔍 **Smart Search & Filtering**
- Real-time search across title, author, publisher
- Filter by shelf, rating, and reading status
- Debounced search for optimal performance

📚 **Complete Book Management**
- Grid and list view toggles
- Detailed book pages with full editing
- Add new books with rich forms
- Book Equivalent (BEq) calculations

📊 **Rich Statistics Dashboard**
- Reading overview with visual charts
- Top authors and rating distributions
- Yearly reading trends
- Mobile-optimized data visualization

🎨 **Modern UI/UX**
- Dark/light theme toggle
- Responsive mobile-first design
- Touch-friendly interface
- Smooth animations and transitions

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**: http://localhost:5173

### Backend Configuration

Update the API URL in `src/lib/api.ts`:

```typescript
const API_BASE_URL = 'https://your-backend.onrender.com';
```

### Build for Production

```bash
npm run build
npm run preview  # Test production build
```

## Deployment Options

### 1. Netlify (Recommended)
- Connect your GitHub repository to Netlify
- `netlify.toml` is pre-configured
- Update the API proxy URL in `netlify.toml`

### 2. Vercel
- Connect repository to Vercel
- `vercel.json` is pre-configured  
- Update the API proxy URL in `vercel.json`

### 3. Static Hosting
- Build with `npm run build`
- Deploy the `build/` directory to any static host
- Configure API requests to your backend URL

## Configuration

### Environment Variables

Create `.env` file for local development:

```bash
VITE_API_URL=http://localhost:8000
```

### API Proxy

For development, the Vite config includes a proxy:
- Frontend requests to `/api/*` → Backend `http://localhost:8000/*`

For production, configure your hosting platform to proxy API requests.

## Project Structure

```
src/
├── app.html              # HTML template
├── app.css              # Global styles (TailwindCSS)
├── lib/
│   ├── api.ts           # API client and types
│   ├── stores.ts        # Svelte stores for state
│   └── components/      # Reusable components
│       ├── BookCard.svelte
│       └── SearchFilters.svelte
└── routes/              # SvelteKit file-based routing
    ├── +layout.svelte   # App layout with navigation
    ├── +page.svelte     # Home page (book library)
    ├── add/             # Add book page
    ├── book/[id]/       # Book details page
    └── stats/           # Statistics dashboard
```

## Tech Stack

- **SvelteKit** - Meta-framework for fast, modern web apps
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Vite** - Lightning-fast build tool

## Key Features

### Book Equivalent (BEq) Display
Shows relative book sizes compared to your reading average:
- `1.2× larger` for books above average
- `85% size` for books below average

### Smart State Management
- Client-side filtering for instant feedback
- Optimistic updates for better UX
- Error handling with retry capabilities

### Mobile-First Design
- Touch-friendly buttons and navigation
- Responsive grid layouts
- Dark mode optimized for reading

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details