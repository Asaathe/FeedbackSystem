import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { Settings, Save, RefreshCw, GraduationCap, Building2 } from "lucide-react";

interface SystemSettingsProps {
  onNavigate?: (page: string) => void;
}

interface DepartmentSettings {
  semester: string;
  academic_year: string;
}

interface AllSettings {
  college: DepartmentSettings;
  seniorHigh: DepartmentSettings;
}

const semesterOptions = [
  { value: "1st", label: "1st Semester" },
  { value: "2nd", label: "2nd Semester" },
  { value: "Summer", label: "Summer" },
];

export function SystemSettings({ onNavigate }: SystemSettingsProps = {}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AllSettings>({
    college: { semester: "1st", academic_year: "2025-2026" },
    seniorHigh: { semester: "1st", academic_year: "2025-2026" },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/settings/current-semester", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        setSettings({
          college: {
            semester: data.data.college?.semester || "1st",
            academic_year: data.data.college?.academic_year || "2025-2026",
          },
          seniorHigh: {
            semester: data.data.seniorHigh?.semester || "1st",
            academic_year: data.data.seniorHigh?.academic_year || "2025-2026",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (department: "college" | "seniorHigh") => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const deptKey = department === "college" ? "College" : "Senior High";
      
      const settingsToUpdate = [
        { key: "current_semester", value: settings[department].semester, department: deptKey },
        { key: "current_academic_year", value: settings[department].academic_year, department: deptKey },
      ];

      const response = await fetch("http://localhost:5000/api/settings/bulk/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`${deptKey} settings updated successfully`);
      } else {
        toast.error(data.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (department: "college" | "seniorHigh", field: "semester" | "academic_year", value: string) => {
    setSettings((prev) => ({
      ...prev,
      [department]: {
        ...prev[department],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold">System Settings</h2>
            <p className="text-gray-600 mt-1">
              Configure department-specific settings for the system
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="college" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="college" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            College
          </TabsTrigger>
          <TabsTrigger value="seniorHigh" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Senior High
          </TabsTrigger>
        </TabsList>

        {/* College Settings */}
        <TabsContent value="college">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-green-600" />
                College Department Settings
              </CardTitle>
              <CardDescription>
                Configure the current semester and academic year for College
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Semester */}
                <div className="space-y-2">
                  <Label htmlFor="college-semester">Current Semester</Label>
                  <Select
                    value={settings.college.semester}
                    onValueChange={(value) => handleChange("college", "semester", value)}
                  >
                    <SelectTrigger id="college-semester">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <Label htmlFor="college-year">Academic Year</Label>
                  <Input
                    id="college-year"
                    type="text"
                    placeholder="2025-2026"
                    value={settings.college.academic_year}
                    onChange={(e) => handleChange("college", "academic_year", e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Format: YYYY-YYYY (e.g., 2025-2026)
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => handleSave("college")}
                  disabled={saving}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save College Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Senior High Settings */}
        <TabsContent value="seniorHigh">
          <Card className="border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Senior High Department Settings
              </CardTitle>
              <CardDescription>
                Configure the current semester and academic year for Senior High
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Semester */}
                <div className="space-y-2">
                  <Label htmlFor="sh-semester">Current Semester</Label>
                  <Select
                    value={settings.seniorHigh.semester}
                    onValueChange={(value) => handleChange("seniorHigh", "semester", value)}
                  >
                    <SelectTrigger id="sh-semester">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <Label htmlFor="sh-year">Academic Year</Label>
                  <Input
                    id="sh-year"
                    type="text"
                    placeholder="2025-2026"
                    value={settings.seniorHigh.academic_year}
                    onChange={(e) => handleChange("seniorHigh", "academic_year", e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Format: YYYY-YYYY (e.g., 2025-2026)
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => handleSave("seniorHigh")}
                  disabled={saving}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Senior High Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Reference Card */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Current College Settings:</p>
              <p className="text-gray-600">
                {settings.college.semester} Semester, SY {settings.college.academic_year}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Current Senior High Settings:</p>
              <p className="text-gray-600">
                {settings.seniorHigh.semester} Semester, SY {settings.seniorHigh.academic_year}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SystemSettings;
