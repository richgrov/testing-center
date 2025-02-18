import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  return date.toISOString().slice(0, 16); // Ensure correct format
}

function TestDialog({ test, onSave }: { test?: Test; onSave: (newTest: Test) => void }) {
  const [formData, setFormData] = useState<Test>(
    test || { id: generateId(), name: "", opens: "", closes: "", duration_mins: 0, course_code: "", section: "", rules: "" }
  );
  const [open, setOpen] = useState(false);
  
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    if (name === "opens" || name === "closes") {
      const datePart = value.split("T")[0]; // Extract only the date part
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
        <Input name="name" value={formData.name} onChange={handleChange} placeholder="Test Name" />
        <Input name="course_code" value={formData.course_code} onChange={handleChange} placeholder="Course Code" />
        <Input name="section" value={formData.section || ""} onChange={handleChange} placeholder="Section (optional)" />
        <Input name="opens" type="datetime-local" value={formatDateForInput(formData.opens)} onChange={handleChange} />
        <Input name="closes" type="datetime-local" value={formatDateForInput(formData.closes)} onChange={handleChange} />
        <Input name="duration_mins" type="number" value={formData.duration_mins} onChange={handleChange} placeholder="Duration (mins)" />
        <Input name="rules" value={formData.rules || ""} onChange={handleChange} placeholder="Rules"/>
        <Button onClick={handleSubmit}>Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function TestCard({ test, onEdit }: { test: Test; onEdit: (updatedTest: Test) => void }) {
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
        <p>Opens: {convertToLocalTime(test.opens)}</p> 
        <p>Closes: {convertToLocalTime(test.closes)}</p>
        <p>Duration: {test.duration_mins} mins</p>
        <p>Rules: {test.rules}</p>
      </CardContent>
    </Card>
  );
}

export function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);

  function addTest(newTest: Test) {
    setTests([...tests, newTest]);
  }

  function editTest(updatedTest: Test) {
    setTests(tests.map(t => t.id === updatedTest.id ? updatedTest : t));
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
