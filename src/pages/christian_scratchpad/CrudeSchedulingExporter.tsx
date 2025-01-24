import { pocketBase } from "@/pocketbase";
import { useEffect, useRef, useState } from "react";
import { TestEnrollment } from "../EditTestSlot";
import { parsePocketbaseDate } from "@/lib/utils";

export default function CrudeSchedulingExporter() {
  const [filter, setFilter] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [comments, setComments] = useState("");
  const [comments2, setComments2] = useState("");

  const [csvText, setCsvText] = useState("");
  const limiter = useRef(Promise.resolve());
  useEffect(() => {
    const abort = new AbortController();

    const signal = abort.signal;
    limiter.current = limiter.current.then(async () => {
      if (signal.aborted) {
        console.log("Skipped");
        return;
      }
      console.log("Begun");
      setCsvText("");
      const enrollments = await pocketBase.collection<TestEnrollment>("test_enrollments").getFullList({
        signal,
        filter,
        expand: "test"
      });

      const rows: string[][] = [];
      rows.push(["Student Name", "Course Code", "Section", "Date", "Start Time", "Allowed Minutes", "Comments", "Comments 2", "Identifier"]);
      const extraction = /(?:^|\s)([A-Z]{3}\d{3})(?:\s|$)/;
      const names = new Set<string>();
      for (const enrollment of enrollments) {
        if (signal.aborted) return;
        let code = enrollment.expand.test.course_code;
        if (code == null || code === "") code = "??????";
        const startAt = parsePocketbaseDate(enrollment.start_test_at);
        const date = startAt != null ? `${startAt.getFullYear()}-${String(startAt.getMonth() + 1).padStart(2, "0")}-${String(startAt.getDate()).padStart(2, "0")}` : "";
        const startTime = startAt != null ? `${String(startAt.getHours() - (startAt.getHours() > 12 ? 12 : 0)).padStart(2, "0")}:${String(startAt.getMinutes()).padStart(2, "0")} ${startAt.getHours() >= 12 ? "PM" : "AM"}` : "";
        rows.push([enrollment.canvas_student_name, code, enrollment.expand.test.section ?? "", date, startTime, enrollment.duration_mins, comments, comments2, enrollment.id]);
        await new Promise(res => setTimeout(res, 0));
      }
      console.log(Array.from(names.values()).map(name => [name, extraction.exec(name)]));

      function csvEscape(value: any) { return '"' + ((value?.toString() ?? "") as string).replace(/"/g, '""') + '"'; }
      setCsvText(rows.map(row => row.map(csvEscape).join(",")).join("\n"))

      console.log("Done");
    }).catch(console.error);


    
    return () => { abort.abort(); }
  }, [refresh, filter, comments, comments2]);

  function downloadCsv() {
    const fileName = "crude_schedule_export.csv";
    const blob = new Blob([csvText], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  
  return <div className="leading-normal">
    <label>Filter: <input className="border border-black" value={filter} onChange={e => setFilter(e.target.value)} /></label><br />
    <label>Comments: <input className="border border-black" value={comments} onChange={e => setComments(e.target.value)} /></label><br />
    <label>Comments 2: <input className="border border-black" value={comments2} onChange={e => setComments2(e.target.value)} /></label><br />
    <textarea className="border border-black" readOnly={true} value={csvText} ></textarea><br />
    <button onClick={() => setRefresh(refresh + 1)}>Refresh</button>
    <button onClick={downloadCsv}>Download</button>
  </div>
}
