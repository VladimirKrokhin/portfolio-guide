Description
===========
Web photo gallery with live thumbnailing and resizing capability to make viewing large RAW galleries over slow connections possible.

Just tell it where your photos are and it will do the rest. It does NOT modify anything in the filesystem AT ALL, however, it's still safest to supply it with a read-only mount of your photo directory. You can do this by running `redcarpet` under a user that has read-only access to your photo directory.

You can find screenshots in the wiki.

Contribution
============
I consider this project feature-complete. Please report any bugs you find. Feature requests should be accompanied by a merge request.

Customization
=============
The project is small and the code documented, so it's best to look there to figure out how things work. There are very few components working together and the backend is pretty basic except one C function that does the heavy lifting.

Configuration
=============
Copy `config.toml.default` to `config.toml` and run redcarpet with `-c` flag pointing to the config file.
```
$ redcarpet -c /path/to/config
```

Build
=====
Requirements
------------
* `go`
* `npm` (not necessary to run as the repo contains a prebuilt js bundle. only used to compile ui javascript and react stuff)
* `imagemagick` dev libraries 6 (not 7, but it's easy to adapt it, just one function is different between the two)
* `libraw`

Backend
-------
```
$ go get ./...
$ go build
$ ./redcarpet
```

UI
--
```
$ npm install
$ npm run build
```