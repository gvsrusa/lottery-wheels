# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lottery wheel PWA for Texas Two Step lottery analysis. It's a React + Vite application that generates dynamic 4-of-N lottery combinations with optional bonus number handling and prize tier filtering.

## Development Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Architecture

- **Frontend Framework**: React 19.1.1 with modern hooks (useState, useMemo)
- **Build Tool**: Vite 7.1.6 with React plugin
- **Styling**: Tailwind CSS v4 with custom theme extensions and dark gradient design
- **Linting**: ESLint with React hooks and refresh plugins
- **Entry Point**: `src/main.jsx` renders the root App component
- **Main Component**: `src/App.jsx` - complete lottery combination generator

## Application Structure

The app is a single-page application with:
- **Pool Selection**: Users select 4-25 numbers from 1-35 for their lottery pool
- **Bonus Candidates**: Optional selection of up to 6 bonus numbers
- **Drawn Numbers**: Input for exactly 4 drawn main numbers and optional bonus
- **Tier Filtering**: Checkboxes for different prize tiers (4/4, 3/4, 2/4 with/without bonus)
- **Combination Generation**: Generates all possible 4-number combinations from the pool
- **Results Display**: Shows matching combinations in a sortable table with CSV export

## Key Features

- **Mathematical Functions**: `nCk()` for combinations, `kCombinations()` for generating all k-combinations
- **CSV Export**: `toCSV()` function generates downloadable CSV files
- **Responsive Design**: Grid layouts that adapt from mobile to desktop
- **Real-time Validation**: Immediate feedback on user inputs and constraints
- **Prize Tier Logic**: Calculates matches and bonus hits for different payout levels

## Code Conventions

- Uses modern ES modules and React function components exclusively
- PascalCase for components, camelCase for functions and variables
- Two-space indentation
- Tailwind utility classes for all styling
- No external state management - uses React's built-in useState and useMemo