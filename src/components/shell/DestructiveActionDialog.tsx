import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'

export type DestructiveAction = null | {
  type: 'archive-project' | 'delete-entry'
  id: string
  label: string
}

export function DestructiveActionDialog({
  action,
  onClose,
  onConfirm,
}: {
  action: DestructiveAction
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={action !== null} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{action?.type === 'archive-project' ? 'Archive project?' : 'Delete time entry?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {action?.type === 'archive-project'
              ? `"${action.label}" will stop appearing in active project selectors. Existing work remains available.`
              : `"${action?.label}" will be permanently removed from tracked work.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{action?.type === 'archive-project' ? 'Archive project' : 'Delete entry'}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
