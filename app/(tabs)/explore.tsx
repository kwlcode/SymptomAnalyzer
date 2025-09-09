import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import SettingsScreen from '@/components/SettingsScreen';
import StatusSection from '@/components/StatusSection';

export default function SettingsTabScreen() {
  const lightTheme = {
    colors: {
      background: '#ffffff',
      surface: '#ffffff',
    },
  };

  return (
    <PaperProvider theme={lightTheme}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <StatusSection />
          <SettingsScreen />
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
