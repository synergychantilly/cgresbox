import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { storage } from './firebase';

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

// Upload a file to Firebase Storage
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
    const storageRef = ref(storage, filePath);

    // Add metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      }
    };

    // Upload file
    const uploadTask = await uploadBytes(storageRef, file, metadata);
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadTask.ref);

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

// Delete a file from Firebase Storage
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    console.log('File deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Get file metadata
export const getFileMetadata = async (filePath: string) => {
  try {
    const fileRef = ref(storage, filePath);
    const metadata = await getMetadata(fileRef);
    return metadata;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
};

// Update file metadata
export const updateFileMetadata = async (
  filePath: string, 
  newMetadata: any
): Promise<void> => {
  try {
    const fileRef = ref(storage, filePath);
    await updateMetadata(fileRef, newMetadata);
    console.log('File metadata updated:', filePath);
  } catch (error) {
    console.error('Error updating file metadata:', error);
    throw error;
  }
};

// Get file download URL from path
export const getFileDownloadURL = async (filePath: string): Promise<string> => {
  try {
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
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
