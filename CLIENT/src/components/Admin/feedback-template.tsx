import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "../ui/dialog";
import { 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CheckCircle,
  XCircle,
  GripVertical,
  Eye,
  Layers,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

interface Category {
  id: number;
  category_name: string;
  description: string;
  display_order: number;
  feedback_type?: 'subject' | 'instructor' | 'general';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent_category_id?: number | null;
  subcategories?: Category[];
}

interface EvaluationPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  academic_year: string;
  semester: string;
  created_at: string;
  updated_at: string;
}

export function FeedbackTemplate() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'evaluation'>('categories');
  const [categoryType, setCategoryType] = useState<'subject' | 'instructor'>('subject');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  
  // Category form state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryActive, setCategoryActive] = useState(true);
  const [categoryFeedbackType, setCategoryFeedbackType] = useState<'subject' | 'instructor'>('subject');
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);

  // Delete category dialog state
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Period form state
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<EvaluationPeriod | null>(null);
  const [periodName, setPeriodName] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState("");
  const [periodActive, setPeriodActive] = useState(false);
  const [savingPeriod, setSavingPeriod] = useState(false);

  useEffect(() => {
    fetchCategories('subject');
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories(categoryType);
    }
  }, [categoryType, activeTab]);

  const fetchCategories = async (type?: 'subject' | 'instructor') => {
    try {
      const token = sessionStorage.getItem('authToken');
      const url = type 
        ? `/api/feedback-templates/categories?feedback_type=${type}`
        : '/api/feedback-templates/categories';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchPeriods = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/feedback-templates/periods', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPeriods(data.periods || []);
      }
    } catch (error) {
      console.error("Error fetching periods:", error);
      toast.error("Failed to load evaluation periods");
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = categories.filter(c => !c.parent_category_id && (c.feedback_type === categoryType || c.feedback_type === 'general'));
  
  const getSubcategories = (parentId: number) => {
    return categories.filter(c => c.parent_category_id === parentId);
  };

  const toggleExpanded = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddCategory = (parentId?: number) => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryActive(true);
    setCategoryFeedbackType(categoryType);
    setParentCategoryId(parentId || null);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.category_name);
    setCategoryDescription(category.description || "");
    setCategoryActive(category.is_active);
    setCategoryFeedbackType(category.feedback_type as 'subject' | 'instructor' || 'subject');
    setParentCategoryId(category.parent_category_id || null);
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSavingCategory(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const url = editingCategory 
        ? `/api/feedback-templates/categories/${editingCategory.id}`
        : '/api/feedback-templates/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_name: categoryName,
          description: categoryDescription,
          is_active: categoryActive,
          feedback_type: categoryFeedbackType,
          parent_category_id: parentCategoryId
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(editingCategory ? "Category updated successfully" : "Category added successfully");
        setCategoryDialogOpen(false);
        fetchCategories(categoryType);
      } else {
        toast.error(data.message || "Failed to save category");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const category = categories.find(c => c.id === id);
    setCategoryToDelete(category || null);
    setDeleteCategoryDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`/api/feedback-templates/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Category deleted successfully");
        fetchCategories(categoryType);
      } else {
        toast.error(data.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleAddPeriod = () => {
    setEditingPeriod(null);
    setPeriodName("");
    setPeriodStartDate("");
    setPeriodEndDate("");
    setPeriodActive(false);
    setPeriodDialogOpen(true);
  };

  const handleEditPeriod = (period: EvaluationPeriod) => {
    setEditingPeriod(period);
    setPeriodName(period.name);
    setPeriodStartDate(period.start_date);
    setPeriodEndDate(period.end_date);
    setPeriodActive(period.is_active);
    setPeriodDialogOpen(true);
  };

  const handleSavePeriod = async () => {
    if (!periodName.trim() || !periodStartDate || !periodEndDate) {
      toast.error("Name, start date, and end date are required");
      return;
    }

    setSavingPeriod(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const url = editingPeriod 
        ? `/api/feedback-templates/periods/${editingPeriod.id}`
        : '/api/feedback-templates/periods';
      
      const method = editingPeriod ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            name: periodName,
            start_date: periodStartDate,
            end_date: periodEndDate,
            is_active: periodActive
          }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(editingPeriod ? "Evaluation period updated successfully" : "Evaluation period created successfully");
        setPeriodDialogOpen(false);
        fetchPeriods();
      } else {
        toast.error(data.message || "Failed to save evaluation period");
      }
    } catch (error) {
      console.error("Error saving period:", error);
      toast.error("Failed to save evaluation period");
    } finally {
      setSavingPeriod(false);
    }
  };

  const handleDeletePeriod = async (id: number) => {
    if (!confirm("Are you sure you want to delete this evaluation period?")) return;
    
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`/api/feedback-templates/periods/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Evaluation period deleted successfully");
        fetchPeriods();
      } else {
        toast.error(data.message || "Failed to delete evaluation period");
      }
    } catch (error) {
      console.error("Error deleting period:", error);
      toast.error("Failed to delete evaluation period");
    }
  };

  const handleTogglePeriod = async (id: number, isActive: boolean) => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`/api/feedback-templates/periods/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Evaluation period ${!isActive ? 'activated' : 'deactivated'} successfully`);
        fetchPeriods();
      } else {
        toast.error(data.message || "Failed to toggle evaluation period");
      }
    } catch (error) {
      console.error("Error toggling period:", error);
      toast.error("Failed to toggle evaluation period");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isPeriodWithinRange = (period: EvaluationPeriod) => {
    const now = new Date();
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
          <div className="h-8 bg-green-200 rounded animate-pulse mb-2 w-64"></div>
          <div className="h-4 bg-green-100 rounded animate-pulse w-80"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-36"></div>
        </div>

        {/* Categories Tab Skeleton */}
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
              <div className="h-4 bg-gray-100 rounded animate-pulse w-64"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-9 bg-green-200 rounded animate-pulse w-24"></div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Category Type Tabs Skeleton */}
            <div className="flex gap-2 mb-6">
              <div className="h-9 bg-green-200 rounded animate-pulse w-32"></div>
              <div className="h-9 bg-gray-200 rounded animate-pulse w-36"></div>
            </div>

            {/* Categories List Skeleton */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border rounded-lg overflow-hidden bg-gray-50">
                  <div className="flex items-center p-4 bg-white">
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse mr-2"></div>
                    <div className="text-sm text-gray-400 w-8 mr-2">{i}.</div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded animate-pulse mb-1 w-32"></div>
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-48"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <div className="space-y-2">
                      {[1, 2].map((j) => (
                        <div key={j} className="flex items-center p-3 bg-white rounded border">
                          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse mr-3"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl font-bold">Feedback Template System</h2>
        <p className="text-gray-600 mt-1">Manage evaluation categories and set feedback periods</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <Button
          variant={activeTab === 'categories' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('categories')}
          className={activeTab === 'categories' ? 'bg-green-500 hover:bg-green-600' : ''}
        >
          <Layers className="w-4 h-4 mr-2" />
          Rating Categories
        </Button>
        <Button
          variant={activeTab === 'evaluation' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('evaluation')}
          className={activeTab === 'evaluation' ? 'bg-green-500 hover:bg-green-600' : ''}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Evaluation Period
        </Button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Rating Categories</CardTitle>
              <CardDescription>
                Manage categories with subcategories for subject and instructor feedback
              </CardDescription>
            </div>
            <div className="flex gap-2">
               <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                 <Eye className="w-4 h-4 sm:mr-2" />
                 <span className="hidden sm:inline">Preview</span>
               </Button>
               <Button onClick={() => handleAddCategory()} className="bg-green-500 hover:bg-green-600">
                 <Plus className="w-4 h-4 sm:mr-2" />
                 <span className="hidden sm:inline">Add Category</span>
               </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Subject/Instructor Category Tabs */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={categoryType === 'subject' ? 'default' : 'outline'}
                onClick={() => setCategoryType('subject')}
                className={categoryType === 'subject' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                Subject Categories
              </Button>
              <Button
                variant={categoryType === 'instructor' ? 'default' : 'outline'}
                onClick={() => setCategoryType('instructor')}
                className={categoryType === 'instructor' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                Instructor Categories
              </Button>
            </div>

            {/* Category List - Form Builder Style */}
            <div className="space-y-3">
              {mainCategories.map((mainCategory, index) => {
                const subcategories = getSubcategories(mainCategory.id);
                const isExpanded = expandedCategories.has(mainCategory.id);
                
                return (
                  <div key={mainCategory.id} className="border rounded-lg overflow-hidden bg-gray-50">
                    {/* Main Category Card */}
                    <div className="flex items-center p-4 bg-white">
                      {/* Drag Handle */}
                      <Button variant="ghost" size="icon" className="cursor-move h-8 w-8 mr-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </Button>
                      
                      {/* Number */}
                      <span className="text-sm text-gray-400 w-8">{index + 1}.</span>
                      
                      {/* Category Info */}
                      <div className="flex-1">
                        <p className="font-semibold">{mainCategory.category_name}</p>
                        {mainCategory.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{mainCategory.description}</p>
                        )}
                      </div>
                      
                      {/* Subcategories indicator */}
                      {subcategories.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(mainCategory.id)}
                          className="mr-2"
                        >
                          <span className="hidden sm:inline text-xs text-green-600 mr-1">{subcategories.length} subcategories</span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </Button>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAddCategory(mainCategory.id)}
                          title="Add Subcategory"
                          className="h-8 w-8"
                        >
                          <Plus className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCategory(mainCategory)}
                          className="h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(mainCategory.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Subcategories - Expanded View */}
                    {subcategories.length > 0 && isExpanded && (
                      <div className="bg-gray-100 p-4 border-t space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Subcategories</p>
                        {subcategories.map((subcategory, subIndex) => (
                          <div 
                            key={subcategory.id}
                            className="flex items-center p-3 bg-white rounded-lg border"
                          >
                            <span className="text-xs text-gray-400 w-8">{index + 1}.{subIndex + 1}</span>
                            <div className="flex-1">
                              <p className="font-medium">{subcategory.category_name}</p>
                              {subcategory.description && (
                                <p className="text-xs text-gray-500">{subcategory.description}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCategory(subcategory)}
                              className="h-7 w-7"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(subcategory.id)}
                              className="h-7 w-7 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {mainCategories.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Layers className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No categories found</p>
                  <p className="text-gray-400 text-sm mb-4">Add a category to get started</p>
                  <Button onClick={() => handleAddCategory()} className="bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Period Tab */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Evaluation Periods</CardTitle>
                <CardDescription>
                  Set the timeframe when students can submit feedback
                </CardDescription>
              </div>
              <Button onClick={handleAddPeriod} className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Period
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => {
                    const isWithinRange = isPeriodWithinRange(period);
                    const isPeriodActive = Boolean(period.is_active);
                    return (
                      <TableRow key={period.id}>
                        <TableCell className="font-medium">{period.name}</TableCell>
                        <TableCell>{formatDate(period.start_date)}</TableCell>
                        <TableCell>{formatDate(period.end_date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isPeriodActive ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {isPeriodActive && isWithinRange && (
                              <Badge className="bg-blue-500">In Progress</Badge>
                            )}
                            {isPeriodActive && !isWithinRange && (
                              <Badge className="bg-orange-500">Scheduled</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTogglePeriod(period.id, period.is_active)}
                            >
                              {period.is_active ? (
                                <ToggleRight className="w-5 h-5 text-green-500" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPeriod(period)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePeriod(period.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {periods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No evaluation periods found. Create one to enable feedback collection.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const activePeriod = periods.find(p => p.is_active);
                if (!activePeriod) {
                  return (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <XCircle className="w-6 h-6 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-700">Feedback Collection is Inactive</p>
                        <p className="text-sm text-gray-500">
                          Create and activate an evaluation period to enable feedback collection
                        </p>
                      </div>
                    </div>
                  );
                }
                
                const isWithinRange = isPeriodWithinRange(activePeriod);
                if (isWithinRange) {
                  return (
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700">Feedback Collection is Active</p>
                        <p className="text-sm text-green-600">
                          Students can now submit subject and instructor feedback
                        </p>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-orange-500" />
                    <div>
                      <p className="font-medium text-orange-700">Feedback Collection is Scheduled</p>
                      <p className="text-sm text-orange-600">
                        Evaluation period is set but not yet active. Opens on {formatDate(activePeriod.start_date)}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Dialog - Full Form Preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[1000px]! w-[95vw] max-h-[90vh] overflow-y-auto scrollbar-ghost" style={{ maxWidth: '1000px', width: '95vw' }}>
          <DialogHeader>
            <DialogTitle>Form View</DialogTitle>
            <DialogDescription>
              This is how respondents will see your feedback form
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Preview Form */}
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-6 space-y-6">
                {/* Title and Description */}
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold">
                    {categoryType === 'subject' ? 'Subject Evaluation' : 'Instructor Evaluation'}
                  </h1>
                  <p className="text-gray-600">
                    Please rate the {categoryType === 'subject' ? 'subject' : 'instructor'} based on the following criteria
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary">
                      {categoryType === 'subject' ? 'Subject Feedback' : 'Instructor Feedback'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Categories */}
                <div className="space-y-6">
                  {categories.length > 0 ? (
                    categories.filter(c => !c.parent_category_id).map((category, categoryIndex) => (
                      <div key={category.id}>
                        {/* Category Section */}
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mt-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <Layers className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{category.category_name}</h3>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-0.5">{category.description}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Subcategories with ratings - Google Forms Checkbox Grid Style */}
                        {getSubcategories(category.id).length > 0 && (
                          <div className="mt-4 overflow-x-auto border rounded-lg shadow-sm">
                            <table className="w-full border-collapse bg-white min-w-[600px]">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm min-w-[120px] sm:min-w-[180px] border-b border-r">
                                    Criteria
                                  </th>
                                  {[
                                    { value: 5, label: 'Strongly Agree' },
                                    { value: 4, label: 'Agree' },
                                    { value: 3, label: 'Neutral' },
                                    { value: 2, label: 'Disagree' },
                                    { value: 1, label: 'Strongly Disagree' }
                                  ].map((option) => (
                                    <th
                                      key={option.value}
                                      className="text-center py-2 sm:py-3 px-1 sm:px-4 font-semibold text-gray-700 text-xs sm:text-sm min-w-[60px] sm:min-w-[90px] border-b border-r last:border-r-0"
                                    >
                                      <span className="hidden sm:block">{option.label}</span>
                                      <span className="sm:hidden">{option.value}</span>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {getSubcategories(category.id).map((sub, subIndex) => (
                                  <tr
                                    key={sub.id}
                                    className={`border-b last:border-b-0 ${subIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50/50 transition-colors`}
                                  >
                                    <td className="py-2 sm:py-3 px-2 sm:px-4 border-r">
                                      <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-medium text-gray-800">
                                          {sub.category_name}
                                        </span>
                                        {sub.description && (
                                          <span className="text-xs text-gray-500 mt-0.5">{sub.description}</span>
                                        )}
                                      </div>
                                    </td>
                                    {[
                                      { value: 5, label: 'Strongly Agree' },
                                      { value: 4, label: 'Agree' },
                                      { value: 3, label: 'Neutral' },
                                      { value: 2, label: 'Disagree' },
                                      { value: 1, label: 'Strongly Disagree' }
                                    ].map((option) => (
                                      <td key={option.value} className="text-center py-2 sm:py-3 px-1 sm:px-4 border-r last:border-r-0">
                                        <div className="flex justify-center">
                                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2 border-gray-300 bg-white hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all flex items-center justify-center shadow-sm">
                                            {/* Checkbox placeholder - unchecked state */}
                                          </div>
                                        </div>
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm">No categories to preview. Add some categories first.</p>
                    </div>
                  )}
                </div>

                {/* Submit Button Preview */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    className="bg-green-500 hover:bg-green-600"
                    disabled
                  >
                    Submit Feedback
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory 
                ? (editingCategory.parent_category_id ? 'Edit Subcategory' : 'Edit Category')
                : (parentCategoryId ? 'Add New Subcategory' : 'Add New Category')
              }
            </DialogTitle>
            <DialogDescription>
              {parentCategoryId 
                ? 'Create a subcategory under the selected main category'
                : 'Create a main category for feedback forms'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">
                {parentCategoryId ? 'Subcategory Name' : 'Category Name'}
              </Label>
              <Input
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={parentCategoryId ? "e.g., Communication Skills" : "e.g., Teaching Quality"}
                className="border border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Brief description of this category"
                className="border border-gray-200"
              />
            </div>
            
            {/* Parent Category Selection */}
            {(!editingCategory || parentCategoryId || editingCategory.parent_category_id) && (
              <div className="space-y-2">
                <Label htmlFor="parentCategory">Parent Category</Label>
                <select
                  id="parentCategory"
                  value={parentCategoryId || ''}
                  onChange={(e) => setParentCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full p-2 border border-gray-200 rounded-md"
                >
                  <option value="">Select a main category (optional)</option>
                  {mainCategories
                    .filter(mc => editingCategory?.id !== mc.id)
                    .map(mc => (
                      <option key={mc.id} value={mc.id}>
                        {mc.category_name}
                      </option>
                    ))
                  }
                </select>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Switch
                id="categoryActive"
                checked={categoryActive}
                onCheckedChange={setCategoryActive}
              />
              <Label htmlFor="categoryActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={savingCategory} className="bg-green-500 hover:bg-green-600">
              {savingCategory && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCategory ? 'Update' : 'Add'} {parentCategoryId ? 'Subcategory' : 'Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {categoryToDelete && getSubcategories(categoryToDelete.id).length > 0 && (
            <div className="py-4">
              <p className="text-sm text-amber-600">
                Warning: This category has {getSubcategories(categoryToDelete.id).length} subcategory(ies) that will also be deleted.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCategory}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Period Dialog */}
      <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPeriod ? 'Edit Evaluation Period' : 'Create Evaluation Period'}</DialogTitle>
            <DialogDescription>
              Set the timeframe for feedback collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="periodName">Period Name</Label>
              <Input
                id="periodName"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
                placeholder="e.g., Midterm Evaluation"
                className="border border-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStartDate">Start Date</Label>
                <Input
                  id="periodStartDate"
                  type="date"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  className="border border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEndDate">End Date</Label>
                <Input
                  id="periodEndDate"
                  type="date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                  className="border border-gray-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="periodActive"
                checked={periodActive}
                onCheckedChange={setPeriodActive}
              />
              <Label htmlFor="periodActive">Activate immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePeriod} disabled={savingPeriod} className="bg-green-500 hover:bg-green-600">
              {savingPeriod && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPeriod ? 'Update' : 'Create'} Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

