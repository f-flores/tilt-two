import React, {Component} from "react";
import YouTube from "react-youtube";


class YouTubeCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ytList: []
    }
    this.shuffleYtCards = this.shuffleYtCards.bind(this);
    this._onReady = this._onReady.bind(this);
    this.onStateChange = this.onStateChange.bind(this);
  }

  shuffleYtCards = (cards) => {
    let counter = cards.length - 1;

    while (counter > 0) {
      const tmp = cards[counter];
      const randInd = Math.floor(Math.random() * (counter + 1));
      cards[counter] = cards[randInd];
      cards[randInd] = tmp; 
      counter--;
    }
    return cards;
  }

  _onReady(e, origObj) {
    this.props.onReady(e, origObj);
    // event.target.pauseVideo();
  }

  // -------------------------------------------------------------
  // onStateChange() listens for youtube player events. Since we
  // want to shuffle the video cards, this is how it is handled:
  //  if the video card is active and playing, move the rest of
  //    cards but have the playing card stay in its position,
  //  if that active video is paused, shuffle all of the video
  //    cards
  // ------------------------------------------------------------
  onStateChange(e) {
    // access to player in all event handlers via event.target
    console.log("in _onStateChange beginning ");
    console.log(e.data);
    const index = this.props.index;

    let arr = [...this.props.ytArray];
    if (e.data === 1) {
      const elem = arr[index];

      // left part of array
      let leftPart = arr.slice(0, index);
      // shuffle left part
      leftPart = this.shuffleYtCards(leftPart);

      // right part of array
      let rightPart = arr.slice(index + 1);
      // shuffle right part
      rightPart = this.shuffleYtCards(rightPart);   

      leftPart.push(elem);
      leftPart.push(...rightPart);
      console.log("e.data === 1 in _onStateChange");
      console.log(e.data);
      this.props.updateYtArray({ytVideos: leftPart});

     } else if (e.data === 2) {
      console.log("e.data === 2 in _onStateChange");
      console.log(e.data);
      let shuffled_arr = [...arr];
      shuffled_arr = this.shuffleYtCards(shuffled_arr);
      this.props.updateYtArray({ytVideos: shuffled_arr});

     }
  }


  render() {
    return (
      <div className="card video-card col-12 col-md-4">
        <YouTube
          videoId={this.props.video.id.videoId}
          opts={this.props.opts}
          onReady={(event) => this._onReady(event, this.props.origVid)}
          onStateChange={(event) => this.onStateChange(event)}
          className="card-img-top"
        />  
        <div className="card-body d-flex align-items-center text-center yt-title px-2 py-1">
          <h6 className="col-12 card-title">{this.props.video.snippet.title}</h6> 
        </div>

      </div>
    );

  }

}

export default YouTubeCard;