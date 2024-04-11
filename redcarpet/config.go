package main

import (
	"log"
	"os"
	"io/ioutil"
	"github.com/BurntSushi/toml"
)

type Configuration struct {
	BasePath string
	LogFile string
	ListenAddress string
	BaseURL string
	Debug bool
}

func InitConfig(loc string) Configuration {
	content, err := ioutil.ReadFile(loc)
	if err != nil {
		log.Fatal("Failed to read config: ", err)
		os.Exit(1)
	}

	var config Configuration
	_, err = toml.Decode(string(content), &config)

	if err != nil {
		log.Fatal("Failed to decode config file: ", err)
		os.Exit(1)
	}

	return config
}
