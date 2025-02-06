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

  useEffect(() => {
    enrollmentsCollection
      .getList(undefined, 500, { expand: "test" })
      .then((data) => {
        setEnrollments(data.items as any[] as Enrollment[]);
      });
  }, []);

  enrollmentsCollection.subscribe("*", (data) => {
    console.log(data);
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Course</TableHead>
        </TableRow>
      </TableHeader>
      {enrollments.map((e) => (
        <TableRow>
          <TableCell>{e.canvas_student_name}</TableCell>
          <TableCell>
            {parsePocketbaseDate(e.start_test_at).toLocaleString()}
          </TableCell>
          <TableCell>
            {e.expand.test.course_code + " " + e.expand.test.section}
          </TableCell>
        </TableRow>
      ))}
    </Table>
  );
}
