document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["meetlingAddonBaseUrl", "meetlingAddonServerId"], (data) => {
    if (data.meetlingAddonBaseUrl) document.getElementById("meetlingAddonBaseUrl").value = data.meetlingAddonBaseUrl;
    if (data.meetlingAddonServerId) document.getElementById("meetlingAddonServerId").value = data.meetlingAddonServerId;
    });

    document.getElementById("configForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const baseUrl = document.getElementById("meetlingAddonBaseUrl").value.trim();
        const serverId = document.getElementById("meetlingAddonServerId").value.trim();

        chrome.storage.local.set({ meetlingAddonBaseUrl: baseUrl, meetlingAddonServerId: serverId });
        chrome.runtime.sendMessage({ action: "reloadExtension" });
        window.close();
    });

    document.getElementById("resetButton").addEventListener("click", () => {
        document.getElementById("meetlingAddonBaseUrl").value = ""
        document.getElementById("meetlingAddonServerId").value = ""
        chrome.storage.local.set({ meetlingAddonBaseUrl: null, meetlingAddonServerId: null });
        chrome.runtime.sendMessage({ action: "storageClear" });
        chrome.runtime.sendMessage({ action: "reloadExtension" });
        window.close();
    });
});
