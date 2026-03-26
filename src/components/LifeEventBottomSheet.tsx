// LifeEventBottomSheet.tsx — 인생 이벤트 바텀시트
// 세뱃돈 이벤트 포함
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { theme } from '../ui/theme';
import { MilyButton } from './ui/MilyButton';
import { CashGiftOccasion, OCCASION_LABELS, OCCASION_EMOJIS } from '../engines/income/cashGiftService';

interface LifeEvent {
  key: string;
  emoji: string;
  label: string;
  desc: string;
}

const LIFE_EVENTS: LifeEvent[] = [
  { key: 'cash_gift', emoji: '🎎', label: '세뱃돈/명절돈', desc: '특별한 날 받은 용돈을 기록해요' },
  { key: 'goal_complete', emoji: '🎯', label: '목표 달성', desc: '목표를 이루었어요!' },
  { key: 'first_save', emoji: '🐷', label: '첫 저금', desc: '저금을 시작했어요' },
  { key: 'allowance_change', emoji: '📊', label: '용돈 변경', desc: '용돈이 바뀌었어요' },
];

interface LifeEventBottomSheetProps {
  onSelect: (eventKey: string, subKey?: string) => void;
  onClose: () => void;
}

export function LifeEventBottomSheet({ onSelect, onClose }: LifeEventBottomSheetProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<CashGiftOccasion | null>(null);

  const isCashGift = selectedEvent === 'cash_gift';
  const canConfirm = selectedEvent !== null && (!isCashGift || selectedOccasion !== null);

  const occasions: CashGiftOccasion[] = ['new_year', 'chuseok', 'birthday', 'graduation', 'other'];

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.title}>어떤 이벤트인가요?</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {LIFE_EVENTS.map((ev) => (
          <TouchableOpacity
            key={ev.key}
            style={[styles.eventCard, selectedEvent === ev.key && styles.eventCardSelected]}
            onPress={() => { setSelectedEvent(ev.key); setSelectedOccasion(null); }}
          >
            <Text style={styles.eventEmoji}>{ev.emoji}</Text>
            <View style={styles.eventText}>
              <Text style={[styles.eventLabel, selectedEvent === ev.key && styles.eventLabelSelected]}>{ev.label}</Text>
              <Text style={styles.eventDesc}>{ev.desc}</Text>
            </View>
            {selectedEvent === ev.key && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}

        {/* 세뱃돈 세부 선택 */}
        {isCashGift && (
          <View style={styles.occasionGrid}>
            {occasions.map((occ) => (
              <TouchableOpacity
                key={occ}
                style={[styles.occCard, selectedOccasion === occ && styles.occCardSelected]}
                onPress={() => setSelectedOccasion(occ)}
              >
                <Text style={styles.occEmoji}>{OCCASION_EMOJIS[occ]}</Text>
                <Text style={[styles.occLabel, selectedOccasion === occ && styles.occLabelSelected]}>{OCCASION_LABELS[occ]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <MilyButton
          label="기록하기"
          onPress={() => selectedEvent && onSelect(selectedEvent, selectedOccasion ?? undefined)}
          disabled={!canConfirm}
        />
        <MilyButton label="닫기" variant="ghost" onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: theme.milyColors.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  handle: { width: 40, height: 4, backgroundColor: theme.milyColors.brownLight, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: theme.milyColors.brownDark, marginBottom: 16 },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 14, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  eventCardSelected: { borderColor: theme.milyColors.coral },
  eventEmoji: { fontSize: 28, marginRight: 12 },
  eventText: { flex: 1 },
  eventLabel: { fontSize: 15, fontWeight: '600', color: theme.milyColors.brownDark },
  eventLabelSelected: { color: theme.milyColors.coral },
  eventDesc: { fontSize: 12, color: theme.milyColors.brownMid, marginTop: 2 },
  check: { fontSize: 18, color: theme.milyColors.coral },
  occasionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  occCard: { width: '30%', backgroundColor: '#fff', borderRadius: theme.borderRadius.card, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  occCardSelected: { borderColor: theme.milyColors.gold },
  occEmoji: { fontSize: 24, marginBottom: 4 },
  occLabel: { fontSize: 11, color: theme.milyColors.brownMid, textAlign: 'center' },
  occLabelSelected: { color: theme.milyColors.brownDark, fontWeight: '600' },
  footer: { gap: 6, paddingTop: 12 },
});
