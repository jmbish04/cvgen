/**
 * PostMessage Integration for CV Editor
 * Handles secure communication between parent window and CV editor
 */

// ===========================================
// POSTMESSAGE SECURITY & VALIDATION
// ===========================================

// Allowed origins for PostMessage communication
const ALLOWED_ORIGINS = [
  'https://jobpare.github.io',
  'https://jobpare.com',
  'http://localhost:3000',
  'http://localhost:9000'
];

// Check if origin is allowed
function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin);
}

// Basic validation for CV data structure
function isValidCVData(data) {
  return data &&
         typeof data === 'object' &&
         data.profile &&
         typeof data.profile === 'object' &&
         data.profile.name &&
         typeof data.profile.name === 'string';
}


// ===========================================
// POSTMESSAGE HANDLER
// ===========================================

// Secure PostMessage listener for external CV JSON injection
window.addEventListener('message', (event) => {
  try {
    // 1. Log all messages for debugging
    console.log('PostMessage received from:', event.origin, 'data:', event.data);
    
    
    // 2. Validate origin - reject unknown origins
    if (!isAllowedOrigin(event.origin)) {
      console.warn('Rejected PostMessage from unauthorized origin:', event.origin);
      console.warn('Allowed origins:', ALLOWED_ORIGINS);
      return;
    }
    
    // 3. Filter out browser extension messages (they have specific patterns)
    if (event.data && (
      event.data.source === 'contentScript' ||
      event.data.isTronLink === true ||
      event.data.message?.action === 'tabReply' ||
      event.data.uuid // Extension messages often have UUIDs
    )) {
      console.log('Ignoring browser extension message from:', event.origin);
      return;
    }
    
    // 4. Validate message structure
    if (!event.data || typeof event.data !== 'object') {
      console.warn('Invalid PostMessage format received');
      return;
    }
    
    const { type, data } = event.data;
    
    // 5. Handle CV data directly
    if (type === 'SET_CV_JSON') {
      // Process CV data
      console.log('Processing CV data...');
    } else {
      console.warn('Unknown PostMessage type:', type);
      return;
    }

    // 6. Validate CV data structure
    if (!isValidCVData(data)) {
      console.error('Invalid CV data received via PostMessage');
      return;
    }

    // 7. Process data safely
    console.log('Processing valid PostMessage from:', event.origin, 'with data:', data);
    
    if (window.cvEditorInstance) {
      window.cvEditorInstance.initPromise
        .then(() => {
          window.cvEditorInstance.cvData = data;
          window.cvEditorInstance.updateAll();
          console.log('CV data updated successfully');
        })
        .catch((error) => {
          console.error('Error processing CV data:', error);
        });
    } else {
      console.error('Editor not initialized');
    }
  } catch (error) {
    console.error('Error in PostMessage handler:', error);
  }
});
