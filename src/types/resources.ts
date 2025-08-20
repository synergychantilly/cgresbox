export type ResourceType = 'Document' | 'Image' | 'Resource' | 'URL';

export interface ResourceFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  description: string;
  file?: ResourceFile; // For uploaded files
  url?: string; // For URL type resources
  category?: string;
  tags?: string[];
  downloadCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResourceData {
  title: string;
  type: ResourceType;
  description: string;
  url?: string; // For URL type
  category?: string;
  tags?: string[];
}

export interface UpdateResourceData {
  title?: string;
  type?: ResourceType;
  description?: string;
  url?: string;
  category?: string;
  tags?: string[];
}
