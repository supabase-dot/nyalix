import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Upload, X, Image as ImageIcon, Play, AlertTriangle, Calendar, MapPin } from 'lucide-react';
import { useExhibitions, useExhibition } from '@/hooks/useExhibitions';
import type { Exhibition, ExhibitionMedia } from '@/hooks/useExhibitions';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

/* ── Confirm Modal ── */
const ConfirmModal = ({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void; }) => {
  const { t } = useTranslation();
  return (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-card rounded-2xl border border-border p-6 shadow-luxury w-full max-w-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <h3 className="font-display font-bold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors">{t('admin.productForm.cancel')}</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">{t('admin.deleteProduct')}</button>
      </div>
    </motion.div>
  </div>
);
};

/* ── Exhibition Form Modal ── */
const ExhibitionForm = ({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Partial<Exhibition>;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    date: initial?.date ?? '',
    location: initial?.location ?? '',
    cover_image_url: initial?.cover_image_url ?? '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `covers/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('exhibitions').upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('exhibitions').getPublicUrl(path);
    setForm((f) => ({ ...f, cover_image_url: data.publicUrl }));
    setUploading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error(t('admin.exhibitions.titleRequired')); return; }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      date: form.date || null,
      location: form.location,
      cover_image_url: form.cover_image_url,
    };
    let error;
    if (initial?.id) {
      ({ error } = await supabase.from('exhibitions').update(payload).eq('id', initial.id));
    } else {
      ({ error } = await supabase.from('exhibitions').insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(initial?.id ? t('admin.exhibitions.updated') : t('admin.exhibitions.created'));
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl border border-border p-6 shadow-luxury w-full max-w-lg my-4"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-foreground text-lg">{initial?.id ? t('admin.exhibitions.editExhibition') : t('admin.exhibitions.newExhibition')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('admin.exhibitions.title')}</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" placeholder={t('admin.exhibitions.titlePlaceholder')} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('admin.exhibitions.description')}</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4} className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none" placeholder={t('admin.exhibitions.descriptionPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" placeholder="City, Country" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Cover Image</label>
            <input ref={coverRef} type="file" accept="image/*" onChange={uploadCover} className="hidden" />
            {form.cover_image_url ? (
              <div className="relative rounded-lg overflow-hidden border border-border h-32">
                <img src={form.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, cover_image_url: '' }))}
                  className="absolute top-2 right-2 w-7 h-7 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => coverRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm">
                {uploading ? <span className="animate-pulse">{t('admin.exhibitions.uploading')}</span> : <><Upload className="w-5 h-5" /><span>{t('admin.exhibitions.uploadCoverImage')}</span></>}
              </button>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors">{t('admin.productForm.cancel')}</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {saving ? t('admin.saving') : (initial?.id ? t('admin.update') : t('admin.create'))}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ── Media Manager ── */
const MediaManager = ({ exhibitionId, onClose }: { exhibitionId: string; onClose: () => void }) => {
  const { t } = useTranslation();
  const { data: exhibition, refetch } = useExhibition(exhibitionId);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string } | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const media = exhibition?.exhibition_media ?? [];

  const uploadFiles = async (files: FileList, type: 'image' | 'video') => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const folder = type === 'image' ? 'images' : 'videos';
      const path = `${folder}/${exhibitionId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('exhibitions').upload(path, file);
      if (uploadErr) { toast.error(uploadErr.message); continue; }
      const { data } = supabase.storage.from('exhibitions').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('exhibition_media').insert({
        exhibition_id: exhibitionId,
        type,
        url: data.publicUrl,
      });
      if (dbErr) toast.error(dbErr.message);
    }
    setUploading(false);
    refetch();
    toast.success('Media uploaded');
  };

  const deleteMedia = async (id: string) => {
    await supabase.from('exhibition_media').delete().eq('id', id);
    refetch();
    setConfirm(null);
    toast.success('Media deleted');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      {confirm && (
        <ConfirmModal
          title={t('admin.exhibitions.deleteMediaTitle')}
          message={t('admin.exhibitions.deleteMediaConfirm')}
          onConfirm={() => deleteMedia(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl border border-border p-6 shadow-luxury w-full max-w-3xl my-4"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-foreground text-lg">{t('admin.exhibitions.manageMedia')} — {exhibition?.title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Upload buttons */}
        <div className="flex gap-3 mb-6">
          <input ref={imageRef} type="file" accept="image/*" multiple onChange={(e) => e.target.files && uploadFiles(e.target.files, 'image')} className="hidden" />
          <input ref={videoRef} type="file" accept="video/*" multiple onChange={(e) => e.target.files && uploadFiles(e.target.files, 'video')} className="hidden" />
          <button onClick={() => imageRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
            <ImageIcon className="w-4 h-4" /> {t('admin.exhibitions.addImages')}
          </button>
          <button onClick={() => videoRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground border border-border rounded-lg text-sm font-medium hover:bg-border disabled:opacity-60 transition-colors">
            <Play className="w-4 h-4" /> {t('admin.exhibitions.addVideos')}
          </button>
          {uploading && <span className="text-sm text-muted-foreground self-center animate-pulse">{t('admin.exhibitions.uploading')}</span>}
        </div>

        {/* Media grid */}
        {media.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <Upload className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{t('admin.exhibitions.noMedia')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {media.map((m) => (
              <div key={m.id} className="group relative rounded-lg overflow-hidden border border-border bg-muted aspect-square">
                {m.type === 'video' ? (
                  <div className="w-full h-full flex items-center justify-center bg-black/80">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                ) : (
                  <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <button
                  onClick={() => setConfirm({ id: m.id })}
                  className="absolute top-1.5 right-1.5 w-7 h-7 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-1.5 left-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${m.type === 'video' ? 'bg-blue-600 text-white' : 'bg-primary text-primary-foreground'}`}>
                    {m.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

/* ── Main Admin Exhibitions Tab ── */
const AdminExhibitions = () => {
  const qc = useQueryClient();
  const { data: exhibitions, isLoading, refetch } = useExhibitions();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Exhibition | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string } | null>(null);

  const deleteExhibition = async (id: string) => {
    await supabase.from('exhibitions').delete().eq('id', id);
    setConfirm(null);
    toast.success('Exhibition deleted');
    refetch();
  };

  return (
    <div>
      <AnimatePresence>
        {(showForm || editItem) && (
          <ExhibitionForm
            initial={editItem ?? undefined}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            onSaved={() => { refetch(); qc.invalidateQueries({ queryKey: ['exhibitions'] }); }}
          />
        )}
        {mediaId && <MediaManager exhibitionId={mediaId} onClose={() => setMediaId(null)} />}
        {confirm && (
          <ConfirmModal
            title="Delete Exhibition"
            message="This will permanently delete the exhibition and all its media. This action cannot be undone."
            onConfirm={() => deleteExhibition(confirm.id)}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-foreground text-xl">Exhibitions</h2>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Exhibition
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : exhibitions && exhibitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exhibitions.map((ex) => (
            <div key={ex.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-luxury flex">
              {ex.cover_image_url ? (
                <img src={ex.cover_image_url} alt={ex.title} className="w-28 h-full object-cover shrink-0" />
              ) : (
                <div className="w-28 h-full bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 p-4 min-w-0">
                <h3 className="font-semibold text-foreground line-clamp-1">{ex.title}</h3>
                <div className="flex flex-wrap gap-2 mt-1 mb-2 text-xs text-muted-foreground">
                  {ex.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(ex.date), 'MMM d, yyyy')}</span>}
                  {ex.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ex.location}</span>}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{ex.description}</p>
                <div className="flex gap-2">
                  <button onClick={() => setMediaId(ex.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs font-medium hover:bg-border transition-colors">
                    <ImageIcon className="w-3.5 h-3.5" /> Media
                  </button>
                  <button onClick={() => setEditItem(ex)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConfirm({ id: ex.id })}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="mb-4">No exhibitions yet</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Create First Exhibition
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminExhibitions;
