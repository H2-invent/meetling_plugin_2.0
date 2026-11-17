import { initWebSocket } from './initWebsocket.js';
import { renderContactsList } from './renderContacts.js';
import { socket } from './webSocketClient.js';
import { updateBadge } from './chromeBadge.js';

function handleLogout() {
  console.log("⚠️ Logout oder kein Login erkannt");
  chrome.storage.local.set({
    contacts: [],
    isLoggedIn: false,
    websocketUrl: null,
    websocketTopics: null,
    servers: []
  });
  // Logout = no presence: disconnect socket so extension doesn't think it's online
  // and doesn't receive calls anymore (JWT remains valid for 3 days)
  if (socket && socket.connected) {
    socket.disconnect();
    updateBadge(false);
  }
}

export function checkLoginStatusAndStoreContacts(meetlingAddonBaseUrl, callback) {
  fetch(`${meetlingAddonBaseUrl}/room/contact/api`, {
    method: "GET",
    credentials: "include",
    redirect: "manual"
  })
  .then(response => {
    // 302 to login-page = session gone (logout)
    if (response.type === "opaqueredirect") {
      handleLogout();
      return;
    }
    // Transient server errors (5xx, etc): keep state and socket, next poll will check again
    if (response.status !== 200) {
      return;
    }
    response.text().then(text => {
      try {
        const data = JSON.parse(text);

        if (Array.isArray(data.contacts)) {
            // Vorherige Kontakte holen
            chrome.storage.local.get("contacts", (result) => {
              const existingContacts = result.contacts || [];

              // Map für schnellen Zugriff auf alten Kontaktstatus
              const statusMap = new Map(existingContacts.map(c => [c.uid, c.status]));

              // Neue Kontakte mergen mit vorhandenem Online-Status
              const mergedContacts = data.contacts.map(newContact => ({
                ...newContact,
                status: statusMap.get(newContact.uid) || false
              }));

              chrome.storage.local.set({
                contacts: mergedContacts,
                isLoggedIn: true,
                websocketUrl: data.websocketUrl,
                websocketTopics: data.websocketTopics,
                servers: Array.isArray(data.servers) ? data.servers : []
              }, () => {
                console.log("✅ Kontakte gespeichert & gemerged.");
                if (typeof callback === "function") {
                  callback();
                } else {
                  initWebSocket(meetlingAddonBaseUrl);
                }
              });
            });
          } else {
            console.warn("⚠️ JSON enthält keine 'contacts'-Eigenschaft:", data);
            handleLogout();
          }
        } catch (err) {
          // 200 with non-json body (login page) -> not logged in
          handleLogout();
        }
      });
  })
  .catch(err => {
    // Transient network error: keep state and socket, next poll will check again
    console.log("⚠️ Netzwerkfehler beim Login-Check:", err);
  });
}

export function loadContacts() {
  chrome.storage.local.get(["contacts", "isLoggedIn"], (result) => {
    const contacts = Array.isArray(result.contacts) ? result.contacts : [];
    console.log("Kontakte geladen:", contacts);

    const introSection = document.getElementById("introSection");
    const contactSection = document.getElementById("contactSection");
    const dashboardBtn = document.getElementById("dashboardBtn");
    const loggedInSection = document.getElementById("logged_in");
    const loginBtn = document.getElementById("loginBtn");

    if (result.isLoggedIn) {
      renderContactsList(contacts);
      introSection.classList.add("hidden");
      contactSection.classList.remove("hidden");
      dashboardBtn.style.display = "block";
      loggedInSection.classList.add("is-visible");
      loginBtn.classList.remove("is-visible");
    } else {
      introSection.classList.remove("hidden");
      contactSection.classList.add("hidden");
      loggedInSection.classList.remove("is-visible");
      loginBtn.classList.add("is-visible");
    }
  });
}
