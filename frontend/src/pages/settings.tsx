import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical, Plus, RotateCcw, Save, Brain, CheckCircle, AlertCircle, CreditCard } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category, UpdateCategory } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [editedCategories, setEditedCategories] = useState<Record<number, UpdateCategory>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCategory }) => {
      const response = await apiRequest("PUT", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const resetCategoriesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/categories/reset");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditedCategories({});
      toast({
        title: "Success",
        description: "Categories reset to defaults",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset categories",
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: { name: string; description: string; scoreType: string; order: number }) => {
      const response = await apiRequest("POST", "/api/categories", category);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const handleFieldChange = (categoryId: number, field: keyof UpdateCategory, value: string | number) => {
    setEditedCategories(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    const updates = Object.entries(editedCategories);
    if (updates.length === 0) {
      toast({
        title: "No changes",
        description: "No categories have been modified",
      });
      return;
    }

    try {
      await Promise.all(
        updates.map(([idStr, data]) =>
          updateCategoryMutation.mutateAsync({ id: parseInt(idStr), data })
        )
      );
      setEditedCategories({});
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const getCategoryValue = (category: Category, field: keyof Category) => {
    const edited = editedCategories[category.id];
    if (edited && field in edited) {
      return edited[field as keyof UpdateCategory];
    }
    return category[field];
  };

  const handleAddCategory = () => {
    const maxOrder = Math.max(...(categories || []).map(c => c.order), 0);
    createCategoryMutation.mutate({
      name: "New Category",
      description: "Enter description for this category",
      scoreType: "1-10",
      order: maxOrder + 1,
    });
  };

  const handleDeleteCategory = (id: number) => {
    if (categories && categories.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "At least one category must remain",
        variant: "destructive",
      });
      return;
    }
    deleteCategoryMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg">
          <CardTitle className="text-2xl">Assessment Configuration</CardTitle>
          <p className="text-slate-100 mt-1">Customize the score categories and descriptions</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {categories?.map((category, index) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Category {index + 1}</h4>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-gray-600">
                      <GripVertical className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-2 text-red-400 hover:text-red-600"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${category.id}`}>Category Name</Label>
                    <Input
                      id={`name-${category.id}`}
                      value={getCategoryValue(category, 'name') as string}
                      onChange={(e) => handleFieldChange(category.id, 'name', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`type-${category.id}`}>Score Type</Label>
                    <Select
                      value={getCategoryValue(category, 'scoreType') as string}
                      onValueChange={(value) => handleFieldChange(category.id, 'scoreType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 Scale</SelectItem>
                        <SelectItem value="1-5">1-5 Scale</SelectItem>
                        <SelectItem value="0-100">Percentage (0-100)</SelectItem>
                        <SelectItem value="0-1">Yes/No (0-1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`desc-${category.id}`}>Description</Label>
                  <Textarea
                    id={`desc-${category.id}`}
                    rows={3}
                    value={getCategoryValue(category, 'description') as string}
                    onChange={(e) => handleFieldChange(category.id, 'description', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button 
              variant="outline" 
              className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400"
              onClick={handleAddCategory}
              disabled={createCategoryMutation.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Category
            </Button>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => resetCategoriesMutation.mutate()}
              disabled={resetCategoriesMutation.isPending}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleSaveAll}
              disabled={updateCategoryMutation.isPending || Object.keys(editedCategories).length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
          <CardTitle className="text-xl flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            AI Diagnostic System
          </CardTitle>
          <p className="text-purple-100 mt-1">AI-powered analysis configuration and status</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">AI System Status</h4>
                  <p className="text-sm text-green-700">OpenAI GPT-4o integration active</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Connected</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Analysis Features</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Risk Level Assessment</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Clinical Insights</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Confidence Scoring</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Personalized Recommendations</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">AI Model Settings</Label>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Model</Label>
                    <Select defaultValue="gpt-4o" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Temperature (Consistency)</Label>
                    <div className="flex items-center space-x-2">
                      <input type="range" min="0" max="1" step="0.1" defaultValue="0.3" className="flex-1" disabled />
                      <span className="text-sm text-gray-600 w-8">0.3</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Fallback Mode</Label>
                    <Select defaultValue="local" disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Algorithm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">How AI Analysis Works</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    The AI system analyzes your assessment scores using advanced medical knowledge to provide 
                    detailed risk assessments, clinical insights, and personalized recommendations. If the AI 
                    service is unavailable, the system automatically falls back to the local diagnostic algorithm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
          <CardTitle className="text-xl">Diagnostic Algorithm</CardTitle>
          <p className="text-orange-100 mt-1">Configure fallback analysis parameters</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Risk Thresholds</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low Risk</span>
                  <Input type="number" defaultValue="15" min="0" max="50" className="w-20 text-center" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Moderate Risk</span>
                  <Input type="number" defaultValue="30" min="0" max="50" className="w-20 text-center" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High Risk</span>
                  <Input type="number" defaultValue="40" min="0" max="50" className="w-20 text-center" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Weight Factors</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Severity Weight</span>
                  <input type="range" min="0.5" max="2" step="0.1" defaultValue="1.5" className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration Weight</span>
                  <input type="range" min="0.5" max="2" step="0.1" defaultValue="1.2" className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Frequency Weight</span>
                  <input type="range" min="0.5" max="2" step="0.1" defaultValue="1.0" className="w-24" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
          <CardTitle className="text-xl flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Premium Subscription
          </CardTitle>
          <p className="text-emerald-100 mt-1">Unlock advanced features with premium plans</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Current Plan</h4>
                <p className="text-sm text-gray-600">Free tier with basic features</p>
              </div>
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Free Features</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Basic diagnostic assessments</li>
                  <li>• Limited AI insights</li>
                  <li>• Standard reporting</li>
                  <li>• Basic categories</li>
                </ul>
              </div>
              
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h5 className="font-medium text-emerald-900 mb-2">Premium Benefits</h5>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>• Unlimited AI assessments</li>
                  <li>• Advanced diagnostic insights</li>
                  <li>• Export reports to PDF</li>
                  <li>• Custom assessment categories</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentModal 
        open={showPaymentModal} 
        onOpenChange={setShowPaymentModal} 
      />
    </div>
  );
}
