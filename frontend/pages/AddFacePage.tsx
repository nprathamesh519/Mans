import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFaceStore } from '../store/faceStore';
import Button from '../components/ui/Button';

const FACE_API = import.meta.env.VITE_FACE_API_URL || 'http://localhost:5001';

// Syncs all faces from Firestore to Flask recognition module
export const autoSyncFaces = async (faces: any[]) => {
  if (!faces.length) return;
  try {
    await fetch(`${FACE_API}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        faces: faces.map(f => ({ name: f.name, relation: f.relation, image: f.imageUrl }))
      })
    });
  } catch {
    console.warn('Face recognition module not available for auto-sync');
  }
};

const AddFacePage: React.FC = () => {
  const navigate = useNavigate();
  const { addFace, faces, fetchFaces } = useFaceStore();

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');

  // ✅ Convert image to base64
 const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");

        // resize image — keep larger for better face detection
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;

        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // compress quality — keep higher for face detection
        const compressed = canvas.toDataURL("image/jpeg", 0.95);

        resolve(compressed);
      };
    };

    reader.readAsDataURL(file);
  });
};

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const base64 = await convertToBase64(file);
    setPreview(base64);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      alert('Please upload an image');
      return;
    }

    const base64Image = await convertToBase64(imageFile);

    // Save to Firestore first
    await addFace({ name, relation, notes, imageUrl: base64Image });

    // Fetch updated list then auto-sync ALL faces to Flask
    const updatedFaces = await fetchFaces();
    const allFaces = [...faces, { name, relation, imageUrl: base64Image }];
    autoSyncFaces(allFaces);

    navigate('/faces');
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Add New Person</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full Name"
          className="form-input"
          required
        />

        <input
          value={relation}
          onChange={e => setRelation(e.target.value)}
          placeholder="Relation (e.g. Daughter)"
          className="form-input"
          required
        />

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes for patient..."
          className="form-input h-32"
        />

        {/* ✅ IMAGE UPLOAD */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="form-input"
        />

        {/* ✅ PREVIEW */}
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl"
          />
        )}

        <Button type="submit" className="w-full">
          Save Profile
        </Button>
      </form>
    </div>
  );
};

export default AddFacePage;