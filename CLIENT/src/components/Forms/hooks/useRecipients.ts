import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  getFilteredUsers,
  getAlumniCompanies,
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
  const [alumniCompanies, setAlumniCompanies] = useState<string[]>([]);
  const [employerCompanies, setEmployerCompanies] = useState<string[]>([]);
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
    return instructors.filter((instructor) =>
      (instructor.fullName || '').toLowerCase().includes((instructorSearchTerm || '').toLowerCase())
    );
  }, [instructors, instructorSearchTerm]);

  // Load companies for alumni and employers
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const alumniResult = await getAlumniCompanies();
        if (alumniResult.success) {
          setAlumniCompanies(alumniResult.companies || []);
        }
        const employerResult = await getEmployerCompanies();
        if (employerResult.success) {
          setEmployerCompanies(employerResult.companies || []);
        }
      } catch (error) {
        toast.error("Failed to load companies");
      }
    };
    loadCompanies();
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
          setInstructors(
            result.users.map((user) => ({
              id: user.id,
              fullName: user.fullName || user.name,
              department: user.department || "No department",
            }))
          );
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
          if (courseYearSection) {
            filters.department = courseYearSection;
          }
        } else if (audienceType === "Alumni") {
          if (courseYearSection) {
            filters.company = courseYearSection;
          }
        }

        const result = await getFilteredUsers(filters);
        if (result.success && result.users && result.users.length > 0) {
          let formattedUsers = result.users.map((user) => ({
            id: user.id,
            fullName: user.fullName || user.name,
            details: formatUserDetails(user),
          }));

          // Filter students by department if "All Students" is selected with a department
          if (
            audienceType === "Students" &&
            courseYearSection === "All Students" &&
            department
          ) {
            formattedUsers = filterStudentsByDepartment(
              formattedUsers,
              department
            );
          }

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
    filteredRecipients,
    selectedRecipients,
    setSelectedRecipients,
    selectAllRecipients,
    searchTerm,
    setSearchTerm,
    alumniCompanies,
    employerCompanies,
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
    assignToUsers,
    deployToGroup,
  };
}
