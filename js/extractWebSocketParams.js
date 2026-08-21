export async function extractWebSocketParamsFromDashboard(meetlingAddonBaseUrl) {
  try {
    const response = await fetch(`${meetlingAddonBaseUrl}/room/dashboard`, {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`Fehler beim Abrufen der Seite: ${response.status}`);
    }

    const html = await response.text();

    // Regex für websocketUrl und websocketTopics aus JS <script>
    const urlMatch = html.match(/var\s+websocketUrl\s*=\s*"(.*?)"/);
    const tokenMatch = html.match(/var\s+websocketTopics\s*=\s*"(.*?)"/);

    const websocketUrl = urlMatch?.[1] || null;
    const websocketTopics = tokenMatch?.[1] || null;

    if (!websocketUrl || !websocketTopics) {
      console.warn("⚠️ WebSocket-Parameter nicht gefunden");
    } else {
      console.log("✅ WebSocket-Parameter extrahiert:", websocketUrl, websocketTopics);
    }

    return { websocketUrl, websocketTopics };

  } catch (err) {
    console.error("❌ Fehler beim Extrahieren der WebSocket-Parameter:", err);
    return { websocketUrl: null, websocketTopics: null };
  }
}