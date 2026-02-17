export interface Video {
  title: string;
  mediaUrl: string;
  mediaType: string;
  thumbnailUrl: string;
  slug: string;
  duration?: string;
  categorySlug: string;
  categoryName: string;
  mp4Url: string;
}

export interface Category {
  slug: string;
  name: string;
  iconUrl: string;
}

export interface CategoryGroup {
  category: Category;
  contents: Video[];
}

export interface PlayerState {
  currentVideo: Video | null;
  isPlaying: boolean;
  isMinimized: boolean;
  showRelatedList: boolean;
}
