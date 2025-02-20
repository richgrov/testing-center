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

function convertToLocalTime(utcDate: string) {
  const date = new Date(utcDate + "Z");
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options); // Format as MM/DD/YYYY
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function formatDateForInput(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 10); // Format as YYYY-MM-DD (date only)
}

function TestDialog({ test, onSave }: { test?: Test; onSave: (newTest: Test) => void }) {
  const [formData, setFormData] = useState<Test>(
    test || { id: generateId(), name: "", opens: "", closes: "", duration_mins: 0, course_code: "", section: "", rules: "" }
  );
  const [open, setOpen] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    if (name === "opens" || name === "closes") {
      const datePart = value; // Use the date part directly, no need to split
      let fixedTime = name === "opens" ? "00:00" : "23:59"; // Set time accordingly
      const localDateTime = new Date(`${datePart}T${fixedTime}`);
      setFormData({ ...formData, [name]: localDateTime.toISOString().slice(0, 16) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  }

  function handleSubmit() {
    onSave(formData);
    setOpen(false);
    alert("Test added successfully!");
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
        <Input name="rules" value={formData.rules || ""} onChange={handleChange} placeholder="Rules"/>

        <Button onClick={handleSubmit}>Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function TestCard({ test, onEdit }: { test: Test; onEdit: (updatedTest: Test) => void }) {

  function formatDateForDisplay(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Ensure two-digit month
    const day = date.getDate().toString().padStart(2, "0"); // Ensure two-digit day
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

  // Fetch tests from PocketBase on component mount
  useEffect(() => {
    async function fetchTests() {
      try {
        const records = await pocketBase.collection("tests").getFullList();
        setTests(records); //it works just fine and is angry for no reason
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
