import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Button, 
  Dialog, 
  Portal,
  Text,
  TextInput,
  List,
  IconButton,
  Chip,
  Surface,
  Divider,
  ProgressBar
} from 'react-native-paper';
import { storage } from '../lib/storage';
import type { Category, InsertCategory } from '../lib/types';
import { AppColors, ButtonStyles } from '../lib/theme';

export default function SettingsScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    scoreType: '1-10',
    order: 1
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const loadedCategories = await storage.getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const categoryData: InsertCategory = {
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        scoreType: newCategory.scoreType,
        order: categories.length + 1
      };

      await storage.createCategory(categoryData);
      await loadCategories();
      setShowAddDialog(false);
      resetNewCategory();
      Alert.alert('Success', 'Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim() || !editingCategory.description.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await storage.updateCategory(editingCategory.id, {
        name: editingCategory.name.trim(),
        description: editingCategory.description.trim(),
        scoreType: editingCategory.scoreType,
        order: editingCategory.order
      });
      await loadCategories();
      setShowEditDialog(false);
      setEditingCategory(null);
      Alert.alert('Success', 'Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.deleteCategory(category.id);
              await loadCategories();
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          }
        }
      ]
    );
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset Categories',
      'This will replace all current categories with the default medical assessment categories. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.resetCategoriesToDefaults();
              await loadCategories();
              Alert.alert('Success', 'Categories reset to defaults');
            } catch (error) {
              console.error('Error resetting categories:', error);
              Alert.alert('Error', 'Failed to reset categories');
            }
          }
        }
      ]
    );
  };

  const resetNewCategory = () => {
    setNewCategory({
      name: '',
      description: '',
      scoreType: '1-10',
      order: 1
    });
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory({ ...category });
    setShowEditDialog(true);
  };

  const scoreTypeOptions = [
    { label: '1-10 Scale', value: '1-10' },
    { label: '1-5 Scale', value: '1-5' },
    { label: '0-100 Scale', value: '0-100' },
    { label: '0-1 Binary', value: '0-1' }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading categories...</Text>
        <ProgressBar indeterminate style={styles.loadingBar} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title style={styles.title}>Assessment Categories</Title>
          <Text style={styles.subtitle}>
            Manage the categories used in diagnostic assessments. Categories define the different aspects that are evaluated during patient assessments.
          </Text>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <View style={styles.actionButtons}>
            <Button 
              mode="outlined" 
              onPress={() => setShowAddDialog(true)}
              style={styles.addButton}
              icon="plus"
              textColor={AppColors.text}
            >
              Add New Category
            </Button>
            <Button 
              mode="outlined" 
              onPress={handleResetToDefaults}
              style={styles.resetButton}
              icon="refresh"
              textColor={AppColors.text}
            >
              Reset to Defaults
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Categories List */}
      <Card style={styles.categoriesCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Current Categories ({categories.length})</Title>
          {categories.length === 0 ? (
            <Surface style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No categories configured. Add categories to enable assessments.
              </Text>
            </Surface>
          ) : (
            categories.map((category, index) => (
              <Surface key={category.id} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                    <View style={styles.categoryMeta}>
                      <Chip mode="outlined" compact style={styles.orderChip}>
                        Order: {category.order}
                      </Chip>
                      <Chip mode="outlined" compact style={styles.scoreTypeChip}>
                        {category.scoreType}
                      </Chip>
                    </View>
                  </View>
                  <View style={styles.categoryActions}>
                    <IconButton
                      icon="pencil"
                      mode="contained-tonal"
                      size={20}
                      onPress={() => openEditDialog(category)}
                    />
                    <IconButton
                      icon="delete"
                      mode="contained-tonal"
                      size={20}
                      iconColor="#F44336"
                      onPress={() => handleDeleteCategory(category)}
                    />
                  </View>
                </View>
                {index < categories.length - 1 && <Divider style={styles.divider} />}
              </Surface>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Add Category Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add New Category</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Category Name"
              value={newCategory.name}
              onChangeText={(text) => setNewCategory({...newCategory, name: text})}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Description"
              value={newCategory.description}
              onChangeText={(text) => setNewCategory({...newCategory, description: text})}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            <Text style={styles.inputLabel}>Score Type</Text>
            <View style={styles.scoreTypeContainer}>
              {scoreTypeOptions.map((option) => (
                <Chip
                  key={option.value}
                  mode={newCategory.scoreType === option.value ? 'flat' : 'outlined'}
                  selected={newCategory.scoreType === option.value}
                  onPress={() => setNewCategory({...newCategory, scoreType: option.value})}
                  style={styles.scoreTypeChip}
                >
                  {option.label}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setShowAddDialog(false);
              resetNewCategory();
            }}>Cancel</Button>
            <Button onPress={handleAddCategory}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Category Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Category</Dialog.Title>
          <Dialog.Content>
            {editingCategory && (
              <>
                <TextInput
                  label="Category Name"
                  value={editingCategory.name}
                  onChangeText={(text) => setEditingCategory({...editingCategory, name: text})}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Description"
                  value={editingCategory.description}
                  onChangeText={(text) => setEditingCategory({...editingCategory, description: text})}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.inputLabel}>Score Type</Text>
                <View style={styles.scoreTypeContainer}>
                  {scoreTypeOptions.map((option) => (
                    <Chip
                      key={option.value}
                      mode={editingCategory.scoreType === option.value ? 'flat' : 'outlined'}
                      selected={editingCategory.scoreType === option.value}
                      onPress={() => setEditingCategory({...editingCategory, scoreType: option.value})}
                      style={styles.scoreTypeChip}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </View>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setShowEditDialog(false);
              setEditingCategory(null);
            }}>Cancel</Button>
            <Button onPress={handleEditCategory}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  headerCard: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    ...ButtonStyles.dashed,
  },
  resetButton: {
    flex: 1,
    ...ButtonStyles.secondary,
  },
  categoriesCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  emptyState: {
    padding: 32,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  categoryItem: {
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  categoryHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    lineHeight: 18,
    marginBottom: 8,
  },
  categoryMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  orderChip: {
    height: 28,
  },
  scoreTypeChip: {
    height: 28,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 4,
  },
  divider: {
    marginHorizontal: 16,
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  scoreTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
});