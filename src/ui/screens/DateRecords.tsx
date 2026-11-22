import { useUserState } from '../../app/UserStateContext';
import { es } from '../../i18n/es';
import { Icon } from '../components/Icon';

const SEATS = [0, 1] as const;
const DAY = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });

/** Finished dates, newest first: who, when, how far they got, and closeness before and after for each. */
export function DateRecords() {
  const { state, update } = useUserState();
  const records = [...state.dates].reverse();
  return (
    <ul className="list" aria-label={es.date.history}>
      {records.map((record) => {
        const day = DAY.format(record.at);
        return (
          <li key={record.id} className="date-record glass" data-testid="date-record">
            <div className="date-record__body">
              <span className="date-record__day">{day}</span>
              <span className="date-record__people">
                {SEATS.map((seat) => (
                  <span key={seat}>{es.date.recordIos(record.names[seat], record.ios.before[seat], record.ios.after[seat])}</span>
                ))}
              </span>
              <span className="stage__label">{es.date.reached(record.lastQuestion)}</span>
            </div>
            <button
              type="button"
              className="icon-btn icon-btn--glass"
              aria-label={es.date.removeRecord(day)}
              onClick={() => update((current) => ({ ...current, dates: current.dates.filter((d) => d.id !== record.id) }))}
            >
              <Icon name="remove" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
