export function updateBadge(connected) {
  if (connected) {
    chrome.action.setIcon({ path: "./images/app_meetling_de_chrome_plugin_GREEN.png" });
  } else {
    chrome.action.setIcon({ path: "./images/app_meetling_de_chrome_plugin_red.png" });
  }
}

export function connectBadge() {
  chrome.action.setIcon({ path: "./images/app_meetling_de_chrome_plugin_red.png" });
}