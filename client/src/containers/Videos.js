import React, { Component } from "react";
import API from "../utilities/API";
import YouTube from "react-youtube";
import YouTubeCard from "../components/YouTubeCard";
import {DefaultVideoQuery} from "../constants/VConst";

const UserSubmitted = "User Submitted Videos";

class Videos extends Component {

  constructor(props) {
    super(props);

    this.state = {
      // --
      // css state variable
      // ---------------------------
      isSubHovered: false,
      isUservidHovered: false,
      // --
      // lists from app mongo tables
      // ---------------------------
      cheatList: [],
      videoList: [],
      gameList: [],
      combinedList: [],
      // --
      // youtube api state variables
      // ---------------------------
      ytVideos: [],
      nextPageToken: "",
      prevPageToken: "",
      // --
      // youtube query values, default value sent first
      // ----------------------------------------------
      q: DefaultVideoQuery,
      submittedQuery: DefaultVideoQuery,
      inputQuery: "",
      // --
      // default query values for video section
      // part = "snippet is required for youtube" 
      part: "snippet" ,
      safeSearch: "moderate",
      maxResults: 9,
      relevanceLanguage: "en",
      // --
      // select menu option default
      // ---------------------------
      value: "none"
    };
    this.displayYtVideos = this.displayYtVideos.bind(this);
    this.updateYtArray = this.updateYtArray.bind(this);
  }

  handleOnChange = event => {
    const {name, value} = event.target;

    this.setState({
      [name]: value
    });
  }

  handleSelectMenuChange = event => {
    const {value} = event.target;

    if (value !== UserSubmitted) {
      this.getYouTubeVids({
        part: this.state.part,
        safeSearch: this.state.safeSearch,
        maxResults: this.state.maxResults,
        relevanceLanguage: this.state.relevanceLanguage,
        // add query value to youtube query object
        q: value     
      });
    }

    this.setState({
      submittedQuery: value,
      value: value,
      q: value,
      inputQuery: ""
    });
  }

  componentDidMount() {
    this.getYouTubeVids({
      part: this.state.part,
      safeSearch: this.state.safeSearch,
      maxResults: this.state.maxResults,
      relevanceLanguage: this.state.relevanceLanguage,
      // add query value to youtube query object
      q: this.state.q     
    });
    this.loadVideosList();
    this.loadCheatsList();
    this.loadGamesList();
  }

  loadCheatsList() {
    API.getCheats()
      .then(res => this.setState({cheatList: res.data}))
      .catch(err => console.log(err));
  }

  loadGamesList() {
    API.getGames()
      .then(res => {
        this.setState({gameList: res.data});
        // at this point combine cheats and games list
        this.combineLists();
      })
      .catch(err => console.log(err));
  }

  combineLists() {
    let comboList = [];

    const list1 = this.state.gameList;
    const list2 = this.state.cheatList;

    for (let elem1 of list1) comboList.push({itemId: elem1._id, nameTerm: `${elem1.gameName} online cheat`});

    for (let elem2 of list2) comboList.push({itemId: elem2._id, nameTerm: elem2.cheatName});

    // add user submitted videos to list
    comboList.push({itemId: UserSubmitted, nameTerm: UserSubmitted});

    this.setState({combinedList: comboList});
  }

  loadVideosList() {
    let vList = [], videoList = [];
    let thisVideos = this;
    API.getVideos()
      .then(res => {
        let linkPos = 0, uVideoId, userVidCtr = 0;
        
        vList = res.data;

        // recursive function to get info on each youtube query with id parameter
        // taking in user submitted youtube links returned from API.getVideos() call
        getYtInfo();

        function getYtInfo() {
          if (userVidCtr < vList.length) {
            linkPos = vList[userVidCtr].videoLink.lastIndexOf("/");
            uVideoId = vList[userVidCtr].videoLink.slice(linkPos + 1);
            
            // create query object
            let ytQuery = {
              part: "snippet",
              q: uVideoId,
              maxResults: 1
            };
            // get snippet title for each user submitted video
            API.youtubeSearch(ytQuery)
            .then(ytRes => {
              // add result to array
              let arr = ytRes.data.items;
              videoList.push({
                vId: uVideoId,
                vLink: uVideoId,
                vTitle: arr[0].snippet.title,
                posted: arr[0].createdOn
              });

              userVidCtr++;
              getYtInfo();
            })
            .catch(err => console.log(err));
          } 
        }

        thisVideos.setState({
          videoList: videoList
        });

      })
      .catch(err => console.log(err));
  }


  getYouTubeVids(query) {
    API.youtubeSearch(query)
    .then(res => {
      let prevPageToken = (res.data.prevPageToken) ? res.data.prevPageToken : null;

      this.setState({
        ytVideos: res.data.items,
        nextPageToken: res.data.nextPageToken,
        submittedQuery: query.q,
        prevPageToken: prevPageToken,
        q: query.q
      });
    })
    .catch(err => console.log(err));
  }

  videoSearch = event => {
    event.preventDefault();
    // input text query takes priority, otherwise dropdown menu value query is selected
    let queryTerm = (this.state.inputQuery) ? this.state.inputQuery : this.state.q;

    // initialize youtube query object with api defaults
    let ytQuery = {
      part: this.state.part,
      safeSearch: this.state.safeSearch,
      maxResults: this.state.maxResults,
      relevanceLanguage: this.state.relevanceLanguage,
      // add query value to youtube query object
      q: queryTerm
    };

    // console.log(ytQuery);
    this.getYouTubeVids(ytQuery);
  }

