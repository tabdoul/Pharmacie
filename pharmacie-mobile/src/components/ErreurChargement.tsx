import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Brand, Spacing } from '@/constants/theme';

type Props = {
  message: string;
  onRetry: () => void;
};

/** Etat d'erreur plein ecran avec un bouton pour relancer le chargement. */
export function ErreurChargement({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="cloud-offline-outline" size={28} color={Brand.danger} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onRetry} accessibilityRole="button" style={styles.button}>
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.buttonText}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: 14,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: Brand.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.accent,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 14,
    marginTop: 4,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});