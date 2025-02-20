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
}

function generateId() {
  return Math.random().toString(36).substr(2, 7) + Math.random().toString(36).substr(2, 8);
}

function TestDialog({ test, onSave }: { test?: Test; onSave: (newTest: Test) => void }) {
  const [formData, setFormData] = useState<Test>(
    test || { id: generateId(), name: "", opens: "", closes: "", duration_mins: 0, course_code: "", section: "", rules: "" }
  );
  const [open, setOpen] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    if (name === "opens" || name === "closes") {
      const localDate = new Date(value);
      localDate.setUTCHours(12, 0, 0, 0); // Prevents timezone shifts
      setFormData({ ...formData, [name]: localDate.toISOString() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  }

  function formatDateForInput(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 10); // Ensures proper display in input
  }

  async function handleSubmit() {
    try {
      const testData = {
        ...formData,
        opens: new Date(formData.opens).toISOString(),
        closes: new Date(formData.closes).toISOString(),
      };

      let savedTest;
      if (test?.id) {
        savedTest = await pocketBase.collection("tests").update(test.id, testData);
      } else {
        savedTest = await pocketBase.collection("tests").create(testData);
      }
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

        <Button onClick={handleSubmit}>Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function TestCard({ test, onEdit }: { test: Test; onEdit: (updatedTest: Test) => void }) {
  function formatDateForDisplay(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
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
        setTests(records);
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