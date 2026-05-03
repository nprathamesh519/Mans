import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const uploadImage = async (file: File, folder: string = 'memories'): Promise<string> => {
  const filename = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};
