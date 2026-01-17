/**
 * Reporter Service
 * 
 * API calls for LLM-powered report generation.
 */

const BASE_API_URL = 'http://localhost:8000/api/v1';

/**
 * Generate a compliance report
 */
export const generateReport = async (uploadId, reportType = 'executive_summary') => {
    const response = await fetch(`${BASE_API_URL}/reporter/${uploadId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            report_type: reportType
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Report generation failed');
    }

    return response.json();
};

/**
 * Get existing report
 */
export const getReport = async (uploadId) => {
    const response = await fetch(`${BASE_API_URL}/reporter/${uploadId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch report');
    }

    return response.json();
};

/**
 * Get text version of report
 */
export const getTextReport = async (uploadId) => {
    const response = await fetch(`${BASE_API_URL}/reporter/${uploadId}/text`);

    if (!response.ok) {
        throw new Error('Failed to fetch text report');
    }

    return response.json();
};

/**
 * Stream report generation progress using Server-Sent Events
 * 
 * @param {number} uploadId - The upload ID
 * @param {function} onMessage - Callback for each progress message
 * @param {function} onComplete - Callback when report generation completes
 * @param {function} onError - Callback for errors
 * @returns {function} Cleanup function to close the stream
 */
export const streamReport = (uploadId, onMessage, onComplete, onError) => {
    const eventSource = new EventSource(`${BASE_API_URL}/reporter/${uploadId}/stream`);

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
