import { getAccessToken } from '../services/krogerAuth.js';

async function searchCatalogLocation(searchTerm, locationId, accessToken) {
    const url = new URL("https://api.kroger.com/v1/products");
    url.searchParams.set("filter.term", searchTerm);
    url.searchParams.set("filter.locationId", locationId);
    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (!response.ok) {
            throw new Error(`Error with Kroger's authenticaion: ${response.status}`);
        }
        const data = await response.json();
        if (!data.data) return [];

        const items = [];

        for (let i = 0; i < data.data.length; i++) {
            const product = data.data[i];
            const {upc, description, brand, items = [], images = []} = product;
            let price = -1;
            if (items.length > 0 && items[0].price) {
                price = items[0].price.promo || items[0].price.regular || -1;
            }
            if (price === -1) continue;
            let imageUrl = '';
            if (images.length > 0 && images[0].sizes.length > 0) {
                imageUrl = images[0].sizes[0].url || '';
            }

            items.push({upc, description, brand, price, imageUrl});
        }

        return items;

    } catch (error) {
      console.log("Error in calling Kroger search API:", error);
      return [];
    }
}

export async function searchCatalog(req, res) {
    try {
        const searchTerm = req.query.searchTerm;
        const krogerLocations = req.query.krogerLocations;

        if (!searchTerm || searchTerm.trim().length == 0) return res.json([]);
        if (krogerLocations.length == 0) return res.json([]);

        const locationIds = krogerLocations.split(',');
        const accessToken = await getAccessToken('product.compact');

        const productMap = {};

        for (const locationId of locationIds) {
            try {
                const items = await searchCatalogLocation(searchTerm, locationId, accessToken);
                for (const item of items) {
                    if (!item) continue;
                    const { upc, price } = item;
                    if (!productMap[upc]) {
                        productMap[upc] = {
                            id: "K-" + upc, 
                            store: "Kroger",
                            ...item
                        };
                    } else {
                        if (price < productMap[upc].price) {
                            productMap[upc].price = price;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error retrieving items for Kroger location ${locationId}`, error);
            }
        }    

        return res.json(Object.values(productMap));    
    } catch (Error) {
        console.error("Error during Kroger search API call:", Error);
        return res.json([]);
    }
}