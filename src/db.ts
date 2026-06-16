import Dexie, { type Table } from 'dexie';

export interface Snippet {
  id: string;          // UUID
  source: 'chatgpt' | 'kimi' | 'doubao' | 'deepseek' | 'gemini' | 'claude' | 'other'; // AI来源
  content: string;     // 抓取的文本内容
  timestamp: number;   // 抓取时间
  status: 'unread' | 'used'; // 状态：未用过 / 已拖入编辑器
  position?: { x: number; y: number }; // 在 React Flow 画布上的坐标
}

export interface DocumentState {
  id: string;          // Static identifier e.g., 'primary_draft'
  content: string;     // Rich text editor JSON string or HTML string
  updatedAt: number;   // Auto-save tag
}

class IdeaMeowDB extends Dexie {
  snippets!: Table<Snippet, string>;
  document!: Table<DocumentState, string>;

  constructor() {
    super('IdeaMeowDB');
    this.version(1).stores({
      snippets: 'id, source, timestamp, status',
      document: 'id'
    });
  }
}

export const db = new IdeaMeowDB();
export type { Snippet as DBSnippet, DocumentState as DBDocumentState };
