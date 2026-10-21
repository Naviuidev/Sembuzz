import { useEffect, useMemo, useRef, useState } from 'react';
import { toYmdLocal } from '../utils/eventFeedDate';
import '../styles/feed-calendar-month.css';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLUMNS = 7;
const EVENT_DOT_ROW = 10;
const CIRCLE_INSET_RATIO = 0.68;

type Props = {
  visibleMonth: Date;
  selectedDate: Date;
  markedDates: Set<string>;
  onSelectDate: (date: Date) => void;
  onChangeMonth: (next: Date) => void;
  variant?: 'guest' | 'loggedIn';
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return toYmdLocal(a) === toYmdLocal(b);
}

export function FeedCalendarMonthGrid({
  visibleMonth,
  selectedDate,
  markedDates,
  onSelectDate,
  onChangeMonth,
  variant = 'guest',
}: Props) {
  const isLoggedIn = variant === 'loggedIn';
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);

  const monthStart = useMemo(() => startOfMonth(visibleMonth), [visibleMonth]);
  const monthLabel = monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const showMarkerLegend = markedDates.size > 0;

  const cells = useMemo(() => {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDow = monthStart.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i++) grid.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(new Date(year, month, day));
    }
    while (grid.length % COLUMNS !== 0) grid.push(null);
    return grid;
  }, [monthStart]);

  const cellSide = gridWidth > 0 ? gridWidth / COLUMNS : 0;
  const circleSize =
    cellSide > 0 ? Math.min(Math.round(cellSide * CIRCLE_INSET_RATIO), cellSide - 2, 36) : 0;

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setGridWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="feed-calendar-month" ref={gridRef}>
      <div className="feed-calendar-month__header">
        <button
          type="button"
          className="feed-calendar-month__nav"
          onClick={() => onChangeMonth(addMonths(monthStart, -1))}
          aria-label="Previous month"
        >
          <i className="bi bi-chevron-left" aria-hidden />
        </button>
        <span className="feed-calendar-month__title">{monthLabel}</span>
        <button
          type="button"
          className="feed-calendar-month__nav"
          onClick={() => onChangeMonth(addMonths(monthStart, 1))}
          aria-label="Next month"
        >
          <i className="bi bi-chevron-right" aria-hidden />
        </button>
      </div>

      <div className="feed-calendar-month__weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="feed-calendar-month__weekday">{label}</span>
        ))}
      </div>

      <div
        className="feed-calendar-month__grid"
        style={
          cellSide > 0
            ? {
                gridTemplateColumns: `repeat(${COLUMNS}, ${cellSide}px)`,
              }
            : undefined
        }
      >
        {cells.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`empty-${index}`}
                className="feed-calendar-month__cell feed-calendar-month__cell--empty"
                style={cellSide > 0 ? { width: cellSide, height: cellSide + EVENT_DOT_ROW } : undefined}
              />
            );
          }
          const ymd = toYmdLocal(date);
          const hasNews = markedDates.has(ymd);
          const selected = isSameDay(date, selectedDate);
          const today = isLoggedIn && isSameDay(date, new Date());

          const dayClasses = [
            'feed-calendar-month__day',
            isLoggedIn ? 'feed-calendar-month__day--logged-in' : 'feed-calendar-month__day--guest',
            selected ? 'is-selected' : '',
            today ? 'is-today' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={ymd}
              type="button"
              className={dayClasses}
              style={cellSide > 0 ? { width: cellSide, height: cellSide + EVENT_DOT_ROW } : undefined}
              onClick={() => onSelectDate(date)}
              aria-label={`${date.toLocaleDateString()}${hasNews ? ', has news' : ''}`}
            >
              <span
                className="feed-calendar-month__day-inner"
                style={
                  circleSize > 0 && (isLoggedIn || selected)
                    ? { width: circleSize, height: circleSize }
                    : undefined
                }
              >
                {date.getDate()}
              </span>
              {hasNews ? (
                <span className="feed-calendar-month__event-dot" aria-hidden />
              ) : (
                <span className="feed-calendar-month__event-dot-spacer" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {isLoggedIn || showMarkerLegend ? (
        <div className="feed-calendar-month__legend">
          {isLoggedIn ? (
            <>
              <span className="feed-calendar-month__legend-swatch feed-calendar-month__legend-swatch--today" />
              <span>Today</span>
            </>
          ) : null}
          {showMarkerLegend ? (
            <>
              <span className="feed-calendar-month__legend-dot" />
              <span>Days with news</span>
            </>
          ) : null}
          <span
            className={`feed-calendar-month__legend-swatch feed-calendar-month__legend-swatch--selected${isLoggedIn ? '' : ' feed-calendar-month__legend-swatch--selected-guest'}`}
          />
          <span>Selected day</span>
        </div>
      ) : null}
    </div>
  );
}
