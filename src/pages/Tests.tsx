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

  async function handleSubmit() {
    try {
      const testData = {
        ...formData,
        opens: ensureDateAtTime(formData.opens, 0, 0),
        closes: ensureDateAtTime(formData.closes, 23, 59),
      } as Test;

      let savedRecord;
      if (test?.id) {
        savedRecord = await pocketBase
          .collection<Test>("tests")
          .update(test.id, testData);
      } else {
        savedRecord = await pocketBase
          .collection<Test>("tests")
          .create(testData);
      }

      onSave(savedRecord);
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
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Test Name"
        />

        <div className="flex gap-8">
          <div>
            <label>Course Code</label>
            <Input
              name="course_code"
              value={formData.course_code}
              onChange={handleChange}
              placeholder="Course Code"
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

        <div className="flex justify-center gap-8">
          <div>
            <label>Test's opening date</label>
            <Input
              name="opens"
              type="date"
              value={formatDateForInput(formData.opens)}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Test's closing date</label>
            <Input
              name="closes"
              type="date"
              value={formatDateForInput(formData.closes)}
              onChange={handleChange}
            />
          </div>
        </div>

        <label>Test Duration</label>
        <Input
          name="duration_mins"
          type="number"
          value={formData.duration_mins}
          onChange={handleChange}
          placeholder="Duration (mins)"
        />

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
        />

        <Button onClick={handleSubmit}>Save</Button>
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
    if (!currentTest.id) {
      return;
    }

    try {
      pocketBase
        .collection("test_enrollments")
        .getFullList({
          filter: `test = "${currentTest.id}"`,
          requestKey: null, // Prevent auto-cancel
        })
        .then((enrollments) => setEnrollmentCount(enrollments.length));
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      setEnrollmentCount(0);
    }
  }, [currentTest.id]);

  return (
    <Card className="w-1/5">
      <CardHeader className="flex justify-between">
        <div>
          <CardTitle>{test.name}</CardTitle>
          <CardDescription>
            {test.course_code} {test.section}
          </CardDescription>
        </div>
        <TestDialog test={test} onSave={onEdit} />
      </CardHeader>
      <CardContent>
        <p>Opens: {new Date(test.opens).toLocaleDateString()}</p>
        <p>Closes: {new Date(test.closes).toLocaleDateString()}</p>
        <p>Duration: {test.duration_mins} mins</p>
        <p>
          {enrollmentCount} / {test.max_enrollments} students signed up
        </p>
        <p>Rules: {test.rules}</p>
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
          .getFullList({ requestKey: null, sort: "-opens" });

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
      <div className="flex flex-wrap gap-4 justify-center">
        {tests.map((test) => (
          <TestCard key={test.id} test={test} onEdit={editTest} />
        ))}
      </div>
    </div>
  );
}
