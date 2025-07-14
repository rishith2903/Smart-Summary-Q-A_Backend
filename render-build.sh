#!/usr/bin/env bash
# Render build script for Smart-Summary-Q&A Backend

echo "Starting build process..."

# Install dependencies
npm install

# Create necessary directories
mkdir -p uploads
mkdir -p temp

echo "Build completed successfully!"
