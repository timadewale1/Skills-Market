import { storage } from "@/lib/firebase"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"

export async function uploadFileWithProgress(opts: {
  path: string
  file: File
  onProgress?: (pct: number) => void
}): Promise<string> {
  const { path, file, onProgress } = opts
  const storageRef = ref(storage, path)

  const task = uploadBytesResumable(storageRef, file)

  return await new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        onProgress?.(pct)
      },
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve(url)
      }
    )
  })
}

export function makeUserPath(uid: string, folder: string, filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
  return `users/${uid}/${folder}/${Date.now()}_${safe}`
}
