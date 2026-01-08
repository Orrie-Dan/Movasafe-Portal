# Movasafe Portal

A Next.js web application for managing Movasafe digital wallet and payment platform operations with dedicated admin portal for transaction, wallet, and escrow management.

## Features

- **Admin Dashboard**: Complete administrative interface for managing transactions, wallets, and escrow payments
- **Transaction Management**: Track and manage all wallet transactions, transfers, and escrow payments
- **Wallet Management**: Monitor wallet balances, reserved balances, and savings
- **Escrow Management**: Manage escrow payments, approvals, releases, and refunds
- **Analytics**: View transaction analytics, commission trends, and wallet distribution
- **Merchant Management**: Manage merchants/vendors and their escrow operations
- **User Management**: Manage users (clients, vendors, admins) with KYC verification

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

