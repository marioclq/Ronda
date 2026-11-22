import type { ReactNode } from 'react';
import { es } from '../../i18n/es';
import { Button } from './Button';

interface ScreenProps {
  readonly title: string;
  readonly onBack?: () => void;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

export function Screen({ title, onBack, actions, children }: ScreenProps) {
  return (
    <main className="screen">
      <header className="screen__bar">
        <div className="row">
          {onBack === undefined ? null : (
            <Button className="btn--back" onClick={onBack} icon="back" data-testid="screen-back">
              {es.common.back}
            </Button>
          )}
          <h1 className="screen__title">{title}</h1>
        </div>
        {actions}
      </header>
      {children}
    </main>
  );
}
