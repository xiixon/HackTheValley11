import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import type { DatabaseMedication } from '../../lib/medicationCatalog';
import { colors } from '../../theme/colors';
import { Clickable } from '../ui/Clickable';

type Props = { visible: boolean; onSelect: (medicine: DatabaseMedication) => void };

export function MedicineCatalogPicker({ visible, onSelect }: Props) {
  const { authenticatedFetch } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<DatabaseMedication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams({ limit: String(limit) });
        if (search.trim()) query.set('search', search.trim());
        const response = await authenticatedFetch(`/medications?${query}`, { signal: controller.signal });
        const data = await response.json() as { medications: DatabaseMedication[]; total: number };
        if (active) { setResults(data.medications); setTotal(data.total); }
      } catch (cause) {
        if (active && !controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Could not load medicines.');
        }
      } finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [visible, search, limit, attempt, authenticatedFetch]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Find a medicine</Text>
      <TextInput accessibilityLabel="Search medicines" autoCapitalize="none" autoCorrect={false}
        onChangeText={(value) => { setSearch(value); setLimit(20); }} placeholder="Brand, generic name or ingredient"
        placeholderTextColor={colors.textMuted} style={styles.input} value={search} />
      {loading && <ActivityIndicator accessibilityLabel="Loading medicines" color={colors.primary} style={styles.loading} />}
      {!!error && <View style={styles.message}><Text style={styles.error}>{error}</Text>
        <Clickable accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)}><Text style={styles.link}>Try again</Text></Clickable>
      </View>}
      {!error && <>
        <Text accessibilityLiveRegion="polite" style={styles.count}>{total} {total === 1 ? 'medicine' : 'medicines'}{search.trim() ? ' found' : ' in the catalog'}</Text>
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.results}>
          {results.map((medicine) => (
            <Clickable key={medicine.id} accessibilityRole="button" accessibilityLabel={`Select ${medicine.brandName || medicine.genericName}`}
              onPress={() => onSelect(medicine)} style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
              <View style={styles.copy}>
                <Text style={styles.name}>{medicine.brandName || medicine.genericName}</Text>
                <Text style={styles.generic}>{medicine.genericName}</Text>
                <Text style={styles.ingredients}>{medicine.ingredients.map((ingredient) => `${ingredient.name} ${ingredient.strengthMg} mg`).join(' · ')} · {medicine.dosageForm}</Text>
              </View>
              <Text style={styles.arrow}>＋</Text>
            </Clickable>
          ))}
          {!loading && results.length === 0 && <Text style={styles.empty}>No matching medicines. Try another name.</Text>}
          {results.length < total && limit < 100 && <Clickable accessibilityRole="button" onPress={() => setLimit((value) => Math.min(100, value + 20))} style={styles.more}><Text style={styles.link}>Show more</Text></Clickable>}
          {limit === 100 && total > 100 && <Text style={styles.empty}>Narrow your search to see more matches.</Text>}
        </ScrollView>
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  label: { color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, minHeight: 48, paddingHorizontal: 12, fontSize: 14 },
  loading: { marginTop: 10 },
  count: { color: colors.textMuted, fontSize: 12, marginVertical: 10 },
  results: { maxHeight: 270, borderColor: colors.border, borderWidth: 1, borderRadius: 14, backgroundColor: colors.surface },
  result: { padding: 14, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1 },
  name: { color: colors.text, fontWeight: '700', fontSize: 15 },
  generic: { color: colors.primary, fontSize: 13, marginTop: 3 },
  ingredients: { color: colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  arrow: { color: colors.primary, fontSize: 22 },
  pressed: { backgroundColor: colors.surfaceMuted },
  empty: { color: colors.textMuted, fontSize: 13, padding: 16 },
  message: { paddingVertical: 12, gap: 8 },
  error: { color: colors.textMuted, fontSize: 13 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  more: { padding: 14, alignItems: 'center' },
});
