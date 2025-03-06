import { useState } from "react";
import { format } from "date-fns";
import { SchedulingTimelineProps } from "./types";

export function defaultHeatmapColorFunc(
  value: number,
  min: number,
  max: number
): string {
  const intensity = (value - min) / (max - min);

  // Start with hue 52, lightness 88%
  // Move to hue 52, lightness 50%
  // End with hue 33, lightness 50%

  if (intensity <= 0.5) {
    // Interpolate lightness from 88% to 50% while keeping hue at 52
    const lightness = 88 - intensity * 2 * (88 - 50);
    return `hsl(52, 100%, ${lightness}%)`;
  } else {
    // Interpolate hue from 52 to 33 while keeping lightness at 50%
    const normalizedIntensity = (intensity - 0.5) * 2; // Scale 0.5-1 to 0-1
    const hue = 52 - normalizedIntensity * (52 - 33);
    return `hsl(${hue}, 100%, 50%)`;
  }
}

export default function HorizontalSchedulingTimeline(
  props: SchedulingTimelineProps
) {
  const {
    title,
    allowedWindows,
    existingSchedules,
    duration,
    timelineStartMins,
    timelineEndMins,
    cellDurationMins,
    heatmapColorFunc,
    update,
    mySchedulings,
  } = {
    timelineStartMins: 7 * 60,
    timelineEndMins: 20 * 60,
    cellDurationMins: 10,
    heatmapColorFunc: defaultHeatmapColorFunc,
    ...props,
  };

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate all time slots for the day
  const timeSlots = Array.from(
    { length: (timelineEndMins - timelineStartMins) / cellDurationMins },
    (_, i) => timelineStartMins + i * cellDurationMins
  );

  // Check if a time is within allowed windows
  const isTimeAllowed = (time: number) => {
    return allowedWindows.some(
      (window) => time >= window.start && time + cellDurationMins <= window.end
    );
  };

  // Count overlaps for a specific time
  const getOverlapCount = (time: number) => {
    let sum = 0;
    existingSchedules
      .filter(
        (schedule) =>
          time < schedule.end && time + cellDurationMins > schedule.start
      )
      .forEach((schedule) => {
        sum += schedule.weight;
      });
    return sum as number;
  };

  const getMaxOverlap = (time: number) => {
    let sum = 0;
    allowedWindows
      .filter(
        (window) =>
          time >= window.start && time + cellDurationMins <= window.end
      )
      .forEach((window) => {
        sum += window.seats;
      });
    return sum;
  };

  // Check if a new scheduling would exceed max overlap at any point
  const wouldExceedMaxOverlap = (startTime: number) => {
    for (
      let time = startTime;
      time < startTime + duration;
      time += cellDurationMins
    ) {
      if (isTimeAllowed(time)) {
        const currentOverlaps = getOverlapCount(time);
        const maxOverlap = getMaxOverlap(time);
        if (currentOverlaps >= maxOverlap) {
          return true;
        }
      }
    }
    return false;
  };

  // Format time for display
  const formatTime = (minutes: number) => {
    const date = new Date();
    date.setHours(Math.floor(minutes / 60));
    date.setMinutes(minutes % 60);
    return format(date, "h:mm a");
  };

  // Preview scheduling
  const getPreviewScheduling = () => {
    if (!hoverTime || !isTimeAllowed(hoverTime)) return null;
    return {
      start: hoverTime,
      end: hoverTime + duration,
    };
  };

  const preview = getPreviewScheduling();

  const handleScheduleClick = (time: number) => {
    if (!isTimeAllowed(time)) {
      setError("This time slot is not within allowed windows");
      return;
    }

    if (wouldExceedMaxOverlap(time)) {
      setError(`Cannot schedule here - would exceed maximum overlap`);
      return;
    }

    setError(null);

    let myDuration = 0;
    while (myDuration < duration && isTimeAllowed(time + myDuration)) {
      myDuration += cellDurationMins;
    }
    if (myDuration === 0) {
      setError("Duration of 0");
      return;
    }

    update({
      startMins: time,
      durationMins: myDuration,
    });
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4">
      <div className="text-lg font-semibold mb-4">{title}</div>

      <div
        className={`mb-4 p-2 ${
          error ? "bg-red-100" : ""
        } text-red-700 text-sm rounded h-16`}
      >
        {error}
      </div>

      {/* Container for heatmap and time labels */}
      <div className="flex flex-col items-center w-full">
        {/* Heatmap Grid */}
        <div className="grid grid-flow-col auto-cols-[15px]">
          {timeSlots.map((time, i) => {
            const isAllowed = isTimeAllowed(time);
            const overlaps = getOverlapCount(time);
            const isInPreview =
              preview && time >= preview.start && time < preview.end;
            const wouldExceed = isAllowed && wouldExceedMaxOverlap(time);

            const backgroundColor = (() => {
              if (!isAllowed) return "#d1d5db"; // gray
              if (wouldExceed) return "#fecaca"; // light red
              if (isInPreview) return "#60a5fa"; // blue
              return heatmapColorFunc(overlaps, 0, 30);
            })();

            return (
              <div
                key={time}
                className={`h-6 relative flex items-center ${
                  isAllowed && !wouldExceed
                    ? "cursor-pointer"
                    : "cursor-not-allowed"
                }`}
                style={{ backgroundColor, zIndex: 1, width: "15px", height: "50px" }}
                onMouseEnter={() => {
                  setHoverTime(time);
                  if (wouldExceed) {
                    setError(`Scheduling here would exceed maximum overlap`);
                  } else {
                    setError(null);
                  }
                }}
                onMouseLeave={() => {
                  setHoverTime(null);
                  setError(null);
                }}
                onClick={() => handleScheduleClick(time)}
              >
                {time % 60 === 0 && (
                  <span
                    style={{ zIndex: 10 }}
                    className="absolute -top-8 text-xs"
                  >
                    {formatTime(time)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
