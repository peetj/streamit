import { getApiUrl, getAuthHeaders } from '../config/api';

export interface UploadResponse {
  success: boolean;
  filename?: string;
  error?: string;
}

export const imageUploadService = {
  async uploadProfileImage(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Get auth token without Content-Type for file uploads
      const token = localStorage.getItem('streamflow_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('/api/upload/profile-image/'), {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      return {
        success: true,
        filename: data.filename,
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  },

  getProfileImageUrl(filename: string): string {
    return getApiUrl(`/uploads/profile/${filename}`);
  },
}; 