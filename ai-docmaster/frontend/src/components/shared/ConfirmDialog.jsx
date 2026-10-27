import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
          ${danger ? 'bg-danger-50 text-danger-600' : 'bg-warning-50 text-warning-600'}`}>
          <AlertTriangle size={20} />
        </div>
        <p className="text-sm text-slate-600 pt-2">{message}</p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={danger ? 'btn-danger' : 'btn-primary'}
        >
          Confirm
        </button>
      </div>
    </Modal>
  )
}
