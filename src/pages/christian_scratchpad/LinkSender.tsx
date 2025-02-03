import { pocketBase } from "@/pocketbase";
import { useState } from "react";
import { TestEnrollment } from "../EditTestSlot";
import { fetchForward } from "./utils";

export default function LinkSender() {
  const [apiBase, setApiBase] = useState("https://lms.neumont.edu/api/v1/");
  const [authHeader, setAuthHeader] = useState("")
  const [testId, setTestId] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [linkBase, setLinkBase] = useState("https://testing-center.greyscale.space/test_slot/");

  const [inProgress, setInProgress] = useState(false);
  async function execute() {
    if (inProgress) return;
    const coll = pocketBase.collection<TestEnrollment>("test_enrollments");
    try {
      const toSend = await coll.getFullList({
        filter: pocketBase.filter("test = {:test} && link_sent = false", { test: testId })
      });
      for (const enrollment of toSend) {
        const link = new URL(enrollment.id, linkBase).href;
        console.log(enrollment.canvas_student_name);
        const conversation = await fetchForward({
          method: "POST",
          url: new URL("conversations", apiBase).href,
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: subject,
            recipients: [enrollment.canvas_student_id.toString()],
            body: body + "\n" + link
          })
        });
        console.log(conversation.status);
        if (conversation.status > 299) {
          console.warn(conversation);
          throw new Error("Died");
        }
        else await coll.update(enrollment.id, { link_sent: true });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInProgress(false);
      console.log("Done");
    }
  }

  return <div className="leading-normal">
    <label>Canvas API base: <input className="border border-black" value={apiBase} onChange={e => setApiBase(e.target.value)} /></label><br />
    <label>Canvas Authorization Header: <input className="border border-black" value={authHeader} onChange={e => setAuthHeader(e.target.value)}/></label><br />
    <label>Pocketbase Test ID: <input className="border border-black" value={testId} onChange={e => setTestId(e.target.value)} /></label><br />
    <label>Link Base: <input className="border border-black" value={linkBase} onChange={e => setLinkBase(e.target.value)} /></label><br />
    <label>Subject: <input className="border border-black" value={subject} onChange={e => setSubject(e.target.value)} /></label><br />
    <button onClick={execute}>Go!</button>
    <textarea className="border border-black" value={body} onChange={e => setBody(e.target.value)}></textarea>
  </div>
}
