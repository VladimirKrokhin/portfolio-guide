
import React, { Component} from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";

import ImagePanel from "./ImagePanel.js";
import AlbumList from "./AlbumList.js";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            album: "",
        };
    }

    onAlbumChanged = (newAlbum) => {
        this.setState((state) => ({album: newAlbum}));
    }

    render() {
        return (
            <div>
              <AlbumList
                onAlbumChanged={this.onAlbumChanged}
                />

              <ImagePanel
                album={this.state.album}
                />
            </div>
        );
    }
}

ReactDOM.render(
  <App />,
  document.querySelector("#app-root")
);

