const gdmOptions = {
  video: {
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000,
    channelCount: 1
  }
}

let videoElem = document.getElementById("streamvideo")



let titleElem = document.getElementsByTagName("title")[0]

/*navigator.mediaDevices.getDisplayMedia(gdmOptions)

.then(stream => {
  videoElem.srcObject = stream
})
    
.catch (err => {
    return
})*/

//document.getElementsByTagName("video")[0].srcObject.getTracks()[0].applyConstraints({width:40, height: 27})

let role
let call
let conn
let peerID
let initialConstraints = null

let startButton = document.getElementById("startButton")
let nothingPlaying = document.getElementById("nothingPlaying")
let idBox = document.getElementById("idBox")
let asideHeading = document.getElementById("asideHeading")

function onShareButton() {
  role = "Host"
  let me = new Peer()
  console.log('hosting')
  SetTitle("Host - Connecting...")
  document.getElementById("roleSelection").style.display = "none"
  document.getElementById("idSection").style.display = "block"
  document.getElementById("idLabel").innerText = "Your IDentificator is:"
  me.on("open", function(id) {
    SetTitle("Host - Waiting for Client...")
    idBox.value = me.id
    idBox.readonly = true
  })

  me.on('connection', function(conn) {
    peerID = conn.peer
    console.log("connected!")
    SetTitle("Host - Connected")
    console.log("calling " + conn.peer)
    if (videoElem.srcObject != null) call = me.call(conn.peer, videoElem.srcObject);
    conn.on('data', function(data) {
      console.log(data)
      if (data.charAt(0) == "!") {
        switch (data.charAt(1)) {
          case "Q":
            changeQuality(parseFloat(data.substring(3)) / 100)
            qualitySlider.value = parseFloat(data.substring(3)) / 100
            qualityValue.innerText = Math.round(qualitySlider.value*100) + "%"
            break
        }
      } else if (data.charAt(0) == "$") {
        
      }
    });
    conn.on('error', function(error) {
      console.error("ERROR:" + error)
    });
  });

  me.on('error', function(error) {
    console.error("ERROR:" + error)
  });

  startButton.onclick = function() {
    navigator.mediaDevices.getDisplayMedia()

    .then(stream => {
      
      if (videoElem.srcObject != undefined) {videoElem.srcObject.getTracks().forEach((track) => track.stop())}
      
      videoElem.srcObject = stream
      console.log("waht's going on?")
      //initialConstraints = videoElem.srcObject.getVideoTracks().getConstraints()
      
      startButton.innerText = "Change Source"
      nothingPlaying.style.display = "none"
      if (peerID == undefined) return
      if (call != undefined) {
        call.close()
        console.log('Recalling ' + peerID)
      } else {
        console.log('calling ' + peerID)
      }
      call = me.call(peerID, videoElem.srcObject);

    })
        
    .catch (err => {
        return
    })
  }
}

function onReceiveButton() {
  role = "Client"
  let me = new Peer()
  console.log("joining")
  SetTitle("Client - Connecting...")

  me.on('error', function(error) {
    console.error("ERROR:" + error)
  });
  startButton.onclick = function() {
    if (idBox.value == "") return
    conn = me.connect(idBox.value, {reliable: true})
    conn.on('open', function() {
      console.log("connected!")
      SetTitle("Client - Connected")
    })
    conn.on('data', function(data) {
      if (data.charAt(0) == "!") {
        switch (data.charAt(1)) {
          case "Q":
            qualitySlider.value = parseFloat(data.substring(3)) / 100
            qualityValue.innerText = Math.round(qualitySlider.value*100) + "%"
            break
      }
      };
    })
    conn.on('error', function(error) {
      console.log("ERROR:" + error)
    });
  }
    me.on('call', function(call) {
      console.log('Getting a stream call...')
      call.answer();
      call.on('stream', function(stream) {
        videoElem.srcObject = stream
        nothingPlaying.style.display = "none"
      });
    });
  document.getElementById("roleSelection").style.display = "none"
  document.getElementById("idSection").style.display = "block"
  document.getElementById("idLabel").innerText = "Your Host's IDentificator is:"
}

function SetTitle(text) {
  titleElem.innerText = text
  asideHeading.innerText = text

}

function changeQuality(value) {
  console.log(value)
  track = videoElem.srcObject.getVideoTracks()[0]
  initialConstraints = initialConstraints || track.getSettings()
  let newConstraints = structuredClone(initialConstraints)
  newConstraints.width = initialConstraints.width * value
  newConstraints.height = newConstraints.width * (1/initialConstraints.aspectRatio)
  videoElem.srcObject.getVideoTracks()[0].applyConstraints(newConstraints)
}

let qualitySlider = document.getElementById("qualitySlider")
let qualityValue = document.getElementById("qualityValue")

qualitySlider.oninput = function() {
  qualityValue.innerText = Math.round(qualitySlider.value*100) + "%"
}

qualitySlider.onchange = function() {
  if (role == "Host") {
    changeQuality(qualitySlider.value)
  } else {
    
  }
  conn.send("!Q:" + Math.round(qualitySlider.value*100))
}