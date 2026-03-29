import type { ReactNode } from 'react'

type ActionCardProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

const ActionCard = ({ title, description, actions, children, className }: ActionCardProps) => (
  <div className={`action-card ${className ?? ''}`.trim()}>
    <div className="action-card-header">
      <div>
        <h3>{title}</h3>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="action-card-actions">{actions}</div> : null}
    </div>
    <div className="action-card-body">{children}</div>
  </div>
)

export default ActionCard
