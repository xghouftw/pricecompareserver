import crypto from 'crypto';
import fs from 'fs';

const privateKeyPem = fs.readFileSync('/etc/secrets/walmartPrivateKey', 'utf8').trim();

const consumerId = process.env.WALMART_CONSUMER_ID;
const keyVersion = process.env.WALMART_KEY_VERSION;

//translating directions from Walmart documentation
async function generateWalmartSignature(timestamp) {
    if (!consumerId || !keyVersion) throw new Error("Missing Walmart client credentials");

    const headers = {
      "WM_CONSUMER.ID": consumerId,
      "WM_CONSUMER.INTIMESTAMP": String(timestamp),
      "WM_SEC.KEY_VERSION": keyVersion,
    };
    const sortedKeys = Object.keys(headers).sort();
    let canonicalString = "";
    for (const key of sortedKeys) {
      canonicalString += headers[key].trim() + "\n";
    }
  
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(canonicalString);
    sign.end();

    const signatureBase64 = sign.sign(privateKeyPem, 'base64');
    return signatureBase64;
}

export async function searchCatalog(req, res) {
    try {
        const searchTerm = req.query.searchTerm;
        if (!searchTerm || searchTerm.trim().length == 0) return res.json([]);
        const timestamp = Date.now()
        const signature = await generateWalmartSignature(timestamp);
        console.log("Searching through Walmart");

        const url = new URL("https://developer.api.walmart.com/api-proxy/service/affil/product/v2/search?");
        url.searchParams.set("query", searchTerm);
        url.searchParams.set("numItems", "25");
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "WM_CONSUMER.ID": consumerId,
                "WM_CONSUMER.INTIMESTAMP": timestamp,
                "WM_SEC.KEY_VERSION": keyVersion,
                "WM_SEC.AUTH_SIGNATURE": signature,
            }
        });
        if (!response.ok) {
            throw new Error(`Error retrieving items from Walmart ${response.status}`);
        }

        const data = await response.json();
        if (!data.items) return [];

        const items = [];
        for (let i = 0; i < data.items.length; i++) {
            const product = data.items[i];
            const {upc, name, brandName, salePrice, mediumImage} = product;
            let id = 'W-' + upc;
            let store = 'Walmart';
            let description = name;
            let brand = brandName;
            let price = salePrice;
            let imageUrl = mediumImage;
            items.push({id, store, upc, description, brand, price, imageUrl});
        }

        return res.json(items);
    } catch (error) {
        console.error("Error in calling Walmart search API:", error);
        return res.json([]);
    }
}  