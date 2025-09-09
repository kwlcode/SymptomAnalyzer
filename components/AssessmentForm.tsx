import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  ProgressBar, 
  Dialog, 
  Portal,
  Text,
  Chip,
  Surface,
  IconButton
} from 'react-native-paper';
import Slider from 'react-native-slider';
import { storage } from '../lib/storage';
import { calculateRiskAssessment, getMaxValueForScoreType, getMinValueForScoreType } from '../lib/diagnostic-algorithm';
import type { Category, Assessment, RiskAssessment } from '../lib/types';
import ResultsDisplay from './ResultsDisplay';

export default function AssessmentForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<RiskAssessment | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const loadedCategories = await storage.getCategories();
      setCategories(loadedCategories);
      
      // Initialize scores with minimum values
      const initialScores = loadedCategories.map(category => 
        getMinValueForScoreType(category.scoreType)
      );
      setScores(initialScores);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load assessment categories');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (index: number, value: number) => {
    const newScores = [...scores];
    newScores[index] = Math.round(value);
    setScores(newScores);
  };

  const completedScores = scores.filter((score, index) => {
    const category = categories[index];
    if (!category) return false;
    const minValue = getMinValueForScoreType(category.scoreType);
    return score > minValue;
  }).length;

  const progress = categories.length > 0 ? completedScores / categories.length : 0;
  const isFormComplete = completedScores === categories.length;

  const handleSubmit = async () => {
    if (!isFormComplete) {
      Alert.alert('Incomplete Assessment', 'Please complete all score categories');
      return;
    }

    try {
      // Calculate risk assessment
      const result = calculateRiskAssessment(scores, categories);
      setAssessmentResult(result);
      setShowResults(true);

      // Save assessment to storage
      const assessmentData = {
        scores,
        totalScore: result.totalScore,
        riskLevel: result.riskLevel,
        explanation: result.explanation,
        recommendations: result.recommendations,
        confidence: 85 // Default confidence for local algorithm
      };

      await storage.createAssessment(assessmentData);
      
      Alert.alert('Analysis Complete', 'Diagnostic assessment completed successfully');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      Alert.alert('Error', 'Failed to complete assessment analysis');
    }
  };

  const handleReset = () => {
    const resetScores = categories.map(category => 
      getMinValueForScoreType(category.scoreType)
    );
    setScores(resetScores);
    setShowResults(false);
    setAssessmentResult(null);
  };

  const handleNewAssessment = () => {
    handleReset();
    setShowResults(false);
  };

  const getSliderThumbStyle = (value: number, maxValue: number) => {
    const percentage = ((value - 1) / (maxValue - 1)) * 100;
    let color = '#4CAF50'; // Green for low values
    
    if (percentage > 70) color = '#F44336'; // Red for high values
    else if (percentage > 40) color = '#FF9800'; // Orange for medium values
    
    return { backgroundColor: color };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading assessment categories...</Text>
        <ProgressBar indeterminate style={styles.loadingBar} />
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Card>
          <Card.Content>
            <Text>No assessment categories configured. Please configure categories in settings.</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Title style={styles.title}>Patient Assessment</Title>
              <Paragraph style={styles.subtitle}>
                Please provide scores for all {categories.length} categories below
              </Paragraph>
            </View>
            <IconButton
              icon="help-circle"
              mode="contained"
              onPress={() => setShowInstructions(true)}
            />
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Assessment Progress</Text>
              <Text style={styles.progressCount}>{completedScores}/{categories.length} completed</Text>
            </View>
            <ProgressBar progress={progress} style={styles.progressBar} />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.formCard}>
        <Card.Content>
          {categories.map((category, index) => {
            const maxValue = getMaxValueForScoreType(category.scoreType);
            const minValue = getMinValueForScoreType(category.scoreType);
            const currentScore = scores[index] || minValue;

            return (
              <Surface key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  </View>
                  <Chip
                    mode="outlined"
                    style={styles.scoreChip}
                    textStyle={styles.scoreChipText}
                  >
                    {currentScore === minValue ? '-' : currentScore.toString()}
                  </Chip>
                </View>
                
                <View style={styles.sliderContainer}>
                  <Slider
                    value={currentScore}
                    minimumValue={minValue}
                    maximumValue={maxValue}
                    step={1}
                    onValueChange={(value) => handleScoreChange(index, value)}
                    thumbStyle={getSliderThumbStyle(currentScore, maxValue)}
                    trackStyle={styles.sliderTrack}
                    minimumTrackTintColor="#2196F3"
                    maximumTrackTintColor="#E0E0E0"
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>
                      {minValue} - {category.scoreType.includes("1-") ? "Minimal" : "None"}
                    </Text>
                    <Text style={styles.sliderLabel}>
                      {Math.floor(maxValue / 2)} - Moderate
                    </Text>
                    <Text style={styles.sliderLabel}>
                      {maxValue} - {category.scoreType.includes("1-") ? "Severe" : "Maximum"}
                    </Text>
                  </View>
                </View>
              </Surface>
            );
          })}
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button 
          mode="outlined" 
          onPress={handleReset}
          style={styles.resetButton}
          icon="refresh"
        >
          Reset Form
        </Button>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          disabled={!isFormComplete}
          style={styles.submitButton}
          icon="trending-up"
        >
          Analyze Results
        </Button>
      </View>

      {showResults && assessmentResult && (
        <ResultsDisplay 
          result={assessmentResult}
          scores={scores}
          categories={categories}
          onNewAssessment={handleNewAssessment}
        />
      )}

      <Portal>
        <Dialog visible={showInstructions} onDismiss={() => setShowInstructions(false)}>
          <Dialog.Title>How to Use the Diagnostic Assessment Tool</Dialog.Title>
          <Dialog.Content>
            <ScrollView>
              <Text style={styles.instructionTitle}>Step 1: Understand the Categories</Text>
              <Text style={styles.instructionText}>
                Each category represents a different aspect of your symptoms. Read the description carefully before rating.
              </Text>
              
              <Text style={styles.instructionTitle}>Step 2: Rate Your Symptoms</Text>
              <Text style={styles.instructionText}>
                Use the sliders to rate each category on a scale of 1-10:
              </Text>
              <Text style={styles.instructionBullet}>• 1-3: Mild or minimal symptoms</Text>
              <Text style={styles.instructionBullet}>• 4-6: Moderate symptoms that may affect daily life</Text>
              <Text style={styles.instructionBullet}>• 7-8: Significant symptoms requiring attention</Text>
              <Text style={styles.instructionBullet}>• 9-10: Severe symptoms that greatly impact your life</Text>
              
              <Text style={styles.instructionTitle}>Step 3: Submit for Analysis</Text>
              <Text style={styles.instructionText}>
                Once you've rated all categories, tap "Analyze Results" to receive diagnostic analysis with personalized recommendations.
              </Text>
              
              <Surface style={styles.warningBox}>
                <Text style={styles.warningText}>
                  Important: This tool provides general guidance only. For medical decisions and emergencies, always consult with a qualified healthcare professional.
                </Text>
              </Surface>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInstructions(false)}>Got it</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingBar: {
    marginTop: 16,
    width: 200,
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  headerCard: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  formCard: {
    marginBottom: 16,
  },
  categoryCard: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 16,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  scoreChip: {
    minWidth: 50,
  },
  scoreChipText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    opacity: 0.6,
    flex: 1,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  resetButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  instructionBullet: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
    marginBottom: 4,
  },
  warningBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
});