# Waste Management System

A Next.js web application for managing waste management operations with dedicated dashboards for administrators and officers.

## Features

- **Admin Dashboard**: Complete administrative interface for managing the waste management system
- **Officer Dashboard**: Dedicated interface for field officers to manage assigned tasks
- **Reports Management**: Track and manage waste collection reports
- **Analytics**: View system analytics and insights
- **Organizations Management**: Manage organizations and their waste management operations

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Maps**: Leaflet

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
├── app/
│   ├── admin/          # Admin dashboard pages
│   ├── officer/        # Officer dashboard pages
│   ├── login/          # Authentication page
│   ├── layout.tsx      # Root layout
│   └── globals.css     # Global styles
├── components/         # Reusable components
├── lib/               # Utility functions and API clients
└── public/            # Static assets
```

## Environment Variables

Create a `.env.local` file in the root directory for environment-specific configuration:

```env
# API Configuration
NEXT_PUBLIC_API_URL=your_api_url_here
```

## License

Private project - All rights reserved

