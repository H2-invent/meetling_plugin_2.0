const CONTENT_SCRIPT_IDS = [
  'meetling-ringtone-page-guard',
  'meetling-ringtone-message-bridge'
];

export async function registerWebsiteRingtoneSuppression(baseUrl) {
  await chrome.scripting.unregisterContentScripts({ ids: CONTENT_SCRIPT_IDS }).catch(() => {});

  const origin = getHttpsOrigin(baseUrl);
  if (!origin) {
    console.warn('⚠️ Klingelton-Unterdrückung benötigt eine gültige HTTPS-Basis-URL.');
    return;
  }

  await chrome.scripting.registerContentScripts([
    {
      id: CONTENT_SCRIPT_IDS[0],
      matches: [`${origin}/*`],
      js: ['js/websiteRingtonePageGuard.js'],
      runAt: 'document_start',
      world: 'MAIN',
      persistAcrossSessions: true
    },
    {
      id: CONTENT_SCRIPT_IDS[1],
      matches: [`${origin}/*`],
      js: ['js/websiteRingtoneMessageBridge.js'],
      runAt: 'document_start',
      world: 'ISOLATED',
      persistAcrossSessions: true
    }
  ]);

  await installInOpenMeetlingTabs(origin);
}

async function installInOpenMeetlingTabs(origin) {
  const tabs = await chrome.tabs.query({ url: `${origin}/*` });

  await Promise.all(tabs.flatMap(tab => [
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['js/websiteRingtonePageGuard.js'],
      world: 'MAIN'
    }),
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['js/websiteRingtoneMessageBridge.js'],
      world: 'ISOLATED'
    })
  ].map(injection => injection.catch(() => {}))));
}

export async function suppressWebsiteRingtone(baseUrl) {
  const origin = getHttpsOrigin(baseUrl);
  if (!origin) return;

  const tabs = await chrome.tabs.query({ url: `${origin}/*` });
  await Promise.all(tabs.map(tab => chrome.tabs.sendMessage(tab.id, {
    type: 'MEETLING_SUPPRESS_WEBSITE_RINGTONE'
  }).catch(() => {})));
}

function getHttpsOrigin(baseUrl) {
  try {
    const url = new URL(baseUrl);
    return url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}
