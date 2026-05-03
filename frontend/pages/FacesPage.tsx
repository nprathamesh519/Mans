import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFaceStore } from '../store/faceStore';
import { UserRole, FaceProfile } from '../types';
import Button from '../components/ui/Button';
import { PlusIcon, PencilIcon, TrashIcon, VideoCameraIcon, SpinnerIcon } from '../components/icons/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { speak } from '../utils/helpers';
import { autoSyncFaces } from './AddFacePage';

interface EditFaceState {
  id: string;
  name: string;
  relation: string;
  notes: string;
  imageFile: File | null;
  imageUrl: string;
}

const FaceCard: React.FC<{ face: FaceProfile, role: UserRole, onEdit?: (face: FaceProfile) => void }> = ({ face, role, onEdit }) => {
    const { deleteFace } = useFaceStore();
    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card overflow-hidden border border-white/40 flex flex-col h-full bg-white/40">
            <img src={face.imageUrl} alt={face.name} className="w-full h-56 object-cover"/>
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-brand-text">{face.name}</h3>
                <p className="text-brand-primary font-semibold text-sm mb-2">{face.relation}</p>
                <p className="text-brand-text-light text-sm italic flex-grow">"{face.notes}"</p>
                {role === UserRole.CARETAKER && (
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="secondary" size="sm" className="p-2" title="Edit" onClick={() => onEdit?.(face)}><PencilIcon /></Button>
                        <Button variant="danger" size="sm" className="p-2" onClick={() => deleteFace(face.id)} title="Delete"><TrashIcon /></Button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const PatientFacesView = () => {
    const { faces, fetchFaces } = useFaceStore();
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [status, setStatus] = useState<'idle' | 'recognizing' | 'recognized' | 'not-found'>('idle');
    const [recognizedFace, setRecognizedFace] = useState<FaceProfile | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const lastSpokenRef = useRef('');
    const lastSpokenTimeRef = useRef(0);
    const facesRef = useRef(faces);
    useEffect(() => { facesRef.current = faces; }, [faces]);

    useEffect(() => { fetchFaces(); }, []);

    const performRecognitionAuto = useRef(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        if (!videoRef.current.videoWidth) return;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        try {
            const faceApiUrl = import.meta.env.VITE_FACE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${faceApiUrl}/recognize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });
            const result = await res.json();
            if (!result.success) return;
            const now = Date.now();
            if (result.name === 'Unknown') {
                if (now - lastSpokenTimeRef.current > 5000) {
                    speak('Unknown person detected');
                    lastSpokenTimeRef.current = now;
                    setStatus('not-found');
                }
            } else {
                if (result.name !== lastSpokenRef.current || now - lastSpokenTimeRef.current > 10000) {
                    speak(`${result.name}. ${result.relation}`);
                    lastSpokenRef.current = result.name;
                    lastSpokenTimeRef.current = now;
                    const match = facesRef.current.find(f => f.name.toLowerCase() === result.name.toLowerCase());
                    setRecognizedFace(match || { id: '', name: result.name, relation: result.relation, imageUrl: '', notes: '' });
                    setStatus('recognized');
                }
            }
        } catch { /* module not running */ }
    });

    useEffect(() => {
        if (isCameraOn) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    streamRef.current = stream;
                    if (videoRef.current) videoRef.current.srcObject = stream;
                })
                .catch(err => {
                    console.error('Camera access denied', err);
                    setIsCameraOn(false);
                });
        } else {
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            setStatus('idle');
            setRecognizedFace(null);
        }
        return () => streamRef.current?.getTracks().forEach(t => t.stop());
    }, [isCameraOn]);

    // Auto-scan every 3s — mirrors Python's continuous while loop, [] deps so never restarts
    useEffect(() => {
        const id = setInterval(() => performRecognitionAuto.current(), 3000);
        return () => clearInterval(id);
    }, []);

    const performRecognition = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setStatus('recognizing');
        setRecognizedFace(null);

        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);

        try {
            const faceApiUrl = import.meta.env.VITE_FACE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${faceApiUrl}/recognize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });
            const result = await res.json();

            if (!result.success) {
                setStatus('idle');
                return;
            }

            if (result.name === 'Unknown') {
                setStatus('not-found');
                speak('Unknown person detected');
            } else {
                // Find matching face profile for the card display
                const match = faces.find(f => f.name.toLowerCase() === result.name.toLowerCase());
                setRecognizedFace(match || { id: '', name: result.name, relation: result.relation, imageUrl: '', notes: '' });
                setStatus('recognized');
                // Mirrors Python: speak("{name}. {relation}")
                speak(`${result.name}. ${result.relation}`);
            }
        } catch {
            setStatus('not-found');
            speak('Face recognition module is not available');
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="glass-card p-8 rounded-[2rem] text-center border border-white/60 mb-8 bg-white/50">
                <div className="mx-auto w-12 h-12 text-brand-primary mb-4">
                    <VideoCameraIcon />
                </div>
                <h2 className="text-3xl font-bold mt-4">Who's Here?</h2>
                {!isCameraOn ? (
                    <Button onClick={() => setIsCameraOn(true)} className="mt-6 px-10 py-5 text-lg rounded-2xl">Start Looking</Button>
                ) : (
                    <div className="flex flex-col items-center mt-6">
                        <div className="relative w-full max-w-lg aspect-video bg-slate-900 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            {status === 'recognizing' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white flex-col">
                                    <SpinnerIcon />
                                    <span className="mt-2 font-bold">Checking memories...</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4 mt-6">
                            <Button onClick={performRecognition} loading={status === 'recognizing'} className="rounded-2xl px-10">Scan Face</Button>
                            <Button onClick={() => setIsCameraOn(false)} variant="secondary" className="rounded-2xl px-10">Stop Camera</Button>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {status === 'recognized' && recognizedFace && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="text-center">
                        <h3 className="text-3xl font-bold text-brand-primary">I remember! This is {recognizedFace.name}</h3>
                        <div className="max-w-xs mx-auto mt-6">
                            <FaceCard face={recognizedFace} role={UserRole.PATIENT} />
                        </div>
                    </motion.div>
                )}
                {status === 'not-found' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="text-center p-8 glass-card bg-red-50">
                        <p className="text-xl font-bold text-brand-danger">I'm sorry, I don't recognize this person yet.</p>
                        <p className="text-brand-text-light mt-2">Maybe they are new? Ask them for their name.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CaretakerFacesView = () => {
    const { faces, fetchFaces, updateFace } = useFaceStore();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [syncing, setSyncing] = useState(false);
    const [editState, setEditState] = useState<EditFaceState | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      fetchFaces().then(() => {
        if (faces.length > 0) autoSyncFaces(faces);
      });
    }, []);

    const convertToBase64 = (file: File): Promise<string> =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 800;
            const scale = MAX / img.width;
            canvas.width = MAX;
            canvas.height = img.height * scale;
            canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
          };
        };
        reader.readAsDataURL(file);
      });

    const openEdit = (face: FaceProfile) => {
      setEditState({ id: face.id, name: face.name, relation: face.relation, notes: face.notes || '', imageFile: null, imageUrl: face.imageUrl });
    };

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
        await updateFace(editState.id, {
          name: editState.name,
          relation: editState.relation,
          notes: editState.notes,
          imageUrl
        });
        // Re-sync to Flask with updated data
        const updatedFaces = faces.map(f => f.id === editState.id ? { ...f, name: editState.name, relation: editState.relation, imageUrl } : f);
        autoSyncFaces(updatedFaces);
        setEditState(null);
      } catch (err: any) {
        alert(`Failed to update: ${err.message}`);
      } finally {
        setSaving(false);
      }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const faceApiUrl = import.meta.env.VITE_FACE_API_URL || 'http://localhost:5001';
            const res = await fetch(`${faceApiUrl}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    faces: faces.map(f => ({ name: f.name, relation: f.relation, image: f.imageUrl }))
                })
            });
            const result = await res.json();
            const failed = result.results?.filter((r: any) => r.status !== 'registered') || [];
            if (failed.length > 0) {
                alert(`Sync done. Failed: ${failed.map((r: any) => r.name + ': ' + r.status).join(', ')}`);
            } else {
                alert('All faces synced successfully!');
            }
        } catch {
            alert('Face recognition module not running. Start api.py first.');
        }
        setSyncing(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold">Manage Face Profiles</h1>
                <div className="flex gap-2">
                    <Button onClick={handleSync} variant="secondary" loading={syncing}>Sync to Recognition</Button>
                    <Button onClick={() => navigate('/faces/add')} leftIcon={<PlusIcon />}>Add Person</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {faces.map(f => (
                    <FaceCard key={f.id} face={f} role={user?.role as any} onEdit={openEdit} />
                ))}
                {faces.length === 0 && (
                    <div className="col-span-full py-20 text-center text-brand-text-light glass-card bg-white/30">
                        <p className="text-lg">No face profiles added yet.</p>
                    </div>
                )}
            </div>

            {/* EDIT MODAL */}
            {editState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-xl font-bold">Edit Person</h2>

                        <input
                            value={editState.name}
                            onChange={e => setEditState(prev => prev ? { ...prev, name: e.target.value } : prev)}
                            placeholder="Full Name"
                            className="form-input w-full"
                        />
                        <input
                            value={editState.relation}
                            onChange={e => setEditState(prev => prev ? { ...prev, relation: e.target.value } : prev)}
                            placeholder="Relation (e.g. Daughter)"
                            className="form-input w-full"
                        />
                        <textarea
                            value={editState.notes}
                            onChange={e => setEditState(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                            placeholder="Notes for patient..."
                            className="form-input w-full h-24"
                        />

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

const FacesPage: React.FC = () => {
    const { user } = useAuthStore();
    return user?.role === UserRole.PATIENT ? <PatientFacesView /> : <CaretakerFacesView />;
};

export default FacesPage;