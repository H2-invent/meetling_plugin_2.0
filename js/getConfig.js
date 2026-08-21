export async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.managed.get(["meetlingAddonBaseUrl", "meetlingAddonServerId"], (managedData) => {
      if (managedData.meetlingAddonBaseUrl && managedData.meetlingAddonServerId) {
        resolve({
          meetlingAddonBaseUrl: managedData.meetlingAddonBaseUrl,
          meetlingAddonServerId: managedData.meetlingAddonServerId,
          source: "managed"
        });
      } else {
        // Kein Managed, dann local check
        chrome.storage.local.get(["meetlingAddonBaseUrl", "meetlingAddonServerId"], (localData) => {
          if (localData.meetlingAddonBaseUrl && localData.meetlingAddonServerId) {
            resolve({
              meetlingAddonBaseUrl: localData.meetlingAddonBaseUrl,
              meetlingAddonServerId: localData.meetlingAddonServerId,
              source: "local"
            });
          } else {
            // Fallback wenn beides nicht gesetzt
            resolve({
              meetlingAddonBaseUrl: "https://app.meetling.de",
              meetlingAddonServerId: 2,
              source: "fallback"
            });
          }
        });
      }
    });
  });
}

export function clearConfig() {
  chrome.storage.local.clear();
  console.log("⚠️ Clean local storage");
}

export function openConfigPopup() {
  const width = 400;
  const height = 600;

  chrome.windows.getCurrent((currentWindow) => {
    const left = currentWindow.left + Math.round((currentWindow.width - width) / 2);
    const top = currentWindow.top + Math.round((currentWindow.height - height) / 2);

    chrome.windows.create({
      url: chrome.runtime.getURL("config.html"),
      type: "popup",
      width,
      height,
      left,
      top,
    });
  });
}
