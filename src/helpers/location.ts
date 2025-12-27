import { Preferences } from '@capacitor/preferences';

export async function getCountryAndCity(lat: number, lon: number) {
  const { value: savedCountry } = await Preferences.get({ key: 'country' });
  const { value: savedCity } = await Preferences.get({ key: 'city' });

  if (savedCountry && savedCity) {
    console.log('Loaded from Preferences:', savedCountry, savedCity);
    return { country: savedCountry, city: savedCity };
  }

  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    const data = await res.json();

    const country = data.countryName || 'Unknown';
    const city = data.city || data.locality || 'Unknown';

    await Preferences.set({ key: 'country', value: country });
    await Preferences.set({ key: 'city', value: city });

    return { country, city };
  } catch (err) {
    console.error('Error fetching location info:', err);
    return { country: 'Unknown', city: 'Unknown' };
  }
}
