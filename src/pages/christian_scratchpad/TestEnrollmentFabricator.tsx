import { useState } from "react";
import { paginatedCanvasRequest } from "./utils";
import { Button } from "@/components/ui/button"; 
import { pocketBase } from "@/pocketbase";


export default function TestEnrollmentFabricator() {
  const [apiBase, setApiBase] = useState("https://lms.neumont.edu/api/v1/");
  const [authHeader, setAuthHeader] = useState("")
  const [courseId, setCourseId] = useState("");
  const [testId, setTestId] = useState("");
  const [jsonPayload, setJsonPayload] = useState("");
  const [unlocksAfter, setUnlocksAfter] = useState("2025-01-21 16:30:00.000Z");

  interface WackCanvasStudent {
    id: string;
    name: string;
  }

  async function retrieveCanvasStudents(): Promise<WackCanvasStudent[]> {
    const request = paginatedCanvasRequest(
      {
        method: "GET",
        url: new URL(`courses/${courseId}/users?enrollment_type=student`, apiBase).href,
        headers: { "Authorization": authHeader },
        body: "",
      },
      res => JSON.parse(res.body ?? "EMPTY").map((s: any) => ({ id: s.id, name: s.name })) as WackCanvasStudent[]
    );
    const result = []
    for await (const student of request) result.push(student);
    return result;
  }

  async function createEnrollmentsForStudents(students: WackCanvasStudent[]) {
    const collection = pocketBase.collection("test_enrollments");
    for (const student of students) {
      await collection.create({
        test: testId,
        canvas_student_id: student.id,
        canvas_student_name: student.name,
        unlock_after: unlocksAfter,
      })
    }
  }

  const [inProgress, setInProgress] = useState(false);
  async function createJsonPayload() {
    if (inProgress) return;
    try {
      setInProgress(true);
      setJsonPayload(JSON.stringify(await retrieveCanvasStudents(), null, 2));
    } catch (e) {
      console.error(e);
    } finally {
      setInProgress(false);
    }
  }
  async function submitAsEntries() {
    if (inProgress) return;
    try {
      setInProgress(true);
      await createEnrollmentsForStudents(JSON.parse(jsonPayload));
    } catch (e) {
      console.error(e);
    } finally {
      setInProgress(false);
    }
  }

  return <div className="leading-normal">
    <label>Canvas API base: <input className="border border-black" value={apiBase} onChange={e => setApiBase(e.target.value)} /></label><br />
    <label>Canvas Authorization Header: <input className="border border-black" value={authHeader} onChange={e => setAuthHeader(e.target.value)}/></label><br />
    <label>Canvas Course ID: <input className="border border-black" value={courseId} onChange={e => setCourseId(e.target.value)} /></label><br />
    <label>Pocketbase Test ID: <input className="border border-black" value={testId} onChange={e => setTestId(e.target.value)} /></label><br />
    <label>Enrollments Unlock After UTC: <input className="border border-black" value={unlocksAfter} onChange={e => setUnlocksAfter(e.target.value)} /></label><br/>
    <Button onClick={createJsonPayload}>Create JSON paylaod</Button>
    <Button onClick={submitAsEntries}>Submit as entries</Button><br/>
    <textarea className="border border-black" value={jsonPayload} onChange={e => setJsonPayload(e.target.value)} />
  </div>;
}
