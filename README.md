# 24 Solar Terms - React Version

This is a React port of the 24 Solar Terms interactive web application.

## About

An interactive exploration of the traditional Chinese 24 solar terms (二十四节气), featuring:
- Interactive solar dial visualization
- Detailed pages for each solar term
- Beautiful traditional Chinese aesthetics
- P5.js animations

## Features

- **Landing Page**: Interactive dial showing all 24 solar terms with animations
- **Terms List**: Grid view of all solar terms
- **Term Detail Pages**: Detailed information about each term including phases, poems, and rituals

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd 24-solar-terms-react

# Install dependencies (if not already installed)
npm install

# Start development server
npm start
```

The app will open in your browser at [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Project Structure

```
24-solar-terms-react/
├── public/
│   ├── css/           # Original CSS files
│   ├── assets/        # Images, fonts, and other assets
│   └── data/          # JSON data for terms
├── src/
│   ├── components/    # React components
│   │   ├── P5Wrapper.js       # P5.js animation wrapper
│   │   ├── SolarDial.js       # Interactive solar term dial
│   │   └── BackCorner.js      # Drag-to-return component
│   ├── pages/         # Page components
│   │   ├── Landing.js         # Landing page with dial
│   │   ├── TermsList.js       # List of all terms
│   │   └── TermDetail.js      # Individual term details
│   ├── data/
│   │   └── termsData.js       # Term constants and data
│   ├── App.js         # Main app with routing
│   └── index.js       # Entry point
└── package.json
```

## Technologies Used

- **React** - UI framework
- **React Router** - Navigation and routing
- **P5.js** - Interactive animations
- **CSS** - Original styling preserved

## React-First Architecture Notes

- Source of truth is in [src/](src/): pages, components, hooks, and data modules.
- P5 is loaded from npm (`p5`) in React components, not a CDN script.
- Term background now runs as a React-managed p5 instance in [src/components/TermBackground.js](src/components/TermBackground.js), with seasonal theme mapping in [src/lib/termBackgroundTheme.js](src/lib/termBackgroundTheme.js).
- `public/` is treated as static assets/template only.
- `build/` is generated output and should not be manually edited.

## Original Project

This is a React conversion of the original vanilla JavaScript project located at:
`/Users/tata/24 solar terms/`

See [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) for detailed migration notes.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (irreversible)

## License

This project is for educational purposes.
