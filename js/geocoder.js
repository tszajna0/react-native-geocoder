import { NativeModules, Platform } from 'react-native';
import GoogleApi from './googleApi.js';
import { stateToCode } from './states.js';

const { RNGeocoder } = NativeModules;

export default {
  apiKey: null,

  fallbackToGoogle(key) {
    this.apiKey = key;
  },

  geocodePosition(position) {
    if (!position || !position.lat || !position.lng) {
      return Promise.reject(new Error("invalid position: {lat, lng} required"));
    }

    return RNGeocoder.geocodePosition(position).catch(err => {
      if (!this.apiKey || err.code !== 'NOT_AVAILABLE') { throw err; }
      return GoogleApi.geocodePosition(this.apiKey, position);
    });
  },

  /**
   * Geocodes position and sets adminAreaCode (e.g. US state code) on best effort
   *
   * Although Android docs says the admin area is a code (e.g. "CA")
   * https://developer.android.com/reference/android/location/Address.html#getAdminArea()
   * some Android devices return localized name of the state.
   * Therefore en_US locale is enforced.
   *
   * iOS returns a code in adminArea.
   */
  geocodePositionStateCode(position) {
    if (!position || !position.lat || !position.lng) {
      return Promise.reject(new Error("invalid position: {lat, lng} required"));
    }

    let q = (Platform.OS === 'android')
      ? RNGeocoder.geocodeLocalizedPosition('en', 'US', position)
      : RNGeocoder.geocodePosition(position);
    return q.catch(err => {
      if (!this.apiKey || err.code !== 'NOT_AVAILABLE') { throw err; }
      return GoogleApi.geocodePosition(this.apiKey, position);
    }).then(res => res.map(i => {
      if (i.countryCode && i.adminArea && !i.adminAreaCode) {
        i.adminAreaCode = stateToCode(i.countryCode, i.adminArea);
      }
      return i;
    }));
  },

  geocodeAddress(address) {
    if (!address) {
      return Promise.reject(new Error("address is null"));
    }

    return RNGeocoder.geocodeAddress(address).catch(err => {
      if (!this.apiKey || err.code !== 'NOT_AVAILABLE') { throw err; }
      return GoogleApi.geocodeAddress(this.apiKey, address);
    });
  },
}