  loadMoreVids = (event, where) => {
    event.preventDefault();
    let destPage;

    destPage = (where === "next") ? this.state.nextPageToken : this.state.prevPageToken;

    let ytQuery = {
      part: this.state.part,
      safeSearch: this.state.safeSearch,
      maxResults: this.state.maxResults,
      relevanceLanguage: this.state.relevanceLanguage,
      pageToken: destPage,
      q: this.state.q
    };

    this.getYouTubeVids(ytQuery);
  }

  _onReady(e, orig) {
    // access to player in all event handlers via event.target
    e.target.pauseVideo();
  }

  // -------------------------------------------------------------
  // updateYtArray() callback receives the updated array
  // ------------------------------------------------------------
  updateYtArray(obj) {
    // access to player in all event handlers via event.target
    // console.log("in _onStateChange obj beginning: ", JSON.stringify(obj));
    console.log("in updateYtArray obj beginning: ");
    // console.log(e.data);
    this.setState(obj);

  }


  displayUserVideos(opts) {
    return (
      this.state.videoList.map(uVid => (

          <div className="card video-card col-4" key={uVid.vId}>

            <YouTube
            videoId={uVid.vLink}
            opts={opts}
            onReady={this._onReady}
            className="card-img-top"
            /> 

            <div className="d-flex align-items-center text-center yt-title px-2 py-2">
              <h5 className="col-12 card-title">{ uVid.vTitle }</h5> 
            </div>

          </div>


        )
      )
    );
  }

  displayYtVideos(opts) {
    return (
      this.state.ytVideos.map((video, index) => {
      
        return (

        <YouTubeCard
          key={video.id.videoId}
          opts={opts}
          video={video}
          index={index}
          origVid={this}
          ytArray={this.state.ytVideos}
          onReady={this._onReady}
          updateYtArray={this.updateYtArray}
        />

        );
      })
    )
  }


  render() { 
    let videoQueryHeader;
    if (this.state.q === DefaultVideoQuery) {
      videoQueryHeader = <span>Top YouTube Cheat Videos</span>
    } else if (this.state.submittedQuery === UserSubmitted) {
      videoQueryHeader = <span>User Submitted Videos</span>
    } else if (this.state.ytVideos.length) {
      videoQueryHeader = <span>{this.state.submittedQuery} Videos</span>
    } else {
      videoQueryHeader = <span>Cheat Videos</span>
    }

    // options for youtube video card rendering
    const opts = {
      height: "205",
      width: "336",
      playerVars: { // https://developers.google.com/youtube/player_parameters
        autoplay: 2, // paused
        modestbranding:1,
        autohide:1,
        showinfo:0,
        controls:0    

      }
    };

    return (
      <div>
        <div className="row no-gutters jumbotron text-center justify-content-center video-jumbo mb-0">
            
            <h1 className="col-12 animated fadeInDown">Videos</h1>
        
            <form className="col-12 col-md-6 justify-content-center">
                  
                  {/* Select dropdown menu */}
                  <div className="form-group">
                      <select className="form-control center-placeholder" value={this.state.value} onChange={this.handleSelectMenuChange}>
                        <option value="none">Cheat Videos By Game</option>
                        {this.state.combinedList.map(cheat =>
                          (
                            <option key={cheat.itemId} value={cheat.nameTerm}>{cheat.nameTerm}</option>
                          )
                        )}
                      </select>
                  </div>

                  {/* Search box */}
                  <div className="form-group">
                    <input 
                      name="inputQuery" 
                      value={this.state.inputQuery}
                      placeholder="Search YouTube Videos"
                      type="text"
                      className="form-control center-placeholder"
                      onChange={this.handleOnChange}
                    />
                  </div>

                  <div className="form-group">
                    <button
                      type="submit"
                      className="btn btn-block"
                      onClick={this.videoSearch}
                    >
                      Search Videos
                    </button>
                  </div>

                  <div className="row text-center justify-content-center">
                    <h3 className="text-center splash-subtitle">
                    {videoQueryHeader}
                    </h3>
                  </div>

                  <div className ="row">
                    <div className="col-12 col-md-6 justify-content-center">
                      <button 
                        className="btn btn-block"
                        onClick={(event) => this.loadMoreVids(event, "prev")}
                        disabled={this.state.prevPageToken === null || this.state.value === UserSubmitted}
                      >
                        Prev videos
                      </button>
                    </div>
                    <div className="col-12 col-md-6 justify-content-center">
                      <button 
                        className="btn btn-block"
                        onClick={(event) => this.loadMoreVids(event, "next")}
                        disabled={this.state.nextPageToken === null || this.state.value === UserSubmitted}
                      >
                        Next videos
                      </button>
                    </div>
                  </div>

            </form>



        </div>

      
            {/* Video results container */}            
              <div className="row video-result justify-content-center no-gutters mb-0">
                {
                  this.state.submittedQuery === UserSubmitted
                  ? 
                  this.displayUserVideos(opts)
                  :
                  this.displayYtVideos(opts) 
                }
              </div>
      
               
       
      </div>
    );
  }  
} 

export default Videos;
