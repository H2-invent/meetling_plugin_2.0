import { io } from './socket.io.esm.js';
import { showMeetlingNotification, openPopup } from './notify.js';
import { socket, setSocket } from './webSocketClient.js';
import { updateBadge } from './chromeBadge.js';
import { updateContactsOnlineStatus } from './updateContactOnlineStatus.js';
import { suppressWebsiteRingtone } from './websiteRingtoneSuppression.js';

let callReceivedRecently = false;
let notificationTimeout = null;

export function connectWebSocket(meetlingAddonBaseUrl, websocketUrl, websocketTopics) {
  if (socket && socket.connected) return;

  const ws = io(websocketUrl, {
    path: '/ws',
    query: { token: websocketTopics },
    transports: ["websocket"]
  });

  ws.on("connect", () => {
    console.log("✅ Verbunden mit dem Server");
    updateBadge(true);
    startStillOnlinePing(socket);
  });

  ws.on("mercure", (rawData) => {
    try {
      const parsed = JSON.parse(rawData);
      console.log("📨 Nachricht empfangen.", parsed);

      if (parsed.type === "call" && parsed.message) {
        callReceivedRecently = true;

        if (notificationTimeout) {
          clearTimeout(notificationTimeout);
          notificationTimeout = null;
          console.log("🔕 Notification wegen Call abgebrochen");
        }

        const href = getCallHref(parsed);

        if (!href) {
          console.warn("⚠️ Anruf ohne gültigen Konferenz-Link ignoriert.");
          return;
        }

        suppressWebsiteRingtone(meetlingAddonBaseUrl).catch(error => {
          console.warn("⚠️ Webseiten-Klingelton konnte nicht unterdrückt werden:", error);
        });

        openPopup(
          parsed.pushMessage || "Eingehender Ad-hoc-Anruf",
          new URL(href, meetlingAddonBaseUrl).href,
          "Meetling-Anruf",
          "sounds/ringtone.mp3",
          0.8
        );
        setTimeout(() => {
          callReceivedRecently = false;
        }, 1500);
        return;
      }
      if (parsed.type === "notification" && parsed.message) {
        notificationTimeout = setTimeout(() => {
          if (!callReceivedRecently) {
            showMeetlingNotification(parsed.message, meetlingAddonBaseUrl + '/room/dashboard', parsed.title, parsed.messageId);
          } else {
            console.log("🔕 Notification unterdrückt wegen Call");
          }
          notificationTimeout = null;
        }, 1000);
      }

    } catch (err) {
      console.error("❌ Fehler beim Parsen:", err);
    }
  });

  ws.on("sendOnlineUser", (rawData) => {
    const parsed = JSON.parse(rawData);
    updateContactsOnlineStatus(parsed);
  });

  ws.on("disconnect", () => {
    console.warn("🔌 WebSocket getrennt");
    updateBadge(false);
  });

  ws.on('connect_error', (err) => {
    console.log("❌ Socket disconnected:", err);
    updateBadge(false);
  });

  ws.on("error", (err) => {
    console.error("❌ Socket-Fehler:", err);
    updateBadge(false);
  });

  setSocket(ws);

}

function getCallHref(parsed) {
  if (typeof parsed.href === "string" || typeof parsed.url === "string") {
    return parsed.href || parsed.url;
  }

  if (typeof parsed.message !== "string") {
    return null;
  }

  const html = parsed.message
  .replace(/\\"/g, '"')
  .replace(/\\\//g, '/');

  return html.match(/href=["']([^"']+)["']/i)?.[1] || null;
}

function startStillOnlinePing(socket) {
  setInterval(() => {
    if (socket && socket.connected) {
      socket.emit("stillOnline", null);
      console.log("📡 stillOnline gesendet");
    }
  }, 2000); // alle 2 Sekunden
}
