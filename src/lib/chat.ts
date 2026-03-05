import { db } from "@/lib/firebase"
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

/**
 * Firestore Rules for /threads/{threadId}:
 * 
 * match /threads/{threadId} {
 *   allow create: if request.auth.uid in request.resource.data.participants;
 *   allow read: if request.auth.uid in resource.data.participants;
 *   allow update: if request.auth.uid in resource.data.participants;
 *   allow delete: if request.auth.uid in resource.data.participants;
 * }
 *
 * For subcollections /threads/{threadId}/messages/{msgId}:
 *
 * match /threads/{threadId}/messages/{msgId} {
 *   allow create: if request.auth.uid in get(/databases/$(database)/documents/threads/$(threadId)).data.participants;
 *   allow read: if request.auth.uid in get(/databases/$(database)/documents/threads/$(threadId)).data.participants;
 * }
 */

export function makeThreadId(gigId: string, clientUid: string, talentUid: string) {
  return `gig_${gigId}__c_${clientUid}__t_${talentUid}`
}

export async function ensureThread(params: {
  gigId: string
  gigTitle: string
  clientUid: string
  clientName: string
  clientSlug?: string | null
  talentUid: string
  talentName: string
  talentSlug?: string | null
  initialProposalStatus?: "submitted" | "shortlisted" | "accepted" | "rejected"
}) {
  const threadId = makeThreadId(params.gigId, params.clientUid, params.talentUid)
  const ref = doc(db, "threads", threadId)

  const base = {
    type: "thread",
    schemaVersion: 1,

    threadId,
    gigId: params.gigId,
    gigTitle: params.gigTitle,

    participants: [params.clientUid, params.talentUid],
    clientUid: params.clientUid,
    talentUid: params.talentUid,

    clientName: params.clientName,
    clientSlug: params.clientSlug || null,

    talentName: params.talentName,
    talentSlug: params.talentSlug || null,

    proposalStatus: params.initialProposalStatus || "submitted",

    // Good defaults
    lastMessageText: "Conversation started",
    lastMessageAt: serverTimestamp(),
    lastMessageBy: params.clientUid,

    createdAt: serverTimestamp(),   // ✅ add
    updatedAt: serverTimestamp(),   // ✅ keep always present
  }

  await setDoc(ref, base, { merge: true })
  return threadId
}
