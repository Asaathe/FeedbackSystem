import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  getFilteredUsers,
  getAlumniCompanies,
  getEmployerCompanies,
  assignFormToUsers,
  deployForm,
} from "../../../services/formManagementService";
import { Recipient, Instructor, FormFilters } from "../types/form";
import { formatUserDetails, filterStudentsByDepartment } from "../utils/formValidation";

// Course Year Section options from signup page (Students)
const COURSE_YEAR_SECTIONS = [
  "All Students",
  // Grade 11
  "ABM11-LOVE",
  "ABM11-HOPE",
  "ABM11-FAITH",
  "HUMSS11-LOVE",
  "HUMSS11-HOPE",
  "HUMSS11-FAITH",
  "HUMSS11-JOY",
  "HUMSS11-GENEROSITY",
  "HUMSS11-HUMILITY",
  "HUMSS11-INTEGRITY",
  "HUMSS11-WISDOM",
  "STEM11-HOPE",
  "STEM11-FAITH",
  "STEM11-JOY",
  "STEM11-GENEROSITY",
  "ICT11-LOVE",
  "ICT11-HOPE",
  // Grade 12
  "ABM12-LOVE",
  "ABM12-HOPE",
  "ABM12-FAITH",
  "HUMSS12-LOVE",
  "HUMSS12-HOPE",
  "HUMSS12-FAITH",
  "HUMSS12-JOY",
  "HUMSS12-GENEROSITY",
  "HUMSS12-HUMILITY",
  "STEM12-LOVE",
  "STEM12-HOPE",
  "STEM12-FAITH",
  "STEM12-JOY",
  "STEM12-GENEROSITY",
  "ICT12-LOVE",
  "ICT12-HOPE",
  // College - BSIT
  "BSIT-1A",
  "BSIT-1B",
  "BSIT-1C",
  "BSIT-2A",
  "BSIT-2B",
  "BSIT-2C",
  "BSIT-3A",
  "BSIT-3B",
  "BSIT-3C",
  "BSIT-4A",
  "BSIT-4B",
  "BSIT-4C",
  // College - BSBA
  "BSBA-1A",
  "BSBA-2A",
  "BSBA-3A",
  "BSBA-4A",
  // College - BSCS
  "BSCS-1A",
  "BSCS-2A",
  "BSCS-3A",
  "BSCS-4A",
  // College - BSEN
  "BSEN-1A",
  "BSEN-2A",
  "BSEN-3A",
  "BSEN-4A",
  // College - BSOA
  "BSOA-1A",
  "BSOA-2A",
  "BSOA-3A",
  "BSOA-4A",
  // College - BSAIS
  "BSAIS-1A",
  "BSAIS-2A",
  "BSAIS-3A",
  "BSAIS-4A",
  // College - BTVTEd
  "BTVTEd-1A",
  "BTVTEd-2A",
  "BTVTEd-3A",
  "BTVTEd-4A",
];

const INSTRUCTOR_DEPARTMENTS = [
  "Senior High Department",
  "College Department",
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
      recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipients, searchTerm]);

  // Filtered instructors (memoized)
  const filteredInstructors = useMemo(() => {
    return instructors.filter((instructor) =>
      instructor.name.toLowerCase().includes(instructorSearchTerm.toLowerCase())
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

  // Load instructors for sharing responses
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const result = await getFilteredUsers({ role: "instructor" });
        if (result.success && result.users) {
          setInstructors(
            result.users.map((user) => ({
              id: user.id,
              name: user.name,
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
            name: user.name,
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
      if (selectedDepartment && selectedCourseYearSection) {
        fetchRecipients(
          selectedAudienceType,
          selectedCourseYearSection,
          selectedDepartment
        );
      } else {
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
  }, [
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
    async (formId: string, targetAudience: string) => {
      const selectedUserIds = Array.from(selectedRecipients).map((id) =>
        parseInt(id.toString())
      );
      const result = await assignFormToUsers(
        formId,
        selectedUserIds,
        targetAudience
      );
      return result;
    },
    [selectedRecipients]
  );

  // Deploy form to group
  const deployToGroup = useCallback(
    async (
      formId: string,
      targetAudience: string,
      startDate?: string,
      endDate?: string
    ) => {
      const result = await deployForm(formId, {
        startDate:
          startDate || new Date().toISOString().split("T")[0],
        endDate:
          endDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        targetFilters: {
          roles:
            targetAudience === "All Users"
              ? ["all"]
              : [targetAudience.toLowerCase().replace(" ", "")],
          target_audience: targetAudience,
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
    selectAllRecipients,
    searchTerm,
    setSearchTerm,
    alumniCompanies,
    employerCompanies,
    instructors,
    filteredInstructors,
    selectedInstructors,
    instructorSearchTerm,
    setInstructorSearchTerm,
    // Constants
    courseYearSections: COURSE_YEAR_SECTIONS,
    instructorDepartments: INSTRUCTOR_DEPARTMENTS,
    // Actions
    toggleRecipient,
    toggleAllRecipients,
    toggleInstructor,
    assignToUsers,
    deployToGroup,
  };
}
