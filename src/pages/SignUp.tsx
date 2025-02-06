import { Button } from "@/components/ui/button";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { parsePocketbaseDate, pocketBase } from "@/pocketbase";
import { useEffect, useState } from "react";

const enrollmentsCollection = pocketBase.collection("test_enrollments");

interface Enrollment {
  canvas_student_id: number;
  canvas_student_name: string;
  duration_mins: number;
  link_sent: boolean;
  start_test_at: string;
  expand: {
    test: {
      course_code: string;
      section: string;
    };
  };
  unlock_after: string;
}

export function SignUpPage() {
  const [enrollments, setEnrollments] = useState(new Array<Enrollment>());
  const [page, setPage] = useState(1);

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

  return (
    <>
      <div className="flex items-center justify-center gap-4 my-2">
        <Button onClick={() => setPage(page - 1)} disabled={page === 1}>
          Previous
        </Button>
        <p>Page {page}</p>
        <Button onClick={() => setPage(page + 1)}>Next</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Rules</TableHead>
          </TableRow>
        </TableHeader>
        {enrollments.map((e, i) => (
          <TableRow key={i}>
            <TableCell>{e.canvas_student_name}</TableCell>
            <TableCell>
              {parsePocketbaseDate(e.start_test_at).toLocaleString()}
            </TableCell>
            <TableCell>{e.duration_mins + " minutes"}</TableCell>
            <TableCell>
              {e.expand.test.course_code + " " + e.expand.test.section}
            </TableCell>
            <TableCell>Rules</TableCell>
          </TableRow>
        ))}
      </Table>
    </>
  );
}
