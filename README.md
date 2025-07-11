# Search Form with Debounce

A React application featuring a search form with debounce functionality that sits at the bottom left of the screen as an icon and expands to the center when clicked.

## Features

- **Floating Search Icon**: Always visible at the bottom left corner
- **Modal Search Interface**: Expands to center screen when clicked
- **Debounced Search**: 300ms delay to prevent excessive API calls
- **Real-time Results**: Displays search results as you type
- **Keyboard Support**: Press Escape to close the modal
- **Click Outside**: Click outside the modal to close
- **Loading States**: Shows loading spinner during search
- **Responsive Design**: Works on all screen sizes
- **Tailwind CSS**: Modern, clean UI design

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

## Usage

1. **Click the search icon** in the bottom left corner to open the search modal
2. **Type your query** - results will appear after a 300ms delay
3. **View results** - each result shows product ID, description, category, and score
4. **Close the modal** by:
   - Clicking the X button
   - Pressing Escape key
   - Clicking outside the modal

## API Configuration

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
  SEARCH_URL: import.meta.env.VITE_API_URL || 'https://your-new-api-endpoint.com/search',
};
```

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

# Build for production
npm run build
```

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
