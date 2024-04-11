package main

import (
	"log"
	"fmt"
	"os"
	"flag"
	"path/filepath"
	"net"
	"net/http/fcgi"
	"net/http"
	"html/template"
	"encoding/json"
	"strconv"
	//"encoding/base64"

	"github.com/gorilla/mux"
	"gopkg.in/gographics/imagick.v2/imagick"
)

var Config Configuration

// setupLogger sets up logger output. At this point, it only supports a file
func setupLogger(loc string) {
	f, err := os.OpenFile(loc, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal("Failed to open log file:", err)
		os.Exit(1)
	}

	log.SetOutput(f)
}

// Finds the location of the current running executable, since all supporting
// files (templates, etc.) are located relative to the executable
//
// The current expected directory structure is:
// ./redcarpet (executable)
// ./templates
// ./static/{js,css}
func findExecutable() string {
	exe, err := os.Executable()
	if err != nil {
		log.Fatal("Failed to find current executable location:", err)
		os.Exit(1)
	}

	return filepath.Dir(exe)
}

func main() {
	var configLocation string
	flag.StringVar(&configLocation, "c", "config.toml", "path to configuration file")
	flag.Parse()

	Config = InitConfig(configLocation)
	setupLogger(Config.LogFile)

	imagick.Initialize()
	defer imagick.Terminate()

	thisExecutable := findExecutable()

	router := mux.NewRouter().PathPrefix(Config.BaseURL).Subrouter()

	// serve static file
	router.PathPrefix("/static/").Handler(
		http.StripPrefix(Config.BaseURL + "static/",
			http.FileServer(http.Dir(filepath.Join(thisExecutable, "static")))))

	// serve main template ui
	router.HandleFunc("/",
		func(w http.ResponseWriter, req *http.Request) {
			tmpl, err := template.ParseFiles(filepath.Join(thisExecutable, "templates/index.html"))

			if err != nil {
				log.Println("Error parsing template: ", err)
			}

			tmpl.Execute(w, nil)
		},
	).Methods("GET")

	// get a list of directories (i.e. albums) recursively
	// see album.go:getAlbums
	router.HandleFunc("/api/albums",
		func(w http.ResponseWriter, req *http.Request) {
			ret, err := json.Marshal(getAlbums())
			if err != nil {
				log.Println("Error marshalling albums []string")
			}

			fmt.Fprintf(w, string(ret))
		},
	).Methods("GET")

	// get a list of images within a directory/album
	router.HandleFunc("/api/album/{path:.*}",
		func(w http.ResponseWriter, req *http.Request) {
			vars := mux.Vars(req)
			ret, err := json.Marshal(getAlbumFileList(vars["path"]))
			if err != nil {
				log.Println("Error marshalling album file list from album", vars["path"])
			}

			fmt.Fprintf(w, string(ret))
		},
	).Methods("GET")

	// get a specific image and return it in binary format
	router.HandleFunc("/api/image/{path:.*}",
		func(w http.ResponseWriter, req *http.Request) {
			vars := mux.Vars(req)
			var imgContent []byte

			if req.ParseForm() != nil {
				log.Println("Failed to parse parameters for url", req.URL)
				return
			}

			_, isThumb := req.Form["thumbnail"]
			imgContent, err := getImageContent(vars["path"], isThumb)

			if err != nil {
				if isThumb {
					log.Println("Failed to generate thumbnail image:", err.Error())
				} else {
					log.Println("Failed to get image:", err.Error())
				}

				return
			}

			w.Header().Set("Content-Type", "image/jpeg")
			w.Header().Set("Content-Length", strconv.Itoa(len(imgContent)))

			if _, err := w.Write(imgContent); err != nil {
				log.Println("Failed to write image response: ", err)
			}
		},
	).Methods("GET")

	if Config.Debug {
		http.ListenAndServe(Config.ListenAddress, router)
	} else {
		listener, err := net.Listen("tcp", Config.ListenAddress)
		if err != nil {
			log.Println(err)
			return
		}

		err = fcgi.Serve(listener, router)
		if err != nil {
			log.Println(err)
			return
		}
	}
}
