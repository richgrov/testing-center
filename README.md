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
- List/Search: grant everyone access
- View: grant everyone access


## `tests`
- `name`: Text
- `opens`: DateTime
- `closes`: DateTime
- `duration_mins`: Number
- `created`: AutoDate
- `updated`: AutoDate
- View: grant everyone access

## `test-enrollments`
- `test`: Relation -> `tests`
- `canvas_student_id`: Number
- `canvas_student_name`: Text
- `unlock_after`: DateTime
- `start_test_at`: DateTime
- `duration_mins`: Number
- List/Search: grant everyone access
- View: grant everyone access
- Update: grant everyone access
