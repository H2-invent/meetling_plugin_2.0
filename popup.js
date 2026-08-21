import { getConfig } from './js/getConfig.js';
import { getNotification } from './js/notify.js';
import { contactState, renderContactsList } from './js/renderContacts.js';
import { checkLoginStatusAndStoreContacts, loadContacts } from './js/contactList.js';

let meetlingAddonBaseUrl = null;
let meetlingAddonServerId = null;

document.addEventListener("DOMContentLoaded", () => {
  const contactSection = document.getElementById("contactSection");
  const loginBtn = document.getElementById("loginBtn");
  const instantBtn = document.getElementById("instantBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const configBtn = document.getElementById("configBtn");
  const disableNotificationBtn = document.getElementById("disableNotificationBtn");
  const enableNotificationBtn = document.getElementById("enableNotificationBtn");
  const contactSearch = document.getElementById("contactSearch")

  const manifest = chrome.runtime.getManifest();
  const isDev = !manifest.update_url;
  const dev = document.getElementById('dev');
  if (dev) {
    if (isDev) {
      dev.textContent = ' DEV ';
      dev.style.display = 'inline'; // oder 'block', je nachdem was du brauchst
    } else {
      dev.style.display = 'none'; // vollständig ausblenden
    }
  }

  getConfig().then(({ meetlingAddonBaseUrl: baseUrl, meetlingAddonServerId: serverId, source }) => {
    console.log("Popup - Konfig aus:", source);
    console.log("Popup - meetlingAddonBaseUrl:", baseUrl);
    console.log("Popup - meetlingAddonServerId:", serverId);

    // Lokale globale Variablen überschreiben
    meetlingAddonBaseUrl = baseUrl;
    meetlingAddonServerId = serverId;
    console.log("Popup - Start Login Check after opening Popup");
    checkLoginStatusAndStoreContacts(meetlingAddonBaseUrl, loadContacts)
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
        console.log("Antwort von der Konferenz-API:", data);
  
        if (data && Array.isArray(data.popups) && data.popups.length > 0) {
          const popupUrl = data.popups[0].url;
  
          // 🛡️ Nur absolute URLs verwenden
          if (popupUrl.startsWith("http")) {
            chrome.tabs.create({ url: popupUrl });
          } else {
            chrome.tabs.create({ url: `${meetlingAddonBaseUrl}${popupUrl}` });
          }
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
        chrome.tabs.create({ url: meetingUrl });
      } else {
    // Sofort-Konferenz API aufrufen
    fetch(`${meetlingAddonBaseUrl}/room/create/fast/confernce`, {
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

          // Nur absolute URLs verwenden
          if (popupUrl.startsWith("http")) {
            chrome.tabs.create({ url: popupUrl });
          } else {
            chrome.tabs.create({ url: `${meetlingAddonBaseUrl}${popupUrl}` });
          }
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
  toggleNotificationDisplay();
});
