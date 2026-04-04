import type { ReactNode } from 'react'

type ActionCanvasProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

const ActionCanvas = ({
  title,
  description,
  actions,
  children,
  className,
}: ActionCanvasProps) => (
  <section className={`action-canvas ${className ?? ''}`.trim()}>
    <header className="action-canvas-header">
      <div>
        <h3>{title}</h3>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="action-canvas-actions">{actions}</div> : null}
    </header>
    <div className="action-canvas-stage">{children}</div>
  </section>
)

export default ActionCanvas
