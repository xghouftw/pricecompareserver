import { getAccessToken } from '../services/krogerAuth.js';

export async function searchLocations(req, res) {
    const latlong = req.query.latlong;
    const accessToken = await getAccessToken();
    const url = new URL("https://api.kroger.com/v1/locations");
    url.searchParams.set("filter.latLong.near", latlong);
    url.searchParams.set("filter.radiusInMiles", "3");

    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            throw new Error(`Error! status: ${response.status}`);
        }
        const data = await response.json();

        const locations = data.data.map((loc) => loc.locationId);

        res.json({ locations });
    } catch (err) {
      console.log(err);
    }
}