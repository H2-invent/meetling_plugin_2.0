import { extractWebSocketParamsFromDashboard } from './extractWebSocketParams.js';
import { connectWebSocket } from './webSocketConnect.js';
import { socket } from './webSocketClient.js';

export async function initWebSocket(meetlingAddonBaseUrl) {
  if (socket && socket.connected) {
    console.log("⚠️ WebSocket bereits verbunden, initialisiere nicht erneut.");
    return;
  }

  try {
    // Prefer using the extension-JWT from the login check.
    // - /room/contact/api liefert personal/<uid> + extension/<uid>).
    // Dashboard subscribes only to personal/<uid> — extension is invisible to ring logic
    let websocketUrl, websocketTopics;
    const stored = await chrome.storage.local.get(["websocketUrl", "websocketTopics"]);
    if (stored.websocketUrl && stored.websocketTopics) {
      ({ websocketUrl, websocketTopics } = stored);
    } else {
      const params = await extractWebSocketParamsFromDashboard(meetlingAddonBaseUrl);
      ({ websocketUrl, websocketTopics } = params);
    }

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