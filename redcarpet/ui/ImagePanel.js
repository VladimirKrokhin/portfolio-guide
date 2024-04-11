import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import InfiniteScroll from 'react-infinite-scroller';
import { Image, Loader, Dimmer, Pagination, Modal } from 'semantic-ui-react';

/* how many images are requested from the server in one go */
const IMAGE_PER_REQUEST = 5;

/*
 * maximum number of images shown before a change of page is needed
 * this is intended to prevent your ram from filling up with thumbnails
 * when you have a directory with a million images
 */
const IMAGE_PER_PAGE = 100;

/*
 * Placeholder component which shows a loading circle while a thumbnail
 * has been requested and is being loaded
 */
class PlaceHolder extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <object className={classNames("ui", "medium", "image", "rounded", "placeholder")}>
              <Dimmer active inverted>
                <Loader />
              </Dimmer>

              <object className={classNames("ui", "medium", "image", "rounded", "placeholder")}>
              </object>
            </object>
        );
    }
}

/*
 * component which engulf a thumbnail. It handles showing a placeholder
 * until the image content is loaded, then it creates a blob: url with
 * the data, then replacing the placeholder with proper image
 *
 * it takes delaySrc as a property that points to the final image request url
 */
class LazyImage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            show: false,
            thumbData: "",
        };
    }

    show = (part) => {
        console.log(part);
        return part;
    }

    /* thumbSrc creates and returns the url for thumbnail */
    thumbSrc = () => {
        return this.props.delaySrc + "?thumbnail";
    }

    /* fullSrc creates and returns the url for full size image */
    fullSrc = () => {
        return this.props.delaySrc;
    }

    componentDidMount() {
        console.log("fetching image content " + this.thumbSrc());
        fetch(this.thumbSrc())
            .then(data => data.blob())
            .then(data => {
                this.setState(state => ({
                    thumbBlob: window.URL.createObjectURL(data),
                    show: true,
                }));
            })
            .catch((err) => console.log("Failed to fetch " + this.thumbSrc() + ": " + err));
    }

    render() {
        if (this.state.show) {
            return (
                <Modal trigger={
                           <Image
                                 rounded
                                 centered
                                 size="medium"
                                 src={this.state.thumbBlob}
                                 key={0}
                                 />
                           }
                           size="fullscreen"
                           closeOnDimmerClick={true}
                           closeOnDocumentClick={true}
                           basic
                           closeIcon>
                  <Modal.Header></Modal.Header>
                  <Modal.Content image>
                    <Image
                      rounded
                      centered
                      src={this.fullSrc()}
                      key={0}
                      className={"fullscreen"}
                      />
                  </Modal.Content>
                </Modal>
            );
        } else {
            return (
                <PlaceHolder />
            );
        }
    }
}

/*
 * The actual gallery component.
 *
 * It handles pagination, loading appropriate number of images, getting album image list.
 * The code will have to serve as the documentation.
 */
class ImagePanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
			loaded: [],
            images : [],
            hasMore: true,
            canLoad: false,

            totalPages: 0,
            activePage: 0,
        };

        this.fetchImageList(this.props.album);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.album !== this.props.album) {
            this.setState((state) => ({images: [], canLoad: false, hasMore: true, loaded: []}));
            this.fetchImageList(nextProps.album);
        }
    }

	fetchImageList = (album) => {
		console.log("fetching album list for " + album);

        fetch("api/album/" + album)
            .then((data) => data.json())
            .then((data) => this.setState((state) => ({
                images: data,
                canLoad: true,
                totalPages: Math.ceil(data.length / IMAGE_PER_PAGE),
                activePage: 1,
            })))
            .catch((err) => console.log("Failed to get image list for album " + album + ": " + err));
	}

    loadMoreImages = (scrollPage) => {
        console.log("loading page " + scrollPage + " new images");

        if (this.state.images.length == 0) {
            this.setState((state) => ({hasMore: false}));
            return;
        }

        // this.state.activePage should ideally start at 0
        const currentPage = (this.state.activePage - 1) * IMAGE_PER_PAGE;
        const start = currentPage + scrollPage * IMAGE_PER_REQUEST;
        const end   = start + IMAGE_PER_REQUEST;

        var hasMore = true;

        if (scrollPage * IMAGE_PER_REQUEST >= IMAGE_PER_PAGE) {
            this.setState((state) => ({hasMore: false}));
            return;
        }

        if (this.state.images.length == 0 || end >= this.state.images.length) {
            console.log("hasMore = false");
            hasMore = false;
        }

        this.setState((state) => ({
            loaded: state.loaded.concat(state.images.slice(start, end)),
            hasMore: hasMore
        }));
    }

    onPaginationChange = (e, data) => {
        console.log("Pagination change to: " + data.activePage);
        this.setState((state) => ({
            activePage: data.activePage,
            loaded: [],
            hasMore: true,
        }));
    }

    render() {
        if (this.props.album === "") {
            return(
                <div className={classNames("ui", "pusher", "centered")}>
                  <h1>Select an album</h1>
                </div>
            );
        }
        
        if (!this.state.canLoad) {
            return(
                <div className={classNames("ui", "pusher", "centered")}>
                  <h1>Waiting for image data to be loaded</h1>
                </div>
            );
        }

        let loadedImages = this.state.loaded.map(function(url, idx) {
            return(
                <LazyImage
                  key={idx}
                  delaySrc={url}
                  />
            );
        });

        return(
            <div className={classNames("ui", "pusher", "centered", "grid")}>
              <div className={classNames("ui", "medium", "images")}>
                <InfiniteScroll
                  // start with -1, because InfiniteScroll adds one at the beginning
                  pageStart={-1}
                  loadMore={this.loadMoreImages}
                  hasMore={this.state.hasMore}
                  loader={<div className="loader" key={0}>Loading...</div>}

                  // make sure InfiniteScroll gets re-rendered when pagination changes
                  key={this.state.activePage}

                  // useWindow={true}
                  // initialLoad={true}
                  // threshold={10}
                  >

                  {loadedImages}

                </InfiniteScroll>

                {
                    this.state.hasMore ? "" :
                        <Pagination
                              totalPages={this.state.totalPages}
                              activePage={this.state.activePage}
                              onPageChange={this.onPaginationChange}
                              />
                }

              </div>
            </div>
        );
    }
}

export default ImagePanel;
