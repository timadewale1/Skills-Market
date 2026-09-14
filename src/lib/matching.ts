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

function hasOverlap(a?: string[], b?: string[]) {
  if (!a?.length || !b?.length) return false
  const values = new Set(b.map(value => String(value).trim().toLowerCase()))
  return a.some(value => values.has(String(value).trim().toLowerCase()))
}

function hasLocationMatch(left?: string, right?: string) {
  return Boolean(left && right && (
    left.toLowerCase().includes(right.toLowerCase()) || right.toLowerCase().includes(left.toLowerCase())
  ))
}

function isEligibleForGig(talent: TalentProfile, gig: Gig) {
  const skillMatch = hasOverlap(gig.requiredSkills, talent.skills)
  const categoryMatch = !gig.category?.item || hasOverlap([gig.category.item], talent.categories)
  const sdgMatch = !gig.sdgTags?.length || hasOverlap(gig.sdgTags, talent.sdgTags)
  const workModeMatch = !gig.workMode || gig.workMode === talent.workMode
  const locationMatch = !gig.location || hasLocationMatch(gig.location, talent.location)
  const matchedDimensions = [
    skillMatch,
    Boolean(gig.category?.item) && categoryMatch,
    Boolean(gig.sdgTags?.length) && sdgMatch,
    Boolean(gig.workMode) && workModeMatch,
    Boolean(gig.location) && locationMatch,
  ]
    .filter(Boolean).length

  // A gig must match its core skill and at least two additional profile dimensions.
  return skillMatch && matchedDimensions >= 3 && talent.verification?.status === "verified"
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
    .filter(talent => isEligibleForGig(talent, gig))
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
    .filter(talent => talent.matchScore >= 2 && talent.verification?.status === "verified")
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function matchGigsToTalent(gigs: Gig[], talent: TalentProfile): Gig[] {
  return gigs
    .map(gig => ({
      ...gig,
      matchScore: calculateMatchScore(talent, {
        skills: gig.requiredSkills,
        categories: gig.category?.item ? [gig.category.item] : [],
        sdgTags: gig.sdgTags,
        workMode: gig.workMode,
        location: gig.location,
      })
    }))
    .filter(gig => isEligibleForGig(talent, gig))
    .sort((a, b) => b.matchScore - a.matchScore)
}
