package main

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/pocketbase/pocketbase/core"
)

// FetchHandler handles custom fetch-like HTTP requests using core.RequestEvent.
func FetchHandler(e *core.RequestEvent) error {
	// Ensure the user is authenticated and is a superuser
	if !e.HasSuperuserAuth() {
		return e.UnauthorizedError("admin privelages required", nil)
	}

	var payload struct {
		Method  string            `json:"method"`
		URL     string            `json:"url"`
		Headers map[string]string `json:"headers,omitempty"`
		Body    string            `json:"body,omitempty"`
	}

	// Parse the JSON body from the request
	if err := json.NewDecoder(e.Request.Body).Decode(&payload); err != nil {
		e.Response.WriteHeader(http.StatusBadRequest)
		_, _ = e.Response.Write([]byte(`{"error": "Invalid JSON payload"}`))
		return err
	}

	// Create the HTTP request
	req, err := http.NewRequest(strings.ToUpper(payload.Method), payload.URL, strings.NewReader(payload.Body))
	if err != nil {
		e.Response.WriteHeader(http.StatusInternalServerError)
		_, _ = e.Response.Write([]byte(`{"error": "Failed to create request"}`))
		return err
	}

	// Add headers to the request
	for key, value := range payload.Headers {
		req.Header.Add(key, value)
	}

	// Execute the HTTP request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		e.Response.WriteHeader(http.StatusInternalServerError)
		_, _ = e.Response.Write([]byte(`{"error": "Failed to execute request"}`))
		return err
	}
	defer resp.Body.Close()

	// Read the response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		e.Response.WriteHeader(http.StatusInternalServerError)
		_, _ = e.Response.Write([]byte(`{"error": "Failed to read response body"}`))
		return err
	}

	// Prepare the response object
	response := map[string]interface{}{
		"status":  resp.StatusCode,
		"headers": resp.Header,
		"body":    string(respBody),
	}

	// Serialize the response object
	responseJSON, err := json.Marshal(response)
	if err != nil {
		e.Response.WriteHeader(http.StatusInternalServerError)
		_, _ = e.Response.Write([]byte(`{"error": "Failed to encode response"}`))
		return err
	}

	// Write the response to the client
	e.Response.Header().Set("Content-Type", "application/json")
	e.Response.WriteHeader(http.StatusOK)
	_, _ = e.Response.Write(responseJSON)

	// No error, so we return nil
	return nil
}

