# 🏍️ My Ride - Vehicle & Service Lifecycle Manager

A modern, minimalist, 100% offline-first Progressive Web App (PWA) designed to track and manage the full lifecycle of multiple bikes, motorcycles, scooters, cars, and EVs. Built with **React 18**, **TypeScript**, **Tailwind CSS**, **Dexie.js (IndexedDB)**, and **Recharts**, following the sleek **shadcn/ui** design system with complete **Dark & Light** mode support.

---

## 🌟 Key Features

- **🏍️ Multi-Vehicle Fleet / Garage**: Add and switch between multiple bikes, scooters, cars, or EVs with live odometer tracking, specifications, and custom tags.
- **⛽ Fuel & Petrol Log Tracker**: Quick logging with auto-populated current date/time, odometer tracking, full-tank indicator, automatic mileage ($\text{km/L}$ or $\text{mi/gal}$) calculations, and running cost per unit distance.
- **🔧 Service & Maintenance Center**: Track periodic maintenance (engine oil, brake pads, chain lubrication, tyres, battery swaps, custom repairs) with itemized parts breakdown and mechanic advice.
- **📄 Documents & Expiry Alerts**: Track Insurance policy and PUC (Pollution certificate) validity with countdown alert badges.
- **⏰ Maintenance Reminders**: Set reminders by Target Odometer reading (e.g. *Next service at 10,000 km*) or Due Date with one-tap completion.
- **📊 Visual Analytics**: Monthly spending trends, cost distribution charts, and fuel mileage performance curves over time.
- **🌓 shadcn/ui Dark & Light Mode**: Clean, high-contrast monochrome design with zero dual-sided scrollbars and full mobile touch optimization.
- **🔒 100% Client-Side & Offline-First**: Zero external servers or databases. All data is stored in the browser using IndexedDB via Dexie.js.
- **📦 Full Backup & Restore**: Export all your data to a single `.json` file and restore it on any device.
- **📱 Installable PWA**: Install directly to mobile or desktop home screen with full offline caching.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation
```bash
# Clone repository
git clone https://github.com/zexhan17/my-ride.git

# Navigate to project directory
cd my-ride

# Install dependencies
npm install

# Start local dev server
npm run dev
```

### Running Automated Tests
```bash
# Run unit & integration test suite (Vitest + React Testing Library)
npm test

# Run tests in watch mode
npm run test:watch
```

### Building for Production
```bash
npm run build
```

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui Design Tokens
- **Local Storage**: Dexie.js (IndexedDB)
- **Visualizations**: Recharts
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa + Workbox
- **Testing**: Vitest + React Testing Library + jest-dom + fake-indexeddb

---

## 📄 License
MIT License
