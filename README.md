# Shopify dummy shop (Inops storefront demo)

This is a **fake Shopify storefront landing page** used to showcase Inops functionality end-to-end against a **local backend**:

- **Campaign landing** via `userInput.type="campaignId"` → featured products
- **Search** via `userInput.type="search"` → summary + vertical product list (auto-runs at 3+ words)
- **Similar products** via `userInput.type="similar_products"` → product modal (right column)

## Local dev setup

1) Create a `.env` file from `env.example` (kept out of git):

```bash
cp env.example .env
```

2) Fill in:

- `VITE_INOPS_API_BASE_URL` (local backend, e.g. `http://127.0.0.1:3000`)
- `VITE_INOPS_SEARCH_KEY` (must belong to the same shopConfig as the campaign)
- `VITE_INOPS_CAMPAIGN_ID` (case-sensitive campaign `referenceId`)

3) Run:

```bash
npm install
npm run dev
```

## API Response Structure

The search form expects API responses in the following format:

```json
{
  "event": "search-result",
  "jobId": "b29e8881-6803-4d55-aa55-5befb1d8aafd",
  "sessionId": "eeb5cb54-05e5-447e-bdd0-06b0e6b5fc5d",
  "timestamp": "2025-07-11T16:19:42.149Z",
  "data": {
    "duration": 1977,
    "request": "Board for 3 years or Surfboard for starter or Longboard for 40cm high waves",
    "response": {
      "widgets": [
        {
          "type": "product",
          "score": 0.27285767,
          "productId": "egpH-pcBUBrQrry7voxs",
          "description": "This is a gift card for the store",
          "category": "giftcard"
        }
      ],
      "accuracy": "high",
      "resultCount": 1,
      "facets": {
        "age_group": "3 years",
        "skill_level": "starter",
        "product_type": "Surfboard, Longboard",
        "wave_height": "40cm"
      },
      "queryUsed": "strictQuery",
      "resolvedQuery": "soft-top longboard for 3 years old beginner 40cm high waves"
    },
    "meta": {
      "jobId": "b29e8881-6803-4d55-aa55-5befb1d8aafd",
      "sessionId": "eeb5cb54-05e5-447e-bdd0-06b0e6b5fc5d"
    },
    "status": "ok"
  },
  "status": "ok"
}
```

## Widget Library

This application can be used as an embeddable widget library. There are two ways to use it:

### Method 1: Simple Embed (Recommended)

Simply add this HTML snippet to any webpage:

```html
<!-- Search Widget -->
<div
  class="textatlas-embed"
  data-widget="search"
  data-id="your-widget-id"
  data-search-key="your-api-key-here"
></div>

<script src="https://your-cdn.com/widget/platform.js" async></script>
```

**Attributes:**

- `data-widget="search"` - Required, identifies the widget type
- `data-search-key` - **Required**, API key for authentication (sent as `x-search-key` header)
- `data-id` - Optional, unique identifier for the widget instance
- `data-api-url` - Optional, custom API endpoint URL
- `data-widget-class` - Optional, custom CSS class
- `data-widget-max-width` - Optional, maximum width (e.g., "600px")

See `public/textatlas-style.html` for live examples.

**How it works:**
- Widget sends search request to `/shop/flow/execute` with `x-search-key` header
- Receives a `sessionId` from the API
- Connects to WebSocket with the API key as token
- Streams search results in real-time via WebSocket events
- Collects results from `products` and `summary-result` events
- Finalizes when `flow-end` event is received

### Method 2: Manual JavaScript API

```html
<div id="my-search"></div>
<script src="./dist/lib/search-widget.standalone.umd.js"></script>
<script>
  const widget = SearchWidget.createSearchWidget();
  widget.mount("#my-search");
</script>
```

See `example.html` for more detailed API usage examples.

## Usage (Standalone App)

1. **Click the search icon** in the bottom left corner to open the search modal
2. **Type your query** - results will appear after a 300ms delay
3. **View results** - each result shows product ID, description, category, and score
4. **Close the modal** by:
   - Clicking the X button
   - Pressing Escape key
   - Clicking outside the modal

## Notes

<<<<<<< Updated upstream
The search form uses environment variables for API configuration. The API endpoint can be configured via the `VITE_API_URL` environment variable.

### Default Configuration

- **URL**: `https://danish-ways-contamination-today.trycloudflare.com/ai/search`
- **Method**: POST
- **Content-Type**: application/json
- **Body**:

```json
{
  "userInput": {
    "type": "search",
    "value": "search term"
  }
}
```

### Environment Variables

Create a `.env` file in the project root to configure the API URL:

```bash
# .env
VITE_API_URL=https://danish-ways-contamination-today.trycloudflare.com/ai/search
```

**Note**: The `.env` file is already added to `.gitignore` to keep sensitive information out of version control.

### Changing the API Endpoint

To use a different API endpoint, you have two options:

#### Option 1: Environment Variable (Recommended)

Create or update your `.env` file:

```bash
VITE_API_URL=https://your-new-api-endpoint.com/search
```

#### Option 2: Update Configuration File

Edit `src/config/api.js` and change the default URL:

```javascript
export const API_CONFIG = {
  SEARCH_URL:
    import.meta.env.VITE_API_URL || "https://your-new-api-endpoint.com/search",
};
```
=======
- This app uses the backend’s `/shop/flow/execute` + SSE session stream (`/sse/session/:id`) with a **SearchKey**.
- If `campaignId` returns empty, it’s usually because:
  - the campaign does not exist for the shopConfig behind the SearchKey, or
  - the campaign `referenceId` casing doesn’t match.
>>>>>>> Stashed changes

### Adjusting Debounce Delay

To change the debounce delay, modify the timeout in `src/components/SearchForm.jsx`:

```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(query);
  }, 500); // Change 300 to your desired delay in milliseconds

  return () => clearTimeout(timer);
}, [query]);
```

### Styling Customization

The component uses Tailwind CSS classes. You can customize the appearance by modifying the className props in the component.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build standalone app
npm run build:app

# Build widget library (with React bundled)
npm run build:lib

# Build widget library (React as external dependency)
npm run build:lib:external

# Build everything (app + both library versions)
npm run build
```

### Building for Widget Deployment

The widget library supports two build modes:

1. **Standalone** (`build:lib`): Includes React in the bundle - best for embedding in non-React sites
2. **External** (`build:lib:external`): React as peer dependency - best for React applications

After building, you'll find:

- `dist/lib/search-widget.standalone.umd.js` - Standalone widget library
- `dist/lib/platform.js` - TextAtlas-style platform loader
- `dist/lib/search-widget.external.*.js` - Library for React apps

## Technologies Used

- React 19
- Tailwind CSS 4
- Vite
- JavaScript (ES6+)

## File Structure

```
src/
├── components/
│   └── SearchForm.jsx      # Main search component
├── config/
│   └── api.js              # API configuration
├── services/
│   └── mockApi.js          # Mock API (kept for reference)
├── App.jsx                 # Main app component
├── App.css                 # App styles
└── main.jsx               # App entry point
```
