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
import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
    };
  };
  unlock_after: string;
}

interface PageNavigationProps {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

function PageNavigation({ page, setPage }: PageNavigationProps) {
  return (
    <div className="flex items-center justify-center gap-4 my-2">
      <Button onClick={() => setPage((page) => page - 1)} disabled={page === 0}>
        Previous
      </Button>
      <p>Page {page + 1}</p>
      <Button onClick={() => setPage((page) => page + 1)}>Next</Button>
    </div>
  );
}

export function SignUpPage() {
  const auth = useContext(AuthContext);
  const [date, setDate] = React.useState(new Date())
  const [open, setOpen] = React.useState(false);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<number>>(new Set());

  const [enrollments, setEnrollments] = useState(new Array<Enrollment>());
  const [page, setPage] = useState(0);

  useEffect(() => {
    enrollmentsCollection
      .getList(page, 100, { expand: "test", sort: "-start_test_at" })
      .then((data) => {
        setEnrollments(data.items as any[] as Enrollment[]);
      });
  }, [page]);

  enrollmentsCollection.subscribe("*", (data) => {
    console.log(data);
  });

  useEffect(() => {
    if (enrollments.length > 0 && date) {
      const selectedDateStr = format(date, "yyyy-MM-dd"); // Convert selected date to "YYYY-MM-DD"

      const filtered = enrollments.filter((e) => {
        const enrollmentDateStr = format(parsePocketbaseDate(e.start_test_at), "yyyy-MM-dd");
        return enrollmentDateStr === selectedDateStr;
      });

      setFilteredEnrollments(filtered);
    }
  }, [date, enrollments]);

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
      <PageNavigation page={page} setPage={setPage} />
      <br />

      <div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
              <CalendarIcon />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate); //Its only angry that it dosn't have a const value. It works just fine.
                setOpen(false);
              }}
              initialFocus />
          </PopoverContent>
        </Popover>

      </div>
      <br />

      <Table className="max-w-screen-lg mx-auto">
        <TableHeader>
          <TableRow>
            {/* Always render the first header, even when no checkboxes are selected */}
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
        {filteredEnrollments.map((e, i) => (
          <TableRow key={i}>
            <TableCell>
              <input
                type="checkbox"
                checked={selectedEnrollments.has(e.canvas_student_id)}
                onChange={() => handleCheckboxChange(e.canvas_student_id)}
              />
            </TableCell>
            <TableCell>{e.canvas_student_name}</TableCell>
            <TableCell>
              {parsePocketbaseDate(e.start_test_at).toLocaleString()}
            </TableCell>
            <TableCell>{e.duration_mins + " minutes"}</TableCell>
            <TableCell>
              {e.expand.test.course_code + " " + e.expand.test.section}
            </TableCell>
            <TableCell>
              {e.expand.test.name }
            </TableCell>
            <TableCell>Rules</TableCell>
          </TableRow>
        ))}
      </Table>

      <PageNavigation page={page} setPage={setPage} />
    </>
  );
}