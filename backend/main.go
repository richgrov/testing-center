package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/subscriptions"
	"golang.org/x/sync/errgroup"
)

func main() {
	app := pocketbase.New()

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./dist"), false))
		se.Router.GET("/api/gitea-canvas-adapter", gitea_canvas_adapter)
		se.Router.GET("/api/next-seat", retreiveNextSeat)

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

const (
	SeatSubscription = "seat"
)

func notifySeatChange(a core.App, change string) error {
	message := subscriptions.Message{
		Name: SeatSubscription,
		Data: []byte(change),
	}
	group := new(errgroup.Group)

	chunks := a.SubscriptionsBroker().ChunkedClients(300)

	for _, chunk := range chunks {
		group.Go(func() error {
			for _, client := range chunk {
				if !client.HasSubscription(SeatSubscription) {
					continue
				}

				client.Send(message)
			}

			return nil
		})
	}

	return group.Wait()
}

func retreiveNextSeat(e *core.RequestEvent) error {
	nextSeat := nextSeatAssignment()
	e.Response.Header().Add("Content-Type", "application/json")
	e.Response.Write([]byte(nextSeat))
	if len(nextSeat) == 0 {
		return nil
	}

	err := notifySeatChange(e.App, nextSeat)
	if err != nil {
		return err
	}

	return nil
}

func gitea_canvas_adapter(e *core.RequestEvent) error {
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

type row struct {
	seats []bool
}

type seatState struct {
	rows []row
}

var seatStateLock = sync.Mutex{}
var currentSeatState seatState = seatState{
	rows: []row{
		{seats: make([]bool, 10)},
		{seats: make([]bool, 10)},
		{seats: make([]bool, 3)},
		{seats: make([]bool, 3)},
		{seats: make([]bool, 3)},
		{seats: make([]bool, 10)},
		{seats: make([]bool, 10)},
	},
}

func nextSeatAssignment() string {
	seatStateLock.Lock()
	defer seatStateLock.Unlock()
	for rowId, row := range currentSeatState.rows {
		for seatId, seat := range row.seats {
			if !seat {
				row.seats[seatId] = true
				return fmt.Sprintf("{\"seat\":\"-%c%d\"}", rune(int('A')+rowId), seatId+1)
			}
		}
	}

	return ""
}
