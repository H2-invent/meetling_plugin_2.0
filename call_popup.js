const params = new URLSearchParams(window.location.search);
const message = params.get("message");
const title = params.get("title");
const href = params.get("href");
const sound = params.get("sound");
const volume = parseFloat(params.get("volume"));

const joinButton = document.getElementById("joinButton");
const muteButton = document.getElementById("muteButton");

if (title) document.getElementById("popup-title").textContent = title;
if (message) document.getElementById("popup-message").innerHTML = message;

let autoCloseTimeout = setTimeout(() => {
  window.close();
}, 40000);

joinButton.addEventListener("click", () => {
  chrome.tabs.create({ url: href }, () => {
      window.close();
  });
});

muteButton.addEventListener("click", () => {
  window.close();
});

if (sound) {
    const audio = new Audio(chrome.runtime.getURL(sound));
    audio.volume = volume;
    audio.loop = true;
    audio.play().catch(err => console.warn("🔇 Sound konnte nicht abgespielt werden:", err));
}
