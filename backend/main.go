package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func main() {
	app := pocketbase.New()

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./dist"), false))
		se.Router.GET("/api/gitea-canvas-adapter", giteaCanvasAdapter)

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

type CanvasUser struct {
	Id    int64  `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type GiteaUser struct {
	Name      string `json:"full_name"`
	Username  string `json:"login"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
	Id        int64  `json:"id"`
}

func giteaCanvasAdapter(e *core.RequestEvent) error {
	bearer_header := e.Request.Header.Get("Authorization")
	req, err := http.NewRequest("GET", "http://localhost/api/v1/users/self", nil)
	if err != nil {
		return err
	}

	req.Header.Add("Authorization", bearer_header)
	req.Header.Add("Accept", "*/*")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var body []byte

	body, err = io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var canvasUser CanvasUser

	if err := json.Unmarshal(body, &canvasUser); err != nil {
		return err
	}

	giteaUser := GiteaUser{
		canvasUser.Name,
		canvasUser.Name,
		canvasUser.Email,
		"",
		canvasUser.Id,
	}

	b, err := json.Marshal(giteaUser)
	if err != nil {
		return err
	}

	e.Response.Header().Add("Content-Type", "application/json")
	written, err := e.Response.Write(b)
	_ = written
	if err != nil {
		return err
	}

	return nil
}

type seat struct {
	name      string
	x         float64
	y         float64
	direction float64
	occupied  bool
}

func rotatePoint(x, y, theta float64) (float64, float64) {
	newX := x*math.Cos(theta) - y*math.Sin(theta)
	newY := x*math.Sin(theta) + y*math.Cos(theta)
	return newX, newY
}

func visbilityFactor(seat *seat, targetX float64, targetY float64) float64 {
	xDiff := targetX - seat.x
	yDiff := targetY - seat.y
	distance := math.Hypot(xDiff*xDiff, yDiff*yDiff)
	distanceFactor := math.Exp(-distance)

	rotatedX, rotatedY := rotatePoint(xDiff, yDiff, seat.direction)
	relativeAngle := math.Abs(math.Atan2(rotatedY, rotatedX))
	angleFactor := (math.Pi - relativeAngle) / math.Pi
	return distanceFactor * angleFactor
}

func _demo() {
	seat := seat{
		name:      "A0",
		x:         0.5,
		y:         0.5,
		direction: math.Pi / 4,
		occupied:  false,
	}
	ascii := " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@"

	for y := 0.0; y < 1; y += 0.0125 {
		for x := 0.0; x < 1; x += 0.0125 / 2.0 {
			visibility := visbilityFactor(&seat, float64(x), float64(y))
			maxIndex := float64(len(ascii) - 1)
			fmt.Printf("%c", ascii[int(visibility*maxIndex)])
		}
		println()
	}
}
