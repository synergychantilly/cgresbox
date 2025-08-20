import { 
  collection, 
  doc, 
  addDoc,
  updateDoc, 
  deleteDoc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { Resource, ResourceType, CreateResourceData, UpdateResourceData, ResourceFile } from '../types/resources';
import { uploadFile, deleteFile, UploadResult } from './storageService';

const COLLECTION_NAME = 'resources';

// Create a new resource with optional file upload
export const createResource = async (
  resourceData: CreateResourceData, 
  createdBy: string,
  file?: File
): Promise<string> => {
  try {
    let uploadResult: UploadResult | undefined;

    // Upload file if provided
    if (file) {
      uploadResult = await uploadFile(file, createdBy);
    }

    const docData: any = {
      ...resourceData,
      downloadCount: 0,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add file information if uploaded
    if (uploadResult) {
      docData.file = {
        name: uploadResult.name,
        url: uploadResult.url,
        size: uploadResult.size,
        type: uploadResult.type,
        uploadedAt: new Date()
      } as ResourceFile;
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

    console.log('Resource created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating resource:', error);
    throw error;
  }
};

// Update an existing resource
export const updateResource = async (
  resourceId: string, 
  resourceData: UpdateResourceData,
  newFile?: File,
  currentUserId?: string
): Promise<void> => {
  try {
    let uploadResult: UploadResult | undefined;

    // Upload new file if provided
    if (newFile && currentUserId) {
      // Get current resource to delete old file if exists
      const currentResource = await getResourceById(resourceId);
      
      uploadResult = await uploadFile(newFile, currentUserId);
      
      // Delete old file if it exists
      if (currentResource?.file?.url) {
        try {
          // Extract file path from URL or use stored path
          const oldFilePath = `resources/${currentUserId}/${currentResource.file.name}`;
          await deleteFile(oldFilePath);
        } catch (deleteError) {
          console.warn('Could not delete old file:', deleteError);
        }
      }
    }

    const updateFields: any = {
      ...resourceData,
      updatedAt: serverTimestamp()
    };

    // Add new file information if uploaded
    if (uploadResult) {
      updateFields.file = {
        name: uploadResult.name,
        url: uploadResult.url,
        size: uploadResult.size,
        type: uploadResult.type,
        uploadedAt: new Date()
      } as ResourceFile;
    }

    await updateDoc(doc(db, COLLECTION_NAME, resourceId), updateFields);
    console.log('Resource updated:', resourceId);
  } catch (error) {
    console.error('Error updating resource:', error);
    throw error;
  }
};

// Delete a resource and its associated file
export const deleteResource = async (resourceId: string): Promise<void> => {
  try {
    // Get resource to find associated file
    const resource = await getResourceById(resourceId);
    
    // Delete the document first
    await deleteDoc(doc(db, COLLECTION_NAME, resourceId));
    
    // Delete associated file if exists
    if (resource?.file?.url) {
      try {
        // Extract file path from URL or use stored path
        const filePath = `resources/${resource.createdBy}/${resource.file.name}`;
        await deleteFile(filePath);
      } catch (deleteError) {
        console.warn('Could not delete associated file:', deleteError);
      }
    }
    
    console.log('Resource deleted:', resourceId);
  } catch (error) {
    console.error('Error deleting resource:', error);
    throw error;
  }
};

// Get all resources
export const getResources = async (): Promise<Resource[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.type as ResourceType,
        description: data.description,
        file: data.file ? {
          name: data.file.name,
          url: data.file.url,
          size: data.file.size,
          type: data.file.type,
          uploadedAt: data.file.uploadedAt?.toDate() || new Date()
        } : undefined,
        url: data.url,
        category: data.category,
        tags: data.tags || [],
        downloadCount: data.downloadCount || 0,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Resource;
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

// Get resources by type
export const getResourcesByType = async (type: ResourceType): Promise<Resource[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.type as ResourceType,
        description: data.description,
        file: data.file ? {
          name: data.file.name,
          url: data.file.url,
          size: data.file.size,
          type: data.file.type,
          uploadedAt: data.file.uploadedAt?.toDate() || new Date()
        } : undefined,
        url: data.url,
        category: data.category,
        tags: data.tags || [],
        downloadCount: data.downloadCount || 0,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Resource;
    });
  } catch (error) {
    console.error('Error fetching resources by type:', error);
    throw error;
  }
};

// Get resources by category
export const getResourcesByCategory = async (category: string): Promise<Resource[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.type as ResourceType,
        description: data.description,
        file: data.file ? {
          name: data.file.name,
          url: data.file.url,
          size: data.file.size,
          type: data.file.type,
          uploadedAt: data.file.uploadedAt?.toDate() || new Date()
        } : undefined,
        url: data.url,
        category: data.category,
        tags: data.tags || [],
        downloadCount: data.downloadCount || 0,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Resource;
    });
  } catch (error) {
    console.error('Error fetching resources by category:', error);
    throw error;
  }
};

