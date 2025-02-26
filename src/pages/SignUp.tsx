import { Button } from "@/components/ui/button";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { AuthContext, parsePocketbaseDate, pocketBase } from "@/pocketbase";
import { useContext, useEffect, useState } from "react";
import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const enrollmentsCollection = pocketBase.collection("test_enrollments");

interface Enrollment {
  canvas_student_id: number;
  canvas_student_name: string;
  duration_mins: number;
  link_sent: boolean;
  start_test_at: string;
  expand: {
    test: {
      name: string;
      course_code: string;
      section: string;
      rules: string;
    };
  };
  unlock_after: string;
}

interface PageNavigationProps {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  hasNext: boolean;
}

function PageNavigation({ page, setPage, hasNext }: PageNavigationProps) {
  return (
    <div className="flex items-center justify-center gap-4 my-2">
      <Button onClick={() => setPage(page - 1)} disabled={page === 0}>
        Previous
      </Button>
      <p>Page {page + 1}</p>
      <Button onClick={() => setPage(page + 1)} disabled={!hasNext}>
        Next
      </Button>
    </div>
  );
}

export function SignUpPage() {
  const auth = useContext(AuthContext);
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<number>>(new Set());
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [page, setPage] = useState(0);
  const [studentName, setStudentName] = useState("");
  const perPage = 100;

  useEffect(() => {
    if (!date) return;

    const selectedDateStr = format(date, "yyyy-MM-dd");
    let filterQuery = `start_test_at >= "${selectedDateStr} 00:00:00" && start_test_at <= "${selectedDateStr} 23:59:59"`;

    if (studentName.trim() !== "") {
      filterQuery += ` && canvas_student_name ~ "${studentName.trim()}"`;
    }

    enrollmentsCollection
      .getFullList({
        expand: "test",
        sort: "-start_test_at",
        filter: filterQuery,
      })
      .then((data) => {
        const enrollments: Enrollment[] = data.map((item) => ({
          canvas_student_id: item.canvas_student_id,
          canvas_student_name: item.canvas_student_name,
          duration_mins: item.duration_mins,
          link_sent: item.link_sent,
          start_test_at: item.start_test_at,
          unlock_after: item.unlock_after,
          expand: {
            test: {
              name: item.expand?.test?.name || "",
              course_code: item.expand?.test?.course_code || "",
              section: item.expand?.test?.section || "",
              rules: item.expand?.test?.rules || "No rules provided",
            },
          },
        }));

        setEnrollments(enrollments);
        setFilteredEnrollments(enrollments);
        setPage(0); // Reset to first page when new data is fetched
      })
      .catch((error) => console.error("Error fetching enrollments:", error));
  }, [date, studentName]);

  const paginatedEnrollments = filteredEnrollments.slice(
    page * perPage,
    (page + 1) * perPage
  );

  const handleCheckboxChange = (id: number) => {
    setSelectedEnrollments((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  if (!auth) {
    return (
      <p className="text-center font-bold text-lg mt-10">
        Perhaps you meant to go to a link?
      </p>
    );
  }

  return (
    <>
      <PageNavigation page={page} setPage={setPage} hasNext={(page + 1) * perPage < filteredEnrollments.length} />
      <div className="flex gap-4 mt-6">
        <input
          type="text"
          placeholder="Search by student name..."
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="border rounded p-2"
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="w-[240px] text-left">
              <CalendarIcon />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate);
                  setOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <br />

      <Table className="max-w-screen-lg mx-auto">
        <TableHeader>
          <TableRow>
            <TableHead>
              {selectedEnrollments.size > 0 ? `${selectedEnrollments.size} / 100` : " "}
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Test Name</TableHead>
            <TableHead>Rules</TableHead>
          </TableRow>
        </TableHeader>
        {paginatedEnrollments.map((e, i) => (
          <TableRow key={i}>
            <TableCell>
              <input
                type="checkbox"
                checked={selectedEnrollments.has(e.canvas_student_id)}
                onChange={() => handleCheckboxChange(e.canvas_student_id)}
              />
            </TableCell>
            <TableCell>{e.canvas_student_name}</TableCell>
            <TableCell>{parsePocketbaseDate(e.start_test_at).toLocaleString()}</TableCell>
            <TableCell>{e.duration_mins + " minutes"}</TableCell>
            <TableCell>{e.expand.test.course_code + " " + e.expand.test.section}</TableCell>
            <TableCell>{e.expand.test.name}</TableCell>
            <TableCell>{e.expand.test.rules}</TableCell>
          </TableRow>
        ))}
      </Table>
    </>
  );
}