import fs from 'fs'
import path from 'path'

const dir = path.resolve(process.cwd(), 'data')
const file = path.resolve(dir, 'admin_tokens.json')

let cache = null

const ensure = () => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ tokens: [] }, null, 2))
}

const load = () => {
  ensure()
  if (cache) return cache
  try {
    const raw = fs.readFileSync(file, 'utf8')
    const json = JSON.parse(raw || '{}')
    cache = new Set(Array.isArray(json.tokens) ? json.tokens : [])
  } catch {
    cache = new Set()
  }
  return cache
}

const persist = () => {
  ensure()
  const tokens = Array.from(cache || [])
  fs.writeFileSync(file, JSON.stringify({ tokens }, null, 2))
}

export const hasToken = (token) => {
  if (!token) return false
  return load().has(token)
}

export const addToken = (token) => {
  if (!token) return false
  load().add(token)
  persist()
  return true
}

export const removeToken = (token) => {
  if (!token) return false
  const ok = load().delete(token)
  persist()
  return ok
}

