// app/types/index.ts
export interface NewsItem {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  category: string;
  images: { url: string; caption: string }[];
  authorName: string;
  author?: { name: string; profileImage: string };
  location?: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  isBreaking: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  location?: string;
  role: string;
  isVerified: boolean;
}