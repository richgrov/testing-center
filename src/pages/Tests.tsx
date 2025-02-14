import { useEffect, useState } from "react";

import { pocketBase, parsePocketbaseDate } from "@/pocketbase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const testsCollection = pocketBase.collection("tests");

interface Test {
  id: string;
  name: string;
  opens: string;
  closes: string;
  duration_mins: number;
  course_code: string;
  section: string | undefined;
}

function Test(props: Test) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.name}</CardTitle>
        <CardDescription>
          {props.course_code} {props.section}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Opens {parsePocketbaseDate(props.opens).toLocaleString()}</p>
        <p>Closes {parsePocketbaseDate(props.closes).toLocaleString()}</p>
        <p>{props.duration_mins} mins</p>
      </CardContent>
    </Card>
  );
}

export function TestsPage() {
  const [tests, setTests] = useState(new Array<Test>());

  useEffect(() => {
    testsCollection
      .getFullList()
      .then((tests) => setTests(tests as any[] as Test[]));
  }, []);

  return (
    <div className="flex flex-wrap m-5 gap-4">
      {tests.map((test) => (
        <Test key={test.id} {...test} />
      ))}
    </div>
  );
}
