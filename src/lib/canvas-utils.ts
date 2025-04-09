import { pocketBase } from "@/pocketbase";

const API_BASE = "https://lms.neumont.edu/api/v1/";

export interface FetchForwardRequest {
  url: URL | string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

export interface FetchForwardResponse {
  status: number;
  headers: Record<string, string[]>;
  body: string | null | undefined;
}

// Used to call APIs that don't return CORS headers
export function fetchForward(
  request: FetchForwardRequest
): Promise<FetchForwardResponse> {
  return pocketBase.send("/api/superUserFetchForward", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function* paginatedCanvasRequest<T>(
  initialRequest: FetchForwardRequest,
  transformer: (response: FetchForwardResponse) => T[] | Promise<T[]>
) {
  let next: FetchForwardRequest | null = initialRequest;
  while (next != null) {
    console.log(next.url);
    const response = await fetchForward(next);
    let nextUrl = null;
    for (const header in response.headers) {
      if (header.toLowerCase() === "link") {
        const linkHeaderParser = /<([^>]+)>; rel=\"([^\"]+)\",?/g;
        for (const link of response.headers[header]) {
          let match;
          while ((match = linkHeaderParser.exec(link)) !== null) {
            if (match[2] === "next") {
              nextUrl = match[1];
              break;
            }
          }
        }
        break;
      }
    }
    next =
      nextUrl != null
        ? {
            method: "GET",
            url: nextUrl,
            body: "",
            headers: next.headers,
          }
        : null;
    for (const value of await transformer(response)) {
      yield value;
    }
  }
}

export interface CanvasStudent {
  id: string;
  name: string;
}

export async function retrieveCanvasStudents(
  authHeader: string,
  courseId: string
): Promise<CanvasStudent[]> {
  const request = paginatedCanvasRequest(
    {
      method: "GET",
      url: new URL(
        `courses/${courseId}/users?enrollment_type=student`,
        API_BASE
      ).href,
      headers: { Authorization: authHeader },
      body: "",
    },
    (res) => {
      console.log(res);
      return JSON.parse(res.body ?? "[]").map((s: any) => ({
        id: s.id,
        name: s.name,
      })) as CanvasStudent[];
    }
  );
  const result = [];
  for await (const student of request) result.push(student);
  return result;
}

export async function createEnrollmentsForStudents(
  testId: string,
  students: CanvasStudent[],
  unlocksAfter: string
) {
  const collection = pocketBase.collection("test_enrollments");
  const result = { new: 0, existing: 0 };

  // Get all student IDs
  const studentIds = students.map((student) => student.id);

  // Fetch all existing enrollments for this test in one batch query
  const existingEnrollments = await collection.getFullList({
    filter: pocketBase.filter(
      "test = {:test} && (" +
        students
          .map((student) => "canvas_student_id = " + student.id)
          .join(" || ") +
        ")",
      {
        test: testId,
        studentIds: studentIds,
      }
    ),
  });

  // Create a map of existing enrollments by student ID for quick lookup
  const existingEnrollmentMap = new Map();
  existingEnrollments.forEach((enrollment) => {
    existingEnrollmentMap.set(
      enrollment.canvas_student_id.toString(),
      enrollment
    );
  });

  // Process each student
  for (const student of students) {
    // Skip if enrollment already exists
    if (existingEnrollmentMap.has(student.id.toString())) {
      result.existing++;
      continue;
    }

    // Create new enrollment
    await collection.create({
      test: testId,
      canvas_student_id: student.id,
      canvas_student_name: student.name,
      unlocks_at: unlocksAfter,
    });

    result.new++;
  }

  return result;
}

export async function sendLinksToStudents(
  authHeader: string,
  testId: string,
  linkBase: string,
  subject: string,
  body: string,
  onProgress: (current: number, total: number) => void
) {
  const coll = pocketBase.collection("test_enrollments");

  const toSend = await coll.getFullList({
    filter: pocketBase.filter("test = {:test} && link_sent = false", {
      test: testId,
    }),
  });

  const total = toSend.length;
  let current = 0;

  for (const enrollment of toSend) {
    const link = new URL(enrollment.id, linkBase).href;
    console.log(enrollment.canvas_student_name);

    try {
      const conversation = await fetchForward({
        method: "POST",
        url: new URL("conversations", API_BASE).href,
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject,
          recipients: [enrollment.canvas_student_id.toString()],
          body: body + "\n" + link,
        }),
      });

      if (conversation.status > 299) {
        console.warn(conversation);
        throw new Error("Failed to send link");
      } else {
        await coll.update(enrollment.id, { link_sent: true });
      }

      current++;
      onProgress(current, total);

      // Add delay between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(
        "Error sending link to",
        enrollment.canvas_student_name,
        error
      );
      throw error;
    }
  }

  return { sent: current, total };
}
