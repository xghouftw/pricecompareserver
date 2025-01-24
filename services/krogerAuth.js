const clientId = process.env.REACT_APP_KROGER_CLIENT_ID;
const clientSecret = process.env.REACT_APP_KROGER_CLIENT_SECRET;

export async function getAccessToken(scope = '') {
    const authString = btoa(`${clientId}:${clientSecret}`);
    const requestBody = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: scope
    });
    const url = new URL("https://api.kroger.com/v1/connect/oauth2/token");

    try {
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authString}`
            },
            body: requestBody,
        });
        if (!response.ok) {
            throw new Error(`Token request failed with status ${response.status}`);
        }
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Error during Kroger token request:", error);
        throw error;
    }
}