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
            throw new Error(`Error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.data) return [];

        const items = data.data.map((product) => {
            const { 
                upc, 
                description, 
                brand, 
                items = [], 
                images = [] 
            } = product;
      
            // Price in an items list, for now consider the first. Consider promo it if exists
            let price = -1;
            if (items.length > 0 && items[0].price) {
                price = items[0].price.promo || items[0].price.regular || -1;
            }
            if (price === -1) return null;

            const webUrl = productPageURI ? `https://www.kroger.com${productPageURI}` : '';
      
            let imageUrl = '';
            if (images.length > 0 && images[0].sizes.length > 0) {
                imageUrl = images[0].sizes[0].url || '';
            }
      
            return {
                upc,
                description,
                brand,
                price,
                imageUrl
            };
        });
        return items;

    } catch (err) {
      console.log(err);
    }
}

export async function searchCatalog(req, res) {
    const searchTerm = req.query.searchTerm;
    const krogerLocations = req.query.krogerLocations;

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
        } catch (err) {
            console.error(err);
        }
    }    

    res.json(Object.values(productMap));    
}