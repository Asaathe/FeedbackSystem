import React, { useState, useEffect } from "react";
import { FormContainer } from "../Forms/form-container";
import { InputField } from "../Reusable_components/input-field";
import { SelectField } from "../Reusable_components/select-field";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../Reusable_components/alert-dialog";

interface SignupPageProps {
  onSignupSuccess: (role: string) => void;
  onBackToLogin: () => void;
}

// API URL configuration - uses Vite proxy in dev, direct URL in production
export function SignupPage({
  onSignupSuccess,
  onBackToLogin,
}: SignupPageProps) {
  // Use Vite's import.meta.env.DEV to detect development mode
  const API_BASE_URL = import.meta.env.DEV ? "http://localhost:5000/api" : "/api";
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    student_id: "",
    course_year_section: "",
    instructor_id: "",
    department: "",
    company_name: "",
    industry: "",
    degree: "",
    alumni_company_name: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Name formatting function to enforce proper capitalization
  const formatName = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleChange = (field: string, value: string) => {
    // Apply name formatting for full name field
    if (field === "name") {
      const formattedName = formatName(value);
      setFormData((prev) => ({ ...prev, [field]: formattedName }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Calculate password strength when password changes
    if (field === "password") {
      const strength = getPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation
  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    return errors;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Full name must be at least 2 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!isValidEmail(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.role) {
      newErrors.role = "Please select a role.";
    }

    // Role-specific validation
    if (formData.role === "student") {
      if (!formData.student_id.trim()) {
        newErrors.student_id = "Student ID is required.";
      } else if (!/^\d{5}$/.test(formData.student_id.trim())) {
        newErrors.student_id = "Student ID must be exactly 5 digits.";
      }
      if (!formData.course_year_section.trim()) {
        newErrors.course_year_section = "Course Year Section is required.";
      }
    } else if (formData.role === "instructor") {
      if (!formData.instructor_id.trim()) {
        newErrors.instructor_id = "Instructor ID is required.";
      }
      if (!formData.department.trim()) {
        newErrors.department = "Department is required.";
      }
    } else if (formData.role === "employer") {
      if (!formData.company_name.trim()) {
        newErrors.company_name = "Company name is required.";
      }
      if (!formData.industry.trim()) {
        newErrors.industry = "Industry is required.";
      }
    } else if (formData.role === "alumni") {
      if (!formData.degree.trim()) {
        newErrors.degree = "Degree is required.";
      }
      if (!formData.alumni_company_name.trim()) {
        newErrors.alumni_company_name = "Company name is required.";
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors[0]; // Show first error
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          fullName: formData.name.trim(),
          role: formData.role,
          student_id: formData.student_id.trim(),
          course_year_section: formData.course_year_section.trim(),
          instructor_id: formData.instructor_id.trim(),
          department: formData.department.trim(),
          company_name: formData.company_name.trim(),
          industry: formData.industry.trim(),
          degree: formData.degree.trim(),
          alumni_company_name: formData.alumni_company_name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.message || data.errors?.[0]?.msg || "Registration failed";
        setErrors({ general: errorMessage });
        toast.error("Registration failed", { description: errorMessage });
        return;
      }

      if (data.token && data.user) {
        // Store token securely in sessionStorage
        sessionStorage.setItem("authToken", data.token);
        sessionStorage.setItem("userData", JSON.stringify(data.user));
        // Store expiration time
        const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
        sessionStorage.setItem("tokenExpiration", expirationTime.toString());

        setSuccessMessage(
          "Account created successfully! Please wait for admin approval before logging in."
        );
        toast.success("Account created successfully!", {
          description: "Please wait for admin approval before logging in.",
        });
        setShowSuccessDialog(true);

        // Don't redirect immediately - user needs admin approval
        // setTimeout(() => {
        //   onSignupSuccess(data.user.role);
        // }, 2000);
      } else {
        setErrors({ general: "Registration failed - no token received" });
        toast.error("Registration failed", {
          description: "Please try again later.",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ general: "Network error. Please try again." });
      toast.error("Registration failed", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  return (
    <>
    <FormContainer
      title="Create Account"
      subtitle="Join the FeedB-ACTS Community"
      buttonText="Create Account"
      onSubmit={handleSubmit}
      footerText="Already have an account?"
      footerLink="Sign In"
      onFooterClick={onBackToLogin}
      isLoading={isLoading}
    >
      {successMessage && (
        <p className="text-green-600 text-center mb-4">{successMessage}</p>
      )}

      <div className="flex flex-col md:flex-row md:gap-4">
        <InputField
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          label="Full Name"
          type="text"
          placeholder="Enter your name"
          error={errors.name}
        />
        <InputField
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          label="Email"
          type="email"
          placeholder="Enter your email"
          error={errors.email}
        />
      </div>

      <SelectField
        label="Role"
        value={formData.role}
        onChange={(value) => handleChange("role", value)}
        options={[
          { value: "student", label: "Student" },
          { value: "instructor", label: "Instructor" },

          { value: "alumni", label: "Alumni" },
          { value: "employer", label: "Employer" },
        ]}
        placeholder="Select a role"
        error={errors.role}
      />

      {formData.role === "student" && (
        <div className="flex flex-col md:flex-row md:gap-4">
          <InputField
            value={formData.student_id}
            onChange={(e) => handleChange("student_id", e.target.value)}
            label="Student ID"
            type="text"
            placeholder="Enter your student ID"
            error={errors.student_id}
          />
          <SelectField
            label="Course-Year and Section"
            value={formData.course_year_section}
            onChange={(value) => handleChange("course_year_section", value)}
            options={[
              // Grade 11
              { value: "ABM11-LOVE", label: "ABM11-LOVE" },
              { value: "ABM11-HOPE", label: "ABM11-HOPE" },
              { value: "ABM11-FAITH", label: "ABM11-FAITH" },
              { value: "HUMSS11-LOVE", label: "HUMSS11-LOVE" },
              { value: "HUMSS11-HOPE", label: "HUMSS11-HOPE" },
              { value: "HUMSS11-FAITH", label: "HUMSS11-FAITH" },
              { value: "HUMSS11-JOY", label: "HUMSS11-JOY" },
              { value: "HUMSS11-GENEROSITY", label: "HUMSS11-GENEROSITY" },
              { value: "HUMSS11-HUMILITY", label: "HUMSS11-HUMILITY" },
              { value: "HUMSS11-INTEGRITY", label: "HUMSS11-INTEGRITY" },
              { value: "HUMSS11-WISDOM", label: "HUMSS11-WISDOM" },
              { value: "STEM11-HOPE", label: "STEM11-HOPE" },
              { value: "STEM11-FAITH", label: "STEM11-FAITH" },
              { value: "STEM11-JOY", label: "STEM11-JOY" },
              { value: "STEM11-GENEROSITY", label: "STEM11-GENEROSITY" },
              { value: "ICT11-LOVE", label: "ICT11-LOVE" },
              { value: "ICT11-HOPE", label: "ICT11-HOPE" },
              // Grade 12
              { value: "ABM12-LOVE", label: "ABM12-LOVE" },
              { value: "ABM12-HOPE", label: "ABM12-HOPE" },
              { value: "ABM12-FAITH", label: "ABM12-FAITH" },
              { value: "HUMSS12-LOVE", label: "HUMSS12-LOVE" },
              { value: "HUMSS12-HOPE", label: "HUMSS12-HOPE" },
              { value: "HUMSS12-FAITH", label: "HUMSS12-FAITH" },
              { value: "HUMSS12-JOY", label: "HUMSS12-JOY" },
              { value: "HUMSS12-GENEROSITY", label: "HUMSS12-GENEROSITY" },
              { value: "HUMSS12-HUMILITY", label: "HUMSS12-HUMILITY" },
              { value: "STEM12-LOVE", label: "STEM12-LOVE" },
              { value: "STEM12-HOPE", label: "STEM12-HOPE" },
              { value: "STEM12-FAITH", label: "STEM12-FAITH" },
              { value: "STEM12-JOY", label: "STEM12-JOY" },
              { value: "STEM12-GENEROSITY", label: "STEM12-GENEROSITY" },
              { value: "ICT12-LOVE", label: "ICT12-LOVE" },
              { value: "ICT12-HOPE", label: "ICT12-HOPE" },
              // College - BSIT
              { value: "BSIT-1A", label: "BSIT-1A" },
              { value: "BSIT-1B", label: "BSIT-1B" },
              { value: "BSIT-1C", label: "BSIT-1C" },
              { value: "BSIT-2A", label: "BSIT-2A" },
              { value: "BSIT-2B", label: "BSIT-2B" },
              { value: "BSIT-2C", label: "BSIT-2C" },
              { value: "BSIT-3A", label: "BSIT-3A" },
              { value: "BSIT-3B", label: "BSIT-3B" },
              { value: "BSIT-3C", label: "BSIT-3C" },
              { value: "BSIT-4A", label: "BSIT-4A" },
              { value: "BSIT-4B", label: "BSIT-4B" },
              { value: "BSIT-4C", label: "BSIT-4C" },
              // College - BSBA
              { value: "BSBA-1A", label: "BSBA-1A" },
              { value: "BSBA-2A", label: "BSBA-2A" },
              { value: "BSBA-3A", label: "BSBA-3A" },
              { value: "BSBA-4A", label: "BSBA-4A" },
              // College - BSCS
              { value: "BSCS-1A", label: "BSCS-1A" },
              { value: "BSCS-2A", label: "BSCS-2A" },
              { value: "BSCS-3A", label: "BSCS-3A" },
              { value: "BSCS-4A", label: "BSCS-4A" },
              // College - BSEN
              { value: "BSEN-1A", label: "BSEN-1A" },
              { value: "BSEN-2A", label: "BSEN-2A" },
              { value: "BSEN-3A", label: "BSEN-3A" },
              { value: "BSEN-4A", label: "BSEN-4A" },
              // College - BSOA
              { value: "BSOA-1A", label: "BSOA-1A" },
              { value: "BSOA-2A", label: "BSOA-2A" },
              { value: "BSOA-3A", label: "BSOA-3A" },
              { value: "BSOA-4A", label: "BSOA-4A" },
              // College - BSAIS
              { value: "BSAIS-1A", label: "BSAIS-1A" },
              { value: "BSAIS-2A", label: "BSAIS-2A" },
              { value: "BSAIS-3A", label: "BSAIS-3A" },
              { value: "BSAIS-4A", label: "BSAIS-4A" },
              // College - BTVTEd
              { value: "BTVTEd-1A", label: "BTVTEd-1A" },
              { value: "BTVTEd-2A", label: "BTVTEd-2A" },
              { value: "BTVTEd-3A", label: "BTVTEd-3A" },
              { value: "BTVTEd-4A", label: "BTVTEd-4A" },
            ]}
            placeholder="Select your course-year and section"
            error={errors.course_year_section}
          />
        </div>
      )}

      {formData.role === "instructor" && (
        <div className="flex flex-col md:flex-row md:gap-4">
          <InputField
            value={formData.instructor_id}
            onChange={(e) => handleChange("instructor_id", e.target.value)}
            label="Instructor ID"
            type="text"
            placeholder="Enter your instructor ID"
            error={errors.instructor_id}
          />
          <SelectField
            label="Department"
            value={formData.department}
            onChange={(value) => handleChange("department", value)}
            options={[
              { value: "College Department", label: "College Department" },
              { value: "Senior High Department", label: "Senior High Department" },
              { value: "Both", label: "Both" },
            ]}
            placeholder="Select your department"
            error={errors.department}
          />
        </div>
      )}

      {formData.role === "employer" && (
        <div className="flex flex-col md:flex-row md:gap-4">
          <InputField
            value={formData.company_name}
            onChange={(e) => handleChange("company_name", e.target.value)}
            label="Company Name"
            type="text"
            placeholder="Enter your company name"
            error={errors.company_name}
          />
          <InputField
            value={formData.industry}
            onChange={(e) => handleChange("industry", e.target.value)}
            label="Industry"
            type="text"
            placeholder="Enter your industry"
            error={errors.industry}
          />
        </div>
      )}

      {formData.role === "alumni" && (
        <div className="flex flex-col md:flex-row md:gap-4">
          <InputField
            value={formData.degree}
            onChange={(e) => handleChange("degree", e.target.value)}
            label="Degree"
            type="text"
            placeholder="Enter your degree"
            error={errors.degree}
          />
          <InputField
            value={formData.alumni_company_name}
            onChange={(e) => handleChange("alumni_company_name", e.target.value)}
            label="Company Name"
            type="text"
            placeholder="Enter your company name"
            error={errors.alumni_company_name}
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:gap-4">
        <div className="flex-1">
          <InputField
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password}
            showPassword={showPassword}
            onTogglePassword={togglePasswordVisibility}
          />

          {/* Password strength indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      level <= passwordStrength
                        ? strengthColors[passwordStrength - 1] || "bg-gray-300"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Password strength:{" "}
                {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "Very Weak"}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                <p>Requirements:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span
                    className={
                      formData.password.length >= 8 ? "text-green-600" : ""
                    }
                  >
                    8+ chars
                  </span>
                  <span
                    className={
                      /[A-Z]/.test(formData.password) ? "text-green-600" : ""
                    }
                  >
                    Uppercase
                  </span>
                  <span
                    className={
                      /[a-z]/.test(formData.password) ? "text-green-600" : ""
                    }
                  >
                    Lowercase
                  </span>
                  <span
                    className={
                      /\d/.test(formData.password) ? "text-green-600" : ""
                    }
                  >
                    Number
                  </span>
                  <span
                    className={
                      /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                        ? "text-green-600"
                        : ""
                    }
                  >
                    Special char
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1">
          <InputField
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            label="Confirm Password"
            type="password"
            placeholder="Confirm password"
            error={errors.confirmPassword}
            showPassword={showConfirmPassword}
            onTogglePassword={toggleConfirmPasswordVisibility}
          />
          {formData.confirmPassword &&
            formData.password !== formData.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                Passwords do not match
              </p>
            )}
          {formData.confirmPassword &&
            formData.password === formData.confirmPassword && (
            <p className="text-green-500 text-xs mt-1">Passwords match</p>
          )}
        </div>
      </div>

      {errors.general && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {errors.general}
        </div>
      )}


    </FormContainer>

    <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Account Created Successfully!</AlertDialogTitle>
          <AlertDialogDescription>
            Your account has been created. Please wait for admin approval before logging in. 
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onBackToLogin}>Back to Login</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
