import { useState } from "react";
import { TestEnrollment } from "../EditTestSlot"; 
import { pocketBase } from "@/pocketbase";
import { fetchForward } from "./utils";

export default function EmailExtractor() {
  const [csvText, setCsvText] = useState("");
  const [apiBase, setApiBase] = useState("https://lms.neumont.edu/api/v1/");
  const [authHeader, setAuthHeader] = useState("");

  function downloadCsv() {
    const fileName = "emails_maybe.csv";
    const blob = new Blob([csvText], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function doIt() {
    setCsvText("");
    console.log("start");

    const enrollments = await pocketBase.collection<TestEnrollment>("test_enrollments").getFullList({
    });

    const rows: string[][] = [];
    const done = new Set();
    rows.push(["Name", "Email"]);
    for (const enrollment of enrollments) {
      if (enrollment.canvas_student_id == null || enrollment.canvas_student_id === 0) continue;
      if (done.has(enrollment.canvas_student_name)) continue;
      const response = await fetchForward({
        method: "GET",
        headers: {
          "Authorization": authHeader,
        },
        url: new URL(`users/${enrollment.canvas_student_id}/profile`, apiBase).href,
        body: ""
      });
      if (response.status != 200) console.error(response);
      else {
        const profile = JSON.parse(response.body!!);
        rows.push([enrollment.canvas_student_name, profile.primary_email]);
        done.add(enrollment.canvas_student_name);
      }
      await new Promise(res => setTimeout(res, 1000));
    }

    function csvEscape(value: any) { return '"' + ((value?.toString() ?? "") as string).replace(/"/g, '""') + '"'; }
    setCsvText(rows.map(row => row.map(csvEscape).join(",")).join("\n"))
    console.log("Done");
  }

  return <div className="leading-normal">
    <label>Canvas API base: <input className="border border-black" value={apiBase} onChange={e => setApiBase(e.target.value)} /></label><br />
    <label>Canvas Authorization Header: <input className="border border-black" value={authHeader} onChange={e => setAuthHeader(e.target.value)}/></label><br />
    <button onClick={() => doIt()}>Do It</button><button onClick={downloadCsv}>Download</button><br />
    <textarea value={csvText} readOnly={true}>

    </textarea>
  </div>
}
