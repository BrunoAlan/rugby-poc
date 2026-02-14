#!/bin/bash

echo "🛑 Deteniendo ngrok..."

if pkill ngrok; then
    echo "✅ ngrok detenido correctamente"
else
    echo "ℹ️  ngrok no estaba corriendo"
fi
