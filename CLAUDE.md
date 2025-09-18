# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a "lottery-wheels" PWA built with React + Vite. Currently it contains the default Vite React template but is intended to become a lottery wheel application.

## Development Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Architecture

- **Frontend Framework**: React 19.1.1 with modern hooks (useState, etc.)
- **Build Tool**: Vite 7.1.6 with React plugin
- **Linting**: ESLint with React-specific rules
- **Entry Point**: `src/main.jsx` renders the root App component
- **Main Component**: `src/App.jsx` - currently a basic counter demo
- **Styling**: CSS files (App.css, index.css)
- **Static Assets**: `public/` directory with Vite logo

## Code Structure

- `src/main.jsx` - Application entry point using React 18+ createRoot API
- `src/App.jsx` - Main application component
- `src/` - All React components and styles
- `public/` - Static assets served directly
- `index.html` - HTML template with root div

## Notes

The project currently contains the default Vite React template. The actual lottery wheel functionality needs to be implemented.