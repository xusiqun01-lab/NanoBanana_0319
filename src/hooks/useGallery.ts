/**
 * 图库Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { GalleryItem, ApiResponse } from '@/types';
import { galleryService } from '@/services/gallery.service';

interface UseGalleryReturn {
  items: GalleryItem[];
  stats: {
    total: number;
    images: number;
    videos: number;
  };
  isLoading: boolean;
  refresh: () => void;
  deleteItem: (itemId: string) => Promise<ApiResponse<void>>;
  clearGallery: () => Promise<ApiResponse<void>>;
  downloadImage: (url: string, filename?: string) => Promise<ApiResponse<void>>;
}

export function useGallery(): UseGalleryReturn {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [stats, setStats] = useState({ total: 0, images: 0, videos: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setIsLoading(true);
    const gallery = galleryService.getGallery();
    setItems(gallery);
    setStats(galleryService.getStats());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteItem = useCallback(async (itemId: string): Promise<ApiResponse<void>> => {
    const result = await galleryService.deleteItem(itemId);
    if (result.success) {
      refresh();
    }
    return result;
  }, [refresh]);

  const clearGallery = useCallback(async (): Promise<ApiResponse<void>> => {
    const result = await galleryService.clearGallery();
    if (result.success) {
      refresh();
    }
    return result;
  }, [refresh]);

  const downloadImage = useCallback(async (url: string, filename?: string): Promise<ApiResponse<void>> => {
    return await galleryService.downloadImage(url, filename);
  }, []);

  return {
    items,
    stats,
    isLoading,
    refresh,
    deleteItem,
    clearGallery,
    downloadImage,
  };
}
