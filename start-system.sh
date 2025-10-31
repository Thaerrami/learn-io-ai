#!/bin/bash

# Learn.io AI - System Startup Script
# This script helps you start all required services

echo "🚀 Learn.io AI - RAG System Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker Desktop first."
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  No .env.local file found${NC}"
    echo ""
    echo "Creating .env.local template..."
    cat > .env.local << EOF
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# ChromaDB Configuration
CHROMA_URL=http://localhost:8000
EOF
    echo -e "${BLUE}📝 Created .env.local${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env.local and add your OpenAI API key!${NC}"
    echo ""
    read -p "Press Enter after you've added your API key..."
fi

echo -e "${GREEN}✅ Environment file found${NC}"
echo ""

# Check if ChromaDB is already running
if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    echo -e "${GREEN}✅ ChromaDB is already running${NC}"
else
    echo -e "${YELLOW}⚠️  ChromaDB is not running${NC}"
    echo "Starting ChromaDB in Docker..."
    echo ""
    
    # Start ChromaDB in background
    docker run -d --name chromadb -p 8000:8000 chromadb/chroma
    
    echo "Waiting for ChromaDB to start..."
    sleep 5
    
    if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ChromaDB started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start ChromaDB${NC}"
        echo "Please check Docker logs: docker logs chromadb"
        exit 1
    fi
fi

echo ""

# Check if PDFs are ingested
echo "Checking if PDFs are ingested..."
COLLECTION_COUNT=$(curl -s http://localhost:3000/api/ingest-pdf 2>/dev/null | grep -o '"document_count":[0-9]*' | grep -o '[0-9]*')

if [ -z "$COLLECTION_COUNT" ] || [ "$COLLECTION_COUNT" -eq "0" ]; then
    echo -e "${YELLOW}⚠️  PDFs not ingested yet${NC}"
    echo ""
    read -p "Do you want to ingest PDFs now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Ingesting PDFs..."
        npm run chroma:ingest
        echo ""
        echo -e "${GREEN}✅ PDFs ingested successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping PDF ingestion. Run 'npm run chroma:ingest' later.${NC}"
    fi
else
    echo -e "${GREEN}✅ Found $COLLECTION_COUNT documents in ChromaDB${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}🎉 System is ready!${NC}"
echo "=================================="
echo ""
echo "📍 Available at:"
echo "   🏠 Home:            http://localhost:3000"
echo "   📚 Chapter Summary: http://localhost:3000/chapter-summary"
echo "   🎓 MCQ Generator:   http://localhost:3000/mcq-demo"
echo ""
echo "🛠️  Useful commands:"
echo "   Stop ChromaDB:   docker stop chromadb"
echo "   Start ChromaDB:  docker start chromadb"
echo "   View logs:       docker logs chromadb"
echo "   Ingest PDFs:     npm run chroma:ingest"
echo ""
echo -e "${BLUE}Happy learning! 🎓✨${NC}"


