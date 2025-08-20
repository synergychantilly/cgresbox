import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your text here...",
  className = "",
  minHeight = 200
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const content = editorRef.current.innerHTML;
      onChange(content);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag);
  };

  return (
    <div className="rich-text-editor border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-2 bg-gray-50 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 underline"
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => formatBlock('h1')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatBlock('h2')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => formatBlock('h3')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => formatBlock('p')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
          title="Normal Text"
        >
          P
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
          title="Numbered List"
        >
          1. List
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={insertLink}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
          title="Insert Link"
        >
          🔗
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
          title="Align Left"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
          title="Align Center"
        >
          ↔
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
          title="Align Right"
        >
          →
        </button>
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 text-red-600"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className={`p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset ${className}`}
        style={{ minHeight: `${minHeight}px` }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          
          .rich-text-editor [contenteditable] h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 0.5em 0;
          }
          
          .rich-text-editor [contenteditable] h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0.5em 0;
          }
          
          .rich-text-editor [contenteditable] h3 {
            font-size: 1.25em;
            font-weight: bold;
            margin: 0.5em 0;
          }
          
          .rich-text-editor [contenteditable] p {
            margin: 0.5em 0;
          }
          
          .rich-text-editor [contenteditable] ul, .rich-text-editor [contenteditable] ol {
            margin: 0.5em 0;
            padding-left: 2em;
          }
          
          .rich-text-editor [contenteditable] li {
            margin: 0.25em 0;
          }
          
          .rich-text-editor [contenteditable] a {
            color: #2563eb;
            text-decoration: underline;
          }
          
          .rich-text-editor [contenteditable] strong {
            font-weight: bold;
          }
          
          .rich-text-editor [contenteditable] em {
            font-style: italic;
          }
          
          .rich-text-editor [contenteditable] u {
            text-decoration: underline;
          }
        `
      }} />
    </div>
  );
}
