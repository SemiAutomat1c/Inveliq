import { Skeleton } from '../ui/skeleton'

export function WorkspaceLoading() {
  return (
    <section className="workspace-loading" aria-label="Loading workspace">
      <Skeleton className="workspace-loading__heading" />
      <div className="workspace-loading__metrics">
        {Array.from({ length: 4 }, (_, index) => <Skeleton className="workspace-loading__metric" key={index} />)}
      </div>
      <Skeleton className="workspace-loading__panel" />
    </section>
  )
}
