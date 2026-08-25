(() => {
  const GUARD_KEY = Symbol.for('meetling.extension.ringtoneGuard');
  if (window[GUARD_KEY]) return;

  const RINGTONE_PATTERN = /(?:ring(?:tone|ing)?|incoming[-_ ]?call|call[-_ ]?sound)/i;
  const SUPPRESSION_DURATION_MS = 45_000;
  const originalPlay = HTMLMediaElement.prototype.play;
  let suppressUntil = 0;

  const isAudio = media => media instanceof HTMLAudioElement;
  const looksLikeRingtone = media => RINGTONE_PATTERN.test(media.currentSrc || media.src || '');
  const shouldSuppress = media => isAudio(media) && (Date.now() < suppressUntil || looksLikeRingtone(media));

  HTMLMediaElement.prototype.play = function (...args) {
    if (shouldSuppress(this)) {
      this.pause();
      return Promise.resolve();
    }

    return originalPlay.apply(this, args);
  };

  window.addEventListener('meetling:suppress-ringtone', () => {
    suppressUntil = Date.now() + SUPPRESSION_DURATION_MS;
    document.querySelectorAll('audio').forEach(audio => audio.pause());
  });

  document.documentElement.dataset.meetlingExtensionInstalled = 'true';
  window.dispatchEvent(new CustomEvent('meetling:extension-ready'));
  window[GUARD_KEY] = true;
})();
