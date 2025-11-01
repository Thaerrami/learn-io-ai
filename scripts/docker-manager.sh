#!/bin/bash

# ChromaDB Docker Management Script
# Usage: ./scripts/docker-manager.sh [start|stop|restart|status|logs|clean]

CONTAINER_NAME="chromadb-learn-io"
CHROMA_PORT=8000

case "$1" in
    start)
        echo "🚀 Starting ChromaDB container..."
        
        # Check if container already exists and is running
        if docker ps | grep -q $CONTAINER_NAME; then
            echo "✅ ChromaDB is already running"
            echo "   Container: $CONTAINER_NAME"
            echo "   URL: http://localhost:$CHROMA_PORT"
            exit 0
        fi
        
        # Check if container exists but is stopped
        if docker ps -a | grep -q $CONTAINER_NAME; then
            echo "♻️  Restarting existing container..."
            docker start $CONTAINER_NAME
        else
            # Kill any process using port 8000
            echo "🔍 Checking port $CHROMA_PORT..."
            if lsof -ti:$CHROMA_PORT; then
                echo "⚠️  Port $CHROMA_PORT is in use. Stopping conflicting processes..."
                # Stop any existing ChromaDB containers
                docker ps | grep chromadb | awk '{print $1}' | xargs -r docker stop
                docker ps | grep :8000 | awk '{print $1}' | xargs -r docker stop
                sleep 2
            fi
            
            echo "🐳 Creating new ChromaDB container..."
            docker run -d \
                --name $CONTAINER_NAME \
                -p $CHROMA_PORT:8000 \
                -v chromadb-data:/data \
                chromadb/chroma
        fi
        
        # Wait for ChromaDB to start
        echo "⏳ Waiting for ChromaDB to start..."
        for i in {1..10}; do
            if curl -s http://localhost:$CHROMA_PORT/api/v1/heartbeat > /dev/null 2>&1; then
                echo "✅ ChromaDB is running!"
                echo "   Container: $CONTAINER_NAME"
                echo "   URL: http://localhost:$CHROMA_PORT"
                echo "   Status: Ready"
                break
            fi
            echo "   Attempt $i/10..."
            sleep 2
        done
        ;;
        
    stop)
        echo "🛑 Stopping ChromaDB container..."
        if docker ps | grep -q $CONTAINER_NAME; then
            docker stop $CONTAINER_NAME
            echo "✅ ChromaDB stopped"
        else
            echo "⚠️  ChromaDB container not running"
        fi
        ;;
        
    restart)
        echo "♻️  Restarting ChromaDB..."
        $0 stop
        sleep 2
        $0 start
        ;;
        
    status)
        echo "📊 ChromaDB Status:"
        echo ""
        
        # Check if container exists
        if docker ps -a | grep -q $CONTAINER_NAME; then
            if docker ps | grep -q $CONTAINER_NAME; then
                echo "✅ Container Status: Running"
                
                # Check API availability
                if curl -s http://localhost:$CHROMA_PORT/api/v1/heartbeat > /dev/null 2>&1; then
                    echo "✅ API Status: Available"
                    echo "✅ URL: http://localhost:$CHROMA_PORT"
                    
                    # Try to get version info
                    VERSION=$(curl -s http://localhost:$CHROMA_PORT/api/v1/version 2>/dev/null | grep -o '"[^"]*"' | head -1 | tr -d '"' || echo "unknown")
                    echo "📋 Version: $VERSION"
                else
                    echo "❌ API Status: Not responding"
                fi
            else
                echo "❌ Container Status: Stopped"
            fi
        else
            echo "❌ Container Status: Not created"
        fi
        
        echo ""
        echo "📋 Port Information:"
        if lsof -ti:$CHROMA_PORT > /dev/null 2>&1; then
            echo "   Port $CHROMA_PORT: In use"
            lsof -i:$CHROMA_PORT | head -5
        else
            echo "   Port $CHROMA_PORT: Available"
        fi
        ;;
        
    logs)
        echo "📋 ChromaDB Logs (last 50 lines):"
        echo "=================================="
        if docker ps -a | grep -q $CONTAINER_NAME; then
            docker logs --tail 50 $CONTAINER_NAME
        else
            echo "❌ ChromaDB container not found"
        fi
        ;;
        
    clean)
        echo "🧹 Cleaning up ChromaDB..."
        
        # Stop and remove container
        if docker ps -a | grep -q $CONTAINER_NAME; then
            docker stop $CONTAINER_NAME 2>/dev/null
            docker rm $CONTAINER_NAME 2>/dev/null
            echo "✅ Removed container: $CONTAINER_NAME"
        fi
        
        # Clean up orphaned containers
        ORPHANS=$(docker ps -a | grep chromadb | awk '{print $1}')
        if [ ! -z "$ORPHANS" ]; then
            echo "🧹 Cleaning orphaned ChromaDB containers..."
            echo $ORPHANS | xargs docker stop 2>/dev/null
            echo $ORPHANS | xargs docker rm 2>/dev/null
        fi
        
        echo "✅ Cleanup complete"
        ;;
        
    *)
        echo "ChromaDB Docker Management Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start    - Start ChromaDB container"
        echo "  stop     - Stop ChromaDB container"
        echo "  restart  - Restart ChromaDB container"
        echo "  status   - Show ChromaDB status"
        echo "  logs     - Show container logs"
        echo "  clean    - Remove container and cleanup"
        echo ""
        echo "Examples:"
        echo "  $0 start     # Start ChromaDB"
        echo "  $0 status    # Check if running"
        echo "  $0 clean     # Fix port conflicts"
        ;;
esac
