package seating

import (
	"image"
	"image/color"
	"math"
)

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

func lerpRgba(start, end color.RGBA, t float64) color.RGBA {
	if t <= 0 {
		return start
	}
	if t >= 1 {
		return end
	}

	r := uint8(float64(start.R) + t*(float64(end.R)-float64(start.R)))
	g := uint8(float64(start.G) + t*(float64(end.G)-float64(start.G)))
	b := uint8(float64(start.B) + t*(float64(end.B)-float64(start.B)))
	a := uint8(float64(start.A) + t*(float64(end.A)-float64(start.A)))

	return color.RGBA{R: r, G: g, B: b, A: a}
}

func BuildHeatmap() *image.RGBA {
	img := image.NewRGBA(image.Rectangle{image.Point{0, 0}, image.Point{512, 512}})
	seat := Seat{
		X: 1.0,
		Y: 1.0,
	}

	for x := 0; x < 512; x++ {
		for y := 0; y < 512; y++ {
			start := color.RGBA{50, 8, 58, 255}
			end := color.RGBA{99, 56, 22, 255}
			target := Seat{
				X: float64(x) / 256.0,
				Y: float64(y) / 256.0,
			}
			col := lerpRgba(start, end, visbilityFactor(&seat, &target))
			img.Set(x, y, col)
		}
	}

	return img
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
