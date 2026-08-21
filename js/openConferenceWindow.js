const CONFERENCE_WINDOW_SIZE = Object.freeze({
  width: 1280,
  height: 800
});

export function openConferenceWindow(url, callback) {
  const conferenceUrl = new URL(url);

  if (!['https:', 'http:'].includes(conferenceUrl.protocol)) {
    throw new TypeError('Die Konferenz-URL muss HTTP oder HTTPS verwenden.');
  }

  const createData = {
    url: conferenceUrl.href,
    type: 'popup',
    focused: true,
    ...CONFERENCE_WINDOW_SIZE
  };

  if (callback) {
    chrome.windows.create(createData, callback);
    return;
  }

  chrome.windows.create(createData);
}
