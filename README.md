# testing-center

**Prerequisites**

- [PocketBase](https://pocketbase.io/)

# Collections
## `testing_center_hours`
- `opens`: DateTime
- `closes`: DateTime
- `seats`: Number
- `created`: AutoDate
- `updated`: AutoDate

## `tests`
- `name`: Text
- `opens`: DateTime
- `closes`: DateTime
- `created`: AutoDate
- `updated`: AutoDate

## `test-enrollments`
- `uuid`: Text, unique index
- `canvas_student_id`: Number
- `test`: Relation -> `tests`
