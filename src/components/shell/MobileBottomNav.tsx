import { Ellipsis } from 'lucide-react'
import { appPages, mobilePrimaryPages, type AppPageId } from '../../lib/navigation'
import { iconForPage } from './pageIcons'

export function MobileBottomNav({
  activePage,
  setActivePage,
  openMore,
}: {
  activePage: AppPageId
  setActivePage: (page: AppPageId) => void
  openMore: () => void
}) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      {mobilePrimaryPages.map((page) => {
        if (page === 'more') {
          return (
            <button type="button" key={page} onClick={openMore}>
              <Ellipsis size={18} />
              <span>More</span>
            </button>
          )
        }
        const Icon = iconForPage[page]
        return (
          <button type="button" key={page} aria-current={activePage === page ? 'page' : undefined} onClick={() => setActivePage(page)}>
            <Icon size={18} />
            <span>{appPages.find((item) => item.id === page)?.label ?? page}</span>
          </button>
        )
      })}
    </nav>
  )
}
