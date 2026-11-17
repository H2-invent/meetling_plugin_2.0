import { getConfig } from './js/getConfig.js';
import { getNotification } from './js/notify.js';
import { contactState, renderContactsList } from './js/renderContacts.js';
import { checkLoginStatusAndStoreContacts, loadContacts } from './js/contactList.js';
import { openConferenceWindow } from './js/openConferenceWindow.js';

let meetlingAddonBaseUrl = null;
let meetlingAddonServerId = null;
let canCall = true; // false when the account has no usable server (set by refreshCallAvailability)

document.addEventListener("DOMContentLoaded", () => {
  const contactSection = document.getElementById("contactSection");
  const loginBtn = document.getElementById("loginBtn");
  const instantBtn = document.getElementById("instantBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const configBtn = document.getElementById("configBtn");
  const disableNotificationBtn = document.getElementById("disableNotificationBtn");
  const enableNotificationBtn = document.getElementById("enableNotificationBtn");
  const contactSearch = document.getElementById("contactSearch");
  const startBtn = document.getElementById("startBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const appVersion = document.getElementById("appVersion");
  const callWarning = document.getElementById("callWarning");

  const manifest = chrome.runtime.getManifest();
  appVersion.textContent = manifest.version;
  const isDev = !manifest.update_url;
  const dev = document.getElementById('dev');
  if (dev) {
    dev.hidden = !isDev;
  }

  // A call needs a server assigned to the account: the ad-hoc endpoint rejects callers
  // without one (silent redirectUrl response). The login check stores the caller's
  // servers from /room/contact/api, so use those and warn in the popup instead.
  function refreshCallAvailability() {
    chrome.storage.local.get(["servers"], (result) => {
      const servers = Array.isArray(result.servers) ? result.servers : [];
      let message = "";

      if (servers.length === 0) {
        message = "Kein Server für dein Konto hinterlegt. Ein Administrator muss dir einen Server zuweisen, bevor du Anrufe starten kannst.";
      } else if (meetlingAddonServerId && !servers.some(s => String(s.id) === String(meetlingAddonServerId))) {
        message = `Der konfigurierte Server (ID ${meetlingAddonServerId}) ist deinem Konto nicht zugewiesen. Bitte die Server-ID in den Einstellungen prüfen.`;
      }

      canCall = message === "";
      contactState.canCall = canCall;
      callWarning.textContent = message;
      callWarning.classList.toggle("d-none", canCall);

      if (!canCall) {
        startBtn.disabled = true;
        startBtn.classList.add("disabled");
      }
    });
  }

  getConfig().then(({ meetlingAddonBaseUrl: baseUrl, meetlingAddonServerId: serverId, source }) => {
    console.log("Popup - Konfig aus:", source);
    console.log("Popup - meetlingAddonBaseUrl:", baseUrl);
    console.log("Popup - meetlingAddonServerId:", serverId);

    // Lokale globale Variablen überschreiben
    meetlingAddonBaseUrl = baseUrl;
    meetlingAddonServerId = serverId;
    refreshCallAvailability();
    console.log("Popup - Start Login Check after opening Popup");
    checkLoginStatusAndStoreContacts(meetlingAddonBaseUrl, () => {
      loadContacts();
      refreshCallAvailability();
    });
  });

  function toggleNotificationDisplay() {
    getNotification((isEnabled) => {
      console.log("Popup - Open Notification Status:", isEnabled);
      //if (disableNotificationBtn) {
        disableNotificationBtn.style.display = isEnabled ? "none" : "block";
      //}
      //if (enableNotificationBtn) {
        enableNotificationBtn.style.display = isEnabled ? "block" : "none";
      //}
    });
  }
  
  function startConference(userId) {
    const meetingRequestUrl = `${meetlingAddonBaseUrl}/room/adhoc/meeting/${userId}/${meetlingAddonServerId}`;
  
    fetch(meetingRequestUrl, {
      method: "GET",
      credentials: "include",
      redirect: "follow"
    })
      .then(response => {
        // Safety: Prüfen, ob die Antwort JSON ist
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json();
        } else {
          throw new Error("Antwort ist kein JSON");
        }
      })
      .then(data => {
        console.log("Antwort von der Konferenz-API:", JSON.stringify(data));
  
        if (data && Array.isArray(data.popups) && data.popups.length > 0) {
          const popupUrl = data.popups[0].url;
          const conferenceUrl = new URL(popupUrl, meetlingAddonBaseUrl);
          openConferenceWindow(conferenceUrl.href);
        } else if (data && data.error) {
          // The backend knows why (e.g. callee offline) — show that instead of the
          // generic message so silent guard failures are not a mystery.
          alert(data.error);
        } else if (data && data.redirectUrl) {
          alert("Der Anruf konnte nicht gestartet werden. Bitte prüfe die Server-Zuweisung und die Einstellungen.");
        } else {
          alert("Keine Konferenz-URL in der Antwort gefunden.");
          console.warn("Fehlende oder ungültige popups:", data);
        }
      })
      .catch(error => {
        console.error("Fehler beim Erstellen der Konferenz:", error);
        alert("Fehler beim Erstellen der Konferenz.");
      });
  }

  contactSearch.addEventListener("input", function () {
    const searchValue = this.value.toLowerCase();

    if (searchValue === "") {
      renderContactsList(contactState.allContacts, true);
      return;
    }

    const filtered = contactState.allContacts.filter(contact =>
      (contact.name || "").toLowerCase().includes(searchValue)
    );

    renderContactsList(filtered, true);
  });

  startBtn.addEventListener("click", () => {
    if (!canCall) {
      alert(callWarning.textContent || "Anrufe sind derzeit nicht möglich.");
      return;
    }
    if (contactState.selectedContactId) {
      loadingOverlay.classList.remove("d-none");
      startConference(contactState.selectedContactId)
      contactState.selectedContactId = null;
      contactState.selectedContactName = null;
    } else {
      alert("Bitte wählen Sie einen Kontakt aus.");
    }
  });

  loginBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "startLoginCheckDelayed" });
    chrome.tabs.create({ url: `${meetlingAddonBaseUrl}/room/dashboard` });
  });

  dashboardBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: `${meetlingAddonBaseUrl}/room/dashboard` });
  });

  configBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openConfigPopup" });
  });

  disableNotificationBtn.addEventListener("click", () => {
    console.log("Popup - Btn enable Notification");
    disableNotificationBtn.style.display = "none";
    chrome.runtime.sendMessage({ action: "enableNotification" });
    enableNotificationBtn.style.display = "block";
  });

  enableNotificationBtn.addEventListener("click", () => {
    console.log("Popup - Btn disable Notification");
    enableNotificationBtn.style.display = "none";
    chrome.runtime.sendMessage({ action: "disableNotification" });
    disableNotificationBtn.style.display = "block";
  });

  // Sofort Konferenz starten
  instantBtn.addEventListener("click", () => {
    chrome.storage.local.get("contacts", (result) => {
      const contacts = result.contacts;
  
      if (!Array.isArray(contacts) || contacts.length === 0) {
        // 🚀 Keine Kontakte → Direkt weiterleiten zu zufälligem Raum
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const roomName = `raum-${randomSuffix}`;
        const meetingUrl = `${meetlingAddonBaseUrl}/m/${roomName}`;
        openConferenceWindow(meetingUrl);
      } else {
    // Sofort-Konferenz API aufrufen
    fetch(`${meetlingAddonBaseUrl}/room/create/fast/conference`, {
      method: "GET",
      credentials: "include",
      redirect: "follow"
    })
      .then(response => response.json())
      .then(data => {
        console.log("Sofort Konferenz Antwort:", data);

        // Überprüfen, ob eine URL im JSON vorhanden ist
        if (data && Array.isArray(data.popups) && data.popups.length > 0) {
          const popupUrl = data.popups[0].url;
          const conferenceUrl = new URL(popupUrl, meetlingAddonBaseUrl);
          openConferenceWindow(conferenceUrl.href);
        } else {
          alert("Fehler: Keine Konferenz-URL gefunden.");
        }
      })
      .catch(error => {
        console.error("Fehler beim Starten der Sofort-Konferenz:", error);
        alert("Fehler beim Starten der Sofort-Konferenz.");
      });
    }
  });
});
  loadContacts();
  refreshCallAvailability();
  toggleNotificationDisplay();
});
