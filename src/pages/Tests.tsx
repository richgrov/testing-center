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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { pocketBase } from "@/pocketbase";
import {
  retrieveCanvasStudents,
  createEnrollmentsForStudents,
  sendLinksToStudents,
} from "@/lib/canvas-utils";

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

function localToUTC(date: Date, hour: number, minute: number): string {
  const localDate = new Date(date);
  localDate.setHours(hour, minute, 0, 0);
  return localDate.toISOString();
}

function utcToLocal(utcDateStr: string): Date {
  if (!utcDateStr) return new Date();
  return new Date(utcDateStr);
}

function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "PPP"); // Long date format
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
  const [openDate, setOpenDate] = useState<Date | undefined>(
    test?.opens ? utcToLocal(test.opens) : undefined
  );
  const [closeDate, setCloseDate] = useState<Date | undefined>(
    test?.closes ? utcToLocal(test.closes) : undefined
  );
  const [open, setOpen] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  function handleOpenDateChange(date: Date | undefined) {
    setOpenDate(date);
    if (date) {
      setFormData({
        ...formData,
        opens: localToUTC(date, 0, 0),
      });
    }
  }

  function handleCloseDateChange(date: Date | undefined) {
    setCloseDate(date);
    if (date) {
      setFormData({
        ...formData,
        closes: localToUTC(date, 23, 59),
      });
    }
  }

  async function handleSubmit() {
    try {
      const testData = {
        ...formData,
        opens: openDate ? localToUTC(openDate, 0, 0) : "",
        closes: closeDate ? localToUTC(closeDate, 23, 59) : "",
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
            <label className="block mb-2">Test's opening date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !openDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {openDate ? (
                    format(openDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={openDate}
                  onSelect={handleOpenDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block mb-2">Test's closing date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !closeDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {closeDate ? (
                    format(closeDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={closeDate}
                  onSelect={handleCloseDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
        <p>Opens: {formatDate(utcToLocal(test.opens))}</p>
        <p>Closes: {formatDate(utcToLocal(test.closes))}</p>
        <p>Duration: {test.duration_mins} mins</p>
        <p>
          {enrollmentCount} / {test.max_enrollments} students signed up
        </p>
        <p>Rules: {test.rules}</p>
      </CardContent>
    </Card>
  );
}

interface GenerateAndSendLinksFormData {
  authHeader: string;
  courseId: string;
  testId: string;
  linkBase: string;
  subject: string;
  body: string;
  unlocksAfter: string;
}

function GenerateAndSendLinksDialog({ tests }: { tests: Test[] }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const [formData, setFormData] = useState<GenerateAndSendLinksFormData>({
    authHeader: "",
    courseId: "",
    testId: "",
    linkBase: "https://testing-center.grover.sh/test_slot/",
    subject: "Test Link",
    body: "Here is your link to take the test:",
    unlocksAfter: new Date().toISOString(),
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  function handleSelectChange(name: string, value: string) {
    setFormData({ ...formData, [name]: value });
  }

  async function handleGenerateAndSend() {
    try {
      setIsLoading(true);
      setProgress(0);
      setCurrentStep(0);
      setTotalSteps(2);
      setStatusMessage("Fetching students from Canvas...");

      // Step 1: Retrieve students from Canvas
      const students = await retrieveCanvasStudents(
        "Beaerer " + formData.authHeader,
        formData.courseId
      );

      if (students.length === 0) {
        throw new Error("No students found for this course");
      }

      setCurrentStep(1);
      setStatusMessage(
        `Signing ${students.length} students up for the test...`
      );

      // Step 2: Create enrollments for the students
      await createEnrollmentsForStudents(
        formData.testId,
        students,
        formData.unlocksAfter
      );

      setCurrentStep(2);
      setStatusMessage("Sending links to students...");

      // Step 3: Send links to the students
      const { sent, total } = await sendLinksToStudents(
        "Bearer " + formData.authHeader,
        formData.testId,
        formData.linkBase,
        formData.subject,
        formData.body,
        (current, total) => {
          setProgress(Math.floor((current / total) * 100));
        }
      );

      setStatusMessage(
        `Successfully sent ${sent} links out of ${total} students`
      );
      setTimeout(() => {
        setOpen(false);
        setIsLoading(false);
        setStatusMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      setStatusMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Send Test Links</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Test Links</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-full">
              <p className="text-sm font-medium mb-2">{statusMessage}</p>
              <Progress value={progress} className="h-2 w-full" />
              <p className="text-xs text-gray-500 mt-1">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="authHeader" className="text-sm font-medium">
                Canvas Auth Token
              </label>
              <Input
                id="authHeader"
                name="authHeader"
                value={formData.authHeader}
                onChange={handleChange}
                placeholder="Bearer token..."
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="courseId" className="text-sm font-medium">
                Canvas Course ID
              </label>
              <Input
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="testId" className="text-sm font-medium">
                Test
              </label>
              <Select
                value={formData.testId}
                onValueChange={(value) => handleSelectChange("testId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a test" />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.name} ({test.course_code} {test.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="unlocksAfter" className="text-sm font-medium">
                Unlocks After
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.unlocksAfter && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.unlocksAfter ? (
                      format(new Date(formData.unlocksAfter), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.unlocksAfter
                        ? new Date(formData.unlocksAfter)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        const dateWithTime = new Date(date);
                        dateWithTime.setHours(0, 0, 0, 0);
                        setFormData({
                          ...formData,
                          unlocksAfter: dateWithTime.toISOString(),
                        });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Email Subject
              </label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="body" className="text-sm font-medium">
                Email Body
              </label>
              <Textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <Button
              onClick={handleGenerateAndSend}
              disabled={
                !formData.testId || !formData.authHeader || !formData.courseId
              }
            >
              Generate & Send
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
      <div className="flex justify-center gap-4 mb-4">
        <TestDialog onSave={addTest} />
        <GenerateAndSendLinksDialog tests={tests} />
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {tests.map((test) => (
          <TestCard key={test.id} test={test} onEdit={editTest} />
        ))}
      </div>
    </div>
  );
}
