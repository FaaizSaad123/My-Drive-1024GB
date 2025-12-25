
export enum FileType {
  IMAGE = 'IMAGE',
  NOTE = 'NOTE',
  FILE = 'FILE',
  FOLDER = 'FOLDER'
}

export interface DriveItem {
  id: string;
  name: string;
  type: FileType;
  size: number; // in bytes
  createdAt: number;
  content?: string; // For notes or text files
  url?: string; // For images (base64 or blob url)
  mimeType?: string;
  isFavorite?: boolean;
  isDeleted?: boolean;
  ownerId?: string;
  parentId?: string | null; // ID of the folder this item belongs to. null/undefined means root.
}

export interface User {
  id: string;
  username: string;
  password?: string;
}

export type ViewMode = 'GRID' | 'LIST';
export type FilterType = 'ALL' | 'IMAGES' | 'NOTES' | 'FAVORITES' | 'TRASH';

export interface StorageStats {
  used: number;
  total: number;
}