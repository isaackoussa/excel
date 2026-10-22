import { useState } from 'react'
import { DATASETS, downloadDataset, type DatasetId } from '../lib/datasets'

export function DownloadButton({ id, label = 'Télécharger' }: { id: DatasetId; label?: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-secondary"
      disabled={busy}
      title={DATASETS[id].fileName}
      onClick={async () => {
        setBusy(true)
        setError(false)
        try {
          await downloadDataset(id)
        } catch (e) {
          console.error(e)
          setError(true)
        } finally {
          setBusy(false)
        }
      }}
    >
      {busy ? 'Préparation…' : error ? 'Réessayer' : `${label} (.xlsx)`}
    </button>
  )
}
