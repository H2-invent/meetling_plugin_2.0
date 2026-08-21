export const contactState = {
  selectedContactId: null,
  selectedContactName: null,
  allContacts: null
};


export function renderContactsList(contacts, skipCache = false) {
  if (!skipCache) {
    contactState.allContacts = contacts;
  }

  const contactList = document.getElementById("contactList");
  contactList.innerHTML = "";

  const statusPriority = {
    meeting: 3,
    away: 2,
    online: 1,
    offline: 0
  };

  const sortedContacts = contacts.slice().sort((a, b) => {
    return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
  });

  sortedContacts.forEach(contact => {
    const li = document.createElement("li");
    li.className = "contact-item";
    li.dataset.uid = contact.uid;

    const nameSpan = document.createElement("span");
    nameSpan.className = "contact-name";
    nameSpan.textContent = contact.name || "Unbekannt";

    const statusDot = document.createElement("span");
    statusDot.className = "status-indicator";

    switch (contact.status) {
      case "meeting":
        statusDot.classList.add("status-meeting");
        break;
      case "away":
        statusDot.classList.add("status-away");
        break;
      case "online":
        statusDot.classList.add("status-online");
        break;
      default:
        statusDot.classList.add("status-offline");
    }

    li.appendChild(nameSpan);
    li.appendChild(statusDot);
    contactList.appendChild(li);

    li.addEventListener("click", () => {
      contactState.selectedContactId = contact.id;
      contactState.selectedContactName = contact.name || "Unbekannt";

      // Visuelles Feedback zur Auswahl
      document.querySelectorAll(".contact-item").forEach(el => el.classList.remove("selected"));
      li.classList.add("selected");

      console.log("Kontakt ausgewählt:", contactState.selectedContactName);

      const startBtn = document.getElementById("startBtn");
      startBtn.classList.remove("disabled");
      startBtn.textContent = `${contactState.selectedContactName} anrufen`;
    });
  });
}

