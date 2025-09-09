import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaView, StyleSheet } from 'react-native';
import SettingsScreen from '@/components/SettingsScreen';

export default function SettingsTabScreen() {
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <SettingsScreen />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
