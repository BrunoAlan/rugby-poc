#\!/bin/bash

echo "🚀 Iniciando ngrok para Rugby Stats..."
echo ""

# Start ngrok in background
nohup ngrok http 3000 > ngrok.log 2>&1 &
NGROK_PID=$\!

echo "⏳ Esperando que ngrok inicie..."
sleep 3

# Get public URL
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o "https://[a-z0-9-]*\.ngrok-free\.app" | head -1)

if [ -n "$PUBLIC_URL" ]; then
    echo "✅ ngrok está corriendo\!"
    echo ""
    echo "📱 URL pública: $PUBLIC_URL"
    echo "📊 Dashboard: http://localhost:4040"
    echo "🔧 PID: $NGROK_PID"
    echo ""
    echo "Para detener ngrok: kill $NGROK_PID"
    echo "O ejecuta: pkill ngrok"
else
    echo "❌ Error: No se pudo obtener la URL de ngrok"
    echo "Revisa ngrok.log para más detalles"
fi
