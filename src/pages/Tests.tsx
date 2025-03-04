import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pocketBase } from "@/pocketbase";

interface Test {
  id: string;
  name: string;
  opens: string;
  closes: string;
  duration_mins: number;
  course_code: string;
  section?: string;
  rules: string;
  max_enrollments: number;
}

function ensureDateAtTime(dateStr: string, hour: number, minute: number) {
  const date = new Date(dateStr);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function formatDateForInput(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 10);
}

function TestDialog({
  test,
  onSave,
}: {
  test?: Test;
  onSave: (newTest: Test) => void;
}) {
  const [formData, setFormData] = useState<Test>(
    test || {
      id: "",
      name: "",
      opens: "",
      closes: "",
      duration_mins: 0,
      course_code: "",
      section: "",
      rules: "",
      max_enrollments: 0,
    }
  );
  const [open, setOpen] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    if (name === "opens") {
      setFormData({ ...formData, opens: ensureDateAtTime(value, 0, 0) }); // Set opening time to 00:00 UTC
    } else if (name === "closes") {
      setFormData({ ...formData, closes: ensureDateAtTime(value, 23, 59) }); // Set closing time to 23:59 UTC
    } else {
      setFormData({ ...formData, [name]: value });
    }
  }

  const [isLoading, setIsLoading] = useState(false);
  const [, setErrorMessage] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  async function handleSubmit() {
    setIsLoading(true);
    setErrorMessage("");
    setFormErrors({}); // Clear previous errors

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = "Test name is required.";
    if (!formData.opens) errors.opens = "Opening date is required.";
    if (!formData.closes) errors.closes = "Closing date is required.";
    if (!formData.course_code) errors.course_code = "Course code is required.";
    if (!formData.duration_mins || formData.duration_mins <= 0) {
      errors.duration_mins = "Duration must be greater than 0.";
    }
    if (!formData.max_enrollments || formData.max_enrollments <= 0) {
      errors.max_enrollments = "Max enrollments must be greater than 0.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const testData = {
        ...formData,
        opens: ensureDateAtTime(formData.opens, 0, 0),
        closes: ensureDateAtTime(formData.closes, 23, 59),
      };

      let savedTestResponse;
      if (test?.id) {
        savedTestResponse = await pocketBase
          .collection("tests")
          .update(test.id, testData);
      } else {
        savedTestResponse = await pocketBase
          .collection("tests")
          .create(testData);
      }

      // Explicitly cast to match the `Test` interface
      const savedTest: Test = {
        id: savedTestResponse.id,
        name: savedTestResponse.name,
        opens: savedTestResponse.opens,
        closes: savedTestResponse.closes,
        duration_mins: savedTestResponse.duration_mins,
        course_code: savedTestResponse.course_code,
        section: savedTestResponse.section,
        rules: savedTestResponse.rules,
        max_enrollments: savedTestResponse.max_enrollments,
      };

      onSave(savedTest);
      setOpen(false);
    } catch (error: any) {
      setErrorMessage(
        error.message || "An error occurred while saving the test."
      );
      console.error("Error saving test:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{test ? "Edit" : "New Test"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{test ? "Edit Test" : "New Test"}</DialogTitle>
          <DialogDescription>Enter test details</DialogDescription>
        </DialogHeader>

        <label>Name of Test</label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Test Name"
          required
        />
        {formErrors.name && (
          <p className="text-red-500 text-sm">{formErrors.name}</p>
        )}

        <div className="flex gap-8">
          <div>
            <label>Course Code</label>
            <Input
              name="course_code"
              value={formData.course_code}
              onChange={handleChange}
              placeholder="Course Code"
              required
            />
          </div>

          <div>
            <label>Section</label>
            <Input
              name="section"
              value={formData.section || ""}
              onChange={handleChange}
              placeholder="Section (optional)"
            />
          </div>
        </div>

        {formErrors.course_code && (
          <p className="text-red-500 text-sm">{formErrors.course_code}</p>
        )}

        <div className="flex justify-center gap-8">
          <div>
            <label>Test's opening date</label>
            <Input
              name="opens"
              type="date"
              value={formatDateForInput(formData.opens)}
              onChange={handleChange}
              className="w-[215px]"
              required
            />
          </div>

          <div>
            <label>Test's closing date</label>
            <Input
              name="closes"
              type="date"
              value={formatDateForInput(formData.closes)}
              onChange={handleChange}
              className="w-[215px]"
              required
            />
          </div>
        </div>

        <div className="flex justify-center gap-8">
          {formErrors.opens && (
            <p className="text-red-500 text-sm">{formErrors.opens}</p>
          )}
          {formErrors.closes && (
            <p className="text-red-500 text-sm">{formErrors.closes}</p>
          )}
        </div>

        <label>Test Duration</label>
        <Input
          name="duration_mins"
          type="number"
          value={formData.duration_mins}
          onChange={handleChange}
          placeholder="Duration (mins)"
          required
        />
        {formErrors.duration_mins && (
          <p className="text-red-500 text-sm">{formErrors.duration_mins}</p>
        )}

        <label>Rules</label>
        <Input
          name="rules"
          value={formData.rules || ""}
          onChange={handleChange}
          placeholder="Rules"
        />

        <label>Max Enrollments</label>
        <Input
          name="max_enrollments"
          type="number"
          value={formData.max_enrollments}
          onChange={handleChange}
          placeholder="Maximum number of students"
          required
        />
        {formErrors.max_enrollments && (
          <p className="text-red-500 text-sm">{formErrors.max_enrollments}</p>
        )}

        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading && (
            <div className="animate-spin h-5 w-5 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          )}
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function TestCard({
  test,
  onEdit,
}: {
  test: Test;
  onEdit: (updatedTest: Test) => void;
}) {
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);
  const [currentTest] = useState<Test>(test);

  useEffect(() => {
    async function fetchEnrollmentCount() {
      try {
        const enrollments = await pocketBase
          .collection("test_enrollments")
          .getFullList({
            filter: `test = "${currentTest.id}"`,
            requestKey: null, // Prevent auto-cancel
          });
        setEnrollmentCount(enrollments.length);
      } catch (error) {
        console.error("Error fetching enrollments:", error);
        setEnrollmentCount(0);
      }
    }

    if (currentTest.id) {
      fetchEnrollmentCount();
    }
  }, [currentTest.id]);

  function formatDateForDisplay(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${month}-${day}-${year}`;
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle>{test.name}</CardTitle>
          <CardDescription>
            {test.course_code} {test.section}
          </CardDescription>
        </div>
        <TestDialog test={test} onSave={onEdit} />
      </CardHeader>
      <CardContent>
        <p>Opens: {formatDateForDisplay(test.opens)}</p>
        <p>Closes: {formatDateForDisplay(test.closes)}</p>
        <p>Duration: {test.duration_mins} mins</p>
        <p>Rules: {test.rules}</p>
        <p>
          {enrollmentCount} / {test.max_enrollments} students signed up
        </p>
      </CardContent>
    </Card>
  );
}

export function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);

  useEffect(() => {
    async function fetchTests() {
      try {
        const records = await pocketBase
          .collection("tests")
          .getFullList({ requestKey: null });

        // Map the records into Test objects
        const formattedTests: Test[] = records.map((record) => ({
          id: record.id,
          name: record.name,
          opens: record.opens,
          closes: record.closes,
          duration_mins: record.duration_mins,
          course_code: record.course_code,
          section: record.section,
          rules: record.rules,
          max_enrollments: record.max_enrollments,
          current_enrollments: record.current_enrollments,
        }));

        setTests(formattedTests);
      } catch (error) {
        console.error("Error fetching tests:", error);
      }
    }

    fetchTests();
  }, []);

  async function addTest(newTest: Test) {
    setTests([...tests, newTest]);
  }

  async function editTest(updatedTest: Test) {
    setTests(tests.map((t) => (t.id === updatedTest.id ? updatedTest : t)));
  }

  return (
    <div className="m-5">
      <TestDialog onSave={addTest} />
      <div className="flex flex-wrap gap-4">
        {tests.map((test) => (
          <TestCard key={test.id} test={test} onEdit={editTest} />
        ))}
      </div>
    </div>
  );
}
