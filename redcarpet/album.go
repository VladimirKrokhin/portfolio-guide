package main

import (
	"fmt"
	"log"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
)

// Recursively scans directory specified in BasePath in config and returns
// all directories. In redcarpet, every directory is called an album.
func getAlbums() []string {
	albums := []string{}
	trimLen := len(Config.BasePath)
	filepath.Walk(Config.BasePath, func(d string, f os.FileInfo, e error) error {
		if f.IsDir() {
			albums = append(albums, d[trimLen:])
		} else {
			// assuming directories are searched before files
			// so skip for the sake of efficiency
			return filepath.SkipDir
		}

		return nil
	})

	// remove the first one since it's the empty string
	albums = albums[1:]
	return albums
}

// Returns a list of appropriate urls to access images within a directory
// the urls are in the form of /api/image/{path} where {path} is the path
// to each image file within the directory relative to `BasePath`
//
// e.g. if you have img1.jpg img2.jpg and img3.jpg in `BasePath`/myalbum,
// getAlbumFileList returns
// ["api/image/myalbum/img1.jpg", "api/image/myalbum/img2.jpg", "api/image/myalbum/img3.jpg"]
func getAlbumFileList(origPath string) []string {
	loc := filepath.Join(Config.BasePath, origPath)

	files, err := ioutil.ReadDir(loc)

	if err != nil {
		log.Println("Failed to read album contents for ", origPath, ":", err)
	}

	images := []string{}
	for _, f := range files {
		if !f.IsDir() {
			images = append(images, fmt.Sprintf("api/image/%s", path.Join(origPath, f.Name())))
		}
	}

	return images
}
