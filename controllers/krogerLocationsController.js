import { getAccessToken } from '../services/krogerAuth.js';
// kroger api needs a location to return price data
export async function searchLocations(req, res) {
    try {
        const latlong = req.query.latlong;
        if (!latlong || latlong.trim().length == 0) return []; 
        const accessToken = await getAccessToken();

        const url = new URL("https://api.kroger.com/v1/locations");
        url.searchParams.set("filter.latLong.near", latlong);
        url.searchParams.set("filter.radiusInMiles", "5");

        const response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error with Kroger's location API: ${response.status}`);
        }

        const data = await response.json();

        const locations = data.data.map((loc) => loc.locationId);
        return res.json(locations);
    } catch (error) {
        console.log("Error in searching Kroger locations:", error);
        return res.json([]);
    }
}