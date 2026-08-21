# Chrome Addon for meetling



## Konfiguration des Addons über eine Policy.json

Folgene meetling.json installiert das Addon aus dem Chrome Store und pinned dieses automatisch in die Nativation im Chrome.
Zusätzlich richtet dieses Policy die notwendigen Parameter für die BaseUrl und die ServerId ein.

Diese meetling.json muss als managed policy in chrome abgelegt werden:

* Windows: `%ProgramFiles%\Google\Chrome\Application\policies\managed\` oder `%ProgramFiles(x86)%\Google\Chrome\Application\policies\managed\` (für 64-Bit-Systeme)
* Linux: `/etc/opt/chrome/policies/managed`
```
{
 "3rdparty": {
    "extensions": {
        "eigjajmppcgpcghajhmbddidmdfeepce": {
            "meetlingAddonBaseUrl": "https://app.meetling.de",
            "meetlingAddonServerId": "2"
        }
    }
  },
  "ExtensionSettings": {
    "eigjajmppcgpcghajhmbddidmdfeepce": {
      "installation_mode": "force_installed",
      "toolbar_pin": "force_pinned",
      "update_url": "https://clients2.google.com/service/update2/crx"
    }
  }
}
```

Die Policy kann im Chrome über chrome://policy überprüft werden. Dort müssten die beiden meetling Attribute mit OK aufgelistet sein.