#!/bin/bash

# HCMUTE Chatbot Update Helper
# Helps manage Docker deployment for Development and Production

echo "=== Select Update Mode ==="
echo "1) Development - Fresh Update (Recreate Clean)"
echo "2) Development - Update (No Delete)"
echo "3) Production  - Fresh Update (Recreate Clean + Prune)"
echo "4) Production  - Update (No Delete)"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo "Running Development Fresh Update..."
        # Clean previous containers
        docker compose -f docker-compose.dev.yml down --remove-orphans
        # Start services
        docker compose -f docker-compose.dev.yml up -d --build
        ;;
    2)
        echo "Running Development Update..."
        # Start/Update services
        docker compose -f docker-compose.dev.yml up -d --build
        ;;
    3)
        echo "Running Production Fresh Update..."
        # Clean previous containers and images
        docker compose -f docker-compose.prod.yml down --remove-orphans
        echo "Pruning system (volumes, images)..."
        docker system prune -a --volumes -f
        # Build and start services
        docker compose -f docker-compose.prod.yml up -d --build
        ;;
    4)
        echo "Running Production Update..."
        # Build and start services
        docker compose -f docker-compose.prod.yml up -d --build
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac
