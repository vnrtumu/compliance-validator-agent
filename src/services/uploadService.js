const BASE_API_URL = 'http://localhost:8000/api/v1';

export const uploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append('files', file);
    });

    try {
        const response = await fetch(`${BASE_API_URL}/uploads/`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to upload files');
        }

        return await response.json();
    } catch (error) {
        console.error('Error in uploadFiles service:', error);
        throw error;
    }
};

export const getInvoices = async () => {
    try {
        const response = await fetch(`${BASE_API_URL}/invoices/`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch invoices');
        }
        return await response.json();
    } catch (error) {
        console.error('Error in getInvoices service:', error);
        throw error;
    }
};

export const updateInvoiceStatus = async (id, status) => {
    try {
        const response = await fetch(`${BASE_API_URL}/invoices/${id}/status?status=${status}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = typeof errorData.detail === 'object'
                ? JSON.stringify(errorData.detail)
                : (errorData.detail || 'Failed to update status');
            throw new Error(errorMsg);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in updateInvoiceStatus service:', error);
        throw error;
    }
};
