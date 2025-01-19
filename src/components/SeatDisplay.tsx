import { pocketBase } from "@/pocketbase";
import { useEffect, useState } from "react";

interface SeatRecord {
  DisplayName: string;
  X: number;
  Y: number;
  Angle: number;
}

function Seat(props: SeatRecord) {
  return (
    <p
      className="absolute bg-white p-3 rounded select-none"
      style={{ top: props.Y * 2, left: props.X * 2 }}
    >
      {props.DisplayName}
    </p>
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
    <div className="relative bg-white">
      {seats.map((seat, i) => (
        <Seat key={i} {...seat} />
      ))}
    </div>
  );
}
