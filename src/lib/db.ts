export interface Variation {
  question: string;
  answer: string;
  explanation: string;
}

export interface Mistake {
  id: string;
  originalText: string;
  originalImageUrl?: string;
  knowledgePoint: string;
  variations: Variation[];
  createdAt: number;
}

const STORAGE_KEY = 'ai_mistakes_db';

export const db = {
  async saveMistake(mistake: Omit<Mistake, 'id' | 'createdAt'>): Promise<Mistake> {
    const newMistake: Mistake = {
      ...mistake,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: Date.now(),
    };
    
    const existing = await this.getAllMistakes();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newMistake, ...existing]));
    return newMistake;
  },

  async getAllMistakes(): Promise<Mistake[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async deleteMistakes(ids: string[]): Promise<void> {
    const existing = await this.getAllMistakes();
    const filtered = existing.filter(m => !ids.includes(m.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  async updateMistake(id: string, updates: Partial<Mistake>): Promise<void> {
    const existing = await this.getAllMistakes();
    const updated = existing.map(m => m.id === id ? { ...m, ...updates } : m);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
};
