import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemoryStore } from '../store/memoryStore';
import Button from '../components/ui/Button';

const AddMemoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { addMemory, fetchMemories } = useMemoryStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    convertToBase64(file).then(setPreview);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = null;
      if (imageFile) imageUrl = await convertToBase64(imageFile);
      await addMemory({ title, description, date: new Date().toISOString(), imageUrl, tags: [] });
      await fetchMemories();
      navigate('/memories');
    } catch (err) {
      console.error('Save memory error:', err);
      alert('Failed to save memory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Memory</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Memory Title"
          className="form-input"
          required
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What happened?"
          className="form-input h-32"
        />
        <input type="file" accept="image/*" onChange={handleImageChange} className="form-input" />
        {preview && <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />}
        <Button type="submit" className="w-full" loading={loading}>
          Save Memory
        </Button>
      </form>
    </div>
  );
};

export default AddMemoryPage;
