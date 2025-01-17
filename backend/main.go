package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
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
		se.Router.GET("/api/gitea-canvas-adapter", gitea_canvas_adapter)

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

func gitea_canvas_adapter(e *core.RequestEvent) error {
	fmt.Println("Canvas adapting")
	bearer_header := e.Request.Header.Get("Authorization")
	fmt.Println(bearer_header)
	req, err := http.NewRequest("GET", "http://localhost/api/v1/users/self", nil)
	if err != nil {
		fmt.Println(err)
		return err
	}

	req.Header.Add("Authorization", bearer_header)
	req.Header.Add("Accept", "*/*")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println(err)
		return err
	}
	defer resp.Body.Close()

	var body []byte

	body, err = io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err)
		return err
	}

	var canvasUser CanvasUser

	fmt.Printf("%s\n", body)

	if err := json.Unmarshal(body, &canvasUser); err != nil {
		fmt.Println(err)
		return err
	}

	fmt.Println(canvasUser)

	giteaUser := GiteaUser{
		canvasUser.Name,
		canvasUser.Name,
		canvasUser.Email,
		"",
		canvasUser.Id,
	}

	fmt.Println(giteaUser)

	b, err := json.Marshal(giteaUser)
	if err != nil {
		fmt.Println(err)
		return err
	}

	fmt.Printf("%s\n", b)
	e.Response.Header().Add("Content-Type", "application/json")
	written, err := e.Response.Write(b)
	_ = written
	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}
