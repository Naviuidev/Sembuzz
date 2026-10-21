import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { authModalTheme } from '../styles/authModalTheme';
import { TOOLBAR_ICON_SIZE } from '../navigation/tabBarMetrics';
import { toYmdLocal } from '../utils/eventFeedDate';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLUMNS = 7;
/** Space reserved under the day number for the event marker dot. */
const EVENT_DOT_ROW = 10;
/** Circle diameter as a fraction of the day cell width (leave room for the dot row). */
const CIRCLE_INSET_RATIO = 0.68;

type Props = {
  visibleMonth: Date;
  selectedDate: Date;
  markedDates: Set<string>;
  onSelectDate: (date: Date) => void;
  onChangeMonth: (next: Date) => void;
  /** Today/selection circles and dot markers for days with news — logged-in calendar only. */
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
  const [gridWidth, setGridWidth] = useState(0);

  const cellSide = gridWidth > 0 ? gridWidth / COLUMNS : 0;
  const circleSize =
    cellSide > 0
      ? Math.min(Math.round(cellSide * CIRCLE_INSET_RATIO), cellSide - 2, 36)
      : 0;
  const showMarkerLegend = markedDates.size > 0;

  const monthStart = useMemo(() => startOfMonth(visibleMonth), [visibleMonth]);
  const monthLabel = monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

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

  const onGridLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== gridWidth) {
      setGridWidth(nextWidth);
    }
  };

  const dayCellStyle =
    cellSide > 0
      ? { width: cellSide, height: cellSide + EVENT_DOT_ROW }
      : styles.dayCellFallback;

  const circleBase =
    circleSize > 0
      ? {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
        }
      : null;

  return (
    <View style={styles.wrap} onLayout={onGridLayout}>
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={() => onChangeMonth(addMonths(monthStart, -1))}
          hitSlop={10}
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={TOOLBAR_ICON_SIZE} color={authModalTheme.primary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={() => onChangeMonth(addMonths(monthStart, 1))}
          hitSlop={10}
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={TOOLBAR_ICON_SIZE} color={authModalTheme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={[styles.weekdayCell, cellSide > 0 && { width: cellSide }]}>
            <Text style={styles.weekdayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={dayCellStyle} />;
          }
          const ymd = toYmdLocal(date);
          const hasNews = markedDates.has(ymd);
          const selected = isSameDay(date, selectedDate);
          const today = isLoggedIn && isSameDay(date, new Date());

          if (!isLoggedIn) {
            return (
              <TouchableOpacity
                key={ymd}
                style={[styles.dayCell, dayCellStyle]}
                onPress={() => onSelectDate(date)}
                activeOpacity={0.85}
                accessibilityLabel={`${date.toLocaleDateString()}${hasNews ? ', has news' : ''}`}
              >
                <View style={styles.dayCellInner}>
                  {circleBase && selected ? (
                    <View style={[styles.dayCircle, circleBase, styles.guestDayCircleSelected]}>
                      <Text style={[styles.dayText, styles.guestDayTextSelected]}>{date.getDate()}</Text>
                    </View>
                  ) : (
                    <Text style={styles.dayText}>{date.getDate()}</Text>
                  )}
                  {hasNews ? <View style={styles.eventMarkerDot} /> : <View style={styles.eventMarkerDotSpacer} />}
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={ymd}
              style={[styles.dayCell, dayCellStyle]}
              onPress={() => onSelectDate(date)}
              activeOpacity={0.85}
              accessibilityLabel={`${date.toLocaleDateString()}${hasNews ? ', has news' : ''}`}
            >
              <View style={styles.dayCellInner}>
                {circleBase ? (
                  <View
                    style={[
                      styles.dayCircle,
                      circleBase,
                      selected && !today && styles.dayCircleSelected,
                      today && styles.dayCircleToday,
                      today && selected && styles.dayCircleTodaySelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        today && styles.dayTextToday,
                        selected && !today && styles.dayTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.dayText}>{date.getDate()}</Text>
                )}
                {hasNews ? <View style={styles.eventMarkerDot} /> : (
                  <View style={styles.eventMarkerDotSpacer} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoggedIn || showMarkerLegend ? (
        <View style={styles.legendRow}>
          {isLoggedIn ? (
            <>
              <View style={styles.legendSwatchToday} />
              <Text style={styles.legendText}>Today</Text>
            </>
          ) : null}
          {showMarkerLegend ? (
            <>
              <View style={styles.legendDotHasNews} />
              <Text style={styles.legendText}>Days with news</Text>
            </>
          ) : null}
          <View style={styles.legendSwatchSelected} />
          <Text style={styles.legendText}>Selected day</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1f2e',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c757d',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellFallback: {
    width: `${100 / COLUMNS}%`,
    aspectRatio: 1,
  },
  dayCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'center',
  },
  dayCircleSelected: {
    backgroundColor: authModalTheme.successPillBg,
    borderWidth: 1,
    borderColor: authModalTheme.successDark,
  },
  dayCircleToday: {
    backgroundColor: authModalTheme.primary,
  },
  dayCircleTodaySelected: {
    borderWidth: 2,
    borderColor: authModalTheme.successDark,
  },
  guestDayCircleSelected: {
    backgroundColor: 'rgba(52, 104, 249, 0.14)',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
    textAlign: 'center',
    includeFontPadding: false,
  },
  eventMarkerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 3,
    backgroundColor: authModalTheme.successDark,
  },
  eventMarkerDotSpacer: {
    height: 8,
  },
  dayTextToday: {
    fontWeight: '700',
    color: '#ffffff',
  },
  dayTextSelected: {
    fontWeight: '800',
    color: authModalTheme.successDark,
  },
  guestDayTextSelected: {
    fontWeight: '700',
    color: authModalTheme.primary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 2,
  },
  legendSwatchToday: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: authModalTheme.primary,
  },
  legendDotHasNews: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: authModalTheme.successDark,
  },
  legendSwatchSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: authModalTheme.successPillBg,
    borderWidth: 1,
    borderColor: authModalTheme.successDark,
  },
  legendText: {
    fontSize: 11,
    color: '#6c757d',
    marginRight: 8,
  },
});
