"use client"

import { createContext, useContext, useState } from "react"

type SearchType = "talent" | "job"

const SearchContext = createContext<any>(null)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<SearchType>("talent")

  return (
    <SearchContext.Provider
      value={{ query, setQuery, type, setType }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export const useSearch = () => useContext(SearchContext)
