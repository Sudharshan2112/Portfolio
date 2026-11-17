export interface ProjectItem {
  id: string;
  number: string;
  category: string;
  title: string;
  description?: string;
  liveUrl: string;
  githubUrl?: string;
  col1Image1: string;
  col1Image2: string;
  col2Image: string;
  tags?: string[];
  carouselItems?: {
    src: string;
    alt: string;
    title: string;
    tag: string;
    description: string;
    href?: string;
    fit?: 'cover' | 'contain';
  }[];
}

export interface ServiceItem {
  number: string;
  title: string;
  description: string;
  tags?: string[];
}
