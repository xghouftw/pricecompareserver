import crypto from 'crypto';
import fs from 'fs';

const privateKeyPem = fs.readFileSync('/etc/secrets/walmartPrivateKey', 'utf8');
privateKeyPem = privateKeyPem.trim();

const consumerId = process.env.WALMART_CONSUMER_ID;
const keyVersion = process.env.WALMART_KEY_VERSION;

async function generateWalmartSignature(timestamp) {
    console.log(privateKeyPem);
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
    const searchTerm = req.query.searchTerm;
    const timestamp = Date.now()
    const signature = await generateWalmartSignature(timestamp);
    const url = new URL("https://developer.api.walmart.com/api-proxy/service/affil/product/v2/search?");
    url.searchParams.set("query", searchTerm);
    try {
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
            throw new Error(`Search request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        if (!data.items) return [];
        const items = data.items.map((product) => {
          const {
            upc,
            name,
            brandName,
            salePrice,
            mediumImage,
          } = product;

          const id = 'W-' + upc;
          const store = 'Walmart';
          const description = name;
          const brand = brandName;
          const price = salePrice;
          const imageUrl = mediumImage;
          return {
            id, 
            store,
            upc,
            description,
            brand,
            price,
            imageUrl
          }
        });

        res.json(items);
    } catch (error) {
        console.error("Error during Walmart search API call:", error);
        throw error;
    }
}  