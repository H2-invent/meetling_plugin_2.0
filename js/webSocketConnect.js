import { io } from './socket.io.esm.js';
import { getNotification, showMeetlingNotification, openPopup } from './notify.js';
import { socket, setSocket } from './webSocketClient.js';
import { updateBadge } from './chromeBadge.js';
import { updateContactsOnlineStatus } from './updateContactOnlineStatus.js';

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

        const { href } = callHref(parsed)

        getNotification((isEnabled) => {
          if (isEnabled === true) {
            openPopup(parsed.pushMessage, meetlingAddonBaseUrl + href, "📞 Meetling Anruf", "sounds/ringtone.mp3", 0.8);
          } else {
            showMeetlingNotification(parsed.pushMessage, meetlingAddonBaseUrl + href, "📞 Meetling Anruf", parsed.messageId);
          }
        });
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

function callHref(parsed) {
  const html = parsed.message
  .replace(/\\"/g, '"')
  .replace(/\\\//g, '/');

  const match = html.match(/href="([^"]+)"/);
  if (match && match[1]) {
    const href = match[1];

    return { href };
  }
}

function startStillOnlinePing(socket) {
  setInterval(() => {
    if (socket && socket.connected) {
      socket.emit("stillOnline", null);
      console.log("📡 stillOnline gesendet");
    }
  }, 2000); // alle 2 Sekunden
}
