
export interface TimeWindow {
  start: number; // minutes from midnight
  end: number;   // minutes from midnight
}

export interface Scheduling extends TimeWindow {
  weight: number;
}

export interface Availability extends TimeWindow {
  startAtDate: string | number | Date;
  minutes: any;
  seats: number;
}

export interface OwnedScheduling extends TimeWindow {
  confirmed: boolean;
}

export interface SchedulingTimelineProps {
  title: string;
  allowedWindows: Availability[];
  existingSchedules: Scheduling[];
  mySchedulings: OwnedScheduling[];
  duration: number;
  timelineStartMins?: number | undefined;
  timelineEndMins?: number | undefined;
  cellDurationMins?: number | undefined;
  heatmapColorFunc?: HeatmapColorFunc | undefined;
  update: (slot: {startMins: number, durationMins: number}) => void;
}
export interface UpdateBits {
  startMins: number;
  durationMins: number;
}

export type HeatmapColorFunc = (value: number, min: number, max: number) => string;
