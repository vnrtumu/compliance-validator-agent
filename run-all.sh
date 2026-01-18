#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GST Compliance Validator - Start All ${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}⚠️  Shutting down all services...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

# 1. Start Mock GST Server (FastAPI version - uses backend venv)
echo -e "${GREEN}📡 Starting Mock GST Server...${NC}"
cd "$SCRIPT_DIR/compliance-backend"
source venv/bin/activate
cd "$SCRIPT_DIR/agentic-ai-assesment (1)"
python3 mock_gst_server_api.py &
GST_PID=$!
echo -e "${GREEN}✓ Mock GST Server started (PID: $GST_PID) - http://localhost:8080${NC}\n"
sleep 2

# 2. Start Backend (FastAPI)
echo -e "${GREEN}🔧 Starting FastAPI Backend...${NC}"
cd "$SCRIPT_DIR/compliance-backend"
source venv/bin/activate 2>/dev/null || echo "Warning: venv not found, using system Python"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID) - http://localhost:8000${NC}\n"
sleep 3

# 3. Start Frontend (React + Vite)
echo -e "${GREEN}🎨 Starting React Frontend...${NC}"
cd "$SCRIPT_DIR/compliance-validator-agent"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID) - http://localhost:5173${NC}\n"

# Display status
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All services are running!${NC}"
echo -e "${BLUE}========================================${NC}\n"
echo -e "📡 ${YELLOW}Mock GST Server:${NC}  http://localhost:8080"
echo -e "🔧 ${YELLOW}Backend API:${NC}      http://localhost:8000"
echo -e "📚 ${YELLOW}API Docs:${NC}         http://localhost:8000/docs"
echo -e "🎨 ${YELLOW}Frontend:${NC}         http://localhost:5173"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Wait for all background processes
wait
