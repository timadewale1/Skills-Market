import Navbar from "@/components/layout/Navbar"
import Button from "@/components/ui/Button"

export default function Home() {
  return (
    <>
              <Navbar/>

    <div className="max-w-7xl mx-auto px-4 py-16">

      <div className="max-w-xl">
        <h1 className="text-4xl font-bold mb-4">
          Find skilled talents for impact-driven work
        </h1>
        <p className="text-gray-600 mb-6">
          Connect with Nigerian youth and freelancers working on projects
          aligned with the Sustainable Development Goals.
        </p>

        <div className="flex gap-4">
          <Button>Find Gigs</Button>
          <Button variant="outline">Post a Gig</Button>
        </div>
      </div>
    </div>
    </>
  )
}
