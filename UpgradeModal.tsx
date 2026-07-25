export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  imageBase64?: string;
  timestamp: Date;
}
