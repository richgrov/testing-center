import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { pocketBase } from "@/pocketbase"; // Ensure this is correctly imported

interface Test {
  id: string;
  name: string;
  opens: string;
  closes: string;
  duration_mins: number;
  course_code: string;
  section?: string;
  rules: string;
  max_enrollments: number; // Add this to the Test interface to track max enrollments
  current_enrollments: number;
}

function ensureDateAtTime(dateStr: string, hour: number, minute: number) {
  const date = new Date(dateStr);
  date.setUTCHours(hour, minute, 0, 0); // Set to the specific hour and minute in UTC
  return date.toISOString();
}

function formatDateForInput(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 10); // Ensures proper display in input field
}

function TestDialog({ test, onSave }: { test?: Test; onSave: (newTest: Test) => void }) {
  const [formData, setFormData] = useState<Test>(
    test || { id: "", name: "", opens: "", closes: "", duration_mins: 0, course_code: "", section: "", rules: "", max_enrollments: 0, current_enrollments: 0}
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

  async function handleSubmit() {
    try {
      const testData = {
        ...formData,
        opens: ensureDateAtTime(formData.opens, 0, 0),
        closes: ensureDateAtTime(formData.closes, 23, 59),
        current_enrollments: formData.current_enrollments || 0,
      };
  
      let savedRecord;
      if (test?.id) {
        savedRecord = await pocketBase.collection("tests").update(test.id, testData);
      } else {
        savedRecord = await pocketBase.collection("tests").create(testData);
      }
  
      const savedTest: Test = {
        id: savedRecord.id,
        name: savedRecord.name,
        opens: savedRecord.opens,
        closes: savedRecord.closes,
        duration_mins: savedRecord.duration_mins,
        course_code: savedRecord.course_code,
        section: savedRecord.section,
        rules: savedRecord.rules,
        max_enrollments: savedRecord.max_enrollments,
        current_enrollments: savedRecord.current_enrollments,
      };
  
      onSave(savedTest); 
      setOpen(false);
    } catch (error) {
      console.error("Error saving test:", error);
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
        <Input name="name" value={formData.name} onChange={handleChange} placeholder="Test Name" />

        <label>Course Code</label>
        <Input name="course_code" value={formData.course_code} onChange={handleChange} placeholder="Course Code" />

        <label>Section</label>
        <Input name="section" value={formData.section || ""} onChange={handleChange} placeholder="Section (optional)" />

        <label>Test's opening date</label>
        <Input name="opens" type="date" value={formatDateForInput(formData.opens)} onChange={handleChange} />

        <label>Test's closing date</label>
        <Input name="closes" type="date" value={formatDateForInput(formData.closes)} onChange={handleChange} />

        <label>Test Duration</label>
        <Input name="duration_mins" type="number" value={formData.duration_mins} onChange={handleChange} placeholder="Duration (mins)" />

        <label>Rules</label>
        <Input name="rules" value={formData.rules || ""} onChange={handleChange} placeholder="Rules" />

        <label>Max Enrollments</label>
        <Input name="max_enrollments" type="number" value={formData.max_enrollments} onChange={handleChange} placeholder="Maximum number of students" />

        <Button onClick={handleSubmit}>Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function TestCard({ test, onEdit }: { test: Test; onEdit: (updatedTest: Test) => void }) {
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);

  useEffect(() => {
    async function fetchEnrollmentCount() {
      try {
        const enrollments = await pocketBase.collection("test_enrollments").getFullList({
          filter: `test = "${test.id}"`,
        });
  
        setEnrollmentCount(enrollments.length);
  
        // Update the current_enrollments field in the parent component
        const updatedTest = { ...test, current_enrollments: enrollments.length };
        onEdit(updatedTest);
      } catch (error) {
        console.error("Error fetching enrollments:", error);
      }
    }
  
    fetchEnrollmentCount();
  }, [test.id]);
  
  
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
          <CardDescription>{test.course_code} {test.section}</CardDescription>
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
        const records = await pocketBase.collection("tests").getFullList();
  
        // Map the records into Test objects
        const formattedTests: Test[] = records.map(record => ({
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
    setTests(tests.map(t => (t.id === updatedTest.id ? updatedTest : t)));
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
