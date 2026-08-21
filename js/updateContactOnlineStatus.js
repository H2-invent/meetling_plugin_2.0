export function updateContactsOnlineStatus(message) {
  if (!message) {
    console.warn("⚠️ Ungültige WebSocket-Message:", message);
    return;
  }

  chrome.storage.local.get("contacts", (result) => {
    const contacts = result.contacts || [];

    const statusMap = new Map();

    for (const [status, uidArray] of Object.entries({
      meeting: message.inMeeting || [],
      away: message.away || [],
      online: message.online || [],
      offline: message.offline || [],
    })) {
      uidArray.forEach(uid => {
        if (!statusMap.has(uid)) {
          statusMap.set(uid, status);
        }
      });
    }

    const updatedContacts = contacts.map(contact => {
      return {
        ...contact,
        status: statusMap.get(contact.uid) || "offline"
      };
    });

    chrome.storage.local.set({ contacts: updatedContacts }, () => {
      console.log("✅ Kontakte mit Status aktualisiert");
    });
  });
}