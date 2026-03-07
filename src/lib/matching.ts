export interface TalentProfile {
  uid: string
  fullName: string
  skills?: string[]
  categories?: string[]
  sdgTags?: string[]
  location?: string
  workMode?: string
  hourlyRate?: number | null
  rating?: { avg?: number; count?: number }
  verification?: { status?: string }
  slug?: string
  roleTitle?: string // added for display
  photoURL?: string
}

export interface ClientProfile {
  uid: string
  fullName: string
  skills?: string[]
  categories?: string[]
  sdgTags?: string[]
  location?: string
  workMode?: string
}

export interface Gig {
  id: string
  title: string
  requiredSkills?: string[]
  category?: { group?: string; item?: string }
  sdgTags?: string[]
  workMode?: string
  location?: string
  budgetType?: string
  hourlyRate?: number | null
  fixedBudget?: number | null
}

export function calculateMatchScore(talent: TalentProfile, criteria: Partial<TalentProfile>): number {
  let score = 0

  // Skills match
  if (criteria.skills && talent.skills) {
    const commonSkills = criteria.skills.filter(skill => talent.skills!.includes(skill))
    score += commonSkills.length * 2
  }

  // Categories match
  if (criteria.categories && talent.categories) {
    const commonCategories = criteria.categories.filter(cat => talent.categories!.includes(cat))
    score += commonCategories.length * 3
  }

  // SDG tags match
  if (criteria.sdgTags && talent.sdgTags) {
    const commonSDGs = criteria.sdgTags.filter(sdg => talent.sdgTags!.includes(sdg))
    score += commonSDGs.length * 2
  }

  // Work mode match
  if (criteria.workMode && talent.workMode === criteria.workMode) {
    score += 1
  }

  // Location match (rough)
  if (criteria.location && talent.location && talent.location.toLowerCase().includes(criteria.location.toLowerCase())) {
    score += 1
  }

  return score
}

export function matchTalentsToGig(talents: TalentProfile[], gig: Gig): TalentProfile[] {
  const criteria: Partial<TalentProfile> = {
    skills: gig.requiredSkills,
    categories: gig.category?.item ? [gig.category.item] : [],
    sdgTags: gig.sdgTags,
    workMode: gig.workMode,
    location: gig.location,
  }

  return talents
    .map(talent => ({
      ...talent,
      matchScore: calculateMatchScore(talent, criteria)
    }))
    .filter(talent => talent.matchScore >= 2) // At least 2 points
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function matchTalentsToClient(talents: TalentProfile[], client: Partial<ClientProfile>): TalentProfile[] {
  const criteria: Partial<TalentProfile> = {
    skills: client.skills,
    categories: client.categories,
    sdgTags: client.sdgTags,
    workMode: client.workMode,
    location: client.location,
  }

  return talents
    .map(talent => ({
      ...talent,
      matchScore: calculateMatchScore(talent, criteria)
    }))
    .filter(talent => talent.matchScore >= 2)
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function matchGigsToTalent(gigs: Gig[], talent: TalentProfile): Gig[] {
  const criteria: Partial<Gig> = {
    requiredSkills: talent.skills,
    category: talent.categories ? { item: talent.categories[0] } : undefined,
    sdgTags: talent.sdgTags,
    workMode: talent.workMode,
    location: talent.location,
  }

  return gigs
    .map(gig => ({
      ...gig,
      matchScore: calculateMatchScore(talent, criteria as any) // Reuse the function
    }))
    .filter(gig => gig.matchScore >= 2)
    .sort((a, b) => b.matchScore - a.matchScore)
}