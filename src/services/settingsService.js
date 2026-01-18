/**
 * Settings Service
 * 
 * API calls for system settings management.
 */

const BASE_API_URL = 'http://localhost:8000/api/v1';

/**
 * Get current LLM provider settings
 */
export const getLLMSettings = async () => {
    const response = await fetch(`${BASE_API_URL}/settings/llm`);

    if (!response.ok) {
        throw new Error('Failed to fetch LLM settings');
    }

    return response.json();
};

/**
 * Update LLM provider
 */
export const updateLLMSettings = async (provider) => {
    const response = await fetch(`${BASE_API_URL}/settings/llm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            provider: provider
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update LLM settings');
    }

    return response.json();
};
