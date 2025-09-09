import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Surface,
  Text,
  Chip,
  Button
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors, ButtonStyles } from '../lib/theme';

export default function StatusSection() {
  return (
    <View style={styles.container}>
      {/* AI Diagnostic System */}
      <Surface style={[styles.sectionCard, { backgroundColor: AppColors.purple }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="brain" size={24} color="white" />
          <Title style={styles.sectionTitle}>AI Diagnostic System</Title>
        </View>
        <Text style={styles.sectionSubtitle}>
          AI-powered analysis configuration and status
        </Text>
      </Surface>

      {/* AI System Status */}
      <Surface style={[styles.statusCard, { backgroundColor: AppColors.lightGreen }]}>
        <View style={styles.statusHeader}>
          <MaterialCommunityIcons name="check-circle" size={24} color={AppColors.green} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>AI System Status</Text>
            <Text style={styles.statusSubtitle}>OpenAI GPT-4o integration active</Text>
          </View>
          <Chip 
            mode="flat" 
            style={[styles.statusChip, { backgroundColor: AppColors.green }]}
            textStyle={styles.statusChipText}
          >
            Connected
          </Chip>
        </View>
      </Surface>

      {/* Analysis Features */}
      <Card style={styles.featuresCard}>
        <Card.Content>
          <View style={styles.featuresGrid}>
            <View style={styles.featureColumn}>
              <Text style={styles.columnTitle}>Analysis Features</Text>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>Risk Level Assessment</Text>
                <Chip mode="flat" style={ButtonStyles.enabled} textStyle={styles.enabledText}>
                  Enabled
                </Chip>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>Clinical Insights</Text>
                <Chip mode="flat" style={ButtonStyles.enabled} textStyle={styles.enabledText}>
                  Enabled
                </Chip>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>Confidence Scoring</Text>
                <Chip mode="flat" style={ButtonStyles.enabled} textStyle={styles.enabledText}>
                  Enabled
                </Chip>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>Personalized Recommendations</Text>
                <Chip mode="flat" style={ButtonStyles.enabled} textStyle={styles.enabledText}>
                  Enabled
                </Chip>
              </View>
            </View>

            <View style={styles.featureColumn}>
              <Text style={styles.columnTitle}>AI Model Settings</Text>
              <Text style={styles.settingLabel}>Model</Text>
              <Text style={styles.settingValue}>GPT-4o (Latest)</Text>
              
              <Text style={styles.settingLabel}>Temperature (Consistency)</Text>
              <Text style={styles.settingValue}>0.3</Text>
              
              <Text style={styles.settingLabel}>Fallback Mode</Text>
              <Text style={styles.settingValue}>Local Algorithm</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Diagnostic Algorithm */}
      <Surface style={[styles.sectionCard, { backgroundColor: AppColors.orange }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-line" size={24} color="white" />
          <Title style={styles.sectionTitle}>Diagnostic Algorithm</Title>
        </View>
        <Text style={styles.sectionSubtitle}>
          Configure fallback analysis parameters
        </Text>
      </Surface>

      {/* Premium Subscription */}
      <Surface style={[styles.sectionCard, { backgroundColor: AppColors.green }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="credit-card" size={24} color="white" />
          <Title style={styles.sectionTitle}>Premium Subscription</Title>
        </View>
        <Text style={styles.sectionSubtitle}>
          Unlock advanced features with premium plans
        </Text>
      </Surface>

      {/* Current Plan */}
      <Card style={styles.planCard}>
        <Card.Content>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planTitle}>Current Plan</Text>
              <Text style={styles.planSubtitle}>Free tier with basic features</Text>
            </View>
            <Button 
              mode="contained" 
              style={[ButtonStyles.primary, { backgroundColor: AppColors.green }]}
              textColor="white"
            >
              Upgrade to Premium
            </Button>
          </View>

          <View style={styles.planComparison}>
            <View style={styles.planColumn}>
              <Text style={styles.planColumnTitle}>Free Features</Text>
              <Text style={styles.planFeature}>• Basic diagnostic assessments</Text>
              <Text style={styles.planFeature}>• Limited AI insights</Text>
              <Text style={styles.planFeature}>• Standard reporting</Text>
              <Text style={styles.planFeature}>• Basic categories</Text>
            </View>

            <Surface style={[styles.planColumn, styles.premiumColumn, { backgroundColor: AppColors.lightGreen }]}>
              <Text style={[styles.planColumnTitle, { color: AppColors.green }]}>Premium Benefits</Text>
              <Text style={[styles.planFeature, { color: AppColors.green }]}>• Unlimited AI assessments</Text>
              <Text style={[styles.planFeature, { color: AppColors.green }]}>• Advanced diagnostic insights</Text>
              <Text style={[styles.planFeature, { color: AppColors.green }]}>• Export reports to PDF</Text>
              <Text style={[styles.planFeature, { color: AppColors.green }]}>• Custom assessment categories</Text>
              <Text style={[styles.planFeature, { color: AppColors.green }]}>• Priority support</Text>
            </Surface>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  statusSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  statusChip: {
    borderRadius: 16,
  },
  statusChipText: {
    color: 'white',
    fontWeight: '600',
  },
  featuresCard: {
    elevation: 1,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  featureColumn: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: AppColors.text,
    flex: 1,
  },
  enabledText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  planCard: {
    elevation: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  planSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  planComparison: {
    flexDirection: 'row',
    gap: 16,
  },
  planColumn: {
    flex: 1,
  },
  premiumColumn: {
    padding: 16,
    borderRadius: 8,
  },
  planColumnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: AppColors.text,
  },
  planFeature: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    color: AppColors.text,
  },
});