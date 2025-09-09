import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip,
  Surface,
  Text,
  Divider,
  List,
  ProgressBar
} from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import type { Category, RiskAssessment } from '../lib/types';

interface ResultsDisplayProps {
  result: RiskAssessment;
  scores: number[];
  categories: Category[];
  onNewAssessment: () => void;
}

const screenWidth = Dimensions.get('window').width;

export default function ResultsDisplay({ 
  result, 
  scores, 
  categories, 
  onNewAssessment 
}: ResultsDisplayProps) {
  
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low risk':
        return '#4CAF50';
      case 'moderate risk':
        return '#FF9800';
      case 'high risk':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getRiskLevelBackground = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low risk':
        return '#E8F5E8';
      case 'moderate risk':
        return '#FFF3E0';
      case 'high risk':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  // Prepare chart data
  const chartData = [
    {
      name: result.riskLevel,
      population: result.riskPercentage,
      color: getRiskLevelColor(result.riskLevel),
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Remaining',
      population: 100 - result.riskPercentage,
      color: '#E0E0E0',
      legendFontColor: '#666',
      legendFontSize: 14,
    },
  ];

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Risk Level Header */}
      <Card style={[styles.riskCard, { backgroundColor: getRiskLevelBackground(result.riskLevel) }]}>
        <Card.Content>
          <View style={styles.riskHeader}>
            <View style={styles.riskInfo}>
              <Title style={[styles.riskTitle, { color: getRiskLevelColor(result.riskLevel) }]}>
                {result.riskLevel}
              </Title>
              <Text style={styles.riskScore}>Total Score: {result.totalScore}</Text>
            </View>
            <Chip
              mode="flat"
              style={[styles.riskChip, { backgroundColor: getRiskLevelColor(result.riskLevel) }]}
              textStyle={styles.riskChipText}
            >
              {result.riskPercentage}%
            </Chip>
          </View>
          
          <ProgressBar 
            progress={result.riskPercentage / 100} 
            color={getRiskLevelColor(result.riskLevel)}
            style={styles.riskProgress}
          />
        </Card.Content>
      </Card>

      {/* Risk Visualization Chart */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Risk Assessment Visualization</Title>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              width={screenWidth - 80}
              height={200}
              chartConfig={chartConfig}
              accessor={'population'}
              backgroundColor={'transparent'}
              paddingLeft={'15'}
              center={[10, 0]}
              absolute
            />
          </View>
        </Card.Content>
      </Card>

      {/* Explanation */}
      <Card style={styles.explanationCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Assessment Explanation</Title>
          <Text style={styles.explanationText}>{result.explanation}</Text>
          {result.confidence && (
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Confidence Level:</Text>
              <ProgressBar 
                progress={result.confidence / 100} 
                color="#2196F3"
                style={styles.confidenceBar}
              />
              <Text style={styles.confidenceText}>{result.confidence}%</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Recommendations */}
      <Card style={styles.recommendationsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Recommendations</Title>
          {result.recommendations.map((recommendation, index) => (
            <List.Item
              key={index}
              title={recommendation}
              left={() => <List.Icon icon="check-circle" color={getRiskLevelColor(result.riskLevel)} />}
              titleNumberOfLines={3}
              style={styles.recommendationItem}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Score Breakdown */}
      <Card style={styles.scoresCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Score Breakdown</Title>
          {categories.map((category, index) => (
            <View key={category.id} style={styles.scoreBreakdownItem}>
              <View style={styles.scoreBreakdownHeader}>
                <Text style={styles.scoreBreakdownName}>{category.name}</Text>
                <Chip mode="outlined" compact>{scores[index]}/10</Chip>
              </View>
              <ProgressBar 
                progress={scores[index] / 10} 
                color={scores[index] <= 3 ? '#4CAF50' : scores[index] <= 6 ? '#FF9800' : '#F44336'}
                style={styles.scoreBreakdownBar}
              />
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* AI Insights */}
      {result.aiInsights && (
        <Card style={styles.aiInsightsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Additional Insights</Title>
            <Text style={styles.aiInsightsText}>{result.aiInsights}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button 
          mode="contained" 
          onPress={onNewAssessment}
          style={styles.newAssessmentButton}
          icon="plus"
        >
          New Assessment
        </Button>
      </View>

      {/* Disclaimer */}
      <Surface style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          <Text style={styles.disclaimerTitle}>Medical Disclaimer: </Text>
          This assessment tool provides general guidance only and should not replace professional medical advice. 
          Always consult with qualified healthcare professionals for medical decisions, diagnosis, and treatment.
        </Text>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  riskCard: {
    marginBottom: 16,
    elevation: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskInfo: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  riskScore: {
    fontSize: 16,
    opacity: 0.8,
  },
  riskChip: {
    marginLeft: 16,
  },
  riskChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  riskProgress: {
    height: 8,
    borderRadius: 4,
  },
  chartCard: {
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  explanationCard: {
    marginBottom: 16,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  confidenceContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  recommendationsCard: {
    marginBottom: 16,
  },
  recommendationItem: {
    paddingLeft: 0,
  },
  scoresCard: {
    marginBottom: 16,
  },
  scoreBreakdownItem: {
    marginBottom: 16,
  },
  scoreBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreBreakdownName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  scoreBreakdownBar: {
    height: 6,
    borderRadius: 3,
  },
  aiInsightsCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  aiInsightsText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actionContainer: {
    marginBottom: 16,
  },
  newAssessmentButton: {
    paddingVertical: 8,
  },
  disclaimerCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#E65100',
  },
  disclaimerTitle: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
});