import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category, Assessment, InsertCategory, InsertAssessment } from './types';

const CATEGORIES_KEY = '@diagnostic_categories';
const ASSESSMENTS_KEY = '@diagnostic_assessments';
const CURRENT_CATEGORY_ID_KEY = '@current_category_id';
const CURRENT_ASSESSMENT_ID_KEY = '@current_assessment_id';

export class DiagnosticStorage {
  private static instance: DiagnosticStorage;
  
  static getInstance(): DiagnosticStorage {
    if (!DiagnosticStorage.instance) {
      DiagnosticStorage.instance = new DiagnosticStorage();
    }
    return DiagnosticStorage.instance;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const stored = await AsyncStorage.getItem(CATEGORIES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Initialize with default categories if empty
      return await this.resetCategoriesToDefaults();
    } catch (error) {
      console.error('Error getting categories:', error);
      return await this.resetCategoriesToDefaults();
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const categories = await this.getCategories();
      const currentId = await this.getNextCategoryId();
      
      const newCategory: Category = {
        id: currentId,
        ...category
      };
      
      categories.push(newCategory);
      categories.sort((a, b) => a.order - b.order);
      
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
      await this.incrementCategoryId();
      
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
    try {
      const categories = await this.getCategories();
      const index = categories.findIndex(cat => cat.id === id);
      
      if (index === -1) {
        throw new Error('Category not found');
      }
      
      categories[index] = { ...categories[index], ...updates };
      categories.sort((a, b) => a.order - b.order);
      
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
      
      return categories[index];
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  }

  async deleteCategory(id: number): Promise<void> {
    try {
      const categories = await this.getCategories();
      const filtered = categories.filter(cat => cat.id !== id);
      
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  }

  async resetCategoriesToDefaults(): Promise<Category[]> {
    try {
      const defaultCategories: Category[] = [
        { 
          id: 1, 
          name: "Symptom Severity", 
          description: "Rate the intensity of primary symptoms", 
          scoreType: "1-10", 
          order: 1 
        },
        { 
          id: 2, 
          name: "Functional Impact", 
          description: "How much symptoms affect daily activities", 
          scoreType: "1-10", 
          order: 2 
        },
        { 
          id: 3, 
          name: "Duration", 
          description: "How long have symptoms been present?", 
          scoreType: "1-10", 
          order: 3 
        },
        { 
          id: 4, 
          name: "Frequency", 
          description: "How often do symptoms occur?", 
          scoreType: "1-10", 
          order: 4 
        },
        { 
          id: 5, 
          name: "Associated Factors", 
          description: "Presence of related symptoms or risk factors", 
          scoreType: "1-10", 
          order: 5 
        },
      ];
      
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
      await AsyncStorage.setItem(CURRENT_CATEGORY_ID_KEY, '6');
      
      return defaultCategories;
    } catch (error) {
      console.error('Error resetting categories:', error);
      throw new Error('Failed to reset categories');
    }
  }

  // Assessments
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    try {
      const assessments = await this.getRecentAssessments();
      const currentId = await this.getNextAssessmentId();
      
      const newAssessment: Assessment = {
        id: currentId,
        ...assessment,
        createdAt: new Date()
      };
      
      assessments.unshift(newAssessment); // Add to beginning
      
      // Keep only last 50 assessments
      if (assessments.length > 50) {
        assessments.splice(50);
      }
      
      await AsyncStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
      await this.incrementAssessmentId();
      
      return newAssessment;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw new Error('Failed to create assessment');
    }
  }

  async getRecentAssessments(limit: number = 10): Promise<Assessment[]> {
    try {
      const stored = await AsyncStorage.getItem(ASSESSMENTS_KEY);
      if (stored) {
        const assessments = JSON.parse(stored);
        // Convert date strings back to Date objects
        const parsed = assessments.map((assessment: any) => ({
          ...assessment,
          createdAt: new Date(assessment.createdAt)
        }));
        return parsed.slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting assessments:', error);
      return [];
    }
  }

  // Helper methods
  private async getNextCategoryId(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(CURRENT_CATEGORY_ID_KEY);
      return stored ? parseInt(stored, 10) : 6;
    } catch (error) {
      return 6;
    }
  }

  private async incrementCategoryId(): Promise<void> {
    try {
      const currentId = await this.getNextCategoryId();
      await AsyncStorage.setItem(CURRENT_CATEGORY_ID_KEY, (currentId + 1).toString());
    } catch (error) {
      console.error('Error incrementing category ID:', error);
    }
  }

  private async getNextAssessmentId(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(CURRENT_ASSESSMENT_ID_KEY);
      return stored ? parseInt(stored, 10) : 1;
    } catch (error) {
      return 1;
    }
  }

  private async incrementAssessmentId(): Promise<void> {
    try {
      const currentId = await this.getNextAssessmentId();
      await AsyncStorage.setItem(CURRENT_ASSESSMENT_ID_KEY, (currentId + 1).toString());
    } catch (error) {
      console.error('Error incrementing assessment ID:', error);
    }
  }

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CATEGORIES_KEY,
        ASSESSMENTS_KEY,
        CURRENT_CATEGORY_ID_KEY,
        CURRENT_ASSESSMENT_ID_KEY
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

export const storage = DiagnosticStorage.getInstance();