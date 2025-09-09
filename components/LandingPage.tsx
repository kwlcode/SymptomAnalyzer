import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { 
  Title, 
  Paragraph, 
  Button, 
  Card,
  Surface,
  Text
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors } from '../lib/theme';

interface LandingPageProps {
  onGetStarted: () => void;
}

const screenWidth = Dimensions.get('window').width;

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: 'brain',
      title: 'AI-Powered',
      description: 'Advanced AI analysis using GPT-4o for accurate diagnostic insights',
      color: AppColors.secondary
    },
    {
      icon: 'pulse',
      title: 'Real-time Results',
      description: 'Get instant risk assessments and personalized recommendations',
      color: AppColors.green
    },
    {
      icon: 'shield-check',
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security',
      color: AppColors.purple
    },
    {
      icon: 'account-group',
      title: 'User-Specific',
      description: 'Personalized categories and assessment history for each user',
      color: AppColors.orange
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Title style={styles.mainTitle}>Diagnostic Assessment Tool</Title>
        <Paragraph style={styles.subtitle}>
          AI-powered medical assessments for healthcare professionals. Analyze symptoms, 
          assess risk levels, and get personalized recommendations.
        </Paragraph>
        <Button 
          mode="contained" 
          onPress={onGetStarted}
          style={styles.getStartedButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Get Started
        </Button>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresSection}>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Surface key={index} style={styles.featureCard}>
              <View style={styles.featureContent}>
                <MaterialCommunityIcons 
                  name={feature.icon as any} 
                  size={48} 
                  color={feature.color}
                  style={styles.featureIcon}
                />
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </Surface>
          ))}
        </View>
      </View>

      {/* Call to Action Section */}
      <View style={styles.ctaSection}>
        <Title style={styles.ctaTitle}>Ready to get started?</Title>
        <Paragraph style={styles.ctaSubtitle}>
          Join healthcare professionals using our diagnostic assessment tool
        </Paragraph>
        <Button 
          mode="contained" 
          onPress={onGetStarted}
          style={styles.signInButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon="login"
        >
          Begin Assessment
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  mainTitle: {
    fontSize: screenWidth > 400 ? 36 : 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: AppColors.text,
    marginBottom: 16,
    lineHeight: screenWidth > 400 ? 44 : 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: AppColors.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: 500,
  },
  getStartedButton: {
    backgroundColor: AppColors.green,
    borderRadius: 8,
    elevation: 2,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  featuresSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#ffffff',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    width: screenWidth > 600 ? '23%' : '47%',
    minWidth: 160,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: AppColors.surface,
    marginBottom: 16,
  },
  featureContent: {
    padding: 24,
    alignItems: 'center',
    minHeight: 200,
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: AppColors.text,
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: AppColors.text,
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: AppColors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  signInButton: {
    backgroundColor: AppColors.green,
    borderRadius: 8,
    elevation: 2,
  },
});