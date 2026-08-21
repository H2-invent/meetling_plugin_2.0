import { initWebSocket } from './initWebsocket.js';
import { renderContactsList } from './renderContacts.js';

export function checkLoginStatusAndStoreContacts(meetlingAddonBaseUrl, callback) {
  fetch(`${meetlingAddonBaseUrl}/room/contact/api`, {
    method: "GET",
    credentials: "include",
    redirect: "follow"
  })
  .then(response => {
    if (response.status === 200) {
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

              chrome.storage.local.set({ contacts: mergedContacts }, () => {
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
            chrome.storage.local.set({ contacts: [] });
          }
        } catch (err) {
          console.log("⚠️ Kein Login erkannt.");
          chrome.storage.local.set({ contacts: [] });
        }
      });
    }
  })
  .catch(err => {
    console.log("⚠️ Logout oder kein Login erkannt");
    chrome.storage.local.set({ contacts: [] });
  });
}

export function loadContacts() {
  chrome.storage.local.get("contacts", (result) => {
    const contacts = result.contacts;
    console.log("Kontakte geladen:", contacts);

    if (Array.isArray(contacts) && contacts.length > 0) {
      renderContactsList(contacts);
      contactSection.style.display = "block";
      dashboardBtn.style.display = "block";
      logged_in.style.display = "block";
    } else {
      loginBtn.style.display = "block";
    }
  });
}