import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { storage } from "@/lib/firebase"

export const MAX_SUPPORT_ATTACHMENTS = 5
export const MAX_SUPPORT_ATTACHMENT_SIZE_MB = 15

export type SupportAttachment = {
  name: string
  url: string
  storagePath: string
  contentType?: string
  size?: number
}

export async function uploadSupportAttachments(threadId: string, files: File[]) {
  const uploaded: SupportAttachment[] = []

  for (const file of files.slice(0, MAX_SUPPORT_ATTACHMENTS)) {
    if (file.size > MAX_SUPPORT_ATTACHMENT_SIZE_MB * 1024 * 1024) {
      throw new Error(`"${file.name}" is too large. Max ${MAX_SUPPORT_ATTACHMENT_SIZE_MB}MB per file.`)
    }

    const safeName = file.name.replace(/[^\w.\-]+/g, "_")
    const path = `support/${threadId}/attachments/${Date.now()}_${safeName}`
    const result = await uploadBytes(ref(storage, path), file, {
      contentType: file.type || "application/octet-stream",
    })
    const url = await getDownloadURL(result.ref)

    uploaded.push({
      name: file.name,
      url,
      storagePath: path,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    })
  }

  return uploaded
}
