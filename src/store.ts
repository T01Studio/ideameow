import { create } from 'zustand';
import { db, type Snippet } from './db';

interface IdeaMeowState {
  snippets: Snippet[];
  documentContent: string;
  isExtensionConnected: boolean;
  pendingInsert: { id: string; content: string } | null;
  loadSnippets: () => Promise<void>;
  addSnippet: (snippet: Snippet) => Promise<void>;
  updateSnippetPosition: (id: string, x: number, y: number) => Promise<void>;
  markAsUsed: (id: string, content?: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  clearAllSnippets: () => Promise<void>;
  updateSnippetTitle: (id: string, title: string) => Promise<void>;
  updateSnippetContent: (id: string, content: string) => Promise<void>;
  setExtensionConnected: (connected: boolean) => void;
  loadDocument: () => Promise<string>;
  saveDocument: (content: string) => Promise<void>;
  resetPendingInsert: () => void;
  requestInsertText: (text: string) => void;
}

export const useStore = create<IdeaMeowState>((set, get) => ({
  snippets: [],
  documentContent: '<h2>欢迎来到 IdeaMeow 灵感喵！</h2><p>将右侧画布中的灵感卡片拖拽至此，顺序组装你的剧本。你可以自由编辑格式，插入图片，尽情创作。</p>',
  isExtensionConnected: false,
  pendingInsert: null,

  // Load snippets indexed in Dexie
  loadSnippets: async () => {
    try {
      const stored = await db.snippets.toArray();
      // Sort snippets by timestamp (newest or natural order)
      stored.sort((a, b) => b.timestamp - a.timestamp);
      set({ snippets: stored });
    } catch (error) {
      console.error('Failed to load snippets from Dexie:', error);
    }
  },

  // Add captured snippet to Dexie & Zustand
  addSnippet: async (snippet: Snippet) => {
    try {
      // Check if snippet container already exists to avoid redundant cards
      const exists = await db.snippets.get(snippet.id);
      if (exists) return;

      // Assign default position if missing
      const finalSnippet: Snippet = {
        ...snippet,
        position: snippet.position || {
          x: Math.random() * 200 + 100,
          y: Math.random() * 200 + 100,
        },
      };

      await db.snippets.add(finalSnippet);
      
      set((state) => {
        const filtered = state.snippets.filter((s) => s.id !== finalSnippet.id);
        return { snippets: [finalSnippet, ...filtered] };
      });
    } catch (error) {
      console.error('Failed to add snippet to Dexie:', error);
    }
  },

  // Updates layout coordinate nodes in Dexie and Zustand
  updateSnippetPosition: async (id: string, x: number, y: number) => {
    try {
      await db.snippets.update(id, { position: { x, y } });
      set((state) => ({
        snippets: state.snippets.map((s) =>
          s.id === id ? { ...s, position: { x, y } } : s
        ),
      }));
    } catch (error) {
      console.error('Failed to update snippet position:', error);
    }
  },

  // Highlight action: flags snippet card as utilized in layout editor
  markAsUsed: async (id: string, content?: string) => {
    try {
      await db.snippets.update(id, { status: 'used' });
      set((state) => ({
        snippets: state.snippets.map((s) =>
          s.id === id ? { ...s, status: 'used' } : s
        ),
        // If content is provided, queue it for insertion into editor
        ...(content ? { pendingInsert: { id, content } } : {}),
      }));
    } catch (error) {
      console.error('Failed to mark snippet as used:', error);
    }
  },

  // Re-enable used snippet back to unread status
  markAsUnread: async (id: string) => {
    try {
      await db.snippets.update(id, { status: 'unread' });
      set((state) => ({
        snippets: state.snippets.map((s) =>
          s.id === id ? { ...s, status: 'unread' } : s
        ),
      }));
    } catch (error) {
      console.error('Failed to mark snippet as unread:', error);
    }
  },

  // Delete node altogether
  deleteSnippet: async (id: string) => {
    try {
      await db.snippets.delete(id);
      set((state) => ({
        snippets: state.snippets.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete snippet:', error);
    }
  },

  // Clear all snippets from canvas
  clearAllSnippets: async () => {
    try {
      await db.snippets.clear();
      set({ snippets: [] });
    } catch (error) {
      console.error('Failed to clear all snippets:', error);
    }
  },

  // Update custom title
  updateSnippetTitle: async (id: string, title: string) => {
    try {
      await db.snippets.update(id, { title });
      set((state) => ({
        snippets: state.snippets.map((s) =>
          s.id === id ? { ...s, title } : s
        ),
      }));
    } catch (error) {
      console.error('Failed to update snippet title:', error);
    }
  },

  setExtensionConnected: (connected: boolean) => {
    set({ isExtensionConnected: connected });
  },

  // Update snippet content inline
  updateSnippetContent: async (id: string, content: string) => {
    try {
      await db.snippets.update(id, { content });
      set((state) => ({
        snippets: state.snippets.map((s) =>
          s.id === id ? { ...s, content } : s
        ),
      }));
    } catch (error) {
      console.error('Failed to update snippet content:', error);
    }
  },

  resetPendingInsert: () => {
    set({ pendingInsert: null });
  },

  requestInsertText: (text: string) => {
    set({ pendingInsert: { id: `selected-${Date.now()}`, content: text } });
  },

  // Load the auto-saved draft
  loadDocument: async () => {
    try {
      const doc = await db.document.get('primary_draft');
      if (doc) {
        set({ documentContent: doc.content });
        return doc.content;
      }
      return get().documentContent;
    } catch (error) {
      console.error('Failed to load document from Dexie:', error);
      return get().documentContent;
    }
  },

  // Save the modified draft
  saveDocument: async (content: string) => {
    try {
      await db.document.put({
        id: 'primary_draft',
        content,
        updatedAt: Date.now(),
      });
      set({ documentContent: content });
    } catch (error) {
      console.error('Failed to save document to Dexie:', error);
    }
  },
}));
