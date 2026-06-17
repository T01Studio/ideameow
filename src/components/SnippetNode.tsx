import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Trash2, CheckCircle2, RotateCcw, AlertCircle, Send, GripHorizontal, Copy, Pencil } from 'lucide-react';
import { useStore } from '../store';
import type { DBSnippet } from '../db';

interface SnippetNodeProps {
  id: string;
  data: {
    snippet: DBSnippet;
    resizeMode?: boolean;
  };
}

export default function SnippetNode({ id: nodeId, data }: SnippetNodeProps) {
  const { snippet } = data;
  const { deleteSnippet, markAsUsed, markAsUnread, requestInsertText, updateSnippetTitle, updateSnippetContent } = useStore();
  const [selectedText, setSelectedText] = useState('');
  const [showSendBtn, setShowSendBtn] = useState(false);
  const [copiedHint, setCopiedHint] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingContent, setEditingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState('');
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const savedWrapperSize = useRef<{ w: string; h: string } | null>(null);

  // ── Custom resize: direct DOM mutation on ReactFlow node wrapper ──
  const resizeRef = useRef<{
    dir: string;
    startW: number;
    startH: number;
    startX: number;
    startY: number;
  } | null>(null);

  const handleResizeStart = useCallback(
    (dir: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const wrapper = nodeRef.current?.closest('.react-flow__node') as HTMLElement | null;
      if (!wrapper) return;
      resizeRef.current = {
        dir,
        startW: wrapper.offsetWidth,
        startH: wrapper.offsetHeight,
        startX: e.clientX,
        startY: e.clientY,
      };
    },
    []
  );

  useEffect(() => {
    if (!data.resizeMode) return;
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const { dir, startW, startH, startX, startY } = resizeRef.current;
      const wrapper = nodeRef.current?.closest('.react-flow__node') as HTMLElement | null;
      if (!wrapper) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let nw = startW;
      let nh = startH;
      if (dir.includes('r')) nw = Math.max(220, startW + dx);
      if (dir.includes('l')) { nw = Math.max(220, startW - dx); }
      if (dir.includes('b')) nh = Math.max(100, startH + dy);
      if (dir.includes('t')) { nh = Math.max(100, startH - dy); }
      wrapper.style.width = nw + 'px';
      wrapper.style.height = nh + 'px';
    };
    const onUp = () => { resizeRef.current = null; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [data.resizeMode]);

  if (!snippet) {
    return (
      <div className="p-4 bg-red-950 border border-red-800 text-red-200 rounded-lg flex items-center gap-2">
        <AlertCircle size={16} />
        <span>同步素材包已损坏</span>
      </div>
    );
  }

  const isUsed = snippet.status === 'used';

  // Vendor color configurations
  const sourceConfigs: Record<string, { name: string; color: string; badge: string; lineBg: string }> = {
    chatgpt: {
      name: 'ChatGPT 平台',
      color: 'text-emerald-400',
      badge: 'bg-emerald-500',
      lineBg: 'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
    },
    kimi: {
      name: 'Kimi 工作台',
      color: 'text-orange-400',
      badge: 'bg-orange-500',
      lineBg: 'bg-orange-500/80 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
    },
    gemini: {
      name: '谷歌 Gemini',
      color: 'text-blue-400',
      badge: 'bg-blue-400',
      lineBg: 'bg-blue-400/80 shadow-[0_0_8px_rgba(96,165,250,0.3)]'
    },
    claude: {
      name: 'Claude AI 智囊',
      color: 'text-purple-400',
      badge: 'bg-purple-500',
      lineBg: 'bg-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
    },
    doubao: {
      name: '豆包 AI',
      color: 'text-green-400',
      badge: 'bg-green-500',
      lineBg: 'bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
    },
    deepseek: {
      name: 'DeepSeek',
      color: 'text-cyan-400',
      badge: 'bg-cyan-500',
      lineBg: 'bg-cyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
    },
    other: {
      name: '快捷灵感便签',
      color: 'text-slate-400',
      badge: 'bg-slate-500',
      lineBg: 'bg-slate-500/80'
    }
  };

  const config = sourceConfigs[snippet.source] || sourceConfigs.other;

  // ── Editable title ──
  const displayTitle = snippet.title || config.name;

  const handleTitleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.resizeMode) {
      setEditingTitle(true);
      setTitleDraft(displayTitle);
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  }, [displayTitle, data.resizeMode]);

  const handleTitleCommit = useCallback(() => {
    setEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== displayTitle) {
      updateSnippetTitle(snippet.id, trimmed);
    }
  }, [titleDraft, displayTitle, snippet.id, updateSnippetTitle]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleCommit();
    if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(''); }
  }, [handleTitleCommit]);

  // ── Editable content ──
  const handleContentDblClick = useCallback(() => {
    if (!data.resizeMode && !isUsed) {
      setEditingContent(true);
      setContentDraft(snippet.content);
      // Save current node wrapper size and expand to comfortable editing size
      const wrapper = nodeRef.current?.closest('.react-flow__node') as HTMLElement | null;
      if (wrapper) {
        savedWrapperSize.current = { w: wrapper.style.width, h: wrapper.style.height };
        const curW = wrapper.offsetWidth;
        const curH = wrapper.offsetHeight;
        if (curW < 300) wrapper.style.width = '300px';
        if (curH < 180) wrapper.style.height = '180px';
      }
      setTimeout(() => {
        contentTextareaRef.current?.focus();
        contentTextareaRef.current?.select();
      }, 0);
    }
  }, [data.resizeMode, isUsed, snippet.content]);

  const handleContentCommit = useCallback(() => {
    setEditingContent(false);
    // Restore node wrapper size
    const wrapper = nodeRef.current?.closest('.react-flow__node') as HTMLElement | null;
    if (wrapper && savedWrapperSize.current) {
      wrapper.style.width = savedWrapperSize.current.w;
      wrapper.style.height = savedWrapperSize.current.h;
      savedWrapperSize.current = null;
    }
    const trimmed = contentDraft.trim();
    if (trimmed !== snippet.content) {
      updateSnippetContent(snippet.id, trimmed || '');
    }
  }, [contentDraft, snippet.content, snippet.id, updateSnippetContent]);

  const handleContentKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditingContent(false);
      setContentDraft('');
      // Restore node wrapper size
      const wrapper = nodeRef.current?.closest('.react-flow__node') as HTMLElement | null;
      if (wrapper && savedWrapperSize.current) {
        wrapper.style.width = savedWrapperSize.current.w;
        wrapper.style.height = savedWrapperSize.current.h;
        savedWrapperSize.current = null;
      }
    }
  }, []);

  const handleClearContent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    updateSnippetContent(snippet.id, '');
  }, [snippet.id, updateSnippetContent]);

  // Convert timestamp
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // ── Global document-level mouseup to detect text selection ──
  // React Flow captures mouse events on nodes, so we hook into document instead.
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      // Small delay to let the selection object settle
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection ? selection.toString().trim() : '';

        // Check if the selection's anchor node is inside OUR card
        if (
          text &&
          contentRef.current &&
          selection &&
          selection.anchorNode &&
          contentRef.current.contains(selection.anchorNode)
        ) {
          setSelectedText(text);
          setShowSendBtn(true);
          // Position toolbar relative to the content area — near the selection end
          const contentRect = contentRef.current.getBoundingClientRect();
          setToolbarPos({
            x: e.clientX - contentRect.left,
            y: e.clientY - contentRect.top - 36, // above mouse cursor
          });
        } else {
          setShowSendBtn(false);
          setSelectedText('');
          setToolbarPos(null);
        }
      }, 10);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Send selected text to editor cursor position
  const handleSendSelection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (selectedText) {
        requestInsertText(selectedText);
        setShowSendBtn(false);
        setSelectedText('');
        // Clear browser selection
        window.getSelection()?.removeAllRanges();
      }
    },
    [selectedText, requestInsertText]
  );

  // Copy selected text to clipboard (fallback for users)
  const handleCopySelection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (selectedText) {
        navigator.clipboard.writeText(selectedText).then(() => {
          setCopiedHint(true);
          setTimeout(() => setCopiedHint(false), 1500);
        }).catch(() => {
          // Fallback for older browsers
          const ta = document.createElement('textarea');
          ta.value = selectedText;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          setCopiedHint(true);
          setTimeout(() => setCopiedHint(false), 1500);
        });
      }
    },
    [selectedText]
  );

  // ALSO support native Ctrl+C — the text is select-text, so it works.
  // We just need to make sure the card doesn't interfere with the keyboard event.

  return (
    <div
      ref={nodeRef}
      id={`node-snippet-${snippet.id}`}
      className={`relative group bg-slate-900 border rounded-xl shadow-xl pointer-events-auto overflow-visible hover:border-slate-700/80 hover:shadow-2xl ${data.resizeMode ? 'border-amber-500/60 border-dashed' : 'border-slate-800/80'}`}
    >
      {data.resizeMode && (
        <>
          {/* Edge lines */}
          <div className="absolute inset-x-0 top-0 h-1 cursor-n-resize z-50" onMouseDown={handleResizeStart('t')} />
          <div className="absolute inset-x-0 bottom-0 h-1 cursor-s-resize z-50" onMouseDown={handleResizeStart('b')} />
          <div className="absolute inset-y-0 left-0 w-1 cursor-w-resize z-50" onMouseDown={handleResizeStart('l')} />
          <div className="absolute inset-y-0 right-0 w-1 cursor-e-resize z-50" onMouseDown={handleResizeStart('r')} />
          {/* Corner handles */}
          <div className="absolute -top-[6px] -left-[6px] w-[14px] h-[14px] bg-slate-500 border-2 border-slate-300 rounded-sm cursor-nw-resize z-50" onMouseDown={handleResizeStart('tl')} />
          <div className="absolute -top-[6px] -right-[6px] w-[14px] h-[14px] bg-slate-500 border-2 border-slate-300 rounded-sm cursor-ne-resize z-50" onMouseDown={handleResizeStart('tr')} />
          <div className="absolute -bottom-[6px] -left-[6px] w-[14px] h-[14px] bg-slate-500 border-2 border-slate-300 rounded-sm cursor-sw-resize z-50" onMouseDown={handleResizeStart('bl')} />
          <div className="absolute -bottom-[6px] -right-[6px] w-[14px] h-[14px] bg-slate-500 border-2 border-slate-300 rounded-sm cursor-se-resize z-50" onMouseDown={handleResizeStart('br')} />
        </>
      )}
      <Handle type="target" position={Position.Top} className="opacity-0 pointer-events-none" />

      {/* Top colored accent line */}
      <div className={`h-1.5 ${config.lineBg} w-full`} />

      {/* Header: drag handle + meta + actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center gap-2">
          {/* Drag Handle — only this element triggers canvas panning */}
          <span
            className="sf-drag-handle flex items-center justify-center w-5 h-5 rounded hover:bg-slate-700/60 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors shrink-0"
            title="拖拽移动卡片"
          >
            <GripHorizontal size={12} />
          </span>

          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleCommit}
              onKeyDown={handleTitleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              maxLength={60}
              className="bg-slate-800 border border-slate-600 text-slate-100 text-[10px] font-bold rounded px-1.5 py-0.5 outline-none focus:border-blue-500 w-[120px]"
            />
          ) : (
            <span
              onClick={handleTitleClick}
              className={`text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:underline hover:text-white transition-colors ${config.color}`}
              title="点击修改标题"
            >
              {displayTitle}
            </span>
          )}
          <span className="font-mono text-[9px] text-slate-500 font-medium">
            {formatTime(snippet.timestamp)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          {isUsed ? (
            <button
              onClick={() => markAsUnread(snippet.id)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-full transition-colors"
              title="标记为未整理"
            >
              <RotateCcw size={12} />
            </button>
          ) : (
            <button
              onClick={() => markAsUsed(snippet.id, snippet.content)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-full transition-colors"
              title="标记为已用"
            >
              <CheckCircle2 size={12} />
            </button>
          )}
          <button
            onClick={() => deleteSnippet(snippet.id)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-full transition-colors"
            title="删除此素材"
          >
            <Trash2 size={12} />
          </button>
          {!isUsed && snippet.content && (
            <button
              onClick={handleClearContent}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-full transition-colors"
              title="清空内容"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Content Zone — NOT draggable, freely selectable & copyable */}
      <div className="relative">
        <div
          ref={contentRef}
          className="p-4 text-slate-200 hover:text-white transition-colors overflow-y-auto max-h-full"
        >
          {editingContent ? (
            <textarea
              ref={contentTextareaRef}
              value={contentDraft}
              onChange={(e) => setContentDraft(e.target.value)}
              onBlur={handleContentCommit}
              onKeyDown={handleContentKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              rows={6}
              className="w-full bg-slate-800 border border-slate-600 text-slate-100 text-xs leading-relaxed rounded p-2 outline-none focus:border-blue-500 resize-none font-sans"
              style={{ minHeight: '80px' }}
            />
          ) : (
            <div
              onDoubleClick={handleContentDblClick}
              className="text-xs text-slate-300 leading-relaxed font-sans block p-2 select-text cursor-text"
              style={{ userSelect: 'text', WebkitUserSelect: 'text', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '24px' }}
              title="双击编辑内容"
            >
              {snippet.content || <span className="text-slate-600 italic">双击编辑内容...</span>}
            </div>
          )}
        </div>

        {/* Floating action bar when text is selected — follows mouse, outside scroll container */}
        {showSendBtn && selectedText && toolbarPos && (
          <div
            className="absolute z-50 animate-fade-in pointer-events-auto"
            style={{ left: Math.max(4, Math.min(toolbarPos.x - 55, (contentRef.current?.offsetWidth || 300) - 195)), top: Math.max(-8, toolbarPos.y - 10) }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 bg-slate-800 border border-slate-500 rounded-lg px-1.5 py-1 shadow-2xl whitespace-nowrap">
              <button
                onClick={handleSendSelection}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1 px-2 rounded transition-all cursor-pointer"
                title="将选中文本发送到剧本编辑器光标处"
              >
                <Send size={10} />
                <span>发送</span>
              </button>
              <button
                onClick={handleCopySelection}
                className="flex items-center gap-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-[10px] font-bold py-1 px-2 rounded transition-all cursor-pointer"
                title="复制选中文本到剪贴板"
              >
                <Copy size={10} />
                <span>{copiedHint ? '已复制!' : '复制'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* USED overlay — compact top banner instead of full center mask */}
      {isUsed && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 border-t border-emerald-500/30 px-3 py-2 flex items-center justify-between animate-fade-in rounded-b-xl">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircle2 size={11} />
            <span>已并入剧本</span>
          </div>
          <button
            onClick={() => markAsUnread(snippet.id)}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold py-1 px-2.5 rounded-full border border-slate-700 hover:border-slate-500 transition-all cursor-pointer"
            title="撤回至灵感池"
          >
            <RotateCcw size={10} />
            <span>撤回</span>
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0 pointer-events-none" />
    </div>
  );
}
