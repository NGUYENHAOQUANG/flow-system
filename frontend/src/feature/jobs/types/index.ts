export interface Job {
  id: number;
  status: string;
  prompt: string;
  model: string;
  duration: string;
  aspectRatio: string;
  quantity?: string;
  tab?: string;
  type?: string;
  createdAt: string;
  videoUrl?: string;
}
