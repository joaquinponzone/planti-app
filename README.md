# Planti App

A modern web application built with Next.js 14, TypeScript, and React.

## 🌟 Features

- Modern, responsive UI built with Next.js App Router and React Server Components
- Beautiful component library using Shadcn UI and Radix UI
- Type-safe development with TypeScript
- State management with local storage persistence
- Mobile-first responsive design with Tailwind CSS

## 🚀 Tech Stack

### Frontend
- Next.js 14 with App Router
- TypeScript
- React Server Components
- Shadcn UI / Radix UI
- Tailwind CSS
- Local storage for state persistence

## 📦 Prerequisites

- Node.js 18.x or later
- Bun (recommended)

## 🛠️ Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd planti-app
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required environment variables in `.env.local`

4. Run the development server:
   ```bash
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📝 Development Guidelines

- Follow TypeScript best practices and maintain strict type checking
- Use functional components and hooks for React development
- Implement proper error handling and logging
- Write unit tests for business logic
- Follow the mobile-first approach for responsive design
- Use Server Components by default, only use 'use client' when necessary

## 🔄 Available Scripts

- `bun dev` - Start development server
- `bun build` - Build production bundle
- `bun start` - Start production server
- `bun lint` - Run ESLint
- `bun ios` - Open iOS Simulator

## 🏗️ Project Structure

```