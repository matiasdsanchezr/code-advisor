export type FileContent = {
  path: string;
  content?: string;
  error?: string;
  dependencies?: string[];
  language?: string;
};
