package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"math"
	"os"
	"strconv"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/richgrov/testing-center/v2/seating"
)

func directionToAngle(direction string) (float64, error) {
	switch direction {
	case "N":
		return math.Pi / 2, nil
	case "S":
		return -math.Pi / 2, nil
	case "E":
		return 0, nil
	case "W":
		return math.Pi, nil
	}

	return 0, fmt.Errorf("invalid direction: %s", direction)
}

func loadSeats(path string) ([]seating.Seat, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)

	header, err := reader.Read()
	if err != nil {
		return nil, err
	}
	_ = header

	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	seats := make([]seating.Seat, 0, len(records))

	for _, record := range records {
		angle, err := directionToAngle(record[1])
		if err != nil {
			return nil, err
		}

		x, err := strconv.ParseFloat(record[2], 64)
		if err != nil {
			return nil, err
		}

		y, err := strconv.ParseFloat(record[3], 64)
		if err != nil {
			return nil, err
		}

		seats = append(seats, seating.Seat{
			Name:     record[0],
			X:        x,
			Y:        y,
			Angle:    angle,
			Occupied: false,
		})
	}

	return seats, nil
}

func addSeats(seats []seating.Seat, app *pocketbase.PocketBase) error {
	seatCollection, err := app.FindCollectionByNameOrId("seats")
	if err != nil {
		return err
	}

	for _, seat := range seats {
		record := core.NewRecord(seatCollection)
		record.Set("DisplayName", seat.Name)
		record.Set("X", seat.X)
		record.Set("Y", seat.Y)
		record.Set("Angle", seat.X)
		if err := app.Save(record); err != nil {
			return err
		}
	}

	return nil
}

func main() {
	seats, err := loadSeats("seats.csv")
	if err != nil {
		log.Fatalf("error loading seats: %v\n", err)
	}

	app := pocketbase.New()

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		if err := addSeats(seats, app); err != nil {
			log.Fatalf("error inserting seats: %v\b", err)
		}
		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
