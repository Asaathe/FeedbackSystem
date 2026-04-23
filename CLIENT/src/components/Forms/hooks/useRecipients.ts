import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  getFilteredUsers,
  getAlumniDegrees,
  getAlumniGraduationYears,
  getAlumniEmploymentCompanies,
  getSupervisorsByCompany,
  getAlumniByCompany,
  getEmployerCompanies,
  getActiveCourseSections,
  getDepartmentsFromPrograms,
  assignFormToUsers,
  deployForm,
} from "../../../services/formManagementService";
import { Recipient, Instructor, FormFilters } from "../types/form";
import { formatUserDetails, filterStudentsByDepartment } from "../utils/formValidation";

const INSTRUCTOR_DEPARTMENTS = [
  "College",
  "Senior High",
  "Both",
];

export function useRecipients() {
  // Audience Selection State
  const [selectedAudienceType, setSelectedAudienceType] =
    useState<string>("All Users");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedCourseYearSection, setSelectedCourseYearSection] =
    useState<string>("");

  // Recipients management
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<number>>(
    new Set()
  );
  const [selectAllRecipients, setSelectAllRecipients] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Dynamic audience options
  const [alumniDegrees, setAlumniDegrees] = useState<string[]>([]);
  const [alumniGraduationYears, setAlumniGraduationYears] = useState<string[]>([]);
  const [employerCompanies, setEmployerCompanies] = useState<string[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState<any[]>([]);
  const [courseYearSections, setCourseYearSections] = useState<string[]>(["All Students"]);
  const [loadingCourseSections, setLoadingCourseSections] = useState<boolean>(false);
  // Departments from course_management table for student filtering
  const [studentDepartments, setStudentDepartments] = useState<string[]>([]);
  const [loadingStudentDepartments, setLoadingStudentDepartments] = useState<boolean>(false);

  // Instructors for sharing responses
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructors, setSelectedInstructors] = useState<Set<number>>(
    new Set()
  );
  const [instructorSearchTerm, setInstructorSearchTerm] = useState<string>("");

  // Filtered recipients (memoized)
  const filteredRecipients = useMemo(() => {
    if (searchTerm.trim() === "") {
      return recipients;
    }
    return recipients.filter((recipient) =>
      (recipient.fullName || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );
  }, [recipients, searchTerm]);

  // Filtered instructors (memoized)
  const filteredInstructors = useMemo(() => {
    let filtered = instructors.filter((instructor) =>
      (instructor.fullName || '').toLowerCase().includes((instructorSearchTerm || '').toLowerCase())
    );

    // If audience is Instructors and department is selected, filter by department
    // For instructors, use selectedCourseYearSection as department filter
    const departmentToFilter = selectedAudienceType === "Instructors" ? selectedCourseYearSection : selectedDepartment;
    if (selectedAudienceType === "Instructors" && departmentToFilter) {
      const deptLower = departmentToFilter.toLowerCase().trim();
      filtered = filtered.filter(instructor => {
        const instDept = (instructor.department || '').toLowerCase().trim();
        if (deptLower === "both") {
          return instDept === "both";
        } else if (deptLower === "college") {
          return instDept === "college" || instDept === "both";
        } else if (deptLower.includes("senior high")) {
          return instDept.includes("senior high") || instDept === "both";
        } else {
          return instDept === deptLower || instDept === "both";
        }
      });
    }

    return filtered;
  }, [instructors, instructorSearchTerm, selectedAudienceType, selectedDepartment, selectedCourseYearSection]);

  // Load degrees and graduation years for alumni, and companies from alumni employment for employers
  useEffect(() => {
    const loadAlumniFilters = async () => {
      try {
        const degreesResult = await getAlumniDegrees();
        if (degreesResult.success) {
          setAlumniDegrees(degreesResult.degrees || []);
        }
        const yearsResult = await getAlumniGraduationYears();
        if (yearsResult.success) {
          setAlumniGraduationYears(yearsResult.graduationYears || []);
        }
        // Use alumni_employment companies for employer feedback
        const employerResult = await getAlumniEmploymentCompanies();
        if (employerResult.success) {
          setEmployerCompanies(employerResult.companies || []);
        }
      } catch (error) {
        toast.error("Failed to load alumni filters");
      }
    };
    loadAlumniFilters();
  }, []);

  // Load supervisors when employer company is selected
  const loadSupervisors = useCallback(async (company: string) => {
    try {
      const result = await getSupervisorsByCompany(company);
      if (result.success) {
        setSupervisors(result.supervisors || []);
      }
    } catch (error) {
      toast.error("Failed to load supervisors");
    }
  }, []);

  // Load course sections from course_management table
  useEffect(() => {
    const loadCourseSections = async () => {
      setLoadingCourseSections(true);
      try {
        // Pass department filter if selected
        const result = await getActiveCourseSections(selectedDepartment || undefined);
        if (result.success && result.sections && result.sections.length > 0) {
          // Prepend "All Students" to the list
          setCourseYearSections(["All Students", ...result.sections]);
        } else {
          // Fallback to empty array with "All Students" if API fails
          setCourseYearSections(["All Students"]);
        }
      } catch (error) {
        console.error("Failed to load course sections:", error);
        setCourseYearSections(["All Students"]);
      } finally {
        setLoadingCourseSections(false);
      }
    };
    loadCourseSections();
  }, [selectedDepartment]);

  // Load departments from course_management table
  useEffect(() => {
    const loadStudentDepartments = async () => {
      setLoadingStudentDepartments(true);
      try {
        const result = await getDepartmentsFromPrograms();
        if (result.success && result.departments && result.departments.length > 0) {
          setStudentDepartments(result.departments);
        } else {
          setStudentDepartments([]);
        }
      } catch (error) {
        console.error("Failed to load student departments:", error);
        setStudentDepartments([]);
      } finally {
        setLoadingStudentDepartments(false);
      }
    };
    loadStudentDepartments();
  }, []);

  // Load instructors for sharing responses
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const result = await getFilteredUsers({ role: "instructor" });
        if (result.success && result.users) {
        const mappedInstructors = result.users.map((user) => ({
          id: user.id,
          fullName: user.fullName || user.name,
          department: user.department || "No department",
        }));
        console.log("Loaded instructors:", mappedInstructors.map(i => ({ name: i.fullName, dept: i.department })));
        setInstructors(mappedInstructors);
        }
      } catch (error) {
        toast.error("Failed to load instructors");
      }
    };
    loadInstructors();
  }, []);

  // Function to fetch recipients based on selection
  const fetchRecipients = useCallback(
    async (
      audienceType: string,
      courseYearSection: string,
      department?: string
    ) => {
      try {
        // Map audience type to the correct role format for the backend
        const roleMap: Record<string, string> = {
          Students: "student",
          Instructors: "instructor",
          Alumni: "alumni",
          "All Users": "all",
        };

        let filters: FormFilters = {
          role: roleMap[audienceType] || audienceType.toLowerCase(),
        };

        if (audienceType === "Students") {
          // Pass both department and course_section for filtering students
          if (department) {
            filters.department = department;
          }
          if (courseYearSection && courseYearSection !== "All Students") {
            filters.course_year_section = courseYearSection;
          }
        } else if (audienceType === "Instructors") {
          // For instructors, load all and filter client-side to include "Both" department
          filters.role = "instructor";
        } else if (audienceType === "Alumni") {
          // Pass degree and graduation year for filtering alumni
          if (department) {
            filters.degree = department;
          }
          if (courseYearSection) {
            filters.gradYear = courseYearSection;
          }
        } else if (audienceType === "Employers") {
          // For employers, get alumni who work at the selected company
          if (courseYearSection) {
            const alumniResult = await getAlumniByCompany(courseYearSection);
            if (alumniResult.success && alumniResult.users && alumniResult.users.length > 0) {
              const formattedUsers = alumniResult.users.map((user) => ({
                id: user.id,
                fullName: user.full_name,
                details: `${user.job_title || 'Employee'} at ${user.company_name}`,
              }));
              setRecipients(formattedUsers);
              setSelectedRecipients(new Set(formattedUsers.map((u) => u.id)));
              setSelectAllRecipients(true);
              return;
            }
          }
          // No company selected, show empty
          setRecipients([]);
          setSelectedRecipients(new Set());
          setSelectAllRecipients(true);
          return;
        }

        const result = await getFilteredUsers(filters);
        if (result.success && result.users && result.users.length > 0) {
          let filteredUsers = result.users;

          // For instructors, filter client-side to include "Both" department
          if (audienceType === "Instructors" && courseYearSection) {
            const deptLower = courseYearSection.toLowerCase().trim();
            filteredUsers = filteredUsers.filter(user => {
              const instDept = (user.department || '').toLowerCase().trim();
              if (deptLower === "both") {
                return instDept === "both";
              } else if (deptLower === "college") {
                return instDept === "college" || instDept === "both";
              } else if (deptLower.includes("senior high")) {
                return instDept.includes("senior high") || instDept === "both";
              } else {
                return instDept === deptLower || instDept === "both";
              }
            });
          }

          let formattedUsers = filteredUsers.map((user) => ({
            id: user.id,
            fullName: user.fullName || user.name,
            details: formatUserDetails(user),
          }));

          // Note: Backend already filters students by department when department is provided
          // No additional client-side filtering needed for "All Students"

          setRecipients(formattedUsers);
          setSelectedRecipients(new Set(formattedUsers.map((u) => u.id)));
          setSelectAllRecipients(true);
        } else {
          setRecipients([]);
          setSelectedRecipients(new Set());
          setSelectAllRecipients(true);
        }
      } catch (error) {
        toast.error("Failed to fetch recipients");
        setRecipients([]);
        setSelectedRecipients(new Set());
        setSelectAllRecipients(true);
      }
    },
    []
  );

  // Effect to fetch recipients when selection changes
  useEffect(() => {
    if (selectedAudienceType === "Students") {
      // Allow filtering by department only, course_section only, or both
      if (selectedDepartment || (selectedCourseYearSection && selectedCourseYearSection !== "All Students")) {
        fetchRecipients(
          selectedAudienceType,
          selectedCourseYearSection || "All Students",
          selectedDepartment
        );
      } else {
        // If nothing selected, show all students
        fetchRecipients(selectedAudienceType, "All Students", "");
      }
    } else if (selectedAudienceType === "Alumni") {
      // For alumni, filter by degree and/or graduation year
      if (selectedDepartment || selectedCourseYearSection) {
        fetchRecipients(
          selectedAudienceType,
          selectedCourseYearSection || "",
          selectedDepartment || ""
        );
      } else {
        // If nothing selected, show all alumni
        setRecipients([]);
        setSelectedRecipients(new Set());
        setSelectAllRecipients(true);
      }
    } else if (
      selectedAudienceType !== "All Users" &&
      selectedCourseYearSection
    ) {
      fetchRecipients(selectedAudienceType, selectedCourseYearSection);
    } else if (
      selectedAudienceType !== "All Users" &&
      !selectedCourseYearSection
    ) {
      setRecipients([]);
      setSelectedRecipients(new Set());
      setSelectAllRecipients(true);
    }
  },  [
    selectedAudienceType,
    selectedDepartment,
    selectedCourseYearSection,
    fetchRecipients,
  ]);

  // Toggle recipient selection
  const toggleRecipient = useCallback((id: number) => {
    setSelectedRecipients((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  // Toggle all recipients
  const toggleAllRecipients = useCallback(
    (checked: boolean) => {
      setSelectAllRecipients(checked);
      if (checked) {
        setSelectedRecipients(new Set(recipients.map((r) => r.id)));
      } else {
        setSelectedRecipients(new Set());
      }
    },
    [recipients]
  );

  // Toggle instructor selection
  const toggleInstructor = useCallback((id: number) => {
    setSelectedInstructors((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  // Toggle supervisor selection
  const toggleSupervisor = useCallback((supervisor: any) => {
    setSelectedSupervisors((prev) => {
      const exists = prev.find(s => s.id === supervisor.id);
      if (exists) {
        return prev.filter(s => s.id !== supervisor.id);
      } else {
        return [...prev, supervisor];
      }
    });
  }, []);

  // Toggle all supervisors
  const toggleAllSupervisors = useCallback((checked: boolean, allSupervisors: any[]) => {
    if (checked) {
      setSelectedSupervisors(allSupervisors);
    } else {
      setSelectedSupervisors([]);
    }
  }, []);

  // Clear selected supervisors when company changes
  const clearSelectedSupervisors = useCallback(() => {
    setSelectedSupervisors([]);
  }, []);

  // Assign form to specific users
  const assignToUsers = useCallback(
    async (
      formId: string,
      userIds: number[],
      targetAudience: string,
      startDate?: string,
      endDate?: string,
      startTime?: string,
      endTime?: string,
      department?: string,
      courseYearSection?: string
    ) => {
      const result = await assignFormToUsers(
        formId,
        userIds,
        targetAudience,
        startDate,
        endDate,
        startTime,
        endTime,
        department,
        courseYearSection
      );
      return result;
    },
    []
  );

  // Deploy form to group
  const deployToGroup = useCallback(
    async (
      formId: string,
      targetAudience: string,
      startDate?: string,
      endDate?: string,
      startTime?: string,
      endTime?: string,
      department?: string,
      courseYearSection?: string,
      company?: string
    ) => {
      console.log("[DEBUG] deployToGroup called with:", { formId, targetAudience, department, courseYearSection, company });
      
      const result = await deployForm(formId, {
        startDate:
          startDate || new Date().toISOString().split("T")[0],
        endDate:
          endDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        targetFilters: {
          roles:
            targetAudience === "All Users"
              ? ["all"]
              : [targetAudience.toLowerCase().replace(" ", "")],
          target_audience: targetAudience,
          department: department || null,
          course_year_section: courseYearSection || null,
          company: company || null,
        },
      });
      return result;
    },
    []
  );

  return {
    // State
    selectedAudienceType,
    setSelectedAudienceType,
    selectedDepartment,
    setSelectedDepartment,
    selectedCourseYearSection,
    setSelectedCourseYearSection,
    recipients,
    setRecipients,
    filteredRecipients,
    selectedRecipients,
    setSelectedRecipients,
    selectAllRecipients,
    setSelectAllRecipients,
    searchTerm,
    setSearchTerm,
    alumniDegrees,
    alumniGraduationYears,
    employerCompanies,
    supervisors,
    selectedSupervisors,
    instructors,
    filteredInstructors,
    selectedInstructors,
    setSelectedInstructors,
    instructorSearchTerm,
    setInstructorSearchTerm,
    // Constants
    courseYearSections,
    loadingCourseSections,
    instructorDepartments: INSTRUCTOR_DEPARTMENTS,
    // Departments from course_management for student filtering
    studentDepartments,
    loadingStudentDepartments,
    // Actions
    toggleRecipient,
    toggleAllRecipients,
    toggleInstructor,
    toggleSupervisor,
    toggleAllSupervisors,
    clearSelectedSupervisors,
    assignToUsers,
    deployToGroup,
    loadSupervisors,
  };
}

