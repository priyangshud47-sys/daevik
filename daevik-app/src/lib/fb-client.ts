export const trackFbEvent = (eventName: string, params?: Record<string, unknown>, options?: { eventID?: string }) => {
  if (typeof window === 'undefined') return;
  let attempts = 0;
  const tryTrack = () => {
    if (window.fbq && typeof window.fbq === 'function') {
      if (options) {
        window.fbq('track', eventName, params, options);
      } else {
        window.fbq('track', eventName, params);
      }
    } else {
      attempts++;
      if (attempts < 40) { // Try for up to 20 seconds (40 * 500ms) to account for API fetch + script load
        setTimeout(tryTrack, 500);
      } else {
        console.warn('Facebook Pixel never loaded, giving up on tracking', eventName);
      }
    }
  };
  tryTrack();
};
