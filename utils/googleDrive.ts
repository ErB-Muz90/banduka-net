// utils/googleDrive.ts

import { DriveUser } from '../types';

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (err) => reject(new Error(`Failed to load script ${src}: ${String(err)}`));
        document.head.appendChild(script);
    });
}

// These should be set in your environment variables.
// The user of this application is expected to create their own Google Cloud project
// and obtain these credentials.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.GOOGLE_API_KEY;

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// These are now correctly typed using the global Window interface in types.ts
let tokenClient: any | null = null;
let gapiInited = false;
let gisInited = false;
let pickerInited = false;
let scriptsLoaded = false;

/**
 * Initializes the GAPI client for Drive and Picker APIs.
 */
function gapiInit(): Promise<void> {
    return new Promise((resolve, reject) => {
        window.gapi.load('client:picker', {
            callback: () => {
                // Replaced deprecated gapi.client.init with gapi.client.load('drive', 'v3').
                // This is the modern, more reliable way to initialize a GAPI client and resolves
                // the "API discovery response missing required fields" error.
                window.gapi.client.load('drive', 'v3').then(() => {
                    gapiInited = true;
                    pickerInited = true;
                    resolve();
                }, (error: any) => {
                    reject(error);
                });
            },
            onerror: reject
        });
    });
}


/**
 * Initializes the GIS client for OAuth2.
 */
function gisInit(): void {
    if (!CLIENT_ID || !API_KEY) {
        throw new Error("Google API credentials are not configured. Cloud backup is disabled.");
    }
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: () => {}, // Callback is handled by the promise in handleAuthClick
    });
    gisInited = true;
}

/**
 * Main initialization function. Loads and initializes GAPI and GIS clients.
 */
export async function initClient(): Promise<void> {
    // Guard against multiple initializations
    if (gapiInited && gisInited) {
        return;
    }

    // Load scripts if they haven't been loaded yet
    if (!scriptsLoaded) {
        try {
            await Promise.all([
                loadScript('https://accounts.google.com/gsi/client'),
                loadScript('https://apis.google.com/js/api.js')
            ]);
            scriptsLoaded = true;
        } catch (error) {
            console.error('Failed to load Google API scripts:', error);
            throw error; // Propagate error
        }
    }

    // Wait for global objects to be available, then initialize GAPI/GIS
    await new Promise<void>((resolve, reject) => {
        const startTime = Date.now();
        const checkGlobals = () => {
            if (window.gapi && window.google?.accounts?.oauth2) {
                gapiInit().then(() => {
                    gisInit();
                    resolve();
                }).catch(reject);
            } else if (Date.now() - startTime > 5000) { // 5-second timeout
                reject(new Error("Google API objects (gapi, google) did not appear on window."));
            } else {
                setTimeout(checkGlobals, 100);
            }
        };
        checkGlobals();
    });
}

/**
 * Handles the sign-in flow and fetches user profile.
 */
export function handleAuthClick(): Promise<DriveUser> {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            return reject(new Error('Google Auth client not initialized. Ensure Client ID is set.'));
        }

        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                return reject(new Error(`Google Auth Error: ${resp.error}`));
            }
            // Manually set the token for gapi.client, as GIS doesn't do it automatically.
            window.gapi.client.setToken(resp);
            
            try {
                // Use the access_token from the GIS response directly.
                const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { 'Authorization': `Bearer ${resp.access_token}` }
                });
                if (!profileResponse.ok) throw new Error('Failed to fetch user profile.');
                const profile = await profileResponse.json();
                resolve({
                    name: profile.name,
                    email: profile.email,
                    picture: profile.picture,
                });
            } catch (error) {
                reject(error);
            }
        };
        
        // With GIS, we just request the token and let it handle prompting the user.
        // The old gapi.client.getToken() logic is deprecated and incorrect here.
        tokenClient.requestAccessToken({ prompt: '' });
    });
}

/**
 * Handles the sign-out flow.
 */
export function handleSignoutClick(): void {
    const token = window.gapi.client.getToken();
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {
            window.gapi.client.setToken(null);
        });
    }
}

/**
 * Uploads a file to Google Drive.
 */
export async function uploadFile(fileName: string, content: string): Promise<any> {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadata = { name: fileName, mimeType: 'application/json' };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        close_delim;

    const request = window.gapi.client.request({
        'path': '/upload/drive/v3/files',
        'method': 'POST',
        'params': { 'uploadType': 'multipart' },
        'headers': { 'Content-Type': `multipart/related; boundary="${boundary}"` },
        'body': multipartRequestBody
    });
    
    const response: { result: any } = await request;
    return response.result;
}

/**
 * Creates and displays the Google Picker for file selection.
 */
export function createPicker(onFilePicked: (content: string) => void): void {
    if (!pickerInited || !gapiInited || !API_KEY || !CLIENT_ID) {
        console.error("Picker or API credentials not initialized");
        alert("Cloud backup feature is not configured correctly. Please check API credentials.");
        return;
    }
    
    // Ensure there's a valid token before creating the picker.
    const token = window.gapi.client.getToken();
    if (!token || !token.access_token) {
        alert("You must be signed in to Google to use the file picker.");
        return;
    }

    const view = new (window.google.picker as any).View((window.google.picker as any).ViewId.DOCS);
    view.setMimeTypes("application/json");

    const picker = new (window.google.picker as any).PickerBuilder()
        .setAppId(CLIENT_ID.split('-')[0])
        .setOAuthToken(token.access_token)
        .addView(view)
        .setDeveloperKey(API_KEY)
        .setCallback((data: any) => {
            if (data.action === (window.google.picker as any).Action.PICKED) {
                const fileId = data.docs[0].id;
                window.gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                }).then((res: { body: string; }) => {
                    onFilePicked(res.body);
                }).catch((err: any) => {
                    console.error("Error fetching file content:", err);
                    alert("Failed to read file from Google Drive.");
                });
            }
        })
        .build();
    picker.setVisible(true);
}