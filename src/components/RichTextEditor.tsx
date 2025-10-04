import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, Italic, Code, List, ListOrdered, Quote, 
  Heading1, Heading2, Heading3, Image as ImageIcon,
  Undo, Redo, Hash, Link2, Minus, Table
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const lowlight = createLowlight(common);

type RichTextEditorProps = {
  content: string;
  onChange: (content: string) => void;
};

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const [viewMode, setViewMode] = useState<'rich' | 'markdown' | 'html'>('rich');
  const [markdownContent, setMarkdownContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your story...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-blog focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  useEffect(() => {
    if (viewMode === 'markdown' && editor) {
      setMarkdownContent(editor.getText());
    } else if (viewMode === 'html' && editor) {
      setHtmlContent(editor.getHTML());
    }
  }, [viewMode, editor]);

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload images');
        return;
      }

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('post-images')
          .upload(fileName, file);

        if (uploadError) {
          toast.error('Error uploading image');
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        editor?.chain().focus().setImage({ src: publicUrl }).run();
      }
    };

    input.click();
  };

  
  const handleMarkdownChange = (value: string) => {
    setMarkdownContent(value);
    onChange(value);
  };

  const handleHtmlChange = (value: string) => {
    setHtmlContent(value);
    onChange(value);
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdownContent.substring(start, end);
    const newText = markdownContent.substring(0, start) + before + selectedText + after + markdownContent.substring(end);
    
    setMarkdownContent(newText);
    onChange(newText);
  };

  const insertHtml = (tag: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = htmlContent.substring(start, end);
    const newText = htmlContent.substring(0, start) + `<${tag}>` + selectedText + `</${tag}>` + htmlContent.substring(end);
    
    setHtmlContent(newText);
    onChange(newText);
  };

  if (!editor) return null;

  const renderToolbar = () => {
    if (viewMode === 'markdown') {
      return (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('**', '**')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('*', '*')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('`', '`')}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('# ', '')}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('## ', '')}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('### ', '')}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('- ', '')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('1. ', '')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('> ', '')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('[', '](url)')}
            title="Link"
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('---\n', '')}
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </>
      );
    }

    if (viewMode === 'html') {
      return (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('strong')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('em')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('code')}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('h1')}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('h2')}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('h3')}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('ul')}
            title="Unordered List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('ol')}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('blockquote')}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('a href=""')}
            title="Link"
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertHtml('table')}
            title="Table"
          >
            <Table className="h-4 w-4" />
          </Button>
        </>
      );
    }

    // Rich text toolbar
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-muted' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImageUpload}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </>
    );
  };

  const getPreviewContent = () => {
    if (viewMode === 'markdown') {
      return markdownContent;
    }
    if (viewMode === 'html') {
      return htmlContent;
    }
    return editor.getHTML();
  };


  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1 items-center">
        {renderToolbar()}
        <div className="w-px h-6 bg-border mx-1" />
        <div className="flex gap-1 ml-auto">
          <Button
            type="button"
            variant={viewMode === 'rich' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('rich')}
          >
            Rich Text
          </Button>
          <Button
            type="button"
            variant={viewMode === 'markdown' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('markdown')}
          >
            Markdown
          </Button>
          <Button
            type="button"
            variant={viewMode === 'html' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('html')}
          >
            HTML
          </Button>
        </div>
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="min-h-[500px]">
        <ResizablePanel defaultSize={50} minSize={30}>
          {viewMode === 'markdown' ? (
            <Textarea
              value={markdownContent}
              onChange={(e) => handleMarkdownChange(e.target.value)}
              className="h-full min-h-[500px] resize-none rounded-none border-0 focus-visible:ring-0 font-mono"
              placeholder="Write your markdown here..."
            />
          ) : viewMode === 'html' ? (
            <Textarea
              value={htmlContent}
              onChange={(e) => handleHtmlChange(e.target.value)}
              className="h-full min-h-[500px] resize-none rounded-none border-0 focus-visible:ring-0 font-mono"
              placeholder="Write your HTML here..."
            />
          ) : (
            <EditorContent editor={editor} className="bg-background h-full" />
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="p-4 bg-muted/30 h-full overflow-auto">
            <div className="max-w-6xl mx-auto bg-background p-6 rounded-lg shadow-sm">
              {viewMode === 'markdown' ? (
                <div className="prose-blog">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdownContent || '*Preview will appear here...*'}
                  </ReactMarkdown>
                </div>
              ) : (
                <div 
                  className="prose-blog"
                  dangerouslySetInnerHTML={{ __html: getPreviewContent() || '<p class="text-muted-foreground">Preview will appear here...</p>' }}
                />
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
