export const trackFbEvent = (eventName: string, params?: any, options?: { eventID?: string }) => {
  if (typeof window === 'undefined') return;
  let attempts = 0;
  const tryTrack = () => {
    if (window.fbq && typeof window.fbq === 'function' && window.fbq.loaded) {
      if (options) {
        window.fbq('track', eventName, params, options);
      } else {
        window.fbq('track', eventName, params);
      }
    } else {
      attempts++;
      if (attempts < 20) { // Try for up to 10 seconds (20 * 500ms)
        setTimeout(tryTrack, 500);
      } else {
        console.warn('Facebook Pixel never loaded, giving up on tracking', eventName);
      }
    }
  };
  tryTrack();
};
