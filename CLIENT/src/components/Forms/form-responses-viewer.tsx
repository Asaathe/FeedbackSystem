import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Search,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  BarChart3,
  Star,
  Mail,
} from "lucide-react";
import jsPDF from 'jspdf';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { toast } from "sonner";
import {
  getFormResponses,
  FormResponse,
  getForm,
  FormData,
} from "../../services/formManagementService";

interface FormResponsesViewerProps {
  formId: string;
  onBack?: () => void;
}

export function FormResponsesViewer({ formId, onBack }: FormResponsesViewerProps) {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<FormResponse[]>([]);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Question analytics data
  const getQuestionAnalytics = (question: any) => {
    console.log('=== getQuestionAnalytics ===');
    console.log('Question:', question);
    console.log('Responses:', responses);
    
    if (!responses.length) {
      console.log('No responses');
      return null;
    }

    const questionId = question.id;
    const questionIdStr = String(question.id);
    console.log('Question ID:', questionId, 'String:', questionIdStr);

    const questionType = question.question_type || question.type;
    console.log('Question Type:', questionType);

    if (questionType === 'rating' || questionType === 'linear-scale' || questionType === 'linear_scale') {
      // Calculate average for rating/linear scale questions
      let sum = 0;
      let count = 0;

      responses.forEach(response => {
        const answer = response.response_data[questionId] || response.response_data[questionIdStr];
        console.log('Response:', response.id, 'Answer:', answer);
        if (answer !== undefined && answer !== null && answer !== '') {
          const numAnswer = parseFloat(answer);
          if (!isNaN(numAnswer)) {
            sum += numAnswer;
            count++;
          }
        }
      });

      const average = count > 0 ? (sum / count).toFixed(2) : '0.00';
      const maxRating = questionType === 'rating' ? 5 : (question.max || 10);

      return {
        question,
        type: 'average',
        average: parseFloat(average),
        count,
        maxRating,
        totalAnswers: responses.length
      };
    } else {
      // Distribution for multiple choice, dropdown, checkboxes
      const answerCounts: Record<string, number> = {};

      responses.forEach(response => {
        console.log('Response ID:', response.id, 'response_data keys:', Object.keys(response.response_data), 'full:', JSON.stringify(response.response_data));
        const answer = response.response_data[questionId] || response.response_data[questionIdStr];
        if (answer !== undefined && answer !== null && answer !== '') {
          if (Array.isArray(answer)) {
            // For checkboxes
            answer.forEach(item => {
              answerCounts[item] = (answerCounts[item] || 0) + 1;
            });
          } else {
            // For single answers
            const key = String(answer);
            answerCounts[key] = (answerCounts[key] || 0) + 1;
          }
        }
      });

      console.log('Answer Counts:', answerCounts);
      
      const totalAnswers = responses.length;
      const chartData = Object.entries(answerCounts).map(([answer, count]) => ({
        answer,
        count,
        percentage: Math.round((count / totalAnswers) * 100)
      }));

      console.log('Chart Data:', chartData);

      return {
        question,
        type: 'distribution',
        chartData: chartData.sort((a, b) => b.count - a.count),
        totalAnswers
      };
    }
  };

  const applicableQuestions = form?.questions?.filter(q => {
    const qType = q.question_type || q.type;
    return ['multiple-choice', 'multiple_choice', 'rating', 'linear-scale', 'linear_scale', 'dropdown', 'checkbox'].includes(qType);
  }) || [];

  // Group questions by sections for analytics display
  const getQuestionsBySection = () => {
    const sections = form?.sections || [];
    
    if (!sections.length) {
      // No sections - return all applicable questions as "Uncategorized"
      return [{ sectionId: null, sectionTitle: 'Questions', questions: applicableQuestions }];
    }

    const sectionMap = new Map<string | null, { sectionId: string | null; sectionTitle: string; questions: typeof applicableQuestions }>();
    
    // Initialize with all sections
    sections.forEach(section => {
      sectionMap.set(section.id, {
        sectionId: section.id,
        sectionTitle: section.title,
        questions: []
      });
    });

    // Add uncategorized group
    sectionMap.set(null, {
      sectionId: null,
      sectionTitle: 'General Questions',
      questions: []
    });

    // Group questions
    applicableQuestions.forEach(question => {
      const sectionId = question.section_id || question.sectionId || null;
      if (sectionMap.has(sectionId)) {
        sectionMap.get(sectionId)!.questions.push(question);
      } else {
        sectionMap.get(null)!.questions.push(question);
      }
    });

    // Filter out empty sections and sort by section order
    const result = Array.from(sectionMap.values())
      .filter(group => group.questions.length > 0)
      .sort((a, b) => {
        if (a.sectionId === null) return 1;
        if (b.sectionId === null) return -1;
        const sectionA = sections.find(s => s.id === a.sectionId);
        const sectionB = sections.find(s => s.id === b.sectionId);
        return (sectionA?.order ?? 0) - (sectionB?.order ?? 0);
      });

    return result;
  };

  const questionsBySection = getQuestionsBySection();

  console.log('Form loaded:', !!form);
  console.log('Form questions:', form?.questions?.length);
  console.log('Applicable questions:', applicableQuestions.length);
  console.log('Applicable questions details:', applicableQuestions.map(q => ({id: q.id, type: q.question_type || q.type, question: q.question})));
  console.log('Responses loaded:', responses.length);
  console.log('Questions by section:', questionsBySection.map(s => ({title: s.sectionTitle, count: s.questions.length})));

  // Function to render star rating
  const renderStars = (rating: number, maxRating: number = 5) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: maxRating }, (_, index) => (
          <Star
            key={index}
            className={`w-5 h-5 ${
              index < Math.floor(rating)
                ? 'text-yellow-400 fill-yellow-400'
                : index < rating
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Load form and responses on component mount
  useEffect(() => {
    loadFormAndResponses();
  }, [formId]);

  // Filter responses based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredResponses(responses);
    } else {
      const filtered = responses.filter((response) =>
        response.respondent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        response.respondent_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        response.respondent_role?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredResponses(filtered);
    }
    setCurrentPage(1); // Reset to first page when search changes
  }, [responses, searchQuery]);

  const loadFormAndResponses = async () => {
    setLoading(true);
    try {
      // Load form details
      const formResult = await getForm(formId);
      if (formResult.success && formResult.form) {
        setForm(formResult.form);
      }

      // Load responses
      const responsesResult = await getFormResponses(formId);
      if (responsesResult.success) {
        console.log("Responses loaded:", responsesResult.responses.length);
        setResponses(responsesResult.responses);
        setFilteredResponses(responsesResult.responses);
      } else {
        console.error("Failed to load responses:", responsesResult.message);
        toast.error(responsesResult.message || "Failed to load responses");
      }
    } catch (error) {
      console.error("Error loading form responses:", error);
      toast.error("Failed to load form responses");
    } finally {
      setLoading(false);
    }
  };



  const handleViewResponse = (response: FormResponse) => {
    setSelectedResponse(response);
    setViewDialogOpen(true);
  };



  // Get all questions including text questions for analytics
  const getAllQuestionsForAnalytics = () => {
    return form?.questions || [];
  };

  // Get analytics for text questions (sample responses)
  const getTextQuestionAnalytics = (question: any) => {
    if (!responses.length) return null;

    const questionId = question.id;
    const questionIdStr = String(question.id);
    
    const textResponses: string[] = [];
    responses.forEach(response => {
      const answer = response.response_data[questionId] || response.response_data[questionIdStr];
      if (answer !== undefined && answer !== null && answer !== '') {
        textResponses.push(String(answer));
      }
    });

    if (textResponses.length === 0) return null;

    // Return sample of responses (up to 10 for token efficiency)
    const sampleResponses = textResponses.slice(0, 10);
    
    return {
      question,
      type: 'text',
      totalResponses: textResponses.length,
      sampleResponses
    };
  };

  // Generate Professional University-Style PDF Report
  const generateQuestionAnalyticsPDF = async () => {
    if (!form) return;

    const doc = new jsPDF();
    let yPosition = 30; // Start lower for professional look
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25; // Wider margins for professional appearance
    const maxWidth = pageWidth - 2 * margin;
    const contentWidth = pageWidth - 2 * margin;

    // Helper function to add page break if needed
    const checkPageBreak = (requiredSpace = 40, forceBreak = false) => {
      // More conservative page breaking since we have fewer sections now
      if (forceBreak || yPosition > pageHeight - requiredSpace - 25) {
        doc.addPage();
        yPosition = 25; // Consistent starting position
        return true;
      }
      return false;
    };

    // Helper function to ensure section starts on new page if needed
    const startNewSection = (sectionType = 'major') => {
      const minSpaceForSection = sectionType === 'major' ? 100 : 60;
      if (yPosition > pageHeight - minSpaceForSection - 20) {
        // Only break page if we don't have enough space for the section
        doc.addPage();
        yPosition = 25;
      }
      // Removed aggressive page breaking for major sections since we have fewer sections now
    };

    // Professional academic section header
    const addSectionHeader = (title: string, level = 1) => {
      checkPageBreak(45);
      if (level === 1) {
        // Main section header - academic style
        doc.setFontSize(14);
        doc.setTextColor(31, 41, 55);
        doc.setFont('helvetica', 'bold');

        // Add section numbering for academic style
        let displayTitle = title;
        if (title === " Response Overview") {
          displayTitle = "1. Response Overview";
        } else if (title === "Quantitative Analysis") {
          displayTitle = "2. Quantitative Analysis";
        } else if (title === "Qualitative Analysis") {
          displayTitle = "3. Qualitative Analysis";
        } else if (title === "Conclusions and Recommendations") {
          displayTitle = "4. Conclusions and Recommendations";
        }

        doc.text(displayTitle, margin, yPosition);
        yPosition += 6;

        // Professional underline with academic styling
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(1);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;
      } else {
        // Subsection header
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin + 10, yPosition); // Indent subsections
        yPosition += 4;
      }
    };

    // Helper function to add regular text with normal paragraph spacing
    const addText = (text: string, fontSize = 11, color: [number, number, number] = [75, 85, 99], font: 'normal' | 'bold' | 'italic' = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont('helvetica', font);

      const lines = doc.splitTextToSize(text, maxWidth);
      if (Array.isArray(lines)) {
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += fontSize; // Exactly font size spacing
        });
      } else {
        doc.text(lines, margin, yPosition);
        yPosition += fontSize;
      }
    };

    // Add header image
    try {
      const headerImg = new window.Image();
      headerImg.src = '/ACTSPDFHEADERTOBEUSED.png';
      await new Promise((resolve) => { headerImg.onload = resolve; });
      const canvas = document.createElement('canvas');
      canvas.width = headerImg.width;
      canvas.height = headerImg.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(headerImg, 0, 0);
      const headerData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth;
      const imgHeight = (headerImg.height / headerImg.width) * imgWidth;
      doc.addImage(headerData, 'PNG', 0, 0, imgWidth, imgHeight);
      yPosition = imgHeight + 15;
    } catch (e) {
      console.warn('Could not add header image:', e);
      yPosition = 40;
    }

    // University Report Header - Clean and Professional

    // Survey Title with Report Label - Main heading
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    const reportTitle = `${form.title} - Report`;
    const formTitleLines = doc.splitTextToSize(reportTitle, maxWidth);
    if (Array.isArray(formTitleLines)) {
      formTitleLines.forEach((line: string) => {
        const lineWidth = doc.getTextWidth(line);
        doc.text(line, (pageWidth - lineWidth) / 2, yPosition); // Center survey title
        yPosition += 8;
      });
    } else {
      const lineWidth = doc.getTextWidth(formTitleLines);
      doc.text(formTitleLines, (pageWidth - lineWidth) / 2, yPosition);
      yPosition += 8;
    }

    // Decorative line under title
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.8);
    doc.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
    yPosition += 12; // Space before metadata

    // Report Metadata - Professional right-aligned format
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const reportTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'normal');

    const metadata = [
      `Report Generated: ${reportDate} at ${reportTime}`,
      `Total Responses: ${responses.length}`,
      `Questions Analyzed: ${form.questions?.length || 0}`
    ];

    metadata.forEach((line) => {
      doc.text(line, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 4.5;
    });
    yPosition += 12; // Professional spacing before main content

    // Introduction Section
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text("Introduction", margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    const introText = `This report presents a comprehensive analysis of the survey "${form.title || 'Survey'} - Report". It provides insights into respondent demographics, quantitative metrics, and qualitative feedback to help understand the outcomes and patterns in the collected data.`;
    const introLines = doc.splitTextToSize(introText, contentWidth);
    doc.text(introLines, margin, yPosition);
    yPosition += introLines.length * 5 + 15;

    // Response Overview - ensure it starts on a fresh section
    startNewSection('major');
    addSectionHeader(" Response Overview");

    // Create a table for response statistics
    checkPageBreak(80, false); // Optimized break spacing

    // Define question types for the statistics table
    const allQuestions = getAllQuestionsForAnalytics();
    const quantitativeQuestions = allQuestions.filter(q => {
      const qType = q.question_type || q.type;
      return ['rating', 'linear-scale', 'linear_scale', 'multiple-choice', 'multiple_choice', 'dropdown', 'checkbox'].includes(qType);
    });
    const textQuestions = allQuestions.filter(q => {
      const qType = q.question_type || q.type;
      return qType === 'text' || qType === 'textarea';
    });

    // Professional Statistics Table
    const tableStartY = yPosition;
    const tableWidth = contentWidth;
    const rowHeight = 12; // Professional row height
    const colWidths = [tableWidth * 0.35, tableWidth * 0.25, tableWidth * 0.4];

    // Table header with professional styling
    doc.setFillColor(31, 41, 55); // Dark blue header
    doc.rect(margin, yPosition, tableWidth, rowHeight, 'F');

    // Header text in white
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text("Metric", margin + 5, yPosition + 8);
    doc.text("Value", margin + colWidths[0] + 5, yPosition + 8);
    doc.text("Description", margin + colWidths[0] + colWidths[1] + 5, yPosition + 8);
    yPosition += rowHeight;

    // Add subtle border around header
    doc.setDrawColor(31, 41, 55);
    doc.setLineWidth(0.3);
    doc.rect(margin, tableStartY, tableWidth, rowHeight);

    // Table rows
    const stats = [
      ["Total Responses", responses.length.toString(), "Complete survey submissions"],
      ["Unique Respondents", new Set(responses.map(r => r.user_id)).size.toString(), "Distinct individuals"],
      ["Response Period", responses.length > 0 ?
        `${new Date(Math.min(...responses.map(r => new Date(r.submitted_at).getTime()))).toLocaleDateString()} - ${new Date(Math.max(...responses.map(r => new Date(r.submitted_at).getTime()))).toLocaleDateString()}` :
        "No responses", "Date range of submissions"],
      ["Quantitative Questions", quantitativeQuestions.length.toString(), "Rating and choice questions"],
      ["Qualitative Questions", textQuestions.length.toString(), "Open-ended text questions"]
    ];

    // Professional table rows with alternating colors and borders
    stats.forEach((stat, index) => {
      // Alternating row colors for better readability
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252); // Very light gray
      } else {
        doc.setFillColor(241, 245, 249); // Slightly darker gray
      }
      doc.rect(margin, yPosition, tableWidth, rowHeight, 'F');

      // Row border
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.rect(margin, yPosition, tableWidth, rowHeight);

      // Row content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(31, 41, 55); // Darker text for better readability

      // Left-align metric name
      doc.text(stat[0], margin + 5, yPosition + 8);

      // Center-align value
      const valueX = margin + colWidths[0] + (colWidths[1] / 2);
      const valueWidth = doc.getTextWidth(stat[1]);
      doc.text(stat[1], valueX - (valueWidth / 2), yPosition + 8);

      // Left-align description/notes
      const notesLines = doc.splitTextToSize(stat[2], colWidths[2] - 10);
      if (Array.isArray(notesLines)) {
        notesLines.forEach((line: string, lineIndex: number) => {
          doc.text(line, margin + colWidths[0] + colWidths[1] + 5, yPosition + 5 + (lineIndex * 4));
        });
      } else {
        doc.text(notesLines, margin + colWidths[0] + colWidths[1] + 5, yPosition + 8);
      }

      yPosition += rowHeight;
    });

    // Bottom border for table
    doc.setDrawColor(31, 41, 55);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8; // Proper space before Analysis section

    // Quantitative Analysis
    if (quantitativeQuestions.length > 0) {
      startNewSection('major');
      addSectionHeader("Quantitative Analysis");

      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'normal');
      const qaIntro = `This section presents detailed analysis of ${quantitativeQuestions.length} quantitative questions, including ratings, multiple choice selections, and checkbox responses.`;
      const qaIntroLines = doc.splitTextToSize(qaIntro, contentWidth);
      doc.text(qaIntroLines, margin, yPosition);
      yPosition += qaIntroLines.length * 5 + 15;

      quantitativeQuestions.forEach((question, index) => {
        // Only check page break for subsequent questions (not first one)
        if (index > 0) {
          checkPageBreak(80); // Reduced threshold to allow fitting on same page when possible
        }

        // Question header
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        doc.setFont('helvetica', 'bold');
        const qNumber = `Question ${index + 1}`;
        doc.text(qNumber, margin, yPosition);
        yPosition += 5; // Ultra-compact question header spacing

        // Question text
        const qText = question.question;
        const qLines = doc.splitTextToSize(qText, maxWidth);
        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'normal');
        if (Array.isArray(qLines)) {
          qLines.forEach((line: string) => {
            doc.text(line, margin, yPosition);
            yPosition += 10; // Exact font size spacing for 10pt font
          });
        } else {
          doc.text(qLines, margin, yPosition);
          yPosition += 10;
        }
        yPosition += 4; // Compact space after question

        const analytics = getQuestionAnalytics(question);
        if (!analytics) {
          addText("No data available for this question.", 10, [156, 163, 175], 'normal');
          yPosition += 8;
          return;
        }

        if (analytics.type === "average") {
          // Rating/Scale question
          doc.setFontSize(12);
          doc.setTextColor(31, 41, 55);
          doc.setFont('helvetica', 'bold');
          doc.text("Rating Analysis", margin, yPosition);
          yPosition += 8;

          // Ensure properties exist before using them
          const averageRating = analytics.average ?? 0;
          const responseCount = analytics.count ?? 0;
          const maxRating = analytics.maxRating ?? 5;

          addText(`Average Rating: ${averageRating.toFixed(2)} out of ${maxRating}`, 11, [75, 85, 99], 'normal');
          addText(`Total Responses: ${responseCount}`, 11, [75, 85, 99], 'normal');
          addText(`Response Rate: ${((responseCount / responses.length) * 100).toFixed(1)}%`, 11, [75, 85, 99], 'normal');

        } else if (analytics.type === "distribution") {
          // Multiple choice, dropdown, checkbox
          doc.setFontSize(12);
          doc.setTextColor(31, 41, 55);
          doc.setFont('helvetica', 'bold');
          doc.text("Response Distribution", margin, yPosition);
          yPosition += 8;

          if (analytics.chartData) {
            // Check if we have enough space for all distribution items
            const estimatedItemsHeight = analytics.chartData.length * 8;
            if (yPosition + estimatedItemsHeight > pageHeight - 40) {
              checkPageBreak(estimatedItemsHeight + 20, true);
            }

            analytics.chartData.forEach((item, itemIndex) => {
              const itemText = `${item.answer}: ${item.count} responses (${item.percentage.toFixed(1)}%)`;
              addText(itemText, 10, [75, 85, 99], 'normal');
            });
          }

          addText(`Total Valid Responses: ${analytics.totalAnswers}`, 11, [75, 85, 99], 'normal');
        }

        yPosition += 6; // Minimal space between questions
      });
    }

// Qualitative Analysis
    if (textQuestions.length > 0) {
      startNewSection('major');
      addSectionHeader("Qualitative Analysis");

      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.setFont('helvetica', 'normal');
      const qualIntro = `This section presents analysis of ${textQuestions.length} open-ended questions, providing insights into respondent perspectives and feedback.`;
      const qualIntroLines = doc.splitTextToSize(qualIntro, contentWidth);
      doc.text(qualIntroLines, margin, yPosition);
      yPosition += qualIntroLines.length * 5 + 15;

      textQuestions.forEach((question, index) => {
        checkPageBreak(80); // Ensure enough space for question and responses

        // Question header
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        doc.setFont('helvetica', 'bold');
        const qNumber = `Question ${quantitativeQuestions.length + index + 1}`;
        doc.text(qNumber, margin, yPosition);
        yPosition += 5; // Ultra-compact question header spacing

        // Question text
        const qText = question.question;
        const qLines = doc.splitTextToSize(qText, maxWidth);
        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'normal');
        if (Array.isArray(qLines)) {
          qLines.forEach((line: string) => {
            doc.text(line, margin, yPosition);
            yPosition += 10; // Exact font size spacing for 10pt font
          });
        } else {
          doc.text(qLines, margin, yPosition);
          yPosition += 10;
        }
        yPosition += 4; // Compact space after question

        const analytics = getTextQuestionAnalytics(question);
        if (!analytics) {
          addText("No text responses available for this question.", 10, [156, 163, 175], 'normal');
          yPosition += 8;
          return;
        }

        addText(`Total Text Responses: ${analytics.totalResponses}`, 11, [75, 85, 99], 'normal');

        if (analytics.sampleResponses.length > 0) {
          yPosition += 6;
          doc.setFontSize(11);
          doc.setTextColor(31, 41, 55);
          doc.setFont('helvetica', 'bold');
          doc.text("Sample Responses:", margin, yPosition);
          yPosition += 8;

          analytics.sampleResponses.forEach((response, rIndex) => {
            // Check if we need a page break for this response
            const estimatedLines = Math.ceil(response.length / 60); // Rough estimate
            const estimatedHeight = estimatedLines * 10 + 6;
            checkPageBreak(estimatedHeight + 10);

            const responseText = `"${response}"`;
            const responseLines = doc.splitTextToSize(responseText, maxWidth - 20);

            doc.setFontSize(10);
            doc.setTextColor(75, 85, 99);
            doc.setFont('helvetica', 'italic');
            if (Array.isArray(responseLines)) {
              responseLines.forEach((line: string) => {
                doc.text(line, margin + 10, yPosition);
                yPosition += 10; // Exact font size spacing for 10pt font
              });
            } else {
              doc.text(responseLines, margin + 10, yPosition);
              yPosition += 10;
            }
            yPosition += 6; // Normal space between responses
          });
        }

        yPosition += 6; // Minimal space between questions
      });
    }

// Conclusions and Recommendations - ensure it starts on a fresh section
    startNewSection('major');
    addSectionHeader("Conclusions and Recommendations");

    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    const conclusionsText1 = "This survey analysis provides valuable insights into respondent feedback and experiences. The quantitative data reveals trends and patterns in responses, while qualitative feedback offers deeper understanding of participant perspectives.";
    const conclusionsLines1 = doc.splitTextToSize(conclusionsText1, contentWidth);
    doc.text(conclusionsLines1, margin, yPosition);
    yPosition += conclusionsLines1.length * 5 + 15;

    const conclusionsText2 = "Key findings from this analysis should inform decision-making processes and future improvements. We recommend reviewing the detailed results and considering follow-up actions based on respondent feedback.";
    const conclusionsLines2 = doc.splitTextToSize(conclusionsText2, contentWidth);
    doc.text(conclusionsLines2, margin, yPosition);
    yPosition += conclusionsLines2.length * 5 + 15;

    // Confidentiality Notice
    checkPageBreak(40);
    yPosition += 6; // Minimal spacing before confidentiality notice

    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'italic');
    const confidentialityText = "Confidentiality Notice: This report contains aggregated and anonymized data. Individual responses have been protected to ensure respondent privacy and comply with data protection regulations.";
    const confLines = doc.splitTextToSize(confidentialityText, maxWidth);
    if (Array.isArray(confLines)) {
      confLines.forEach((line: string) => {
        doc.text(line, margin, yPosition);
        yPosition += 8; // Compact spacing for 8pt font
      });
    } else {
      doc.text(confLines, margin, yPosition);
      yPosition += 8;
    }

    // Professional academic footer with page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Footer separator line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

      // Page number in center
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 18, { align: "center" });

      // Institution footer
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text("Feedb-ACTS University Survey Analytics System", pageWidth / 2, pageHeight - 10, { align: "center" });

      // Subtle copyright/academic notice
      doc.setFontSize(6);
      doc.text("Confidential - For Academic Use Only", pageWidth / 2, pageHeight - 5, { align: "center" });
    }

    // Download PDF
    const filename = `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analytics_report.pdf`;
    doc.save(filename);
    toast.success(" FeedbACTS Report downloaded!");
  };

  const renderResponseValue = (question: any, value: any) => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-gray-400 italic">No answer</span>;
    }

    const qType = question.question_type || question.type;
    switch (qType) {
      case "multiple-choice":
      case "dropdown":
        return <span className="font-medium">{String(value)}</span>;
      case "checkbox":
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return <span className="font-medium">{String(value)}</span>;
      case "rating":
      case "linear-scale":
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{value}</span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-600">{qType === 'rating' ? 5 : (question.max || 10)}</span>
            {qType === 'rating' && renderStars(parseFloat(value), 5)}
          </div>
        );
      case "text":
      case "textarea":
        return <div className="whitespace-pre-wrap break-words">{String(value)}</div>;
      default:
        return <span className="font-medium">{String(value)}</span>;
    }
  };





  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <p className="mt-2 text-gray-600">Loading responses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onBack && (
              <Button variant="outline" onClick={onBack} className="shrink-0">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex-1 text-center min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold truncate">Form Responses</h2>
            <p className="text-gray-600 truncate">
              {form?.title} - {responses.length} responses
            </p>
          </div>
           <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={generateQuestionAnalyticsPDF}
              disabled={responses.length === 0}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600 truncate">Total Responses</p>
                <p className="text-2xl font-bold">{responses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600 truncate">Unique Respondents</p>
                <p className="text-2xl font-bold">
                  {new Set(responses.map(r => r.user_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600 truncate">Latest Response</p>
                <p className="text-sm font-bold truncate">
                  {responses.length > 0
                    ? new Date(Math.max(...responses.map(r => new Date(r.submitted_at).getTime()))).toLocaleDateString()
                    : "No responses"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Analytics Section (always shown) */}
      {applicableQuestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Question Analytics</h3>
          </div>
          
          {questionsBySection.map((sectionGroup, sectionIndex) => (
            <div key={sectionGroup.sectionId ?? 'uncategorized'} className="space-y-2">
              {/* Section Header */}
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-semibold text-gray-800">{sectionGroup.sectionTitle}</h4>
                <Badge variant="secondary" className="ml-auto">
                  {sectionGroup.questions.length} question{sectionGroup.questions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sectionGroup.questions.map((question, qIndex) => {
                  const analytics = getQuestionAnalytics(question);
                  const globalIndex = applicableQuestions.findIndex(q => q.id === question.id);
                  if (!analytics) return null;

                  if (analytics.type === 'average' && typeof analytics.average === 'number') {
                    return (
                      <Card key={question.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50/50 to-transparent">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base leading-relaxed" title={question.question}>
                              <span className="line-clamp-2">{question.question}</span>
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-4">
                            <div className="flex items-center justify-center gap-3 mb-3">
                              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {analytics.average.toFixed(1)}
                              </div>
                              {question.type === 'rating' && renderStars(analytics.average, analytics.maxRating)}
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                              out of {analytics.maxRating}
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (analytics.average / analytics.maxRating) * 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-400">
                              Average from {analytics.count} response{analytics.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else if (analytics.type === 'distribution' && analytics.chartData && analytics.chartData.length > 0) {
                    // Find the most common answer for this question
                    const topAnswer = analytics.chartData[0];
                    const topPercentage = topAnswer ? topAnswer.percentage : 0;
                    
                    return (
                      <Card key={question.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-l-4 border-l-green-500">
                        <CardHeader className="pb-2 bg-gradient-to-r from-green-50/50 to-transparent">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base leading-relaxed" title={question.question}>
                              <span className="line-clamp-2">{question.question}</span>
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Top answer highlight */}
                          {topAnswer && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                              <p className="text-xs text-green-600 font-medium mb-1">Most Common Answer</p>
                              <p className="font-semibold text-gray-900">{topAnswer.answer}</p>
                              <p className="text-sm text-green-600">{topAnswer.percentage}% of respondents</p>
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            {analytics.chartData.slice(0, 5).map((item, idx) => (
                              <div key={idx} className="group">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-3" title={item.answer}>
                                    {item.answer}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-sm text-gray-600 font-medium">
                                      {item.count} <span className="text-gray-400 text-xs">({item.percentage}%)</span>
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${idx === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-300'}`}
                                    style={{ width: `${item.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                            {analytics.chartData.length > 5 && (
                              <p className="text-xs text-gray-400 text-center pt-1">
                                +{analytics.chartData.length - 5} more options
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search by user name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Responses Table */}
      {filteredResponses.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {responses.length === 0 ? "No responses yet" : "No matching responses"}
          </h3>
          <p className="text-gray-500">
            {responses.length === 0
              ? "This form hasn't received any responses yet."
              : "Try adjusting your search criteria."
            }
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] px-6 py-4 text-center">User</TableHead>
                    <TableHead className="min-w-[120px] px-6 py-4 text-center">Role</TableHead>
                    <TableHead className="min-w-[150px] px-6 py-4 text-center">Submitted</TableHead>
                    <TableHead className="min-w-[100px] px-6 py-4 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="px-6 py-4 text-center">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{response.respondent_name || "Anonymous"}</p>
                            <p className="text-sm text-gray-500 truncate">{response.respondent_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <Badge variant="outline" className="truncate max-w-[100px]">
                            {response.respondent_role || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center whitespace-nowrap">
                          {new Date(response.submitted_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResponse(response)}
                            className="w-full sm:w-auto"
                          >
                            View Response
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredResponses.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-4 px-6 py-4 border-t bg-gray-50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(filteredResponses.length / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredResponses.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredResponses.length / itemsPerPage)}
                >
                  &gt;
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Response Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Response Details
            </DialogTitle>
          </DialogHeader>

          {selectedResponse && form && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* User Info Card - Fixed/Sticky */}
              <div className="py-6 bg-lime-100 border-b shrink-0">
                <div className="px-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="bg-gray-200 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {selectedResponse.respondent_profile_picture ? (
                        <img
                          src={selectedResponse.respondent_profile_picture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-start gap-2 mb-3">
                        <h3 className="font-bold text-gray-900 text-xl">
                          {selectedResponse.respondent_name || "Anonymous"}
                        </h3>
                        {selectedResponse.respondent_role && (
                          <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-700 border border-blue-200">
                            {selectedResponse.respondent_role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-start gap-4">
                        {selectedResponse.respondent_email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-blue-500" />
                            <span>{selectedResponse.respondent_email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span>{new Date(selectedResponse.submitted_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Responses Area */}
              <div className="flex-1 overflow-hidden px-6 pb-6">
                <h4 className="font-semibold mb-4 text-gray-800 pt-4">Question Responses</h4>
                <div
                  className="overflow-y-auto pr-1 space-y-4"
                  style={{
                    maxHeight: 'calc(70vh - 180px)',
                  }}
                >
                  {form.questions?.map((question, idx) => (
                    <div key={question.id} className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                      <p className="font-medium text-sm leading-relaxed mb-3">
                        <span className="inline-block w-6 text-gray-500 font-bold">{idx + 1}.</span>
                        {question.question}
                      </p>
                      <div className="text-gray-800 bg-gray-50 rounded p-4 border border-gray-100">
                        {renderResponseValue(question, selectedResponse.response_data[String(question.id)])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
