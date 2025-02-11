const clientId = process.env.KROGER_CLIENT_ID;
const clientSecret = process.env.KROGER_CLIENT_SECRET;

export async function getAccessToken(scope = '') {
    try {
        if (!clientId || !clientSecret) throw new Error("Missing Kroger client credentials");
        const authString = btoa(`${clientId}:${clientSecret}`);
        const requestBody = new URLSearchParams({ grant_type: 'client_credentials', scope: scope });
        const url = new URL("https://api.kroger.com/v1/connect/oauth2/token");
        
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authString}`
            },
            body: requestBody,
        });
        if (!response.ok) {
            throw new Error(`Kroger token auth failed with status ${response.status} (${response.statusText})`);
        } 
        else {
            console.log("Kroger token auth successful");
        }
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Error with Kroger token auth:", error);
        throw error;
    }
}