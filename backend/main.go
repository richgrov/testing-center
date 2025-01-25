package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	_ "github.com/richgrov/testing-center/v2/migrations"
	"github.com/richgrov/testing-center/v2/seating"
)

func main() {
	app := pocketbase.New()

	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		// enable auto creation of migration files when making collection changes in the Dashboard
		// (the isGoRun check is to enable it only during development)
		Automigrate: isGoRun,
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./dist"), true))
		se.Router.GET("/api/gitea-canvas-adapter", giteaCanvasAdapter)
		se.Router.GET("/api/seat-assignment/{studentId}", seatAssignment)
		se.Router.POST("/api/superUserFetchForward", FetchHandler)

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

func getAllSeats(app core.App) ([]seating.Seat, error) {
	seatCollection, err := app.FindCollectionByNameOrId("seats")
	if err != nil {
		return nil, err
	}

	records, err := app.FindAllRecords(seatCollection)
	if err != nil {
		return nil, err
	}

	seats := make([]seating.Seat, 0, len(records))
	for _, record := range records {
		seats = append(seats, seating.Seat{
			Name:     record.GetString("DisplayName"),
			X:        record.GetFloat("X"),
			Y:        record.GetFloat("Y"),
			Angle:    record.GetFloat("Angle"),
			Occupied: false,
		})
	}

	return seats, nil
}

func getSeatAssignments(app core.App) (map[string]string, error) {
	seatAssignmentsCollection, err := app.FindCollectionByNameOrId("SeatAssignments")
	if err != nil {
		return nil, err
	}

	seatAssignments, err := app.FindAllRecords(seatAssignmentsCollection)
	if err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for _, record := range seatAssignments {
		studentId := record.GetString("studentId")
		seatName := record.GetString("seatName")
		result[studentId] = seatName
	}

	return result, nil
}

func assignSeat(app core.App, studentId string, seatName string) error {
	seatAssignmentsCollection, err := app.FindCollectionByNameOrId("SeatAssignments")
	if err != nil {
		return err
	}

	record := core.NewRecord(seatAssignmentsCollection)
	record.Set("studentId", studentId)
	record.Set("seatName", seatName)

	if err = app.Save(record); err != nil {
		return err
	}

	return nil
}

func seatAssignment(e *core.RequestEvent) error {
	studentId := e.Request.PathValue("studentId")
	if e.Auth == nil {
		return e.UnauthorizedError("admin privelages required", nil)
	}

	seats, err := getAllSeats(e.App)
	if err != nil {
		return e.InternalServerError("error fetching seats", err)
	}

	seatAssignments, err := getSeatAssignments(e.App)
	if err != nil {
		return e.InternalServerError("error fetching seat assignments", err)
	}

	for otherStudent, otherSeat := range seatAssignments {
		if otherStudent == studentId {
			return e.String(http.StatusOK, otherSeat)
		}

		for i, seat := range seats {
			if seat.Name == otherSeat {
				seats[i].Occupied = true
			}
		}
	}

	seatIdx := seating.LeastVisibleSeat(seats)
	if seatIdx == -1 {
		return e.NoContent(204)
	}

	seatName := seats[seatIdx].Name

	if err := assignSeat(e.App, studentId, seatName); err != nil {
		return err
	}

	return e.String(http.StatusOK, seatName)
}
