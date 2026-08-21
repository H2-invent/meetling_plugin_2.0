import { openConferenceWindow } from './openConferenceWindow.js';

export function setNotification(value) {
  chrome.storage.local.set({ meetlingAddonNotification: value }, () => {
    console.log("✅ meetlingAddonNotification gesetzt auf:", value);
  });
}

export function getNotification(callback) {
  chrome.storage.local.get("meetlingAddonNotification", (result) => {
    const storedValue = result.meetlingAddonNotification;

    // Wenn undefined oder null, dann true als Default
    const value = storedValue === undefined || storedValue === null
      ? true
      : storedValue === true;

    callback(value);
  });
}

export function showMeetlingNotification(message, fullUrl, title, notificationId) {

  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: "app_meetling_de_chrome_plugin.png",
    title: title || "Meetling",
    message: message || "Update",
    priority: 2
  }, (id) => {
    if (chrome.runtime.lastError) {
      console.error("Fehler bei Benachrichtigung:", chrome.runtime.lastError.message);
    } else {
      console.log("🔔 Benachrichtigung erstellt:", id);
    }
  });

  chrome.notifications.onClicked.addListener((clickedId) => {
    if (clickedId === notificationId) {
      openConferenceWindow(fullUrl);
      chrome.notifications.clear(clickedId);
    }
  });
}

export function openPopup(message, href, title, soundFile, volume) {
  const url = chrome.runtime.getURL(`call_popup.html?message=${encodeURIComponent(message)}&href=${encodeURIComponent(href)}&title=${encodeURIComponent(title)}&sound=${soundFile}&volume=${volume}`);

  const popupWidth = 400;
  const popupHeight = 200;

  chrome.windows.getCurrent((currentWindow) => {
    //const left = Math.floor(currentWindow.left + (currentWindow.width - popupWidth) / 2);
    //const top = Math.floor(currentWindow.top + (currentWindow.height - popupHeight) / 2);
    const left = Math.floor(currentWindow.left + currentWindow.width - popupWidth - 20);
    const top = Math.floor(currentWindow.top + currentWindow.height - popupHeight - 60);

    chrome.windows.create({
      url,
      type: "popup",
      width: popupWidth,
      height: popupHeight,
      left: left,
      top: top
    });
  });

}
