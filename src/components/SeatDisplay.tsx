import { pocketBase } from "@/pocketbase";
import { useEffect, useState } from "react";

import vision from "@/assets/vision.webp";

interface SeatRecord {
  DisplayName: string;
  X: number;
  Y: number;
  Angle: number;
}

function toDegrees(angle: number) {
  return (angle * 180) / Math.PI - 90;
}

function Seat(props: SeatRecord) {
  return (
    <div className="absolute" style={{ top: props.Y * 2, left: props.X * 2 }}>
      <img
        className="absolute top-0 w-64 max-w-screen-2xl"
        style={{
          transform: `translate(-50%, -50%) rotate(${toDegrees(
            props.Angle
          )}deg)`,
        }}
        src={vision}
      />
      <p className="absolute top-0 -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-50 p-3 rounded select-none">
        {props.DisplayName}
      </p>
    </div>
  );
}

export function SeatDisplay() {
  const [seats, setSeats] = useState<SeatRecord[]>([]);

  useEffect(() => {
    pocketBase
      .collection("seats")
      .getFullList()
      .then((records) => {
        setSeats(records as any as SeatRecord[]);
      });
  }, []);

  return (
    <div className="absolute bg-white">
      {seats.map((seat, i) => (
        <Seat key={i} {...seat} />
      ))}
    </div>
  );
}
