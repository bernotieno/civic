# County Projects Frontend Setup

## Overview
A minimal React + TypeScript + Tailwind frontend for displaying county projects with feedback functionality.

## Features
- Project list page with cards displaying project information
- Project details page with full description and feedback form
- Responsive design with Tailwind CSS
- Mock API simulation with realistic data
- Success feedback for form submissions

## Tech Stack
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Mock data simulation

## File Structure
```
src/
├── components/
│   ├── ProjectList.tsx      # Main project listing page
│   └── ProjectDetails.tsx   # Individual project details with feedback
├── data/
│   └── projects.ts          # Mock project data and TypeScript interfaces
└── App.tsx                  # Updated with new routes
```

## Installation & Setup

1. **Install dependencies** (if not already installed):
```bash
cd frontend
npm install @tailwindcss/line-clamp
```

2. **Start the development server**:
```bash
npm run dev
```

## Usage

### Accessing the Projects
- Navigate to `/projects` to see the project list
- Click "View Details" on any project card to see full details
- Submit feedback on the project details page

### Routes
- `/projects` - Project list page
- `/project/:id` - Individual project details page

## Mock Data
The application uses mock data from `src/data/projects.ts` that simulates the `/public-updates` API endpoint. The data includes:
- Project name and description
- County information
- Budget and timeline
- Project status (ongoing, completed, planned)
- Category classification

## Components

### ProjectList
- Fetches and displays projects in a responsive grid
- Shows project cards with key information
- Includes loading state simulation
- Status badges with color coding

### ProjectDetails
- Displays full project information
- Includes feedback submission form
- Success message simulation
- Navigation back to project list

## Styling
- Fully responsive design
- Clean, modern UI with Tailwind CSS
- Hover effects and transitions
- Status-based color coding
- Mobile-first approach

## Future Integration
The components are designed for easy integration with real API endpoints:
- Replace mock data imports with actual API calls
- Update the fetch simulation in useEffect hooks
- Add error handling for network requests
- Implement proper form validation and submission