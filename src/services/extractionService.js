/**
 * Extraction Service
 * 
 * API service for document extraction endpoints.
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Trigger extraction analysis for an uploaded document.
 * @param {number} uploadId - The ID of the upload to analyze
 * @returns {Promise<Object>} Extraction result
 */
export const extractDocument = async (uploadId) => {
    const response = await fetch(`${API_BASE_URL}/extraction/${uploadId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Extraction failed');
    }

    return response.json();
};

/**
 * Get extraction result for an upload.
 * @param {number} uploadId - The ID of the upload
 * @returns {Promise<Object>} Extraction result
 */
export const getExtractionResult = async (uploadId) => {
    const response = await fetch(`${API_BASE_URL}/extraction/${uploadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get extraction result');
    }

    return response.json();
};

/**
 * Stream extraction analysis with real-time updates.
 * @param {number} uploadId - The ID of the upload to analyze
 * @param {Function} onMessage - Callback for each streaming message
 * @param {Function} onComplete - Callback when extraction completes
 * @param {Function} onError - Callback on error
 * @returns {Function} Cleanup function to close the stream
 */
export const streamExtraction = (uploadId, onMessage, onComplete, onError) => {
    const eventSource = new EventSource(`${API_BASE_URL}/extraction/${uploadId}/stream`);

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'complete') {
                onComplete(data.result);
                eventSource.close();
            } else if (data.type === 'error') {
                onError(new Error(data.message));
                eventSource.close();
            } else if (data.type === 'status') {
                onMessage(data);
            }
        } catch (e) {
            console.error('Failed to parse SSE message:', e);
        }
    };

    eventSource.onerror = (error) => {
        onError(new Error('Connection lost'));
        eventSource.close();
    };

    // Return cleanup function
    return () => eventSource.close();
};

export default {
    extractDocument,
    getExtractionResult,
    streamExtraction,
};
