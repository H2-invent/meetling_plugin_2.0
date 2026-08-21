import { extractWebSocketParamsFromDashboard } from './extractWebSocketParams.js';
import { connectWebSocket } from './webSocketConnect.js';
import { socket } from './webSocketClient.js';

export async function initWebSocket(meetlingAddonBaseUrl) {
  if (socket && socket.connected) {
    console.log("⚠️ WebSocket bereits verbunden, initialisiere nicht erneut.");
    return;
  }

  try {
    const { websocketUrl, websocketTopics } = await extractWebSocketParamsFromDashboard(meetlingAddonBaseUrl);

    if (!websocketUrl || !websocketTopics) {
      console.warn("⚠️ WebSocket-Parameter fehlen, Verbindung wird nicht hergestellt.");
      return;
    }
    console.log("✅ Initialisiere Websocket.");
    connectWebSocket(meetlingAddonBaseUrl, websocketUrl, websocketTopics);
  } catch (err) {
    console.error("❌ Fehler beim Initialisieren der WebSocket-Verbindung:", err);
  }
}