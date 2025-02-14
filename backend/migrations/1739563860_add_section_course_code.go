package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		tests, err := app.FindCollectionByNameOrId("tests")
		if err != nil {
			return err
		}

		tests.Fields.Add(&core.TextField{
			Name:     "course_code",
			Required: true,
		}, &core.TextField{
			Name: "section",
		})

		return app.Save(tests)
	}, func(app core.App) error {
		tests, err := app.FindCollectionByNameOrId("tests")
		if err != nil {
			return err
		}

		tests.Fields.RemoveByName("course_code")
		tests.Fields.RemoveByName("section")
		return app.Save(tests)
	})
}
