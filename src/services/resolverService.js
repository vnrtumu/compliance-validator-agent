/**
 * Resolver Service
 * 
 * API calls for LLM-powered conflict resolution and ambiguity handling.
 */

const BASE_API_URL = 'http://localhost:8000/api/v1';

/**
 * Run resolution on a validated document
 */
export const runResolution = async (uploadId, batchContext = null, historicalDecisions = null) => {
    const response = await fetch(`${BASE_API_URL}/resolver/${uploadId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            batch_context: batchContext,
            historical_decisions: historicalDecisions
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Resolution failed');
    }

    return response.json();
};

/**
 * Get existing resolution results
 */
export const getResolution = async (uploadId) => {
    const response = await fetch(`${BASE_API_URL}/resolver/${uploadId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch resolution results');
    }

    return response.json();
};

/**
 * Stream resolution progress using Server-Sent Events
 * 
 * @param {number} uploadId - The upload ID to resolve
 * @param {function} onMessage - Callback for each progress message
 * @param {function} onComplete - Callback when resolution completes with result
 * @param {function} onError - Callback for errors
 * @returns {function} Cleanup function to close the stream
 */
export const streamResolution = (uploadId, onMessage, onComplete, onError) => {
    const eventSource = new EventSource(`${BASE_API_URL}/resolver/${uploadId}/stream`);

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.step === 'result') {
                onComplete && onComplete(data.result);
                eventSource.close();
            } else if (data.step === 'error') {
                onError && onError(new Error(data.message));
                eventSource.close();
            } else {
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

    return () => {
        eventSource.close();
    };
};
