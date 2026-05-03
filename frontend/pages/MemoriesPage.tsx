import React, { useEffect, useState } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { PhotoIcon, SparklesIcon, PencilIcon, TrashIcon } from '../components/icons/Icons';
import { AIService } from '../services/aiService';
import { speak } from '../utils/helpers';
import Button from '../components/ui/Button';

interface EditState {
  id: string;
  title: string;
  description: string;
  imageFile: File | null;
  imageUrl: string;
}

const MemoriesPage: React.FC = () => {
  const { memories, fetchMemories, updateMemory, deleteMemory } = useMemoryStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [narratingId, setNarratingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMemories(); }, []);

  const handleNarrate = async (memory: any) => {
    if (!user) return;
    setNarratingId(memory.id);
    try {
      const story = await AIService.narrateMemory(memory, user.name);
      if (story) speak(story);
    } catch (e) {
      console.error(e);
    } finally {
      setNarratingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this memory?')) return;
    await deleteMemory(id);
  };

  const openEdit = (m: any) => {
    setEditState({ id: m.id, title: m.title, description: m.description || '', imageFile: null, imageUrl: m.imageUrl || '' });
  };

  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 400;
          const scale = MAX / img.width;
          canvas.width = MAX;
          canvas.height = img.height * scale;
          canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.readAsDataURL(file);
    });

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editState) return;
    setEditState(prev => prev ? { ...prev, imageFile: file, imageUrl: URL.createObjectURL(file) } : prev);
  };

  const handleEditSave = async () => {
    if (!editState) return;
    setSaving(true);
    try {
      let imageUrl = editState.imageUrl;
      if (editState.imageFile) {
        imageUrl = await convertToBase64(editState.imageFile);
      }
      await updateMemory(editState.id, {
        title: editState.title,
        description: editState.description,
        imageUrl: imageUrl || null,
      });
      await fetchMemories();
      setEditState(null);
    } catch (err: any) {
      console.error('Update memory error:', err);
      alert(`Failed to update: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Photo Memories</h1>
        {user?.role === 'caretaker' && (
          <Button onClick={() => navigate('/memories/add')} className="transition-transform hover:scale-105 active:scale-95">
            + Add Memory
          </Button>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memories.map(m => (
          <div
            key={m.id}
            className="glass-card overflow-hidden border border-white/40 flex flex-col h-full bg-white/40"
          >
            {/* Photo — same h-56 as FaceCard */}
            {m.imageUrl ? (
              <img src={m.imageUrl} alt={m.title} className="w-full h-56 object-cover" />
            ) : (
              <div className="w-full h-56 bg-slate-100 flex items-center justify-center text-gray-300">
                <PhotoIcon />
              </div>
            )}

            <div className="p-5 flex flex-col flex-grow">
              <h3 className="text-xl font-bold text-brand-text">{m.title}</h3>
              <p className="text-brand-primary font-semibold text-sm mb-2">
                {new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-brand-text-light text-sm italic flex-grow line-clamp-3">"{m.description}"</p>

              <div className="flex justify-end space-x-2 mt-4 flex-wrap gap-2">
                <Button size="sm" onClick={() => handleNarrate(m)} loading={narratingId === m.id}>
                  <SparklesIcon /> Story
                </Button>
                {user?.role === 'caretaker' && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>
                      <PencilIcon /> Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(m.id)}>
                      <TrashIcon /> Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {memories.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">
            <PhotoIcon />
            <p className="mt-2">No memories yet</p>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">Edit Memory</h2>

            <input
              value={editState.title}
              onChange={e => setEditState(prev => prev ? { ...prev, title: e.target.value } : prev)}
              placeholder="Title"
              className="form-input w-full"
            />

            <textarea
              value={editState.description}
              onChange={e => setEditState(prev => prev ? { ...prev, description: e.target.value } : prev)}
              placeholder="Description"
              className="form-input w-full h-28"
            />

            {/* Current photo */}
            {editState.imageUrl && (
              <img src={editState.imageUrl} alt="preview" className="w-full h-40 object-cover rounded-xl" />
            )}

            <input type="file" accept="image/*" onChange={handleEditImageChange} className="form-input w-full" />

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleEditSave} loading={saving}>Save</Button>
              <Button className="flex-1" variant="secondary" onClick={() => setEditState(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoriesPage;
