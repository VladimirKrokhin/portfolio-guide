package main

// #include <libraw/libraw.h>
// #include <stdlib.h>
//
// unsigned char *raw_extract_thumb(const char *input, unsigned int *final_size, int *err) {
//     int ret;
//     libraw_data_t *raw = libraw_init(0);
//
//     ret = libraw_open_file(raw, input);
//     if (ret != 0) {
//         *err = ret;
//         return NULL;
//     }
//
//     ret = libraw_unpack_thumb(raw);
//     if (ret != 0) {
//         libraw_close(raw);
//         *err = ret;
//         return NULL;
//     }
//
//     libraw_processed_image_t *pimg = libraw_dcraw_make_mem_thumb(raw, &ret);
//     if (!pimg) {
//         libraw_close(raw);
//         *err = ret;
//         return NULL;
//     }
//
//     *final_size = pimg->data_size;
//     unsigned char *final_data = malloc(*final_size);
//     memcpy(final_data, pimg->data, *final_size);
//
//     libraw_dcraw_clear_mem(pimg);
//     libraw_close(raw);
//
//     return final_data;
// }
//
// void raw_free_thumb(unsigned char *data) {
//     if (data) {
//         free(data);
//     }
// }
//
// #cgo CFLAGS: -I/usr/local/include
// #cgo LDFLAGS: -L/usr/local/lib -lraw
import "C"

import (
	"path"
	"path/filepath"
	"io/ioutil"
	"math"
	"strings"
	"errors"
	"unsafe"
	"gopkg.in/gographics/imagick.v2/imagick"
)

// Returns binary image content for specified image (as pointed to by `origPath`
// The following processing is done for every request:
// 1. if the image has a RAW extension supported by libraw, then the embedded thumbnail
// is extracted. If not, then image is just read by imagemagick verbatim.
// 2. resulting jpeg is stripped,
// 3. plane interlaced,
// 4. and (if a thumbnail is requested) reduced to maximum dimensions of 300x250 (w x h)
// 5. finally image binary is returned
func getImageContent(origPath string, isThumb bool) ([]byte, error) {
	p := filepath.Join(Config.BasePath, origPath)
	var data []byte
	var err error

	if isRawImage(p) {
		data, err = extractThumbFromRaw(p)
	} else {
		data, err = ioutil.ReadFile(p)
	}

	if err != nil {
		return nil, err
	}

	/* setup magickwand */
	mw := imagick.NewMagickWand()
	defer mw.Destroy()

	err = mw.ReadImageBlob(data)
	if err !=  nil {
		return nil, errors.New("Failed to read thumb blob with imagemagick: " + err.Error())
	}

	mw.ResetIterator()
	if !mw.NextImage() {
		return nil, errors.New("Failed to get NextImage for thumb blob")
	}

	err = mw.SetImageFormat("jpeg")
	if err != nil {
		return nil, errors.New("Failed to set image format for thumb blob: " + err.Error())
	}

	/* make progressive jpeg */
	err = mw.StripImage()
	if err != nil {
		return nil, errors.New("Failed to strip image: " + err.Error())
	}

	err = mw.SetImageInterlaceScheme(imagick.INTERLACE_PLANE)
	if err != nil {
		return nil, errors.New("Failed to set interlace scheme to plane: " + err.Error())
	}

	/* minify thumbnail */
	if isThumb {
		width, height := getFinalResolution(mw.GetImageWidth(), mw.GetImageHeight(), 300, 250)

		err = mw.ResizeImage(width, height, imagick.FILTER_LANCZOS, 1.0)
		if err != nil {
			return nil, errors.New("Failed to resize image for thumb blob: " + err.Error())
		}
	}

	return mw.GetImageBlob(), nil
}

func isRawImage(i string) bool {
	e := strings.ToLower(path.Ext(i))[1:]

	rawFormats := []string{"nef", "crw", "cr2", "raf", "dng", "mos", "kdc", "dcr"}
	for _, x := range rawFormats {
		if e == x {
			return true;
		}
	}

	return false
}

// Extracts embedded thumbnail that is present in most RAW formats.
// I have only tested this with NEF files.
// See `raw_extract_thumb` C function embedded above this file for how this is
// exactly done. Under the hood, it uses libraw with cgo.
func extractThumbFromRaw(p string) ([]byte, error) {
	var size C.uint = 0
	var err C.int = 0
	var data *C.uchar = C.raw_extract_thumb(C.CString(p), &size, &err)

	if err != 0 {
		C.raw_free_thumb(data)
		return nil, errors.New("Failed to extract thumbnail from raw: " + C.GoString(C.libraw_strerror(err)))
	}

	result := C.GoBytes(unsafe.Pointer(data), C.int(size))
	C.raw_free_thumb(data)
	return result, nil
}

// calculates how an image should be resized to fit in desired dimensions while
// keeping proper aspect ratio.
// w and h are original image width and height respectively
// dW and dH are desired width and height respectively
func getFinalResolution(w, h, dW, dH uint) (width, height uint) {
	// dW = desired width, dH = desired height

	widthRatio := float64(dW) / float64(w)
	heightRatio := float64(dH) / float64(h)

	finalRatio := math.Min(widthRatio, heightRatio)

	finalWidth := uint(math.Round(float64(w) * finalRatio))
	finalHeight := uint(math.Round(float64(h) * finalRatio))

	return finalWidth, finalHeight
}
