export type UpdateType = 'News' | 'Update' | 'Article' | 'Activity';

export interface Update {
  id: string;
  title: string;
  type: UpdateType;
  description: string; // Rich content HTML
  expiration?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean; // Computed based on expiration
}

export interface CreateUpdateData {
  title: string;
  type: UpdateType;
  description: string;
  expiration?: Date;
}

export interface UpdateUpdateData {
  title?: string;
  type?: UpdateType;
  description?: string;
  expiration?: Date;
}
