# Compliance Validator Agent

A modern, agent-centric React application designed to automate and visualize the compliance validation process for financial documents. This project implements a sophisticated UI with glassmorphism aesthetics and standalone management screens for multi-agent systems.

## 🚀 Key Features

- **Executive Dashboard**: High-level overview of invoices processed, compliance rates, and active regulatory flags.
- **Invoice Management**: Detailed list of scanned files with point-by-point compliance scores based on a 58-point validation framework.
- **Multi-Agent Control Center**: Standalone screen to monitor AI agent reasoning chains (Extractor, Validator, Resolver, Reporter).
- **Compliance Insights**: Category-wise breakdown (GST, TDS, Arithmetic, Policy) with 90-day trend visualizations.
- **System Settings**: Configurable AI engines (GPT-4o, Claude, Llama), API gateway management, and notification preferences.
- **Interactive File Upload**: Functional file selection zone with dynamic UI updates and validation triggers.

## 🛠️ Tech Stack

- **Framework**: [React.js](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Vanilla CSS (Custom Design System with Glassmorphism)
- **Icons**: Emoji-based and CSS-drawn components
- **State Management**: React Hooks (useState, useRef)

## 📦 Project Structure

```text
src/
├── components/
│   ├── AgentCenter.jsx      # Standalone Agent Monitoring
│   ├── ComplianceReports.jsx # Analytics & Trends
│   ├── Dashboard.jsx        # Main Overview & Upload
│   ├── Invoices.jsx         # Detailed Scanned List
│   ├── Settings.jsx         # System Configuration
│   └── Sidebar.jsx          # Global Navigation
├── App.jsx                   # Routing & Screen Management
├── index.css                # Global Design Tokens
└── main.jsx                 # Entry Point
```

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vnrtumu/compliance-validator-agent.git
   cd compliance-validator-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📖 Framework Overview

The application validates invoices against a **58-point compliance framework** across five core categories:
1. **Document Authenticity**: Signature and seal verification.
2. **GST Compliance**: GSTIN validation and state code matching.
3. **Extraction & Arithmetic**: Data accuracy and mathematical cross-checks.
4. **TDS Compliance**: Section-wise deduction accuracy.
5. **Business Policy**: Internal rule-set validation.

---
Developed as part of the Agentic AI Test Challenge.
