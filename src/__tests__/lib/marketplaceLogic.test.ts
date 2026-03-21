jest.mock("@/lib/firebase", () => ({
  db: "mock-db",
}))

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
}))

import {
  calculateMatchScore,
  matchGigsToTalent,
  matchTalentsToClient,
  matchTalentsToGig,
} from "@/lib/matching"
import {
  fetchPublicTalent,
  fetchPublicTalentBySlug,
  fetchPublicTalents,
} from "@/lib/publicProfile"
import { fetchPublicGigs } from "@/lib/publicGigs"
import {
  fetchPublicClientBySlug,
  fetchPublicClientByUid,
  pickClientAbout,
  pickClientCategories,
  pickClientPhoto,
  pickClientPortfolio,
  pickClientSocials,
} from "@/lib/publicClients"
import { slugifyName, syncPublicProfile } from "@/lib/profileSync"
import { ensureThread, makeThreadId } from "@/lib/chat"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore"

const mockedDoc = doc as jest.Mock
const mockedGetDoc = getDoc as jest.Mock
const mockedCollection = collection as jest.Mock
const mockedGetDocs = getDocs as jest.Mock
const mockedQuery = query as jest.Mock
const mockedWhere = where as jest.Mock
const mockedLimit = limit as jest.Mock
const mockedOrderBy = orderBy as jest.Mock
const mockedSetDoc = setDoc as jest.Mock
const mockedServerTimestamp = serverTimestamp as jest.Mock

function makeDocSnapshot(exists: boolean, data: any = {}) {
  return {
    exists: () => exists,
    data: () => data,
  }
}

function makeQuerySnapshot(docs: any[]) {
  return {
    empty: docs.length === 0,
    docs,
  }
}