// Get resources by tag
export const getResourcesByTag = async (tag: string): Promise<Resource[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('tags', 'array-contains', tag),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.type as ResourceType,
        description: data.description,
        file: data.file ? {
          name: data.file.name,
          url: data.file.url,
          size: data.file.size,
          type: data.file.type,
          uploadedAt: data.file.uploadedAt?.toDate() || new Date()
        } : undefined,
        url: data.url,
        category: data.category,
        tags: data.tags || [],
        downloadCount: data.downloadCount || 0,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Resource;
    });
  } catch (error) {
    console.error('Error fetching resources by tag:', error);
    throw error;
  }
};

// Get a specific resource by ID
export const getResourceById = async (resourceId: string): Promise<Resource | null> => {
  try {
    const resourceDoc = await getDoc(doc(db, COLLECTION_NAME, resourceId));
    if (resourceDoc.exists()) {
      const data = resourceDoc.data();
      return {
        id: resourceDoc.id,
        title: data.title,
        type: data.type as ResourceType,
        description: data.description,
        file: data.file ? {
          name: data.file.name,
          url: data.file.url,
          size: data.file.size,
          type: data.file.type,
          uploadedAt: data.file.uploadedAt?.toDate() || new Date()
        } : undefined,
        url: data.url,
        category: data.category,
        tags: data.tags || [],
        downloadCount: data.downloadCount || 0,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Resource;
    }
    return null;
  } catch (error) {
    console.error('Error fetching resource:', error);
    throw error;
  }
};

// Increment download count for a resource
export const incrementDownloadCount = async (resourceId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, resourceId), {
      downloadCount: increment(1)
    });
    console.log('Download count incremented for resource:', resourceId);
  } catch (error) {
    console.error('Error incrementing download count:', error);
    throw error;
  }
};

// Get most downloaded resources
export const getMostDownloadedResources = async (limit: number = 10): Promise<Resource[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('downloadCount', 'desc'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const resources = querySnapshot.docs.slice(0, limit).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.type as ResourceType,
        description: data.description,
        file: data.file ? {
          name: data.file.name,
          url: data.file.url,
          size: data.file.size,
          type: data.file.type,
          uploadedAt: data.file.uploadedAt?.toDate() || new Date()
        } : undefined,
        url: data.url,
        category: data.category,
        tags: data.tags || [],
        downloadCount: data.downloadCount || 0,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Resource;
    });
    
    return resources;
  } catch (error) {
    console.error('Error fetching most downloaded resources:', error);
    throw error;
  }
};

// Subscribe to resources for real-time updates
export const subscribeToResources = (callback: (resources: Resource[]) => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const resources = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        type: data.type as ResourceType,
        description: data.description,
        file: data.file ? {
          name: data.file.name,
          url: data.file.url,
          size: data.file.size,
          type: data.file.type,
          uploadedAt: data.file.uploadedAt?.toDate() || new Date()
        } : undefined,
        url: data.url,
        category: data.category,
        tags: data.tags || [],
        downloadCount: data.downloadCount || 0,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Resource;
    });
    callback(resources);
  });
};

// Get all unique categories
export const getResourceCategories = async (): Promise<string[]> => {
  try {
    const resources = await getResources();
    const categories = new Set<string>();
    
    resources.forEach(resource => {
      if (resource.category) {
        categories.add(resource.category);
      }
    });
    
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error fetching resource categories:', error);
    throw error;
  }
};

// Get all unique tags
export const getResourceTags = async (): Promise<string[]> => {
  try {
    const resources = await getResources();
    const tags = new Set<string>();
    
    resources.forEach(resource => {
      if (resource.tags) {
        resource.tags.forEach(tag => tags.add(tag));
      }
    });
    
    return Array.from(tags).sort();
  } catch (error) {
    console.error('Error fetching resource tags:', error);
    throw error;
  }
};
