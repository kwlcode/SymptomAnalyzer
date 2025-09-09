import React, { useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaView, StyleSheet } from 'react-native';
import LandingPage from '@/components/LandingPage';
import AssessmentForm from '@/components/AssessmentForm';

export default function HomeScreen() {
  const [showAssessment, setShowAssessment] = useState(false);

  const handleGetStarted = () => {
    setShowAssessment(true);
  };

  const handleBackToLanding = () => {
    setShowAssessment(false);
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        {showAssessment ? (
          <AssessmentForm onBackToLanding={handleBackToLanding} />
        ) : (
          <LandingPage onGetStarted={handleGetStarted} />
        )}
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
