/**
 * MOCK STORAGE SERVICE
 * 
 * This is a mock implementation that works without Firebase Storage billing.
 * Files under 1MB are stored as base64 in localStorage.
 * Larger files are simulated with mock URLs.
 * 
 * TO SWITCH TO REAL FIREBASE STORAGE:
 * 1. Enable Firebase Storage in console
 * 2. Uncomment the Firebase imports below
 * 3. Replace the mock functions with the commented real implementations
 * 4. Deploy storage rules from storage.rules
 * 
 * ALTERNATIVE REAL STORAGE OPTIONS:
 * - Supabase Storage (1GB free)
 * - Cloudflare R2 (10GB free)  
 * - Backblaze B2 (10GB free)
 */

// Uncomment these for real Firebase Storage:
// import { 
//   ref, 
//   uploadBytes, 
//   getDownloadURL, 
//   deleteObject,
//   getMetadata,
//   updateMetadata
// } from 'firebase/storage';
// import { storage } from './firebase';

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
  path: string;
}

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

// Maximum file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes

// Allowed file types for resources
const ALLOWED_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  
  // Other
  'application/json',
  'application/xml',
  'text/xml'
];

// Validate file before upload
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not allowed`
    };
  }

  return { isValid: true };
};

// Generate a unique file path
const generateFilePath = (file: File, userId: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `resources/${userId}/${timestamp}_${randomString}_${safeName}`;
};

// Mock file upload - stores small files as base64, simulates upload for larger files
export const uploadFile = async (
  file: File, 
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate file path
    const filePath = generateFilePath(file, userId);

    // Simulate upload progress
    if (onProgress) {
      for (let i = 0; i <= 100; i += 20) {
        setTimeout(() => {
          onProgress({
            progress: i,
            bytesTransferred: (file.size * i) / 100,
            totalBytes: file.size
          });
        }, i * 10);
      }
    }

    // For files under 1MB, convert to base64 and store in localStorage
    // For larger files, create a mock URL
    let downloadURL: string;

    if (file.size <= 1024 * 1024) { // 1MB limit for base64 storage
      const base64 = await fileToBase64(file);
      const storageKey = `file_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.setItem(storageKey, base64);
      downloadURL = `data:${file.type};base64,${base64.split(',')[1]}`;
    } else {
      // For larger files, create a mock URL (in real implementation, this would be actual upload)
      downloadURL = `mock://storage/${filePath}`;
      console.warn(`Mock storage: File "${file.name}" is too large for base64 storage. Using mock URL.`);
    }

    // Simulate slight delay for upload
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      url: downloadURL,
      name: file.name,
      size: file.size,
      type: file.type,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Mock file deletion - removes from localStorage for small files
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const storageKey = `file_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
    localStorage.removeItem(storageKey);
    console.log('File deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Mock file metadata - returns basic info for stored files
export const getFileMetadata = async (filePath: string) => {
  try {
    const storageKey = `file_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      return {
        name: filePath.split('/').pop(),
        contentType: stored.split(':')[1]?.split(';')[0] || 'application/octet-stream',
        size: Math.floor(stored.length * 0.75), // Approximate original size
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString()
      };
    }
    
    throw new Error('File not found');
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
};

// Mock metadata update - not needed for mock storage
export const updateFileMetadata = async (
  filePath: string, 
  newMetadata: any
): Promise<void> => {
  try {
    console.log('Mock storage: File metadata update simulated for:', filePath);
  } catch (error) {
    console.error('Error updating file metadata:', error);
    throw error;
  }
};

// Mock download URL getter - returns the stored data URL or mock URL
export const getFileDownloadURL = async (filePath: string): Promise<string> => {
  try {
    const storageKey = `file_${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      return stored; // Return the data URL
    }
    
    // Return mock URL for files that weren't stored in localStorage
    return `mock://storage/${filePath}`;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file icon based on type
export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📋';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '🗜️';
  if (fileType.includes('text')) return '📄';
  if (fileType.includes('json') || fileType.includes('xml')) return '⚙️';
  
  return '📎'; // Default file icon
};
