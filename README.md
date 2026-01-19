# Compliance Validator Agent (Frontend)

A modern, agent-centric React application designed to automate and visualize the compliance validation process for financial documents. This acts as the user interface for the Agentic AI Assessment system, connecting to a FastAPI backend and a Mock GST Server.

## 🚀 Key Features

- **Executive Dashboard**: High-level overview of invoices processed, compliance rates, and active regulatory flags.
- **Invoice Management**: Detailed list of scanned files with point-by-point compliance scores based on a 58-point validation framework.
- **Multi-Agent Control Center**:
    - **Live Agent Monitoring**: Real-time visibility into the reasoning chains of the Extractor, Validator, Resolver, and Reporter agents.
    - **Stream Panels**: Dedicated UI components (`*StreamPanel.jsx`) that visualize the step-by-step logic execution of each agent.
- **Compliance Insights**: Category-wise breakdown (GST, TDS, Arithmetic, Policy) with trend visualizations.
- **Dynamic AI Settings**:
    - **LLM Provider Selection**: Configurable AI engines via the Settings page (OpenAI, GROQ, DeepSeek, etc.).
    - **API Key Management**: Secure handling of provider credentials.
- **Interactive File Upload**: Drag-and-drop zone with immediate validation initialization.

## 🛠️ Tech Stack

- **Framework**: [React.js](https://reactjs.org/) (Vite)
- **Styling**: Vanilla CSS with Glassmorphism Design System
- **State Management**: React Hooks
- **API Integration**: RESTful services connecting to FastAPI

## 📦 Project Structure

```text
src/
├── components/
│   ├── AgentCenter.jsx          # Hub for monitoring active agents
│   ├── ComplianceReports.jsx    # Analytics & Trends
│   ├── Dashboard.jsx            # Main Overview & Upload
│   ├── Invoices.jsx             # Detailed Scanned List
│   ├── Settings.jsx             # LLM & System Configuration
│   ├── Sidebar.jsx              # Global Navigation
│   ├── *StreamPanel.jsx         # Live logic visualization components
│   └── ...
├── services/                    # API Integration Layer
│   ├── uploadService.js         # File handling & Invoice fetching
│   ├── settingsService.js       # LLM provider configuration
│   ├── extractionService.js     # Extractor agent API
│   ├── validationService.js     # Validator agent API
│   ├── resolverService.js       # Resolver agent API
│   └── reporterService.js       # Reporter agent API
├── App.jsx                      # Routing & Layout
├── index.css                    # Global Design Tokens
└── main.jsx                     # Entry Point
```

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- Backend services running:
    - **Compliance Backend**: `http://localhost:8000`
    - **Mock GST Server**: `http://localhost:8080`

### Installation & Run

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd compliance-validator-agent
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The app will be available at [http://localhost:5173](http://localhost:5173).

### � Quick Start (Full System)

To run the entire system (Frontend + Backend + Mock Server) simultaneously, use the provided script in the root directory:

```bash
# from the project root
./run-all.sh
```

## 📖 Agent Workflow

1.  **Extraction**: The `Extractor Agent` parses uploaded invoices using the selected LLM.
2.  **Validation**: The `Validator Agent` checks the extracted data against the 58-point framework and live GST data from the Mock Server.
3.  **Resolution**: If discrepancies are found, the `Resolver Agent` attempts to auto-correct or flag them.
4.  **Reporting**: The `Reporter Agent` aggregates findings into actionable insights.

---
Developed as part of the Agentic AI Test Challenge.
