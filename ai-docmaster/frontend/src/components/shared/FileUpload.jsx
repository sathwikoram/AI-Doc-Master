import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image, File } from 'lucide-react'
import { cn, formatFileSize } from '../../lib/utils'

export default function FileUpload({ onFilesSelected, maxFiles = 5, accept, label }) {
  const [files, setFiles] = useState([])

  const onDrop = useCallback((accepted) => {
    const merged = [...files, ...accepted].slice(0, maxFiles)
    setFiles(merged)
    onFilesSelected?.(merged)
  }, [files, maxFiles, onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept: accept || {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  })

  const remove = (i) => {
    const updated = files.filter((_, idx) => idx !== i)
    setFiles(updated)
    onFilesSelected?.(updated)
  }

  const icon = (type = '') => {
    if (type.startsWith('image')) return <Image size={16} className="text-blue-500" />
    if (type.includes('pdf'))    return <FileText size={16} className="text-red-500" />
    return <File size={16} className="text-slate-400" />
  }

  return (
    <div>
      {label && <p className="label">{label}</p>}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary-400 bg-primary-50'
            : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50',
        )}
      >
        <input {...getInputProps()} />
        <Upload size={24} className="mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-600">
          {isDragActive ? 'Drop files here…' : 'Drag & drop files, or click to browse'}
        </p>
        <p className="text-xs text-slate-400 mt-1">PDF, Word, JPG, PNG — max {maxFiles} files</p>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              {icon(f.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{f.name}</p>
                <p className="text-xs text-slate-400">{formatFileSize(f.size)}</p>
              </div>
              <button onClick={() => remove(i)} className="btn-icon text-slate-400 hover:text-danger-500 hover:bg-danger-50">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
