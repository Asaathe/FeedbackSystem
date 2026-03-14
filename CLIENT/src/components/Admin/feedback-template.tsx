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
  GripVertical, 
  Calendar,
  Clock,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";

interface Category {
  id: number;
  category_name: string;
  description: string;
  display_order: number;
  feedback_type?: 'subject' | 'instructor' | 'general';
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  
  // Category form state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryActive, setCategoryActive] = useState(true);
  const [categoryFeedbackType, setCategoryFeedbackType] = useState<'subject' | 'instructor'>('subject');
  const [savingCategory, setSavingCategory] = useState(false);
  
  // Period form state
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<EvaluationPeriod | null>(null);
  const [periodName, setPeriodName] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState("");
  const [periodAcademicYear, setPeriodAcademicYear] = useState("");
  const [periodSemester, setPeriodSemester] = useState("");
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
        ? `http://localhost:5000/api/feedback-templates/categories?feedback_type=${type}`
        : 'http://localhost:5000/api/feedback-templates/categories';
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
      const response = await fetch('http://localhost:5000/api/feedback-templates/periods', {
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

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryActive(true);
    setCategoryFeedbackType(categoryType);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.category_name);
    setCategoryDescription(category.description || "");
    setCategoryActive(category.is_active);
    setCategoryFeedbackType(category.feedback_type as 'subject' | 'instructor' || 'subject');
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
        ? `http://localhost:5000/api/feedback-templates/categories/${editingCategory.id}`
        : 'http://localhost:5000/api/feedback-templates/categories';
      
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
          feedback_type: categoryFeedbackType
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(editingCategory ? "Category updated successfully" : "Category added successfully");
        setCategoryDialogOpen(false);
        fetchCategories();
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
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/feedback-templates/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Category deleted successfully");
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleAddPeriod = () => {
    setEditingPeriod(null);
    setPeriodName("");
    setPeriodStartDate("");
    setPeriodEndDate("");
    setPeriodAcademicYear("");
    setPeriodSemester("");
    setPeriodActive(false);
    setPeriodDialogOpen(true);
  };

  const handleEditPeriod = (period: EvaluationPeriod) => {
    setEditingPeriod(period);
    setPeriodName(period.name);
    setPeriodStartDate(period.start_date);
    setPeriodEndDate(period.end_date);
    setPeriodAcademicYear(period.academic_year || "");
    setPeriodSemester(period.semester || "");
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
        ? `http://localhost:5000/api/feedback-templates/periods/${editingPeriod.id}`
        : 'http://localhost:5000/api/feedback-templates/periods';
      
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
          academic_year: periodAcademicYear,
          semester: periodSemester,
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
      const response = await fetch(`http://localhost:5000/api/feedback-templates/periods/${id}`, {
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
      const response = await fetch(`http://localhost:5000/api/feedback-templates/periods/${id}/toggle`, {
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading feedback template...</p>
        </div>
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
          <Star className="w-4 h-4 mr-2" />
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
                Manage the star-rating categories used for subject and instructor feedback
              </CardDescription>
            </div>
            <Button onClick={handleAddCategory} className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent>
            {/* Subject/Instructor Category Tabs */}
            <div className="flex gap-2 mb-4">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.category_name}</TableCell>
                    <TableCell className="text-gray-600">{category.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No categories found. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Semester</TableHead>
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
                        <TableCell>{period.academic_year || '-'}</TableCell>
                        <TableCell>{period.semester || '-'}</TableCell>
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
                              title={period.is_active ? 'Deactivate' : 'Activate'}
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
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              Create a new rating category for feedback forms
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Clarity of Teaching"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Brief description of this category"
              />
            </div>
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
              {editingCategory ? 'Update' : 'Add'} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Period Dialog */}
      <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
        <DialogContent className="max-w-lg sm:max-w-lg">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEndDate">End Date</Label>
                <Input
                  id="periodEndDate"
                  type="date"
                  value={periodEndDate}
                  onChange={(e) => setPeriodEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodAcademicYear">Academic Year</Label>
                <Input
                  id="periodAcademicYear"
                  value={periodAcademicYear}
                  onChange={(e) => setPeriodAcademicYear(e.target.value)}
                  placeholder="e.g., 2025-2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodSemester">Semester</Label>
                <Input
                  id="periodSemester"
                  value={periodSemester}
                  onChange={(e) => setPeriodSemester(e.target.value)}
                  placeholder="e.g., 1st Semester"
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
