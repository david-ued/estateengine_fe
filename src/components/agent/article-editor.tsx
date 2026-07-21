'use client';

import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconH2,
  IconH3,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconMinus,
  IconPhoto,
  IconStrikethrough,
} from '@tabler/icons-react';
import { Placeholder } from '@tiptap/extensions';
import Image from '@tiptap/extension-image';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  btn,
  cardClass,
  errorTextClass,
  inputClass,
  successTextClass,
} from '@/components/ui/styles';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/get-dictionary';
import { apiFetch } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import type { Article, ArticleStatus } from '@/lib/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** 圖片直傳 article-media bucket（RLS：agent 僅能寫自己 uid 資料夾） */
async function uploadImage(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('no session');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('article-media')
    .upload(path, file);
  if (error) throw error;
  return supabase.storage.from('article-media').getPublicUrl(path).data
    .publicUrl;
}

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('no session');
  return session.access_token;
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: Readonly<{
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // mousedown 先於 blur，避免點按鈕讓編輯器失焦後選取消失
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex size-9 items-center justify-center transition-colors disabled:opacity-30 ${
        active
          ? 'bg-ink text-white'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-ink dark:text-neutral-400 dark:hover:bg-neutral-900'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 專欄編輯器（Substack 式）：大標題 + 摘要 + 富文本內文，
 * 封面 / 內文圖直傳 Storage，草稿 / 發佈走 NestJS /articles。
 */
export function ArticleEditor({
  locale,
  labels,
  article,
}: Readonly<{
  locale: Locale;
  labels: Dictionary['agentBlog'];
  article: Article | null;
}>) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(article?.title ?? '');
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '');
  const [slug, setSlug] = useState(article?.slug ?? '');
  const [coverUrl, setCoverUrl] = useState(article?.cover_image_url ?? '');
  const [isFeatured, setIsFeatured] = useState(article?.is_featured ?? false);
  const [status, setStatus] = useState<ArticleStatus>(
    article?.status ?? 'draft',
  );
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
      }),
      Image,
      Placeholder.configure({ placeholder: labels.contentPlaceholder }),
    ],
    content: article?.content_html ?? '',
    editorProps: {
      attributes: {
        class: 'article-prose min-h-[50vh] focus:outline-none',
        'aria-label': labels.contentPlaceholder,
      },
    },
  });

  // v3 預設不隨 transaction 重繪，工具列 active 狀態改由 selector 訂閱
  const marks = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            bold: current.isActive('bold'),
            italic: current.isActive('italic'),
            strike: current.isActive('strike'),
            h2: current.isActive('heading', { level: 2 }),
            h3: current.isActive('heading', { level: 3 }),
            quote: current.isActive('blockquote'),
            bulletList: current.isActive('bulletList'),
            orderedList: current.isActive('orderedList'),
            link: current.isActive('link'),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
          }
        : null,
  });

  async function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setCoverUrl(await uploadImage(file));
    } catch {
      setError(labels.uploadError);
    } finally {
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  }

  async function handleInlineImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editor) return;
    setError(null);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      setError(labels.uploadError);
    } finally {
      if (inlineInputRef.current) inlineInputRef.current.value = '';
    }
  }

  function handleLink() {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(labels.linkPrompt, previous ?? 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  }

  async function save(nextStatus: ArticleStatus) {
    if (!editor) return;
    if (title.trim() === '') {
      setError(labels.errorTitleRequired);
      return;
    }

    setSaveState('saving');
    setError(null);
    try {
      const token = await getAccessToken();
      const body: Record<string, unknown> = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        contentHtml: editor.getHTML(),
        coverImageUrl: coverUrl,
        isFeatured,
        status: nextStatus,
      };
      // slug 留空交由後端從標題產生（中文標題會退回亂數代稱）
      const trimmedSlug = slug.trim();
      if (trimmedSlug !== '') body.slug = trimmedSlug;

      if (article) {
        const updated = await apiFetch<Article>(`/articles/${article.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
          token,
        });
        setSlug(updated.slug);
        setStatus(updated.status);
        setSaveState('saved');
        router.refresh();
      } else {
        const created = await apiFetch<Article>('/articles', {
          method: 'POST',
          body: JSON.stringify(body),
          token,
        });
        router.replace(`/${locale}/agent/posts/${created.id}/edit`);
      }
    } catch {
      setSaveState('error');
    }
  }

  async function handleDelete() {
    if (!article) return;
    if (!window.confirm(labels.deleteConfirm)) return;
    setSaveState('saving');
    try {
      const token = await getAccessToken();
      await apiFetch(`/articles/${article.id}`, { method: 'DELETE', token });
      router.push(`/${locale}/agent/posts`);
      router.refresh();
    } catch {
      setSaveState('error');
    }
  }

  const saving = saveState === 'saving';

  return (
    <div className="flex flex-col gap-6">
      {/* 文稿卡：封面 → 標題 → 摘要 → 工具列 → 內文 */}
      <div className={`${cardClass} p-0`}>
        <div className="p-6 pb-0">
          {coverUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 遠端圖 */}
              <img
                src={coverUrl}
                alt=""
                className="max-h-80 w-full object-cover"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className={btn.quiet}
                >
                  {labels.coverReplace}
                </button>
                <button
                  type="button"
                  onClick={() => setCoverUrl('')}
                  className={btn.danger}
                >
                  {labels.coverRemove}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 border border-dashed border-neutral-300 py-8 text-neutral-500 transition-colors hover:border-gold hover:text-gold dark:border-neutral-700"
            >
              <IconPhoto size={24} aria-hidden />
              <span className="text-sm">{labels.coverAdd}</span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        <div className="flex flex-col gap-3 p-6">
          <textarea
            rows={1}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={labels.titlePlaceholder}
            className="font-display w-full resize-none border-0 bg-transparent text-3xl leading-tight outline-none placeholder:text-neutral-300 focus:ring-0 sm:text-4xl dark:placeholder:text-neutral-700"
          />
          <textarea
            rows={2}
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder={labels.excerptPlaceholder}
            className="w-full resize-none border-0 bg-transparent text-base text-neutral-500 outline-none placeholder:text-neutral-300 focus:ring-0 dark:placeholder:text-neutral-700"
          />
        </div>

        {/* 工具列：黏在文稿卡頂端，長文捲動時仍可取用 */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-y border-neutral-200 bg-white px-3 py-1.5 dark:border-neutral-800 dark:bg-neutral-950">
          <ToolButton
            label={labels.toolbar.bold}
            active={marks?.bold}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <IconBold size={18} aria-hidden />
          </ToolButton>
          <ToolButton
            label={labels.toolbar.italic}
            active={marks?.italic}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <IconItalic size={18} aria-hidden />
          </ToolButton>
          <ToolButton
            label={labels.toolbar.strike}
            active={marks?.strike}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <IconStrikethrough size={18} aria-hidden />
          </ToolButton>
          <span className="mx-1.5 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />
          <ToolButton
            label={labels.toolbar.h2}
            active={marks?.h2}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <IconH2 size={18} aria-hidden />
          </ToolButton>
          <ToolButton
            label={labels.toolbar.h3}
            active={marks?.h3}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <IconH3 size={18} aria-hidden />
          </ToolButton>
          <ToolButton
            label={labels.toolbar.quote}
            active={marks?.quote}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <IconBlockquote size={18} aria-hidden />
          </ToolButton>
          <ToolButton
            label={labels.toolbar.bulletList}
            active={marks?.bulletList}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <IconList size={18} aria-hidden />
          </ToolButton>
          <ToolButton
            label={labels.toolbar.orderedList}
            active={marks?.orderedList}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <IconListNumbers size={18} aria-hidden />
          </ToolButton>
          <span className="mx-1.5 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />
          <ToolButton
            label={labels.toolbar.link}
            active={marks?.link}
            onClick={handleLink}
          >
            <IconLink size={18} aria-hidden />
          </ToolButton>
          <ToolButton
            label={labels.toolbar.image}
            onClick={() => inlineInputRef.current?.click()}
          >
            <IconPhoto size={18} aria-hidden />
          </ToolButton>
          <ToolButton
            label={labels.toolbar.divider}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <IconMinus size={18} aria-hidden />
          </ToolButton>
          <span className="mx-1.5 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />
          <ToolButton
            label={labels.toolbar.undo}
            disabled={!marks?.canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <IconArrowBackUp size={18} aria-hidden />
          </ToolButton>
          <ToolButton
            label={labels.toolbar.redo}
            disabled={!marks?.canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <IconArrowForwardUp size={18} aria-hidden />
          </ToolButton>
          <input
            ref={inlineInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInlineImage}
            className="hidden"
          />
        </div>

        <div className="p-6">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* 發佈設定 */}
      <div className={`${cardClass} flex flex-col gap-4`}>
        <h3 className="eyebrow">{labels.settingsSection}</h3>
        <label className="flex flex-col gap-1 text-sm">
          {labels.slugLabel}
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder={labels.slugHint}
            className={inputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
            className="size-4 accent-[--color-gold]"
          />
          {labels.featuredLabel}
        </label>
        <p className="text-xs text-neutral-500">{labels.featuredHint}</p>
      </div>

      {/* 動作列 */}
      <div className="flex flex-wrap items-center gap-3">
        {status === 'published' ? (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => save('published')}
              className={btn.primary}
            >
              {saving ? labels.saving : labels.update}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save('draft')}
              className={btn.secondary}
            >
              {labels.unpublish}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => save('published')}
              className={btn.primary}
            >
              {saving ? labels.saving : labels.publish}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save('draft')}
              className={btn.secondary}
            >
              {labels.saveDraft}
            </button>
          </>
        )}
        {article && (
          <button
            type="button"
            disabled={saving}
            onClick={handleDelete}
            className={btn.danger}
          >
            {labels.delete}
          </button>
        )}
        {saveState === 'saved' && (
          <p className={successTextClass}>{labels.saved}</p>
        )}
        {saveState === 'error' && <p className={errorTextClass}>{labels.error}</p>}
        {error && <p className={errorTextClass}>{error}</p>}
      </div>
    </div>
  );
}