describe("Marketplace client and talent logic", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedServerTimestamp.mockReturnValue("SERVER_TIMESTAMP")
    mockedDoc.mockImplementation((...parts: string[]) => ({ path: parts.join("/") }))
    mockedCollection.mockImplementation((...parts: string[]) => ({ path: parts.join("/") }))
    mockedWhere.mockImplementation((...args: any[]) => ({ type: "where", args }))
    mockedLimit.mockImplementation((value: number) => ({ type: "limit", value }))
    mockedOrderBy.mockImplementation((field: string, direction?: string) => ({
      type: "orderBy",
      field,
      direction,
    }))
    mockedQuery.mockImplementation((...args: any[]) => ({ args }))
  })

  describe("matching flows", () => {
    it("scores talents based on overlapping skills, categories, sdgs, work mode, and location", () => {
      const score = calculateMatchScore(
        {
          uid: "talent-1",
          fullName: "Ada Developer",
          skills: ["React", "Node.js"],
          categories: ["Web Development"],
          sdgTags: ["SDG 8"],
          workMode: "Remote",
          location: "Lagos, Nigeria",
        },
        {
          skills: ["React", "TypeScript"],
          categories: ["Web Development"],
          sdgTags: ["SDG 8"],
          workMode: "Remote",
          location: "lagos",
        }
      )

      expect(score).toBe(9)
    })

    it("matches and sorts talents for a client gig", () => {
      const talents = [
        {
          uid: "talent-1",
          fullName: "Top Match",
          skills: ["React", "Node.js"],
          categories: ["Frontend"],
          sdgTags: ["SDG 8"],
          workMode: "Remote",
          location: "Abuja",
        },
        {
          uid: "talent-2",
          fullName: "Low Match",
          skills: ["Photoshop"],
          categories: ["Design"],
        },
      ]

      const matches = matchTalentsToGig(talents, {
        id: "gig-1",
        title: "Build dashboard",
        requiredSkills: ["React"],
        category: { item: "Frontend" },
        sdgTags: ["SDG 8"],
        workMode: "Remote",
      })

      expect(matches).toHaveLength(1)
      expect(matches[0]).toMatchObject({
        uid: "talent-1",
        matchScore: 8,
      })
    })

    it("matches gigs back to a talent profile", () => {
      const gigs = [
        {
          id: "gig-1",
          title: "Frontend build",
          requiredSkills: ["React", "Next.js"],
          category: { item: "Frontend" },
          workMode: "Remote",
          location: "Lagos",
        },
        {
          id: "gig-2",
          title: "Brand deck",
          requiredSkills: ["Illustrator"],
        },
      ]

      const matches = matchGigsToTalent(gigs, {
        uid: "talent-1",
        fullName: "Ada Developer",
        skills: ["React"],
        categories: ["Frontend"],
        workMode: "Remote",
        location: "lagos",
      })

      expect(matches).toHaveLength(1)
      expect(matches[0]).toMatchObject({
        id: "gig-1",
        matchScore: 7,
      })
    })

    it("matches talents to a client profile", () => {
      const matches = matchTalentsToClient(
        [
          {
            uid: "talent-1",
            fullName: "Ada Developer",
            skills: ["React"],
            categories: ["Frontend"],
          },
          {
            uid: "talent-2",
            fullName: "Mina Writer",
            skills: ["Copywriting"],
            categories: ["Content"],
          },
        ],
        {
          skills: ["React"],
          categories: ["Frontend"],
        }
      )

      expect(matches.map((item) => item.uid)).toEqual(["talent-1"])
    })
  })

  describe("public talent and gig discovery", () => {
    it("fetches a public talent profile without leaking private nested fields", async () => {
      mockedGetDoc.mockResolvedValue(
        makeDocSnapshot(true, {
          fullName: "Ada Developer",
          location: "Lagos",
          rating: { avg: 4.8, count: 12 },
          verification: { status: "verified" },
          publicProfile: {
            photoURL: "https://img.test/ada.jpg",
            hourlyRate: 75,
            bio: "Frontend engineer",
            languages: ["English"],
            socials: { github: "ada" },
            portfolio: [{ id: "p1", title: "Case Study" }],
          },
          talent: {
            roleTitle: "Frontend Engineer",
            skills: ["React", "Next.js"],
          },
          kyc: {
            bvn: "should-not-leak",
          },
        })
      )

      const result = await fetchPublicTalent("talent-1")

      expect(result).toEqual({
        uid: "talent-1",
        fullName: "Ada Developer",
        location: "Lagos",
        roleTitle: "Frontend Engineer",
        photoURL: "https://img.test/ada.jpg",
        hourlyRate: 75,
        bio: "Frontend engineer",
        skills: ["React", "Next.js"],
        languages: ["English"],
        education: [],
        certifications: [],
        employment: [],
        socials: { github: "ada" },
        portfolio: [{ id: "p1", title: "Case Study" }],
        rating: { avg: 4.8, count: 12 },
        verification: { status: "verified" },
        sdgTags: [],
        slug: undefined,
      })
      expect((result as any)?.kyc).toBeUndefined()
    })

    it("looks up public talent by slug and falls back to uid", async () => {
      mockedGetDocs
        .mockResolvedValueOnce(makeQuerySnapshot([]))
        .mockResolvedValueOnce(
          makeQuerySnapshot([
            {
              data: () => ({
                uid: "talent-2",
                fullName: "Fallback Talent",
                publicProfile: {},
                talent: {},
              }),
            },
          ])
        )

      const result = await fetchPublicTalentBySlug("talent-2")

      expect(result?.uid).toBe("talent-2")
      expect(mockedGetDocs).toHaveBeenCalledTimes(2)
    })

    it("lists only public talent cards with normalized defaults", async () => {
      mockedGetDocs.mockResolvedValue(
        makeQuerySnapshot([
          {
            id: "talent-1",
            data: () => ({
              fullName: "Ada Developer",
              role: "talent",
              publicProfile: { hourlyRate: 120 },
              talent: { skills: ["React"] },
            }),
          },
        ])
      )

      const result = await fetchPublicTalents(5)

      expect(result).toEqual([
        expect.objectContaining({
          uid: "talent-1",
          fullName: "Ada Developer",
          hourlyRate: 120,
          skills: ["React"],
        }),
      ])
      expect(mockedWhere).toHaveBeenCalledWith("role", "==", "talent")
      expect(mockedLimit).toHaveBeenCalledWith(5)
    })

    it("lists only open gigs in newest-first order", async () => {
      mockedGetDocs.mockResolvedValue(
        makeQuerySnapshot([
          {
            id: "gig-1",
            data: () => ({
              title: "Build marketplace UI",
              status: "open",
              budgetType: "fixed",
            }),
          },
        ])
      )

      const gigs = await fetchPublicGigs(10)

      expect(gigs).toEqual([
        {
          id: "gig-1",
          title: "Build marketplace UI",
          status: "open",
          budgetType: "fixed",
        },
      ])
      expect(mockedWhere).toHaveBeenCalledWith("status", "==", "open")
      expect(mockedOrderBy).toHaveBeenCalledWith("createdAt", "desc")
    })
  })

  describe("public client profile helpers", () => {
    it("prefers organization-specific client fields before generic public profile fallbacks", () => {
      const profile = {
        photoUrl: "https://img.test/logo.png",
        orgProfile: {
          about: "We build climate products",
          categories: ["Climate", "Data"],
          portfolio: [{ id: "c1", title: "Launch" }],
          socials: { website: "https://client.test" },
        },
        publicProfile: {
          categories: ["Fallback"],
          portfolio: [{ id: "ignored" }],
          socials: { linkedin: "ignored" },
        },
      }

      expect(pickClientPhoto(profile)).toBe("https://img.test/logo.png")
      expect(pickClientAbout(profile)).toBe("We build climate products")
      expect(pickClientCategories(profile)).toEqual(["Climate", "Data"])
      expect(pickClientPortfolio(profile)).toEqual([{ id: "c1", title: "Launch" }])
      expect(pickClientSocials(profile)).toEqual({ website: "https://client.test" })
    })

    it("loads clients by slug and uid from public profiles", async () => {
      mockedGetDocs.mockResolvedValue(
        makeQuerySnapshot([
          {
            data: () => ({ uid: "client-1", slug: "acme", role: "client" }),
          },
        ])
      )
      mockedGetDoc.mockResolvedValue(makeDocSnapshot(true, { uid: "client-2", role: "client" }))

      const bySlug = await fetchPublicClientBySlug("acme")
      const byUid = await fetchPublicClientByUid("client-2")

      expect(bySlug).toEqual({ uid: "client-1", slug: "acme", role: "client" })
      expect(byUid).toEqual({ uid: "client-2", role: "client" })
    })
  })

  describe("profile publishing and chat bootstrap", () => {
    it("slugifies names into stable public profile slugs", () => {
      expect(slugifyName("  Timi & Co. Studio  ")).toBe("timi-and-co-studio")
      expect(slugifyName("")).toBe("talent")
    })

    it("syncs public profile patches with merge semantics", async () => {
      await syncPublicProfile("user-1", { fullName: "Timi", slug: "timi" })

      expect(mockedSetDoc).toHaveBeenCalledWith(
        { path: "mock-db/publicProfiles/user-1" },
        {
          fullName: "Timi",
          slug: "timi",
          updatedAt: "SERVER_TIMESTAMP",
        },
        { merge: true }
      )
    })

    it("creates deterministic thread ids and seeds thread metadata", async () => {
      expect(makeThreadId("gig1", "client1", "talent1")).toBe(
        "gig_gig1__c_client1__t_talent1"
      )

      await ensureThread({
        gigId: "gig1",
        gigTitle: "Landing page redesign",
        clientUid: "client1",
        clientName: "Acme",
        talentUid: "talent1",
        talentName: "Ada",
        initialProposalStatus: "accepted",
      })

      expect(mockedSetDoc).toHaveBeenCalledWith(
        { path: "mock-db/threads/gig_gig1__c_client1__t_talent1" },
        expect.objectContaining({
          threadId: "gig_gig1__c_client1__t_talent1",
          participants: ["client1", "talent1"],
          proposalStatus: "accepted",
          lastMessageText: "Conversation started",
          createdAt: "SERVER_TIMESTAMP",
          updatedAt: "SERVER_TIMESTAMP",
        }),
        { merge: true }
      )
    })
  })
})
