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
	"github.com/richgrov/testing-center/v2/seating"
)

func main() {
	seats := []seating.Seat{
		{
			Name:     "A0",
			X:        0.5,
			Y:        0.5,
			Angle:    math.Pi / 4,
			Occupied: false,
		},
		{
			Name:     "A1",
			X:        1.5,
			Y:        1.5,
			Angle:    math.Pi / 4,
			Occupied: false,
		},
	}

	for true {
		bestSeat := seating.LeastVisibleSeat(seats)
		if bestSeat == -1 {
			println("no more seats")
			break
		}

		fmt.Printf("%#v\n", seats[bestSeat])
		seats[bestSeat].Occupied = true
	}

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
