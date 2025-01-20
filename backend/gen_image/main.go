package main

import (
	"image/png"
	"os"

	"github.com/richgrov/testing-center/v2/seating"
)

func main() {
	img := seating.BuildHeatmap()
	file, err := os.Create("vision.png")
	if err != nil {
		panic(err)
	}

	if err := png.Encode(file, img); err != nil {
		panic(err)
	}
}
