import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaView, StyleSheet } from 'react-native';
import AssessmentForm from '@/components/AssessmentForm';

export default function HomeScreen() {
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <AssessmentForm />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
