/**
 * Validation Service
 * 
 * API calls for LLM-powered compliance validation.
 */

const BASE_API_URL = 'http://localhost:8000/api/v1';

/**
 * Run validation on an uploaded document
 */
export const runValidation = async (uploadId) => {
    const response = await fetch(`${BASE_API_URL}/validation/${uploadId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Validation failed');
    }

    return response.json();
};

/**
 * Get existing validation results
 */
export const getValidation = async (uploadId) => {
    const response = await fetch(`${BASE_API_URL}/validation/${uploadId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch validation results');
    }

    return response.json();
};

/**
 * Stream validation progress using Server-Sent Events
 * 
 * @param {number} uploadId - The upload ID to validate
 * @param {function} onMessage - Callback for each progress message
 * @param {function} onComplete - Callback when validation completes with result
 * @param {function} onError - Callback for errors
 * @returns {function} Cleanup function to close the stream
 */
export const streamValidation = (uploadId, onMessage, onComplete, onError) => {
    const eventSource = new EventSource(`${BASE_API_URL}/validation/${uploadId}/stream`);

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.step === 'result') {
                // Final result
                onComplete && onComplete(data.result);
                eventSource.close();
            } else if (data.step === 'error') {
                onError && onError(new Error(data.message));
                eventSource.close();
            } else {
                // Progress message
                onMessage && onMessage(data);
            }
        } catch (e) {
            console.error('Failed to parse SSE data:', e);
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        onError && onError(new Error('Connection lost'));
        eventSource.close();
    };

    // Return cleanup function
    return () => {
        eventSource.close();
    };
};
