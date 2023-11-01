// ws config
const wsConf = {
  HTTPS: import.meta.env.VITE_WS_HTTP, // if use https change to wss
  HOST: import.meta.env.VITE_WS_HOST,
  PORT: import.meta.env.VITE_WS_PORT,
  OFFER_OPTIONS: {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1,
  },
  CONFIG: {
    iceServers: [
      {
        urls: "turn:s-turn.uird.jp:443?transport=udp",
        username: "realcast",
        credential: "rS2N9Hz",
      },
      {
        urls: "turn:s-turn.uird.jp:443?transport=tcp",
        username: "realcast",
        credential: "rS2N9Hz",
      }
    ],
  },
  RECONNECT_INTREVAL: 3000,
  RECONNECT_TIMEOUT: 3000,
  POLLING_INTERVAL: 10000,
  PING_INTERVAL: 10000,
  CANVAS_WIDTH: 380,
  CANVAS_HEIGHT: 260,
};

// studen screen share
const studentConf = {
  //interval ranges accoroding to current student list, please enter items in an ordered manners (from least to most participants)
  REFRESH_SCREEN_INTERVAL_RANGE: [{
                                  max_participant:9,//1 ~ 9
                                  interval:3000
                                },{
                                  max_participant:14,//10 ~ 14 
                                  interval:10000
                                },{
                                  max_participant:19,//15 ~ 19 
                                  interval:15000
                                },{
                                  max_participant:29,//19 ~ 29 
                                  interval:20000
                                },{
                                  max_participant:49,//30 ~ 49
                                  interval:30000
                                },{
                                  max_participant:99,//50 ~ 99 
                                  interval:50000
                                },{
                                  max_participant:1000,//100 ~ 1000 
                                  interval:100000
                                }],
  getRefreshScreenInterval: function(forCount){
    var interval = this.REFRESH_SCREEN_INTERVAL_RANGE.at(-1).interval //get the biggest interval
    let ranges = this.REFRESH_SCREEN_INTERVAL_RANGE

    for (var i = 0; i < ranges.length; i++) {
      let range = ranges[i]
      if(forCount <= range.max_participant){
        interval = range.interval
        i = ranges.length
      }
    }
    return interval
  },
  MINIFY_JS: 1,
  POLLING_INTERVAL: 10000,
};

//browser type
const browserType = {
  OS_BROWSER: 1,
  IOS_BROWSER: 2,
};

//ROOM Limit
const roomLimit = {
  MAX_ROOM_TIME: 0, //menit
};

export { wsConf, studentConf, browserType, roomLimit };
