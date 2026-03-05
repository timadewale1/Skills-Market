# Final Work Feature - Complete Implementation Guide

## Overview
The Final Work submission feature with comprehensive watermarking support for all file types (images, videos, PDFs, documents). Features include approval-gated downloads and multi-format preview handling.

## Architecture Summary

### Frontend ([src/app/dashboard/workspaces/[id]/page.tsx](src/app/dashboard/workspaces/[id]/page.tsx))

**File Type Detection & Preview Rendering:**
- Images: Full-screen zoom modal with native viewer + watermark badge
- Videos: Native HTML5 `<video>` player with controls
- PDFs: iframe viewer with optional download link
- Documents: Download cards with conditional "View only" badge
- Unknown files: Graceful fallback with appropriate UI

**View-Only Mode:**
- Milestones shown to clients as "preview only" (disableDownload={isClient})
- Final work previews shown to clients until `status == "approved"`
- Downloads enabled only after client approval

**UI Layout:**
- Talent: Submit final work form with notes + file upload
- Client: Review section appears only when `finalWork` exists
- Payout section moved to after final work (for better UX flow)

### Cloud Functions ([functions/src/index.ts](functions/src/index.ts))

**Multi-File Watermarking Strategy:**

1. **Images** (jpg, jpeg, png, gif, webp, bmp)
   - Processing: Apply SVG watermark overlay with Sharp
   - Output: Watermarked JPEG with text "SKILLS MARKET • PREVIEW"
   - Resolution: 1600px wide, quality 78%

2. **Videos** (mp4, webm, ogg, mov, avi, mkv)
   - Processing: Copy to preview folder as-is
   - Metadata: Store as `fileType: "video"`
   - Frontend Display: Shows with "Preview" badge, no download until approved

3. **PDFs** (.pdf)
   - Processing: Copy to preview folder as-is
   - Metadata: Store as `fileType: "pdf"`
   - Frontend Display: iframe viewer with "Preview" badge

4. **Documents** (doc, docx, xls, xlsx, ppt, pptx, txt)
   - Processing: Copy to preview folder as-is
   - Metadata: Store as `fileType: "document"`
   - Frontend Display: Card with "Preview only" badge

**Storage Paths:**
- Raw (talent-only): `workspaces/{wsId}/milestones|finalWork/raw/{file}`
- Preview: `workspaces/{wsId}/milestones|finalWork/previews/{preview}`

**Firestore Metadata:**
- Attachment objects now include `fileType` field for frontend type detection
- Both milestone and final work use same attachment schema

## Database Schema

### Milestone Attachment
```typescript
{
  kind: "preview",
  name: string,           // Preview filename
  contentType: string,    // MIME type (image/jpeg, video/mp4, etc.)
  size: number,           // File size in bytes
  storagePath: string,    // Storage path to preview
  fileType?: string       // "image" | "video" | "pdf" | "document"
}
```

### FinalWork Document
```typescript
{
  id: string,                              // "submission"
  status: "submitted" | "approved" | "declined",
  submittedBy: string,                     // Talent UID
  submittedAt?: Timestamp,
  notes?: string,                          // Talent's submission notes
  attachments?: MilestoneAttachment[],     // Preview + raw refs
  review?: {
    decision: "approved" | "declined",
    reason: string,
    at: Timestamp,
    byUid: string                         // Client UID
  },
  downloadableAfter?: "submitted" | "approved",
  updatedAt?: Timestamp
}
```

## Storage Rules Updates

