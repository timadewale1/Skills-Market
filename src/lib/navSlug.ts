import { hireCategories, findWorkCategories, whyUsLinks } from "@/data/navCategories"

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-")
}

export function unslugify(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
}

export function allHireItems() {
  return hireCategories.flatMap((c) => c.items.map((item) => ({ item, slug: slugify(item), group: c.title })))
}

export function allJobItems() {
  return findWorkCategories.flatMap((c) => c.items.map((item) => ({ item, slug: slugify(item), group: c.title })))
}

export function findHireBySlug(slug: string) {
  return allHireItems().find((x) => x.slug === slug) || null
}

export function findJobBySlug(slug: string) {
  return allJobItems().find((x) => x.slug === slug) || null
}

export function allWhyUs() {
  return whyUsLinks.map((x) => ({ ...x, slug: slugify(x.title) }))
}

export function findWhyUsBySlug(slug: string) {
  return allWhyUs().find((x) => x.slug === slug) || null
}
