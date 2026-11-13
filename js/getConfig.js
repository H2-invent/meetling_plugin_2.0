export async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["meetlingAddonBaseUrl", "meetlingAddonServerId"], (localData) => {
      chrome.storage.managed.get(["meetlingAddonBaseUrl", "meetlingAddonServerId"], (managedData) => {
        // Vorrang je Schlüssel: local > managed > Fallback
        const meetlingAddonBaseUrl = localData.meetlingAddonBaseUrl || managedData.meetlingAddonBaseUrl || "https://app.meetling.de";
        const meetlingAddonServerId = localData.meetlingAddonServerId || managedData.meetlingAddonServerId || 2;

        // source beschreibt, woher die Base-URL kommt (entscheidet den Login-Check)
        const source = localData.meetlingAddonBaseUrl ? "local" : managedData.meetlingAddonBaseUrl ? "managed" : "fallback";
        resolve({ meetlingAddonBaseUrl, meetlingAddonServerId, source });
      });
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
