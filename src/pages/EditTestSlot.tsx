import { parsePocketbaseDate } from "@/lib/utils";
import { pocketBase } from "@/pocketbase";
import { RecordModel } from "pocketbase";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

import {
  Availability,
  OwnedScheduling,
  Scheduling,
  TimeWindow,
} from "@/components/scheduling/types";
import VerticalSchedulingTimeline from "@/components/scheduling/VerticalSchedulingTimeline";
import { millisecondsInDay, millisecondsInMinute } from "date-fns/constants";
import { Button } from "@/components/ui/button";

export interface TestEnrollment extends RecordModel {
  expand: { test: Test };
  duration_mins: number;
  start_test_at: string;
  test: string;
  canvas_student_name: string;
  canvas_student_id: number;
  unlocks_at: string;
}
export interface Test extends RecordModel {
  duration_mins: number;
  name: string;
  opens: string;
  closes: string;
}

export interface TestingCenterHours extends RecordModel {
  opens: string;
  closes: string;
  seats: number;
}

export const TestEnrollments = pocketBase.collection("test_enrollments");
export const TestingCenterHours = pocketBase.collection("testing_center_hours");

export default function EditTestSlotPage() {
  const params = useParams<"enrollmentId">();
  const [enrollment, setEnrollment] = useState<
    TestEnrollment | null | undefined
  >(null);

  useEffect(() => {
    if (typeof params.enrollmentId !== "string") {
      setEnrollment(undefined);
      return;
    }
    setEnrollment(null);
    const subscription = TestEnrollments.subscribe(
      params.enrollmentId!!,
      (event) => setEnrollment((event.record as TestEnrollment) ?? false),
      { expand: "test" }
    );
    subscription
      .then(() =>
        TestEnrollments.getOne(params.enrollmentId!!, { expand: "test" })
      )
      .then((record) => setEnrollment((record as TestEnrollment) ?? false))
      .catch((e) => {
        console.error(e);
        setEnrollment(null);
      });
    return () => {
      subscription.then((unsubscribe) => unsubscribe());
    };
  }, [params.enrollmentId]);

  var openValue: Date | null = null;
  var closeValue: Date | null = null;
  if (enrollment != null) {
    openValue = parsePocketbaseDate(enrollment.expand.test.opens);
    if (enrollment.unlocks_at != null && enrollment.unlocks_at !== "") {
      const unlocksAt = parsePocketbaseDate(enrollment.unlocks_at)!;
      if (unlocksAt > openValue!) openValue = unlocksAt;
    }
    closeValue = parsePocketbaseDate(enrollment.expand.test.closes);
  }

  interface Desired {
    startAtDate: number;
    minutes: number;
    maxMinutes: number;
  }
  const [desiredScheduling, setDesiredScheduling] = useState<Desired | null>(
    null
  );

  const [availability, setAvailability] = useState<TestingCenterHours[]>([]);
  useEffect(() => {
    setAvailability([]);
    const myOpenValue = openValue;
    const myCloseValue = closeValue;
    if (myOpenValue == null || myCloseValue == null) return;

    const selectedHours = new Map<string, TestingCenterHours>();
    TestingCenterHours.getList(1, 1000, {
      filter: pocketBase.filter(
        "(opens <= {:myOpenValue} && closes >= {:myOpenValue}) || (opens <= {:myCloseValue} && closes >= {:myCloseValue}) || ({:myOpenValue} <= opens && {:myCloseValue} >= opens) || ({:myOpenValue} <= closes && {:myCloseValue} >= closes)",
        { myOpenValue, myCloseValue }
      ),
    }).then((result) => {
      for (const item of result.items) {
        selectedHours.set(item.id, item as TestingCenterHours);
      }
      if (result.items.length > 0)
        setAvailability(Array.from(selectedHours.values()));
    });
    const subscription = TestingCenterHours.subscribe<TestingCenterHours>(
      "*",
      (event) => {
        if (event.action === "delete" && selectedHours.delete(event.record.id))
          setAvailability(Array.from(selectedHours.values()));
        else {
          const opens = parsePocketbaseDate(event.record.opens)!;
          const closes = parsePocketbaseDate(event.record.closes)!;
          const relevant =
            (opens <= myOpenValue && closes >= myOpenValue) ||
            (opens <= myCloseValue && closes >= myCloseValue) ||
            (myOpenValue <= opens && myCloseValue >= opens) ||
            (myOpenValue <= closes && myCloseValue >= closes);
          var updated = false;
          if (relevant) {
            selectedHours.set(event.record.id, event.record);
            updated = true;
          } else {
            updated = selectedHours.delete(event.record.id);
          }
          if (updated) setAvailability(Array.from(selectedHours.values()));
        }
      }
    );
    return () => {
      subscription.then((unsubscribe) => unsubscribe());
    };
  }, [openValue?.valueOf(), closeValue?.valueOf()]);

  interface MyScheduling extends Scheduling {
    day: number;
  }
  const [existing, setExisting] = useState<MyScheduling[]>([]);
  useEffect(() => {
    const myOpenValue = openValue as Date;
    const myCloseValue = closeValue as Date;
    setExisting([]);
    if (myOpenValue == null || myCloseValue == null) return;

    const tracked = new Map<string, MyScheduling>();
    function entryForEnrollment(
      enrollment: TestEnrollment
    ): MyScheduling | null {
      if (enrollment.start_test_at == null || enrollment.start_test_at === "")
        return null;
      const opens = parsePocketbaseDate(enrollment.start_test_at)!;
      const closes = new Date(
        opens.valueOf() + enrollment.duration_mins * millisecondsInMinute
      );
      const relevant =
        (opens <= myOpenValue && closes >= myOpenValue) ||
        (opens <= myCloseValue && closes >= myCloseValue) ||
        (myOpenValue <= opens && myCloseValue >= opens) ||
        (myOpenValue <= closes && myCloseValue >= closes);
      if (!relevant) return null;
      const day = new Date(opens.valueOf());
      day.setHours(0);
      day.setMinutes(0);
      day.setSeconds(0);
      day.setMilliseconds(0);
      const startMins =
        (opens.valueOf() - day.valueOf()) / millisecondsInMinute;
      return {
        day: day.valueOf(),
        start: startMins,
        end: startMins + enrollment.duration_mins,
        weight: 1,
      };
    }
    const filterOpenValue = new Date(myOpenValue.valueOf() - millisecondsInDay);
    const filterCloseValue = new Date(
      myCloseValue.valueOf() + millisecondsInDay
    );
    TestEnrollments.getList<TestEnrollment>(1, 100000, {
      filter: pocketBase.filter(
        "{:myOpenValue} <= start_test_at && {:myCloseValue} >= start_test_at",
        { myOpenValue: filterOpenValue, myCloseValue: filterCloseValue }
      ),
    }).then((result) => {
      console.log("Initial enrollments: " + result.items.length);
      for (const item of result.items) {
        const entry = entryForEnrollment(item);
        if (entry != null) tracked.set(item.id, entry);
      }
      setExisting(Array.from(tracked.values()));
    });

    const subscription = TestEnrollments.subscribe<TestEnrollment>(
      "*",
      (event) => {
        if (event.action === "delete" && tracked.delete(event.record.id))
          setExisting(Array.from(tracked.values()));
        else {
          var updated = false;
          const entry = entryForEnrollment(event.record);
          if (entry == null) updated = tracked.delete(event.record.id);
          else {
            tracked.set(event.record.id, entry);
            updated = true;
          }
          if (updated) setExisting(Array.from(tracked.values()));
        }
      }
    );
    return () => {
      subscription.then((unsubscribe) => unsubscribe());
    };
  }, [openValue?.valueOf(), closeValue?.valueOf()]);

  function mintSchedulings<T>(
    startDate: Date,
    endDate: Date,
    map: Map<number, T[]>,
    transform: (window: TimeWindow) => T
  ) {
    const dayIncrement = 1000 * 60 * 60 * 24;
    const millisecondsInMinute = 1000 * 60;
    const start = startDate.valueOf();
    const startDay = new Date(start);
    startDay.setHours(0);
    startDay.setMinutes(0);
    startDay.setSeconds(0);
    startDay.setMilliseconds(0);
    let day = startDay.valueOf();
    const end = endDate.valueOf();
    do {
      var thisDay = map.get(day);
      if (thisDay == null) {
        thisDay = [];
        map.set(day, thisDay);
      }
      thisDay.push(
        transform({
          start: Math.max(0, (start - day) / millisecondsInMinute),
          end: Math.min(60 * 24, (end - day) / millisecondsInMinute),
          //seats: hours.seats,
        })
      );
      day += dayIncrement;
    } while (day < end);
  }

  const timeDetails = useMemo(() => {
    const days = new Map<number, Availability[]>();
    for (const hours of availability) {
      mintSchedulings(
        parsePocketbaseDate(hours.opens)!,
        parsePocketbaseDate(hours.closes)!,
        days,
        (window) => ({ ...window, seats: hours.seats })
      );
    }
    return Array.from(days.entries());
  }, [availability]);

  const ownedSchedulings = useMemo(() => {
    const mySchedulings = new Map<number, OwnedScheduling[]>();
    if (
      enrollment != null &&
      enrollment.start_test_at != null &&
      enrollment.start_test_at !== ""
    ) {
      const start = parsePocketbaseDate(enrollment.start_test_at)!;
      const end = new Date(
        start.valueOf() + enrollment.duration_mins * millisecondsInMinute
      );
      mintSchedulings(start, end, mySchedulings, (window) => ({
        ...window,
        confirmed: true,
      }));
    }
    if (desiredScheduling != null) {
      const start = new Date(desiredScheduling.startAtDate);
      const end = new Date(
        desiredScheduling.startAtDate +
          desiredScheduling.minutes * millisecondsInMinute
      );
      mintSchedulings(start, end, mySchedulings, (window) => ({
        ...window,
        confirmed: false,
      }));
    }
    return mySchedulings;
  }, [
    enrollment?.start_test_at,
    enrollment?.duration_mins,
    desiredScheduling?.startAtDate,
    desiredScheduling?.minutes,
  ]);

  const existingsGroups = useMemo(() => {
    const groups = new Map<number, MyScheduling[]>();
    for (const entry of existing) {
      var thisDay = groups.get(entry.day);
      if (thisDay == null) {
        thisDay = [];
        groups.set(entry.day, thisDay);
      }
      thisDay.push(entry);
    }
    return groups;
  }, [existing]);

  function submitDesiredInput() {
    if (desiredScheduling === null) return;
    console.log(
      pocketBase.filter("{:date}", {
        date: new Date(desiredScheduling.startAtDate),
      })
    );
    TestEnrollments.update(params.enrollmentId!!, {
      start_test_at: new Date(desiredScheduling.startAtDate),
      duration_mins: desiredScheduling.minutes,
    }).then(() => setDesiredScheduling(null));
  }

  if (enrollment === null) return <main>Loading...</main>;
  else if (enrollment === undefined)
    return <main>Test not found. Contact Christian Grey.</main>;
  else {
    return (
      <main className="flex flex-col gap-4">
        <p className="text-center">
          Hello {enrollment.canvas_student_name}!<br />
          <span className="text-3xl">
            Lets get you signed up for your {enrollment.expand.test.name}.
          </span>
        </p>
        <div className="flex flex-row wrap justify-center gap-4">
          <div className="flex-grow" style={{ border: "4px solid orange" }}>
            <h1 className="text-2xl">
              <u>Current Slot</u>
            </h1>
            <p>
              {enrollment.start_test_at != null &&
              enrollment.start_test_at != "" ? (
                <>
                  {formatDate(parsePocketbaseDate(enrollment.start_test_at)!)}
                  <br />
                  Duration: {formatDuration(enrollment.duration_mins)}
                </>
              ) : (
                "You've not signed up yet."
              )}
            </p>
          </div>
          {desiredScheduling != null ? (
            <div className="flex-grow" style={{ border: "3px dashed orange" }}>
              <h1 className="text-2xl">
                <u>New Slot</u>
              </h1>
              <p>
                {formatDate(new Date(desiredScheduling.startAtDate))}
                <br />
                Duration:{" "}
                <input
                  value={desiredScheduling.minutes}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value);
                    if (isNaN(parsed)) return;
                    setDesiredScheduling({
                      ...desiredScheduling,
                      minutes: Math.min(parsed, desiredScheduling.maxMinutes),
                    });
                  }}
                  className="w-8 border border-black"
                />{" "}
                Minutes
                <br />
                <Button onClick={submitDesiredInput}>Submit</Button>
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-row nowrap w-full overflow-x-auto">
          {timeDetails.map((day) => {
            const date = new Date(day[0]);
            return (
              <VerticalSchedulingTimeline
                key={day[0]}
                title={`${DAYS[date.getDay()]}, ${
                  MONTHS[date.getMonth()]
                } ${date.getDate()}`}
                allowedWindows={day[1]}
                existingSchedules={existingsGroups.get(day[0]) ?? []}
                duration={enrollment.expand.test.duration_mins}
                mySchedulings={ownedSchedulings.get(day[0]) ?? []}
                update={(bits) =>
                  setDesiredScheduling({
                    startAtDate: day[0] + bits.startMins * millisecondsInMinute,
                    minutes: bits.durationMins,
                    maxMinutes: bits.durationMins,
                  })
                }
              />
            );
          })}
        </div>
      </main>
    );
  }
}

function formatDate(date: Date) {
  var hours = date.getHours() % 12;
  if (hours === 0) hours = 12;
  return `${DAYS[date.getDay()]}, ${
    MONTHS[date.getMonth()]
  } ${date.getDate()} at ${String(hours).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")} ${date.getHours() >= 12 ? "PM" : "AM"}`;
}
function formatDuration(duration: number) {
  if (duration === 120) return "Two Hours";
  else if (duration === 60) return "One Hour";
  else return duration + " Minutes";
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
