import { useState } from "react";
import { paginatedCanvasRequest } from "./utils";
import { pocketBase } from "../../pocketbase";


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

  return <>
    <header className="container">
      <hgroup>
        <h1>Test enrollment fabricator</h1>
        <p>Create test enrollment collections from Canvas</p>
      </hgroup>
    </header>
    <main className="container">
      <form>
        <label>
          Canvas API base
          <input value={apiBase} onChange={e => setApiBase(e.target.value)} />
        </label>
        <label>
          Canvas Authorization Header
          <input value={authHeader} onChange={e => setAuthHeader(e.target.value)}/>
        </label>
        <label>
          Canvas Course ID:
          <input value={courseId} onChange={e => setCourseId(e.target.value)} />
        </label>
        <label>
          Pocketbase Test ID:
          <input value={testId} onChange={e => setTestId(e.target.value)} />
        </label>
        <label>
          Enrollments Unlock After UTC:
          <input value={unlocksAfter} onChange={e => setUnlocksAfter(e.target.value)} />
        </label>
        <input type="submit" onClick={createJsonPayload} value="Create JSON paylaod" />
        <input type="submit" onClick={submitAsEntries} value="Submit as entries" />
        <textarea value={jsonPayload} onChange={e => setJsonPayload(e.target.value)} />
      </form>
    </main>
  </>;
}
