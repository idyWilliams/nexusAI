export type TaskProvenanceKind = 'user' | 'inferred'

export interface TaskProvenance {
  kind: TaskProvenanceKind
  reasonCodes: string[]
  evidenceSummary: string
  coarseDomain?: string
}

export interface TaskCandidate {
  id: string
  titleGuess: string
  provenance: TaskProvenance
  confidence: number
  createdAt: number
}

export interface Task extends TaskCandidate {
  status: 'open' | 'done' | 'dismissed'
}
