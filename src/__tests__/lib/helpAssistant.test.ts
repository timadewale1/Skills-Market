import { answerHelpQuestion, getSuggestedHelpQuestions } from "@/lib/helpAssistant"

describe("help assistant", () => {
  it("answers talent workflow questions with the right page hint", () => {
    const response = answerHelpQuestion("talent", "How do I apply for a gig?")
    expect(response.answer.toLowerCase()).toContain("find work")
    expect(response.href).toBe("/dashboard/find-work")
  })

  it("answers client workflow questions with post gig guidance", () => {
    const response = answerHelpQuestion("client", "How do I post a gig?")
    expect(response.answer.toLowerCase()).toContain("post a gig")
    expect(response.href).toBe("/dashboard/post-gig")
  })

  it("returns admin support inbox guidance", () => {
    const response = answerHelpQuestion("admin", "Where do support chats appear?")
    expect(response.href).toBe("/admin/support")
  })

  it("exposes prefilled faqs for each role", () => {
    expect(getSuggestedHelpQuestions("talent").length).toBeGreaterThan(0)
    expect(getSuggestedHelpQuestions("client").length).toBeGreaterThan(0)
    expect(getSuggestedHelpQuestions("admin").length).toBeGreaterThan(0)
  })
})
