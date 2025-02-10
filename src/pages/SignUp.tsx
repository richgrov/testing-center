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
      <Table className="max-w-screen-lg mx-auto">
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
      <PageNavigation page={page} setPage={setPage} />
    </>
  );
}
