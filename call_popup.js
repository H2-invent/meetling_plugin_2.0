import { openConferenceWindow } from './js/openConferenceWindow.js';

const params = new URLSearchParams(window.location.search);
const message = params.get("message");
const title = params.get("title");
const href = params.get("href");
const sound = params.get("sound");
const volume = parseFloat(params.get("volume"));

const joinButton = document.getElementById("joinButton");
const declineButton = document.getElementById("declineButton");

if (title) document.getElementById("popup-title").textContent = title;
if (message) document.getElementById("popup-message").textContent = message;

const autoCloseTimeout = setTimeout(() => {
  window.close();
}, 40000);

joinButton.addEventListener("click", () => {
  openConferenceWindow(href, () => window.close());
});

declineButton.addEventListener("click", () => {
  window.close();
});

let ringtone = null;

if (sound) {
    ringtone = new Audio(chrome.runtime.getURL(sound));
    ringtone.volume = Number.isFinite(volume) ? Math.min(Math.max(volume, 0), 1) : 0.8;
    ringtone.loop = true;
    ringtone.play().catch(err => console.warn("🔇 Sound konnte nicht abgespielt werden:", err));
}

window.addEventListener("beforeunload", () => {
  clearTimeout(autoCloseTimeout);
  ringtone?.pause();
});
