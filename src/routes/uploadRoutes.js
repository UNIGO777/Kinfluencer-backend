import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

const router = Router()

const uploadsDir = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now()
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    cb(null, `${timestamp}-${safeName}`)
  }
})

const upload = multer({ storage })

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' })
  const relativePath = `/uploads/${req.file.filename}`
  res.status(201).json({ url: relativePath })
})

export default router

