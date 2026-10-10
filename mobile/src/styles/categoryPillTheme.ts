import { StyleSheet } from 'react-native';

import { authModalTheme } from './authModalTheme';

/** Shared rounded-pill chips for category / subcategory pickers. */
export const categoryPillTheme = StyleSheet.create({
  subRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subPill: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: authModalTheme.pillRadius,
    borderWidth: 1,
  },
  subPillOff: {
    borderColor: '#cfe2ff',
    backgroundColor: '#f4f8fc',
  },
  subPillOn: {
    borderColor: '#86D9A0',
    backgroundColor: '#DDFBE2',
  },
  subPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  subPillTextOn: {
    fontWeight: '700',
    color: authModalTheme.successDark,
  },
});
