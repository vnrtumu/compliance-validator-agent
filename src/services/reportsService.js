const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Get aggregated reports statistics
 */
export const getReportsStatistics = async () => {
    const response = await fetch(`${API_BASE_URL}/reports/statistics`);

    if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
    }

    return response.json();
};

/**
 * Get dashboard statistics (stat cards)
 */
export const getDashboardStats = async () => {
    const response = await fetch(`${API_BASE_URL}/reports/dashboard-stats`);

    if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
    }

    return response.json();
};
