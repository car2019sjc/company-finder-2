# Apollo.io Company Search Application

A React application for searching companies using the Apollo.io API.

## Setup Instructions

### 1. Environment Variables Configuration

1. Create a `.env` file in the root directory
2. Add your API keys to the `.env` file:

```env
# Apollo.io API Configuration
VITE_APOLLO_API_KEY=your_apollo_api_key_here

# OpenAI API Configuration (for email capture features)
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Getting Your API Keys

**Apollo.io API Key:**
1. Sign up for an Apollo.io account with a paid plan (API access requires a paid plan)
2. Go to your Apollo.io account settings → Integrations → API
3. Copy your API key
4. Add it to the `.env` file

**OpenAI API Key (optional):**
1. Sign up at [OpenAI](https://platform.openai.com)
2. Go to API Keys section
3. Create a new API key
4. Add it to the `.env` file

### 3. Running the Application

```bash
npm install
npm run dev
```

The application uses Vite's proxy configuration to handle CORS issues with the Apollo.io API.

## Features

- Search companies by name, location, and employee count
- View detailed company information including:
  - Company logo and basic info
  - Location and employee count
  - Founded year and revenue
  - Industry and keywords
  - Social media links
- Pagination support for large result sets
- Responsive design for mobile and desktop
- Email capture from company websites
- People search within companies
- Export functionality for leads and companies

## Technical Details

- Built with React, TypeScript, and Tailwind CSS
- Uses Vite proxy to handle CORS issues with Apollo.io API
- Implements proper error handling and loading states
- API keys are configured via environment variables for security
- No manual API key input required in the browser

## Troubleshooting

If you encounter CORS errors:
1. Make sure you're running the development server (`npm run dev`)
2. The Vite proxy should handle CORS automatically
3. Check that your Apollo.io API key is valid and has the necessary permissions

If you get authentication errors:
1. Verify your Apollo.io API key is correct in the `.env` file
2. Ensure your Apollo.io account has a paid plan (free plans don't include API access)
3. Check that your API key has the necessary permissions in your Apollo.io account settings

If the application doesn't work:
1. Make sure the `.env` file exists in the root directory
2. Verify that the API keys are properly formatted in the `.env` file
3. Restart the development server after making changes to the `.env` file