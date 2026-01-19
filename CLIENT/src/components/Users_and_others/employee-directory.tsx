import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Search, Filter, Users } from "lucide-react";

// Alumni employees working at this company
const alumniEmployees = [
  {
    id: 1,
    name: 'John Smith',
    graduationYear: '2022',
    department: 'Computer Science',
    position: 'Software Engineer',
    email: 'john.smith@company.com',
    hireDate: '2022-06-15',
  },
  {
    id: 2,
    name: 'Maria Garcia',
    graduationYear: '2021',
    department: 'Business Administration',
    position: 'Marketing Manager',
    email: 'maria.garcia@company.com',
    hireDate: '2021-08-01',
  },
  {
    id: 3,
    name: 'James Wilson',
    graduationYear: '2023',
    department: 'Engineering',
    position: 'Junior Engineer',
    email: 'james.wilson@company.com',
    hireDate: '2023-07-10',
  },
  {
    id: 4,
    name: 'Sarah Chen',
    graduationYear: '2020',
    department: 'Computer Science',
    position: 'Senior Developer',
    email: 'sarah.chen@company.com',
    hireDate: '2020-09-01',
  },
  {
    id: 5,
    name: 'Michael Brown',
    graduationYear: '2022',
    department: 'Business Administration',
    position: 'Sales Associate',
    email: 'michael.brown@company.com',
    hireDate: '2022-05-20',
  },
  {
    id: 6,
    name: 'Emily Davis',
    graduationYear: '2021',
    department: 'Education',
    position: 'Training Coordinator',
    email: 'emily.davis@company.com',
    hireDate: '2021-10-15',
  },
  {
    id: 7,
    name: 'David Martinez',
    graduationYear: '2023',
    department: 'Computer Science',
    position: 'Data Analyst',
    email: 'david.martinez@company.com',
    hireDate: '2023-06-01',
  },
  {
    id: 8,
    name: 'Lisa Anderson',
    graduationYear: '2021',
    department: 'Engineering',
    position: 'Project Manager',
    email: 'lisa.anderson@company.com',
    hireDate: '2021-11-01',
  },
];

interface EmployeeDirectoryProps {
  onViewEmployee?: (id: string) => void;
}

export function EmployeeDirectory({ onViewEmployee }: EmployeeDirectoryProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  const filteredEmployees = alumniEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter;
    const matchesYear = yearFilter === 'all' || emp.graduationYear === yearFilter;
    return matchesSearch && matchesDepartment && matchesYear;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-lime-500 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl">Our Alumni Employees</h2>
            <p className="text-gray-600 mt-1">University graduates working at your company</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, department, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Business Administration">Business Admin</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Graduation Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2023">Class of 2023</SelectItem>
                <SelectItem value="2022">Class of 2022</SelectItem>
                <SelectItem value="2021">Class of 2021</SelectItem>
                <SelectItem value="2020">Class of 2020</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredEmployees.length} of {alumniEmployees.length} alumni employees
      </div>

      {/* Employee List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="border-green-100 hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-lime-500 flex items-center justify-center text-white flex-shrink-0">
                  <span className="text-lg">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg mb-1">{employee.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{employee.position}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        {employee.department}
                      </Badge>
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        Class of {employee.graduationYear}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📧 {employee.email}</p>
                      <p>📅 Hired: {employee.hireDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No alumni employees found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
