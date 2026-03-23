export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  category_color: string;
  tag: string | null;
  featured_image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  read_time_minutes: number;
  views_count: number;
  author_name?: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface NewsListItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  category_color: string;
  tag: string | null;
  featured_image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  published_at: string | null;
  read_time_minutes: number;
  views_count: number;
}

export interface NewsListResponse {
  items: NewsListItem[];
  total: number;
  categories: string[];
}

export interface NewsCreateRequest {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  category_color: string;
  tag: string | null;
  featured_image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  read_time_minutes: number;
}

export interface NewsUpdateRequest extends Partial<NewsCreateRequest> {
  id?: never;
}
