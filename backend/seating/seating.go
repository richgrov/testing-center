package seating

import "math"

type Seat struct {
	Name     string
	X        float64
	Y        float64
	Angle    float64
	Occupied bool
}

func rotatePoint(x, y, theta float64) (float64, float64) {
	newX := x*math.Cos(theta) - y*math.Sin(theta)
	newY := x*math.Sin(theta) + y*math.Cos(theta)
	return newX, newY
}

func visbilityFactor(origin *Seat, target *Seat) float64 {
	xDiff := target.X - origin.X
	yDiff := target.Y - origin.Y
	distance := math.Hypot(xDiff*xDiff, yDiff*yDiff)
	distanceFactor := math.Exp(-distance)

	rotatedX, rotatedY := rotatePoint(xDiff, yDiff, target.Angle)
	relativeAngle := math.Abs(math.Atan2(rotatedY, rotatedX))
	angleFactor := (math.Pi - relativeAngle) / math.Pi
	return distanceFactor * angleFactor
}

func seatVisibility(seatIdx int, allSeats []Seat) float64 {
	highestVisibility := 0.0
	seat := allSeats[seatIdx]

	for i, other := range allSeats {
		if !other.Occupied || i == seatIdx {
			continue
		}

		highestVisibility = math.Max(highestVisibility, visbilityFactor(&other, &seat))
	}

	return highestVisibility
}

func LeastVisibleSeat(seats []Seat) int {
	best := -1
	lowestVisibility := math.MaxFloat64

	for i, seat := range seats {
		if seat.Occupied {
			continue
		}

		visibility := seatVisibility(i, seats)
		if visibility < lowestVisibility {
			best = i
			lowestVisibility = visibility
		}
	}

	return best
}
