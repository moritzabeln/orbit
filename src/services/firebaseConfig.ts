import { initializeApp } from 'firebase/app';

// Load and parse google-services.json
const config = require('../../firebase-config.json');

// Extract Firebase config from firebase-config.json
const app = initializeApp(config);
const clientId = config.webClientId;

export default app;
export { clientId };
