import { es } from '../../i18n/es';
import { UserStateError } from '../../store/userState';
import { Button } from '../components/Button';
import { downloadText } from '../download';

/** Shown when the stored state is corrupt or from an unknown version. The record is never overwritten. */
export function LoadError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <main className="screen" data-testid="load-error">
      <h1 className="screen__title">{es.errors.loadTitle}</h1>
      <p>{es.errors.loadHelp}</p>
      <pre className="banner">{message}</pre>
      {error instanceof UserStateError ? (
        <Button variant="primary" onClick={() => downloadText('saved-data.json', JSON.stringify(error.raw, null, 2))}>
          {es.errors.exportRaw}
        </Button>
      ) : null}
    </main>
  );
}
