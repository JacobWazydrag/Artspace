import { logEvent, isSupported } from "firebase/analytics";
import { analytics } from "../firebase";

// Check if Analytics is supported in the current environment
let analyticsEnabled = false;

isSupported().then((supported) => {
  analyticsEnabled = supported;
});

/**
 * Tracks a page view event
 * @param pageName - Name of the page being viewed
 * @param pageTitle - Title of the page (optional)
 */
export const trackPageView = (pageName: string, pageTitle?: string) => {
  if (!analyticsEnabled) return;

  try {
    logEvent(analytics, "page_view", {
      page_title: pageTitle || pageName,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
    console.log(`Analytics: Page view tracked - ${pageName}`);
  } catch (error) {
    console.error("Error tracking page view:", error);
  }
};

/**
 * Tracks when a user clicks on an artwork
 * @param artworkId - ID of the artwork clicked
 * @param artworkTitle - Title of the artwork
 * @param artistName - Name of the artist
 * @param artworkPosition - Position of the artwork in the gallery (1-based index)
 */
export const trackArtworkClick = (
  artworkId: string,
  artworkTitle: string,
  artistName: string,
  artworkPosition: number
) => {
  if (!analyticsEnabled) return;

  try {
    logEvent(analytics, "artwork_click", {
      artwork_id: artworkId,
      artwork_title: artworkTitle,
      artist_name: artistName,
      artwork_position: artworkPosition,
      content_type: "artwork",
      content_id: artworkId,
    });
    console.log(
      `Analytics: Artwork click tracked - ${artworkTitle} by ${artistName}`
    );
  } catch (error) {
    console.error("Error tracking artwork click:", error);
  }
};

/**
 * Tracks when a user clicks on an artist's name/link to view their bio
 * @param artistId - ID of the artist
 * @param artistName - Name of the artist
 * @param clickContext - Where the artist link was clicked from
 */
export const trackArtistBioClick = (
  artistId: string,
  artistName: string,
  clickContext: string = "artwork_card"
) => {
  if (!analyticsEnabled) return;

  try {
    logEvent(analytics, "artist_bio_click", {
      artist_id: artistId,
      artist_name: artistName,
      click_context: clickContext,
      content_type: "artist_bio",
      content_id: artistId,
    });
    console.log(`Analytics: Artist bio click tracked - ${artistName}`);
  } catch (error) {
    console.error("Error tracking artist bio click:", error);
  }
};

/**
 * Generic event tracking function for custom events
 * @param eventName - Name of the event
 * @param parameters - Event parameters
 */
export const trackCustomEvent = (
  eventName: string,
  parameters: Record<string, any>
) => {
  if (!analyticsEnabled) return;

  try {
    logEvent(analytics, eventName, parameters);
    console.log(`Analytics: Custom event tracked - ${eventName}`, parameters);
  } catch (error) {
    console.error(`Error tracking custom event ${eventName}:`, error);
  }
};
