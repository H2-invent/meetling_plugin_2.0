const BRIDGE_KEY = Symbol.for('meetling.extension.ringtoneMessageBridge');

if (!window[BRIDGE_KEY]) {
  chrome.runtime.onMessage.addListener(message => {
    if (message?.type !== 'MEETLING_SUPPRESS_WEBSITE_RINGTONE') return;

    window.dispatchEvent(new CustomEvent('meetling:suppress-ringtone'));
  });

  window[BRIDGE_KEY] = true;
}
