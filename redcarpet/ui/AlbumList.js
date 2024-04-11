import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

/*
 * Album item refers to each item on the left sidebar
 *
 * this component just makes sure the active component is highlighted
 */
class AlbumItem extends React.Component {
    constructor(props) {
        super(props);
    }

    handleClick = () => {
        this.props.clickHandler(this.props.index);
    }

    render() {
        return(
            <a className={classNames("item", this.props.active ? "active" : "")} onClick={this.handleClick}>
              {this.props.name}
            </a>
        );
    }
}

/*
 * Fetches album list and shows it in a sidebar
 */
class AlbumList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeIndex: 0,
            albums: [],
        };
    }

    componentDidMount() {
        this.fetch_albums();
    }

    fetch_albums = () => {
        fetch("api/albums")
            .then((data) => data.json())
            .then((data) => this.setState((state) => ({albums: data})))
            .catch((err) => console.log("could not fetch albums: " + err));
    }

    onItemClick = (i) => {
        this.setState((state) => ({activeIndex: i}));
        this.props.onAlbumChanged(this.state.albums[i]);
    }

    render() {
        return (
            <div className={classNames("ui", "sidebar", "left", "vertical", "menu", "visible", "inverted")}>
              <div className={classNames("header", "item")}>
                <strong>Albums</strong>
              </div>

              {
                  this.state.albums.map(function(item, i) {
                      return <AlbumItem
                                   key={i}
                                   name={item}
                                   active={(this.state.activeIndex == i ? true : false)}
                                   index={i}
                                   clickHandler={this.onItemClick} />;
                  }, this)
              }
            </div>
        );
    }
}

export default AlbumList;
