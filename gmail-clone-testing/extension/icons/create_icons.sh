#!/bin/bash
# Create minimal placeholder icons using base64-encoded PNGs

# Minimal 16x16 blue PNG (base64)
echo "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAEklEQVR4nGP8z8DwH4H/MzIwAAD9nA" | base64 -d > icon16.png

# Minimal 48x48 blue PNG (base64)  
echo "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAEklEQVR4nGP8z8DwH4H/MzIwAAD9nA" | base64 -d > icon48.png

# Minimal 128x128 blue PNG (base64)
echo "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAEklEQVR4nGP8z8DwH4H/MzIwAAD9nA" | base64 -d > icon128.png

echo "Created placeholder icons (minimal blue PNGs)"