Add to your Firebase Storage Rules (https://console.firebase.google.com/project/{PROJECT}/storage/rules):

```javascript
// Milestone raw uploads (talent-only)
match /workspaces/{wsId}/milestones/{milestoneId}/raw/{path=**} {
  allow read, write: if request.auth != null && 
    get(/databases/(default)/documents/workspaces/$(wsId)).data.talentUid == request.auth.uid;
}

// Milestone watermarked previews (participants only)
match /workspaces/{wsId}/milestones/{milestoneId}/previews/{path=**} {
  allow read: if request.auth != null && (
    get(/databases/(default)/documents/workspaces/$(wsId)).data.talentUid == request.auth.uid ||
    get(/databases/(default)/documents/workspaces/$(wsId)).data.clientUid == request.auth.uid
  );
}

// Final Work raw uploads (talent-only)
match /workspaces/{wsId}/finalWork/raw/{path=**} {
  allow read, write: if request.auth != null && 
    get(/databases/(default)/documents/workspaces/$(wsId)).data.talentUid == request.auth.uid;
}

// Final Work watermarked previews (participants only)
match /workspaces/{wsId}/finalWork/previews/{path=**} {
  allow read: if request.auth != null && (
    get(/databases/(default)/documents/workspaces/$(wsId)).data.talentUid == request.auth.uid ||
    get(/databases/(default)/documents/workspaces/$(wsId)).data.clientUid == request.auth.uid
  );
}
```

## Firestore Rules Updates

Add to your Firestore Security Rules (https://console.firebase.google.com/project/{PROJECT}/firestore/rules):

```javascript
// Milestone subcollection
match /workspaces/{wsId}/milestones/{milestoneId} {
  allow read, create: if request.auth != null &&
    get(/databases/(default)/documents/workspaces/$(wsId)).data.talentUid == request.auth.uid;
  allow update: if request.auth != null && (
    (request.resource.data.status == 'submitted' && 
     get(/databases/(default)/documents/workspaces/$(wsId)).data.talentUid == request.auth.uid) ||
    get(/databases/(default)/documents/workspaces/$(wsId)).data.clientUid == request.auth.uid
  );
}

// Final Work submission
match /workspaces/{wsId}/finalWork/submission {
  allow read: if request.auth != null && (
    get(/databases/(default)/documents/workspaces/$(wsId)).data.talentUid == request.auth.uid ||
    get(/databases/(default)/documents/workspaces/$(wsId)).data.clientUid == request.auth.uid
  );
  allow create: if request.auth != null && 
    get(/databases/(default)/documents/workspaces/$(wsId)).data.talentUid == request.auth.uid;
  allow update: if request.auth != null && (
    (request.resource.data.status == 'submitted' && 
     get(/databases/(default)/documents/workspaces/$(wsId)).data.talentUid == request.auth.uid) ||
    get(/databases/(default)/documents/workspaces/$(wsId)).data.clientUid == request.auth.uid
  );
}
```

## Deployment Steps

### 1. Deploy Cloud Functions
```bash
cd functions
npm install
npm run build
npm run deploy
```

### 2. Update Firebase Rules
- **Storage Rules:** Go to Storage → Rules → Paste rules above → Publish
- **Firestore Rules:** Go to Firestore → Rules → Paste rules above → Publish

### 3. Verify Deployment
Test the workflow:
1. Talent uploads final work files (various types)
2. Cloud Functions automatically generate previews
3. Client views watermarked previews (view-only)
4. Client approves final work
5. Talent can now download approved files
6. Frontend respects `downloadableAfter: "approved"`

## Frontend Features

### Talent Side
- Submit final work form with textarea for notes + file picker
- Upload indicator ("Uploading…" button state)
- Status tracking (submitted → approved → available for download)
- Ability to resubmit if client declines

### Client Side
- Only sees final work review section if talent submitted
- Views watermarked previews (no download option)
- Can approve or decline with specific reason
- Gets visual feedback on approval decision

### Payout Flow
- Request payout button now appears after final work section
- Clearer separation between final deliverables and payment request

## File Type Handling

| Type | Detection | Processing | Display |
|------|-----------|-----------|---------|
| Image (jpg, png, etc.) | Extension match | Sharp watermark + JPEG conversion | Zoom modal + watermark badge |
| Video (mp4, webm, etc.) | Extension match | Copy as-is | Native `<video>` player |
| PDF | `.pdf` extension | Copy as-is | iframe viewer |
| Document (doc, xls, etc.) | Extension match | Copy as-is | Download card |
| Unknown | Other extensions | Copy as-is | Generic download |

## Watermark Details

**Text:** "SKILLS MARKET • PREVIEW"
**Styling:** 
- SVG text overlay using pattern with 45° rotation
- White text (rgba(255,255,255,0.22)) for opacity
- Bold Arial font
- Applied at 48px size

**Image Processing:**
- Auto-rotate based on EXIF data
- Resize to 1600px max width
- Compress to 78% quality JPEG
- Watermark applied after composition

## Testing Checklist

- [ ] Talent can upload files of all types
- [ ] Cloud Functions generate previews within 5 seconds
- [ ] Images show watermarked preview in client view
- [ ] Videos/PDFs show with "Preview" badge
- [ ] Client cannot download until approval
- [ ] Client can approve (enables downloads)
- [ ] Client can decline with reason
- [ ] Talent can resubmit after decline
- [ ] Payout request visible after final work submission
- [ ] All file type previews render correctly

## Troubleshooting

### 403 Forbidden Errors
- Verify workspace has `talentUid` and `clientUid` fields
- Check that signed-in user matches workspace participant
- Review Cloud Functions logs for errors

### Preview Not Generating
- Check Cloud Functions logs: `firebase functions:log`
- Verify file type is supported
- Check Storage bucket permissions
- Ensure Firestore document exists before upload

### Download Button Hidden
- Verify `finalWork.status == "approved"` in Firestore
- Check that frontend respects `disableDownload` flag
- Confirm client role detection is correct

## Monitoring

### Cloud Functions Logs
```bash
firebase functions:log
# Filter for [watermarkMilestoneUpload] or [watermarkFinalWorkUpload]
```

### Firestore Queries
To check final work status:
```
db.collection('workspaces').doc(wsId).collection('finalWork').doc('submission').get()
```

## Version History

**v1.0** (Feb 20, 2026)
- Initial implementation with multi-file watermarking
- Image watermarking with Sharp
- Video/PDF/Document preview support
- Approval-gated downloads
- Payout section repositioning
- Client-only final work review UI
