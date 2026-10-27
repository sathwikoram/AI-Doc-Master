import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  FileText, Upload, Search, File, Image,
  Download, Eye, Filter, FolderOpen,
} from 'lucide-react'
import { casesApi } from '../../lib/api'
import { FullPageLoader } from '../../components/shared/LoadingSpinner'
import EmptyState from '../../components/shared/EmptyState'
import PageHeader from '../../components/shared/PageHeader'
import Modal from '../../components/shared/Modal'
import FileUpload from '../../components/shared/FileUpload'
import { formatDate, formatFileSize, getFileIcon, getErrorMessage } from '../../lib/utils'

export default function AdvocateDocuments() {
  const queryClient = useQueryClient()
  const [search,        setSearch]     = useState('')
  const [uploadCase,    setUploadCase] = useState(null)
  const [uploadFiles,   setUploadFiles] = useState([])

  // We aggregate documents across all advocate's cases
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['advocate-cases'],
    queryFn:  () => casesApi.list().then(r => r.data),
  })

  // Fetch docs for all cases (parallel queries)
  const caseIds = cases.map(c => c.id)
  const { data: allDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['advocate-all-docs', caseIds.join(',')],
    queryFn:  async () => {
      if (!caseIds.length) return []
      const results = await Promise.all(caseIds.map(id =>
        casesApi.getDocs(id).then(r => r.data.map(d => ({ ...d, case_id: id })))
      ))
      return results.flat()
    },
    enabled: caseIds.length > 0,
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      for (const file of uploadFiles) {
        const form = new FormData()
        form.append('file', file)
        form.append('document_type', 'evidence')
        await casesApi.uploadDoc(uploadCase, form)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['advocate-all-docs'])
      queryClient.invalidateQueries(['case-docs'])
      setUploadCase(null)
      setUploadFiles([])
      toast.success('Documents uploaded successfully')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const isLoading = casesLoading || docsLoading

  const filtered = allDocs.filter(d =>
    !search ||
    d.file_name.toLowerCase().includes(search.toLowerCase()) ||
    d.document_type?.toLowerCase().includes(search.toLowerCase())
  )

  // Group by case
  const grouped = filtered.reduce((acc, d) => {
    const caseInfo = cases.find(c => c.id === d.case_id)
    const key = caseInfo?.title || d.case_id
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {})

  if (isLoading) return <FullPageLoader />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Documents"
        subtitle={`${allDocs.length} document${allDocs.length !== 1 ? 's' : ''} across all cases`}
        action={
          <div className="flex gap-2">
            <select
              onChange={e => setUploadCase(e.target.value)}
              className="input text-sm py-2"
              defaultValue=""
            >
              <option value="" disabled>Select case to upload</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.title.slice(0, 40)}…</option>
              ))}
            </select>
            <button
              onClick={() => uploadCase && setUploadCase(uploadCase)}
              disabled={!uploadCase}
              className="btn-primary btn-sm gap-1.5 whitespace-nowrap"
            >
              <Upload size={14} /> Upload
            </button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="input pl-9"
        />
      </div>

      {allDocs.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No documents yet"
          description="Upload documents to your cases and they'll appear here."
        />
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState icon={Search} title="No results" description="Try a different search term." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([caseTitle, docs]) => (
            <div key={caseTitle}>
              {/* Case header */}
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen size={16} className="text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-700 truncate flex-1">{caseTitle}</h3>
                <span className="text-xs text-slate-400">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {docs.map(d => (
                  <DocumentCard key={d.id} doc={d} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal — triggered by select + button */}
      <Modal
        open={!!uploadCase && uploadFiles.length > 0 || (!!uploadCase && uploadMutation.isPending)}
        onClose={() => { setUploadCase(null); setUploadFiles([]) }}
        title="Upload Documents"
      >
        <FileUpload
          onFilesSelected={setUploadFiles}
          label="Select files to upload"
        />
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => { setUploadCase(null); setUploadFiles([]) }} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => uploadFiles.length && uploadMutation.mutate()}
            disabled={!uploadFiles.length || uploadMutation.isPending}
            className="btn-primary gap-1.5"
          >
            <Upload size={15} />
            {uploadMutation.isPending ? 'Uploading…' : `Upload ${uploadFiles.length} file${uploadFiles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function DocumentCard({ doc: d }) {
  const iconEmoji = getFileIcon(d.file_type || '')
  const isPdf   = (d.file_type || '').includes('pdf')
  const isImage = (d.file_type || '').includes('image')

  return (
    <div className="card-sm flex flex-col gap-3 group">
      {/* Thumbnail / icon */}
      <div className="w-full h-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img src={d.file_url} alt={d.file_name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <div className="text-4xl">{iconEmoji}</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{d.file_name}</p>
        <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
          <span className="capitalize">{d.document_type || 'Document'}</span>
          <span>{formatDate(d.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={d.file_url}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary btn-sm flex-1 gap-1 justify-center"
        >
          <Eye size={13} /> View
        </a>
        <a
          href={d.file_url}
          download={d.file_name}
          className="btn-secondary btn-sm flex-1 gap-1 justify-center"
        >
          <Download size={13} /> Download
        </a>
      </div>
    </div>
  )
}
