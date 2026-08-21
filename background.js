import { setNotification, showMeetlingNotification } from './js/notify.js';
import { connectBadge } from './js/chromeBadge.js';
import { getConfig, clearConfig, openConfigPopup } from './js/getConfig.js';
import { checkLoginStatusAndStoreContacts } from './js/contactList.js';

let meetlingAddonBaseUrl = null;
let meetlingAddonServerId = null;

getConfig().then(({ meetlingAddonBaseUrl: baseUrl, meetlingAddonServerId: serverId, source }) => {
  console.log("Konfig aus:", source);
  console.log("meetlingAddonBaseUrl:", baseUrl);
  console.log("meetlingAddonServerId:", serverId);

  // Lokale globale Variablen überschreiben
  meetlingAddonBaseUrl = baseUrl;
  meetlingAddonServerId = serverId;
  checkLoginStatusAndStoreContacts(meetlingAddonBaseUrl);
  chrome.alarms.create("initialCheckLoginStatus", {
    delayInMinutes: 0.5
  });
  connectBadge()
});


function createAlarmWithPolicyInterval() {
  chrome.storage.managed.get("meetlingCheckInterval", (result) => {
    let interval = result.meetlingCheckInterval || 1;
    console.log("perodInMinutes:", interval, "Minuten");

    chrome.alarms.clear("checkLoginStatus", () => {
      chrome.alarms.create("checkLoginStatus", {
        periodInMinutes: interval
      });
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "openConfigPopup") {
    openConfigPopup();
  }

  if(message.action === "reloadExtension") {
    chrome.runtime.reload();
  }

  if(message.action === "storageClear") {
    clearConfig();
  }

  if(message.action === "disableNotification") {
    setNotification(false)
  }

  if(message.action === "enableNotification") {
    setNotification(true)
  }

});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "initialCheckLoginStatus") {
    console.log("Initial Login Check via alarm.");
    checkLoginStatusAndStoreContacts(meetlingAddonBaseUrl);
    console.log("Create Alert Policy for checking Login.");
    createAlarmWithPolicyInterval();
  }
  if (alarm.name === "checkLoginStatus") {
    console.log("Regular Login Check via period Alert.");
    checkLoginStatusAndStoreContacts(meetlingAddonBaseUrl);
  }
});
